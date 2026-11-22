import { getKv } from "./kv";

/**
 * Snail-mail list: email addresses collected on the public /snailmail page and
 * read back on the password-protected /admin/snailmail page.
 *
 * Stored in KV as a single hash `snailmail:subscribers` mapping a normalized
 * email → the ISO timestamp it was first added. Using the email as the field
 * makes signups idempotent (a repeat submit never creates a duplicate). Every
 * function degrades gracefully when KV is unconfigured.
 */

const SUBSCRIBERS_KEY = "snailmail:subscribers";

// Lightweight form-performance counters (Typeform-style "At a glance"). Kept in
// separate keys so the `snailmail:subscribers` hash shape is never touched.
const METRICS_VIEWS_KEY = "snailmail:metrics:views";
const METRICS_STARTS_KEY = "snailmail:metrics:starts";
const METRICS_SUBMISSIONS_KEY = "snailmail:metrics:submissions";
const METRICS_COMPLETE_MS_TOTAL_KEY = "snailmail:metrics:completeMsTotal";
const METRICS_COMPLETE_COUNT_KEY = "snailmail:metrics:completeCount";

export type Subscriber = { email: string; subscribedAt: string };

export type Metrics = {
  views: number;
  starts: number;
  submissions: number;
  /** submissions ÷ starts as a 0..1 fraction (0 when starts === 0). */
  completionRate: number;
  /** Average Start → Submission time in ms (0 when no timed submissions). */
  avgCompleteMs: number;
};

/** Basic, forgiving email shape check (real validation happens at send time). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Lowercase + trim so dedupe is reliable. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Persist a subscriber. Returns whether it was newly added (vs. already on the
 * list) and whether anything was actually saved (false when KV is off).
 */
export async function saveSubscriber(
  email: string,
): Promise<{ saved: boolean; alreadyExisted: boolean }> {
  const kv = getKv();
  if (!kv) return { saved: false, alreadyExisted: false };
  try {
    // hsetnx returns 1 when the field is new, 0 when it already existed.
    const added = await kv.hsetnx(SUBSCRIBERS_KEY, email, new Date().toISOString());
    return { saved: true, alreadyExisted: added === 0 };
  } catch (err) {
    console.error("snailmail.saveSubscriber failed:", err);
    return { saved: false, alreadyExisted: false };
  }
}

/** All subscribers, newest first. Empty when KV is off or none collected yet. */
export async function getSubscribers(): Promise<Subscriber[]> {
  const kv = getKv();
  if (!kv) return [];
  try {
    const all = await kv.hgetall<Record<string, string>>(SUBSCRIBERS_KEY);
    if (!all) return [];
    return Object.entries(all)
      .map(([email, subscribedAt]) => ({ email, subscribedAt: String(subscribedAt) }))
      .sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt));
  } catch (err) {
    console.error("snailmail.getSubscribers failed:", err);
    return [];
  }
}

/** Count a /snailmail page view. No-op when KV is off. */
export async function recordView(): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  try {
    await kv.incr(METRICS_VIEWS_KEY);
  } catch (err) {
    console.error("snailmail.recordView failed:", err);
  }
}

/** Count a form "start" (first focus/typing of the email field). No-op when KV is off. */
export async function recordStart(): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  try {
    await kv.incr(METRICS_STARTS_KEY);
  } catch (err) {
    console.error("snailmail.recordStart failed:", err);
  }
}

/**
 * Count a successful submission. When `elapsedMs` is a finite number > 0, also
 * fold it into the running Start → Submission average. No-op when KV is off.
 */
export async function recordSubmission(elapsedMs?: number): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  try {
    await kv.incr(METRICS_SUBMISSIONS_KEY);
    if (typeof elapsedMs === "number" && Number.isFinite(elapsedMs) && elapsedMs > 0) {
      await kv.incrby(METRICS_COMPLETE_MS_TOTAL_KEY, Math.round(elapsedMs));
      await kv.incr(METRICS_COMPLETE_COUNT_KEY);
    }
  } catch (err) {
    console.error("snailmail.recordSubmission failed:", err);
  }
}

/** Form-performance snapshot. Zeros when KV is off or nothing collected yet. */
export async function getMetrics(): Promise<Metrics> {
  const empty: Metrics = {
    views: 0,
    starts: 0,
    submissions: 0,
    completionRate: 0,
    avgCompleteMs: 0,
  };
  const kv = getKv();
  if (!kv) return empty;
  try {
    const [views, starts, submissions, completeMsTotal, completeCount] =
      await Promise.all([
        kv.get<number>(METRICS_VIEWS_KEY),
        kv.get<number>(METRICS_STARTS_KEY),
        kv.get<number>(METRICS_SUBMISSIONS_KEY),
        kv.get<number>(METRICS_COMPLETE_MS_TOTAL_KEY),
        kv.get<number>(METRICS_COMPLETE_COUNT_KEY),
      ]);
    const v = Number(views ?? 0);
    const s = Number(starts ?? 0);
    const sub = Number(submissions ?? 0);
    const msTotal = Number(completeMsTotal ?? 0);
    const count = Number(completeCount ?? 0);
    return {
      views: v,
      starts: s,
      submissions: sub,
      completionRate: s > 0 ? sub / s : 0,
      avgCompleteMs: count > 0 ? msTotal / count : 0,
    };
  } catch (err) {
    console.error("snailmail.getMetrics failed:", err);
    return empty;
  }
}

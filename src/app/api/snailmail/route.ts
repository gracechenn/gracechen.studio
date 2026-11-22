import { NextResponse } from "next/server";
import {
  isValidEmail,
  normalizeEmail,
  recordSubmission,
  saveSubscriber,
} from "@/lib/snailmail";

// Side-effect endpoint (writes to KV, sends mail) — never cached.
export const dynamic = "force-dynamic";

/**
 * Fire a notification email via Resend's REST API, if configured. Best-effort:
 * failures are logged but never block the signup. No dependency needed — we
 * call the HTTP API directly. Set RESEND_API_KEY (and optionally
 * SNAILMAIL_NOTIFY_FROM / SNAILMAIL_NOTIFY_TO) to enable.
 */
async function notifyOwner(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const from = process.env.SNAILMAIL_NOTIFY_FROM ?? "Snail Mail <onboarding@resend.dev>";
  const to = process.env.SNAILMAIL_NOTIFY_TO ?? "hello@gracechen.studio";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `New snail mail signup: ${email}`,
        text: `${email} just signed up for your snail mail list.\n\nTime: ${new Date().toISOString()}\nSee all signups: /admin/snailmail`,
      }),
    });
    if (!res.ok) {
      console.error("snailmail notify failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("snailmail notify error:", err);
  }
}

export async function POST(req: Request) {
  let email: string;
  let elapsedMs: number | undefined;
  try {
    const body = await req.json();
    email = normalizeEmail(String(body?.email ?? ""));
    const rawElapsed = body?.elapsedMs;
    elapsedMs =
      typeof rawElapsed === "number" && Number.isFinite(rawElapsed)
        ? rawElapsed
        : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const { saved, alreadyExisted } = await saveSubscriber(email);

  // Count each successful save as a submission (even without a timing sample).
  if (saved) await recordSubmission(elapsedMs);

  // Only notify on a genuinely new signup, so repeats don't spam the inbox.
  if (saved && !alreadyExisted) await notifyOwner(email);

  return NextResponse.json({ ok: true, alreadySubscribed: alreadyExisted });
}

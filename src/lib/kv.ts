import { Redis } from "@upstash/redis";

/**
 * Lazily create the Upstash Redis client from the Vercel KV env vars
 * (`KV_REST_API_URL` + `KV_REST_API_TOKEN`). Returns `null` when those are not
 * configured so every caller degrades gracefully (reads fall back, writes are
 * skipped) and the site keeps working locally before KV is set up. The client
 * is created once and cached for the lifetime of the server process.
 */
let cached: Redis | null | undefined;

export function getKv(): Redis | null {
  if (cached !== undefined) return cached;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  cached = url && token ? new Redis({ url, token }) : null;
  return cached;
}

/** Whether a KV store is configured (used by the admin UI to warn the owner). */
export function isKvConfigured(): boolean {
  return getKv() !== null;
}

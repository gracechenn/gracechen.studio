import type { Product } from "@/data/products";
import { getKv } from "./kv";

/**
 * Inventory model, unified + backward-compatible.
 *
 * Stock lives in KV under `stock:<slug>` as an integer. A slug's KV entry, when
 * present, is authoritative: available while `> 0`, sold out at `0`. When NO
 * entry exists the item is "unmanaged" and we fall back to the static catalog:
 * prints are unlimited/available; originals are available unless flagged
 * `sold: true` in products.ts. This makes finite limits opt-in per item and
 * keeps the site working before any counts are seeded.
 *
 * Every function degrades gracefully: with KV unconfigured, reads return the
 * unmanaged fallback and writes are no-ops, so checkout and the shop keep
 * working unchanged. Errors are logged, never thrown to the user.
 */

/** A stock count, or `null` when the slug is unmanaged (no KV entry). */
export type StockValue = number | null;

export type Availability = {
  available: boolean;
  /** Remaining units for a finite (managed) item, else `null` (unlimited). */
  remaining: number | null;
};

const key = (slug: string) => `stock:${slug}`;

/** Coerce a raw KV value to a clean integer stock count, or `null`. */
function toStock(value: unknown): StockValue {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export async function getStock(slug: string): Promise<StockValue> {
  const kv = getKv();
  if (!kv) return null;
  try {
    return toStock(await kv.get<number>(key(slug)));
  } catch (err) {
    console.error("inventory.getStock failed:", err);
    return null;
  }
}

/** Batch-read stock for many slugs. Missing/unmanaged slugs map to `null`. */
export async function getAllStock(
  slugs: string[],
): Promise<Map<string, StockValue>> {
  const map = new Map<string, StockValue>();
  const kv = getKv();
  if (!kv || slugs.length === 0) {
    for (const s of slugs) map.set(s, null);
    return map;
  }
  try {
    const values = await kv.mget<(number | null)[]>(...slugs.map(key));
    slugs.forEach((s, i) => map.set(s, toStock(values[i])));
  } catch (err) {
    console.error("inventory.getAllStock failed:", err);
    for (const s of slugs) map.set(s, null);
  }
  return map;
}

/** Set an absolute count. `null` clears the entry (back to unmanaged). */
export async function setStock(slug: string, value: number | null): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  try {
    if (value === null) {
      await kv.del(key(slug));
    } else {
      await kv.set(key(slug), Math.max(0, Math.trunc(value)));
    }
  } catch (err) {
    console.error("inventory.setStock failed:", err);
  }
}

// Atomically decrement, clamping at 0 so stock can never go negative even under
// concurrent webhook retries. Returns the new count, or -1 when the slug is
// unmanaged (no entry) so the caller knows nothing was tracked.
const DECREMENT_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if raw == false then return -1 end
local current = tonumber(raw)
if current == nil then return -1 end
local next = current - tonumber(ARGV[1])
if next < 0 then next = 0 end
redis.call('SET', KEYS[1], next)
return next
`;

// Atomically increment, but ONLY if the slug is managed (has an entry). An
// unmanaged print has no finite count to restore, so restock is a no-op there.
const INCREMENT_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if raw == false then return -1 end
if tonumber(raw) == nil then return -1 end
return redis.call('INCRBY', KEYS[1], tonumber(ARGV[1]))
`;

/**
 * Atomically decrement stock for a slug (fulfillment). Clamps at 0. Returns the
 * new count, or `null` when the slug is unmanaged or KV is unavailable.
 */
export async function decrementStock(
  slug: string,
  qty: number,
): Promise<StockValue> {
  const kv = getKv();
  if (!kv) return null;
  const amount = Math.max(0, Math.trunc(qty));
  if (amount === 0) return getStock(slug);
  try {
    const res = await kv.eval(DECREMENT_SCRIPT, [key(slug)], [String(amount)]);
    const n = Number(res);
    return n < 0 ? null : n;
  } catch (err) {
    console.error("inventory.decrementStock failed:", err);
    return null;
  }
}

/**
 * Atomically increment stock for a managed slug (refund restock). No-op for
 * unmanaged slugs. Returns the new count, or `null` when unmanaged/unavailable.
 */
export async function incrementStock(
  slug: string,
  qty: number,
): Promise<StockValue> {
  const kv = getKv();
  if (!kv) return null;
  const amount = Math.max(0, Math.trunc(qty));
  if (amount === 0) return getStock(slug);
  try {
    const res = await kv.eval(INCREMENT_SCRIPT, [key(slug)], [String(amount)]);
    const n = Number(res);
    return n < 0 ? null : n;
  } catch (err) {
    console.error("inventory.incrementStock failed:", err);
    return null;
  }
}

/**
 * Resolve whether a product is buyable, given its KV stock. Managed items use
 * the count; unmanaged items fall back to catalog behavior (prints unlimited,
 * originals sold-out only when flagged `sold` in products.ts).
 */
export function resolveAvailability(
  product: Product,
  kvStock: StockValue,
): Availability {
  if (typeof kvStock === "number") {
    return { available: kvStock > 0, remaining: kvStock };
  }
  if (product.kind === "print") {
    return { available: true, remaining: null };
  }
  return { available: !product.sold, remaining: null };
}

/** Threshold below which a finite item is considered "low on stock". */
export const LOW_STOCK_THRESHOLD = 5;

/**
 * Whether to surface a public "Low on stock" hint. Limited to PRINTS with a
 * managed, finite count of 1–4 remaining; one-of-a-kind originals (always 1)
 * are excluded since the label would be misleading there.
 */
export function isLowStock(product: Product, remaining: StockValue): boolean {
  return (
    product.kind === "print" &&
    remaining !== null &&
    remaining > 0 &&
    remaining < LOW_STOCK_THRESHOLD
  );
}

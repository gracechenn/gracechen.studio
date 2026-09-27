import { getKv } from "./kv";

/**
 * Order snapshots persisted around a purchase so the Stripe webhook can adjust
 * inventory later. Two records are kept:
 *
 * - `cart:<sessionId>` — the purchased line items, written at checkout with a
 *   24h TTL, read on `checkout.session.completed` to decrement stock.
 * - `order:<paymentIntentId>` — the fulfilled items, written on completion and
 *   read on `charge.refunded` to restock. Kept long enough to cover refunds.
 *
 * A `processed:<id>` flag makes webhook handling idempotent across retries.
 * All functions no-op safely when KV is unconfigured.
 */

export type OrderItem = { slug: string; qty: number };

const CART_TTL_SECONDS = 60 * 60 * 24; // 24h — covers the checkout window.
const ORDER_TTL_SECONDS = 60 * 60 * 24 * 120; // ~4 months — covers refund window.
const PROCESSED_TTL_SECONDS = 60 * 60 * 24 * 120;

const cartKey = (sessionId: string) => `cart:${sessionId}`;
const orderKey = (paymentIntentId: string) => `order:${paymentIntentId}`;
const processedKey = (id: string) => `processed:${id}`;

export async function saveCartSnapshot(
  sessionId: string,
  items: OrderItem[],
): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  try {
    await kv.set(cartKey(sessionId), items, { ex: CART_TTL_SECONDS });
  } catch (err) {
    console.error("orders.saveCartSnapshot failed:", err);
  }
}

export async function getCartSnapshot(
  sessionId: string,
): Promise<OrderItem[] | null> {
  const kv = getKv();
  if (!kv) return null;
  try {
    return (await kv.get<OrderItem[]>(cartKey(sessionId))) ?? null;
  } catch (err) {
    console.error("orders.getCartSnapshot failed:", err);
    return null;
  }
}

export async function saveFulfilledOrder(
  paymentIntentId: string,
  items: OrderItem[],
): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  try {
    await kv.set(orderKey(paymentIntentId), items, { ex: ORDER_TTL_SECONDS });
  } catch (err) {
    console.error("orders.saveFulfilledOrder failed:", err);
  }
}

export async function getFulfilledOrder(
  paymentIntentId: string,
): Promise<OrderItem[] | null> {
  const kv = getKv();
  if (!kv) return null;
  try {
    return (await kv.get<OrderItem[]>(orderKey(paymentIntentId))) ?? null;
  } catch (err) {
    console.error("orders.getFulfilledOrder failed:", err);
    return null;
  }
}

/**
 * Atomically claim a one-time processing slot for `id` (via `SET NX`). Returns
 * `true` only for the first caller, so webhook handlers can skip Stripe's
 * retries. When KV is unconfigured this returns `true` (there is no persisted
 * stock to double-adjust anyway — the decrements are themselves no-ops).
 */
export async function claimProcessedOnce(id: string): Promise<boolean> {
  const kv = getKv();
  if (!kv) return true;
  try {
    const res = await kv.set(processedKey(id), "1", {
      nx: true,
      ex: PROCESSED_TTL_SECONDS,
    });
    return res === "OK";
  } catch (err) {
    console.error("orders.claimProcessedOnce failed:", err);
    return true;
  }
}

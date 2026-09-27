import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { decrementStock, incrementStock } from "@/lib/inventory";
import {
  claimProcessedOnce,
  getCartSnapshot,
  getFulfilledOrder,
  saveFulfilledOrder,
  type OrderItem,
} from "@/lib/orders";

// Always run at request time — this is a signed side-effect endpoint, never
// cached or prerendered.
export const dynamic = "force-dynamic";

/** Recover the order from Stripe session metadata when the KV snapshot is gone. */
function itemsFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): OrderItem[] | null {
  const raw = metadata?.order;
  if (!raw) return null;
  try {
    const pairs = JSON.parse(raw) as [string, number][];
    if (!Array.isArray(pairs)) return null;
    return pairs
      .map(([slug, qty]) => ({ slug: String(slug), qty: Number(qty) }))
      .filter((o) => o.slug && Number.isFinite(o.qty) && o.qty > 0);
  } catch {
    return null;
  }
}

function paymentIntentId(
  ref: string | Stripe.PaymentIntent | null | undefined,
): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  // Idempotency: claim before doing work so Stripe retries can't double-count.
  if (!(await claimProcessedOnce(`checkout:${session.id}`))) return;

  const items =
    (await getCartSnapshot(session.id)) ?? itemsFromMetadata(session.metadata);
  if (!items || items.length === 0) {
    console.warn(
      `Stripe webhook: no order snapshot for session ${session.id}; skipping stock decrement.`,
    );
    return;
  }

  // Decrement each purchased slug. Prints sell out and originals auto-mark sold
  // once their count reaches 0. Unmanaged slugs are left untouched.
  await Promise.all(items.map((it) => decrementStock(it.slug, it.qty)));

  // Persist the fulfilled order under its payment intent so refunds can restock.
  const pi = paymentIntentId(session.payment_intent);
  if (pi) await saveFulfilledOrder(pi, items);
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const pi = paymentIntentId(charge.payment_intent);
  if (!pi) return;

  // Only FULL refunds auto-restock — for partials we can't tell which items
  // were returned, so we log and leave it to the owner to adjust in admin.
  if (charge.amount_refunded !== charge.amount) {
    console.warn(
      `Stripe webhook: partial refund on ${pi} (${charge.amount_refunded}/${charge.amount}); not auto-restocking — adjust manually in /admin/inventory.`,
    );
    return;
  }

  if (!(await claimProcessedOnce(`refund:${pi}`))) return;

  const items = await getFulfilledOrder(pi);
  if (!items || items.length === 0) {
    console.warn(
      `Stripe webhook: no fulfilled order for ${pi}; cannot auto-restock.`,
    );
    return;
  }

  // Restock managed items: prints regain stock; a refunded original (count back
  // above 0) becomes available again.
  await Promise.all(items.map((it) => incrementStock(it.slug, it.qty)));
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    console.error(
      "Stripe webhook not configured (missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET).",
    );
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  // App Router: read the RAW body for signature verification (never JSON.parse
  // first, or the computed signature won't match).
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }
  } catch (err) {
    // Return 500 so Stripe retries; our handlers are idempotent.
    console.error(`Stripe webhook: error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

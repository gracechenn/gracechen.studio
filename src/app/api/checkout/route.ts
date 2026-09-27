import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProduct } from "@/data/products";
import { getAllStock, resolveAvailability } from "@/lib/inventory";
import { saveCartSnapshot, type OrderItem } from "@/lib/orders";

type CartPayloadItem = { slug: string; quantity: number };

// Shipping settings — kept as named constants so they're trivial to change.
// Amounts are in cents to match Stripe's unit_amount convention.
const ORIGINAL_DOMESTIC_SHIPPING_CENTS = 3000; // $30 domestic shipping for originals

function siteUrl(req: Request): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
  ).replace(/\/$/, "");
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "Checkout is not configured yet. Set STRIPE_SECRET_KEY in your environment to enable payments.",
      },
      { status: 503 },
    );
  }

  let items: CartPayloadItem[];
  try {
    const body = await req.json();
    items = Array.isArray(body?.items) ? body.items : [];
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Resolve the cart against the catalog server-side (never trust client
  // prices), dropping unknown or catalog-sold items.
  const catalogResolved = items
    .map((item) => {
      const product = getProduct(item.slug);
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 0));
      if (!product || product.sold) return null;
      return { product, quantity };
    })
    .filter(
      (r): r is { product: NonNullable<ReturnType<typeof getProduct>>; quantity: number } =>
        r !== null,
    );

  // Live inventory is the source of truth: drop sold-out items and clamp any
  // quantity that exceeds the remaining count (mirrors the drop-sold pattern
  // above). No-ops to "available" when KV is unconfigured.
  const stock = await getAllStock(catalogResolved.map((r) => r.product.slug));
  const resolved = catalogResolved
    .map(({ product, quantity }) => {
      const { available, remaining } = resolveAvailability(
        product,
        stock.get(product.slug) ?? null,
      );
      if (!available) return null;
      const clamped = remaining === null ? quantity : Math.min(quantity, remaining);
      if (clamped < 1) return null;
      return { product, quantity: clamped };
    })
    .filter(
      (r): r is { product: NonNullable<ReturnType<typeof getProduct>>; quantity: number } =>
        r !== null,
    );

  const lineItems = resolved.map(({ product, quantity }) => {
    const kindLabel = product.kind === "original" ? "Original" : "Print";
    const description = [kindLabel, product.dimensions]
      .filter(Boolean)
      .join(" · ");
    return {
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: product.title,
          ...(description ? { description } : {}),
          images: [`${siteUrl(req)}${product.image}`],
        },
      },
    };
  });

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Derive shipping from the resolved cart. Originals ship crated, so a cart
  // containing one lets the customer choose free NYC pickup or $30 domestic
  // shipping; print-only carts always ship free.
  const hasOriginal = resolved.some(({ product }) => product.kind === "original");

  const shippingOptions = hasOriginal
    ? [
        {
          shipping_rate_data: {
            type: "fixed_amount" as const,
            fixed_amount: { amount: 0, currency: "usd" },
            display_name: "Local pickup — New York City",
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount" as const,
            fixed_amount: {
              amount: ORIGINAL_DOMESTIC_SHIPPING_CENTS,
              currency: "usd",
            },
            display_name: "Domestic shipping",
          },
        },
      ]
    : [
        {
          shipping_rate_data: {
            type: "fixed_amount" as const,
            fixed_amount: { amount: 0, currency: "usd" },
            display_name: "Free shipping",
          },
        },
      ];

  const base = siteUrl(req);

  // Compact order snapshot the webhook uses to adjust stock after payment.
  const orderItems: OrderItem[] = resolved.map(({ product, quantity }) => ({
    slug: product.slug,
    qty: quantity,
  }));
  // Stripe metadata is capped at 500 chars per value; include it only as a
  // backup to the primary KV `cart:<sessionId>` snapshot when it fits.
  const orderMeta = JSON.stringify(orderItems.map((o) => [o.slug, o.qty]));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${base}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/shop`,
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: shippingOptions,
      // Let customers enter promo codes defined by the owner in the Stripe
      // Dashboard (Products → Coupons / Promotion codes).
      allow_promotion_codes: true,
      ...(orderMeta.length <= 500 ? { metadata: { order: orderMeta } } : {}),
    });

    // Primary snapshot: keyed by session id with a TTL. Best-effort; no-ops
    // without KV. The webhook falls back to session metadata if this is gone.
    await saveCartSnapshot(session.id, orderItems);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}

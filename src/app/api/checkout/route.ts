import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProduct } from "@/data/products";

type CartPayloadItem = { slug: string; quantity: number };

// Shipping settings — kept as named constants so they're trivial to change.
// Amounts are in cents to match Stripe's unit_amount convention.
const PRINT_FLAT_SHIPPING_CENTS = 600; // $6 flat rate for print orders
const FREE_SHIPPING_THRESHOLD_CENTS = 5000; // free shipping on subtotals ≥ $50
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
  // prices), dropping unknown or sold-out items.
  const resolved = items
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
  // shipping; print-only carts get a flat rate that becomes free above the
  // threshold.
  const subtotalCents = resolved.reduce(
    (sum, { product, quantity }) => sum + Math.round(product.price * 100) * quantity,
    0,
  );
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
    : subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
      ? [
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: { amount: 0, currency: "usd" },
              display_name: "Free shipping (orders over $50)",
            },
          },
        ]
      : [
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: {
                amount: PRINT_FLAT_SHIPPING_CENTS,
                currency: "usd",
              },
              display_name: "Standard shipping",
            },
          },
        ];

  const base = siteUrl(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${base}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/shop`,
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: shippingOptions,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 },
    );
  }
}

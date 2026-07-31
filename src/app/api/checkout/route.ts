import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProduct } from "@/data/products";

type CartPayloadItem = { slug: string; quantity: number };

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

  const lineItems = items
    .map((item) => {
      const product = getProduct(item.slug);
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 0));
      if (!product || product.sold) return null;
      const description = [product.medium, product.dimensions]
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
    })
    .filter(
      (l): l is NonNullable<typeof l> => l !== null,
    );

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const base = siteUrl(req);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${base}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/shop`,
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB"] },
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

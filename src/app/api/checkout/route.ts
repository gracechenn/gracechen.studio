import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProduct } from "@/data/products";
import { getAllStock, resolveAvailability } from "@/lib/inventory";
import { saveCartSnapshot, type OrderItem } from "@/lib/orders";

type CartPayloadItem = { slug: string; quantity: number };

// Shipping settings — kept as named constants so they're trivial to change.
// Amounts are in cents to match Stripe's unit_amount convention.
const ORIGINAL_DOMESTIC_SHIPPING_CENTS = 3000; // $30 domestic shipping for originals
const PRINT_INTERNATIONAL_SHIPPING_CENTS = 500; // $5 international shipping for prints

// Stripe's full supported set for `shipping_address_collection.allowed_countries`
// (ISO-3166-1 alpha-2). Sourced from the Stripe SDK's own
// `SessionCreateParams.ShippingAddressCollection.AllowedCountry` union so every
// code is accepted at session creation (passing an unsupported code 400s). Used
// for print-only carts so prints can ship (almost) anywhere. Sanctioned/
// unsupported destinations (e.g. CU, IR, KP, SY) are intentionally absent
// because Stripe does not accept them.
const INTERNATIONAL_ALLOWED_COUNTRIES = [
  "AC", "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AT", "AU",
  "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL",
  "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CD",
  "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CV", "CW", "CY",
  "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES",
  "ET", "FI", "FJ", "FK", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH",
  "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IS", "IT",
  "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KR", "KW", "KY",
  "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA",
  "MC", "MD", "ME", "MF", "MG", "MK", "ML", "MM", "MN", "MO", "MQ", "MR", "MS",
  "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NG", "NI", "NL",
  "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL",
  "PM", "PN", "PR", "PS", "PT", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA",
  "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO",
  "SR", "SS", "ST", "SV", "SX", "SZ", "TA", "TC", "TD", "TF", "TG", "TH", "TJ",
  "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "US",
  "UY", "UZ", "VA", "VC", "VE", "VG", "VN", "VU", "WF", "WS", "XK", "YE", "YT",
  "ZA", "ZM", "ZW",
] as const;

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
  // shipping (US-only). Print-only carts ship worldwide: free within the US or
  // $5 international. Stripe Checkout can't auto-select a rate by destination, so
  // we present both options and let the buyer pick.
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
            display_name: "United States — Free shipping",
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount" as const,
            fixed_amount: {
              amount: PRINT_INTERNATIONAL_SHIPPING_CENTS,
              currency: "usd",
            },
            display_name: "International shipping",
          },
        },
      ];

  // `shipping_address_collection.allowed_countries` is session-wide, so branch
  // it on the cart: originals stay US-only; print-only carts open up to Stripe's
  // full supported country set.
  const allowedCountries = hasOriginal
    ? (["US"] as const)
    : INTERNATIONAL_ALLOWED_COUNTRIES;

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
      shipping_address_collection: { allowed_countries: [...allowedCountries] },
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

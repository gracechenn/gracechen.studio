import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Container } from "@/components/Container";
import { AddToCart } from "@/components/shop/AddToCart";
import { Button } from "@/components/ui/Button";
import { getProduct, products } from "@/data/products";
import { getStock, isLowStock, resolveAvailability } from "@/lib/inventory";
import { formatUSD } from "@/lib/format";

// Render at request time so availability reflects live inventory.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.title,
    description: product.description,
    openGraph: { images: [product.image] },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const product = getProduct(slug);
  if (!product) notFound();

  const { available, remaining } = resolveAvailability(
    product,
    await getStock(slug),
  );

  // Return to the tab the visitor came from; fall back to the product's kind
  // ("print" → Prints tab, "original" → Originals tab) on a direct landing.
  const backTab = from === "print" || from === "original" ? from : product.kind;

  return (
    <PageShell>
      <Container className="pt-8 pb-8">
        <Link
          href={`/shop?tab=${backTab}`}
          className="type-label transition-colors hover:text-ink"
        >
          ← Back to shop
        </Link>
      </Container>
      <Container className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="w-full">
          <Image
            src={product.image}
            alt={product.title}
            width={product.width}
            height={product.height}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-auto w-full"
            priority
          />
        </div>

        <div className="flex flex-col">
          <p className="type-label">
            {product.kind === "original" ? "Original work" : "print"}
          </p>
          <h1 className="mt-3 type-h2">
            {product.title}
          </h1>
          {available && (
            <p className="mt-5 type-body-2 text-ink">{formatUSD(product.price)}</p>
          )}

          <dl className="mt-6 space-y-2 type-body-2">
            {product.medium && (
              <div className="flex gap-3">
                <dt className="w-28 text-ink-muted">Medium</dt>
                <dd className="text-ink">{product.medium}</dd>
              </div>
            )}
            <div className="flex gap-3">
              <dt className="w-28 text-ink-muted">Dimensions</dt>
              <dd className="text-ink">{product.dimensions}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 text-ink-muted">Year</dt>
              <dd className="text-ink">{product.year}</dd>
            </div>
          </dl>

          <p className="mt-6 max-w-prose type-body-2 text-ink-muted">
            {product.description}
          </p>

          {available && isLowStock(product, remaining) && (
            <p className="mt-4 type-label text-[#0051ff]">Low on stock</p>
          )}

          <div className="mt-8">
            {!available ? (
              <Button disabled className="w-full sm:w-auto">
                {product.kind === "print" ? "Sold out" : "Sold"}
              </Button>
            ) : (
              <AddToCart
                slug={product.slug}
                showQuantity={product.kind === "print"}
                maxQuantity={remaining ?? undefined}
              />
            )}
          </div>
        </div>
      </Container>
    </PageShell>
  );
}

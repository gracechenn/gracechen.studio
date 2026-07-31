import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Container } from "@/components/Container";
import { AddToCart } from "@/components/shop/AddToCart";
import { Button } from "@/components/ui/Button";
import { getProduct, products } from "@/data/products";
import { formatUSD } from "@/lib/format";

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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <PageShell>
      <Container className="pt-8 pb-8">
        <Link
          href="/shop"
          className="type-label transition-colors hover:text-ink"
        >
          ← Back to shop
        </Link>
      </Container>
      <Container className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-card">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col">
          <p className="type-label">
            {product.kind === "original" ? "Original work" : "Archival print"}
          </p>
          <h1 className="mt-3 type-h2">
            {product.title}
          </h1>
          {!product.sold && (
            <p className="mt-5 type-body-1 text-ink">{formatUSD(product.price)}</p>
          )}

          <dl className="mt-8 space-y-2 border-t border-hairline pt-6 type-body-2">
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

          <p className="mt-6 max-w-prose type-body-1 text-ink-muted">
            {product.description}
          </p>

          <div className="mt-8">
            {product.sold ? (
              <Button disabled className="w-full sm:w-auto">
                Sold
              </Button>
            ) : (
              <AddToCart slug={product.slug} />
            )}
          </div>
        </div>
      </Container>
    </PageShell>
  );
}

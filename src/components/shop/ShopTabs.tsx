"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { clsx } from "@/lib/clsx";
import { formatUSD } from "@/lib/format";
import { useImagesLoaded } from "@/lib/useImagesLoaded";
import type { Product } from "@/data/products";
import { CommissionsPanel } from "./CommissionsPanel";

type Tab = "original" | "print" | "commissions";

const TABS: { id: Tab; label: string }[] = [
  { id: "print", label: "Prints" },
  { id: "original", label: "Originals" },
  { id: "commissions", label: "Commissions" },
];

export function ShopTabs({
  products,
  initialTab = "print",
}: {
  products: Product[];
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <>
      <Container className="pt-10 pb-10 sm:pt-16">
        <div className="flex justify-center gap-8">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={clsx(
                "-mb-px border-b py-3 type-label transition-colors hover:text-ink",
                tab === id
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Container>

      {tab === "commissions" ? (
        <CommissionsPanel />
      ) : (
        <>
          {tab === "print" && (
            <Container className="pb-6">
              <p className="type-label text-ink-muted">
                Free shipping on orders over $50
              </p>
            </Container>
          )}
          <ProductGrid key={tab} tab={tab} products={products.filter((p) => p.kind === tab)} />
        </>
      )}
    </>
  );
}

function ProductGrid({ tab, products }: { tab: Tab; products: Product[] }) {
  const { revealed, onImageLoad } = useImagesLoaded(products.length);
  return (
    <Container className="pb-10">
      <div
        className={clsx(
          "grid grid-cols-1 gap-x-6 gap-y-12 transition-opacity duration-700 sm:grid-cols-2 lg:grid-cols-3",
          revealed ? "opacity-100" : "opacity-0",
        )}
      >
        {products.map((product) => (
          <Link
            key={product.slug}
            href={`/shop/${product.slug}?from=${tab}`}
            className="group block"
          >
            {/* Show the full artwork (contained) in the preview for both prints
                and originals; both keep an inset, larger for originals. */}
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-card">
              <Image
                src={product.image}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={90}
                loading="eager"
                onLoad={onImageLoad}
                className={clsx(
                  "object-contain object-center",
                  product.kind === "original" ? "px-8" : "p-4",
                )}
              />
              <span className="absolute left-3 top-3 bg-bg/90 px-2 py-1 type-label">
                {product.kind}
              </span>
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-3">
              <h2 className="type-body-2 text-ink">{product.title}</h2>
              <span className="type-body-2 text-ink">
                {product.sold ? "Sold" : formatUSD(product.price)}
              </span>
            </div>
            <p className="mt-1 type-label">
              {product.medium
                ? `${product.dimensions}, ${product.medium}`
                : product.dimensions}
            </p>
          </Link>
        ))}
      </div>
    </Container>
  );
}

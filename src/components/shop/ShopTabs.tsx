"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { clsx } from "@/lib/clsx";
import { formatUSD } from "@/lib/format";
import type { Product } from "@/data/products";
import { CommissionsPanel } from "./CommissionsPanel";

type Tab = "original" | "print" | "commissions";

const TABS: { id: Tab; label: string }[] = [
  { id: "print", label: "Prints" },
  { id: "original", label: "Originals" },
  { id: "commissions", label: "Commissions" },
];

export function ShopTabs({ products }: { products: Product[] }) {
  const [tab, setTab] = useState<Tab>("print");

  return (
    <>
      <Container className="pt-10 pb-10 sm:pt-16">
        <div className="flex gap-8">
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
        <ProductGrid products={products.filter((p) => p.kind === tab)} />
      )}
    </>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <Container>
      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const isPrint = product.kind === "print";
          // Transform scale that makes an object-contain image exactly cover
          // the 4/5 (0.8) card box, so prints look cropped at rest and can
          // smoothly zoom OUT to scale(1) = full image on hover.
          const imgAspect = product.width / product.height;
          const coverScale = Math.max(0.8 / imgAspect, imgAspect / 0.8);
          return (
          <Link
            key={product.slug}
            href={`/shop/${product.slug}`}
            className="group block"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-card">
              <Image
                src={product.image}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={90}
                className={clsx(
                  "object-contain object-center",
                  isPrint
                    ? "transition-transform duration-700 ease-out scale-[var(--cover-scale)] group-hover:scale-100"
                    : "px-8",
                )}
                style={
                  isPrint
                    ? ({ ["--cover-scale" as string]: String(coverScale) } as CSSProperties)
                    : undefined
                }
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
          );
        })}
      </div>
    </Container>
  );
}

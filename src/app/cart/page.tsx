"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { formatUSD } from "@/lib/format";

export default function CartPage() {
  const { lines, subtotal, setQuantity, removeItem, items } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (lines.length === 0) {
    return (
      <PageShell>
        <div className="flex min-h-[calc(100dvh-169px)] flex-col items-center justify-center gap-[40px] px-6 text-center">
          <div className="relative aspect-[394/266] w-[394px] max-w-full">
            <Image
              src="/assets/cart/empty-cart.png"
              alt="Your cart is empty"
              fill
              sizes="394px"
              priority
              className="object-contain"
            />
          </div>
          <p className="type-body-2 text-ink">Your cart is empty.</p>
          <div className="py-[20px]">
            <Link
              href="/shop"
              className="type-label text-[14px] text-[#0051ff] transition-opacity hover:opacity-70"
            >
              BROWSE SHOP →
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader title="Cart" />
      <Container className="pb-24">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          {/* Line items */}
          <ul className="divide-y divide-hairline border-y border-hairline">
            {lines.map((line) => (
              <li key={line.product.slug} className="flex gap-4 py-6">
                <Link
                  href={`/shop/${line.product.slug}`}
                  className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden bg-card"
                >
                  <Image
                    src={line.product.image}
                    alt={line.product.title}
                    fill
                    sizes="96px"
                    className="object-contain"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <Link
                      href={`/shop/${line.product.slug}`}
                      className="type-body-2 text-ink hover:opacity-70"
                    >
                      {line.product.title}
                    </Link>
                    <span className="type-body-2 text-ink">
                      {formatUSD(line.lineTotal)}
                    </span>
                  </div>
                  <p className="mt-1 type-label">
                    {line.product.kind} · {formatUSD(line.product.price)} each
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-center border border-hairline">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() =>
                          setQuantity(line.product.slug, line.quantity - 1)
                        }
                        className="px-3 py-1 text-ink-muted hover:text-ink"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center type-body-2 text-ink">
                        {line.quantity}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() =>
                          setQuantity(line.product.slug, line.quantity + 1)
                        }
                        className="px-3 py-1 text-ink-muted hover:text-ink"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(line.product.slug)}
                      className="type-label transition-colors hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Summary */}
          <aside className="h-fit lg:sticky lg:top-8">
            <div className="border border-hairline p-6">
              <div className="flex justify-between type-body-2 text-ink">
                <span>Subtotal</span>
                <span>{formatUSD(subtotal)}</span>
              </div>
              <p className="mt-2 type-body-2 text-ink-muted">
            Shipping calculated at checkout.
              </p>
              <Button
                onClick={checkout}
                disabled={loading}
                className="mt-6 w-full"
              >
                {loading ? "Redirecting…" : "Checkout"}
              </Button>
              {error && (
                <p className="mt-4 type-body-2 text-accent">
                  {error}
                </p>
              )}
              <Link
                href="/shop"
                className="mt-4 block text-center type-label transition-colors hover:text-ink"
              >
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </PageShell>
  );
}

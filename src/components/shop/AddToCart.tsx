"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";

const DEFAULT_MAX_QUANTITY = 10;

export function AddToCart({
  slug,
  showQuantity = false,
  maxQuantity,
}: {
  slug: string;
  showQuantity?: boolean;
  /** Cap for finite prints; falls back to the default browsing cap. */
  maxQuantity?: number;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const max = Math.max(1, Math.min(maxQuantity ?? DEFAULT_MAX_QUANTITY, DEFAULT_MAX_QUANTITY));

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-stretch">
      {showQuantity && (
        <div className="flex items-stretch border border-hairline">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="flex items-center px-4 py-3 text-ink-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            −
          </button>
          <span
            aria-live="polite"
            className="flex min-w-[2.5rem] items-center justify-center type-body-2 text-ink"
          >
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            disabled={quantity >= max}
            className="flex items-center px-4 py-3 text-ink-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            +
          </button>
        </div>
      )}
      <Button
        onClick={() => {
          addItem(slug, quantity);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 1600);
        }}
        className="w-full sm:w-auto"
      >
        {added ? "Added ✓" : "Add to cart"}
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";

const MAX_QUANTITY = 10;

export function AddToCart({
  slug,
  showQuantity = false,
}: {
  slug: string;
  showQuantity?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

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
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            disabled={quantity >= MAX_QUANTITY}
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

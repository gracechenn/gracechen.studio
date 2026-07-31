"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";

export function AddToCart({ slug }: { slug: string }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      onClick={() => {
        addItem(slug, 1);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
      className="w-full sm:w-auto"
    >
      {added ? "Added ✓" : "Add to cart"}
    </Button>
  );
}

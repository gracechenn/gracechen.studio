"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

/** Empties the cart once an order completes successfully. */
export function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}

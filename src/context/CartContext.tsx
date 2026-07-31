"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProduct, type Product } from "@/data/products";

export type CartItem = {
  slug: string;
  quantity: number;
};

/** A cart line resolved against the catalog for display. */
export type ResolvedCartLine = {
  product: Product;
  quantity: number;
  lineTotal: number;
};

type CartContextValue = {
  items: CartItem[];
  lines: ResolvedCartLine[];
  count: number;
  subtotal: number;
  addItem: (slug: string, quantity?: number) => void;
  removeItem: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "gracechen.cart.v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount. Syncing React state from an
  // external store (localStorage) on mount is the intended use of an effect;
  // the rule below has a known false positive for this hydration pattern.
  useEffect(() => {
    let restored: CartItem[] | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          restored = parsed.filter(
            (i) => typeof i?.slug === "string" && Number(i.quantity) > 0,
          );
        }
      }
    } catch {
      // Ignore malformed storage.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restored && restored.length) setItems(restored);
    setHydrated(true);
  }, []);

  // Persist on change (after initial hydration to avoid clobbering).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage may be unavailable (private mode); fail quietly.
    }
  }, [items, hydrated]);

  const addItem = useCallback((slug: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === slug);
      if (existing) {
        return prev.map((i) =>
          i.slug === slug ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { slug, quantity }];
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) => (i.slug === slug ? { ...i, quantity } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const lines = useMemo<ResolvedCartLine[]>(() => {
    return items
      .map((item) => {
        const product = getProduct(item.slug);
        if (!product) return null;
        return {
          product,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity,
        };
      })
      .filter((l): l is ResolvedCartLine => l !== null);
  }, [items]);

  const count = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.lineTotal, 0),
    [lines],
  );

  const value: CartContextValue = {
    items,
    lines,
    count,
    subtotal,
    addItem,
    removeItem,
    setQuantity,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

type SectionLink = {
  label: string;
  href: string;
  // Extra routes that should also mark this link active (the category galleries
  // live at their own top-level routes but belong to ARTWORK).
  matchPaths?: string[];
};

const SECTION_LINKS: SectionLink[] = [
  // Hidden for now — the ruler (old home) page still exists at /ruler but is
  // intentionally unlinked. Restore this entry to bring it back to the nav.
  // { label: "RULER", href: "/ruler" },
  {
    label: "ARTWORK",
    href: "/artwork",
    matchPaths: ["/illustration", "/painting", "/textile"],
  },
  { label: "EXHIBITIONS", href: "/exhibitions" },
  { label: "ABOUT", href: "/about" },
  { label: "SHOP", href: "/shop" },
];

/**
 * Global navigation.
 *
 * - Default: the entire bar is fixed to the top of the viewport.
 * - `cartOnlyFixed`: the wordmark + section links (and the mobile menu) scroll
 *   away with the page, while only CART stays pinned top-right. Used on the
 *   shop listing so the cart is always reachable while browsing a long grid.
 */
export function Nav({ cartOnlyFixed = false }: { cartOnlyFixed?: boolean }) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const wordmarkAndLinks = (
    <div className="flex items-center gap-[38px]">
      <Link href="/" className="type-wordmark">
        Grace Chen
      </Link>
      <ul className="hidden items-center gap-[38px] md:flex type-label">
        {SECTION_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-ink transition-colors hover:text-ink-muted"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  const menuButton = (
    <button
      type="button"
      aria-label="Open menu"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      className="flex flex-col gap-[5px] p-2 md:hidden"
    >
      <span className="block h-px w-6 bg-ink-strong" />
      <span className="block h-px w-6 bg-ink-strong" />
      <span className="block h-px w-6 bg-ink-strong" />
    </button>
  );

  const cartLink = (
    <Link
      href="/cart"
      className="type-label text-ink transition-colors hover:text-ink-muted"
    >
      CART ({count})
    </Link>
  );

  const mobileDropdown = open && (
    <div className="border-t border-hairline bg-bg md:hidden">
      <ul className="flex flex-col px-6 py-2 type-label">
        {SECTION_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-ink transition-colors hover:text-ink-muted"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  if (cartOnlyFixed) {
    return (
      <>
        {/* Wordmark + links: positioned at the top of the page (absolute), so
            they scroll away as the grid scrolls. */}
        <div className="absolute inset-x-0 top-0 z-40 flex h-[77px] items-center px-6">
          {wordmarkAndLinks}
        </div>

        {/* Fixed transparent layer holding only CART (+ mobile menu). It's
            click-through except for its own controls, so the scrolling links
            beneath stay interactive. */}
        <header className="pointer-events-none fixed inset-x-0 top-0 z-50 w-full">
          <nav className="flex h-[77px] items-center justify-end px-6">
            <div className="pointer-events-auto flex items-center gap-8">
              {menuButton}
              {cartLink}
            </div>
          </nav>
          <div className="pointer-events-auto">{mobileDropdown}</div>
        </header>
      </>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full">
      <nav className="flex h-[77px] items-center justify-between px-6 sm:px-6">
        {wordmarkAndLinks}
        <div className="flex items-center gap-8">
          {menuButton}
          {cartLink}
        </div>
      </nav>
      {mobileDropdown}
    </header>
  );
}

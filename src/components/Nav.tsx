"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/CartContext";

/** `useLayoutEffect` on the client, `useEffect` on the server (no SSR warning). */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Breathing room (px) kept between the inline links / cart and the centred
 * wordmark. We collapse into the hamburger this many px BEFORE an actual pixel
 * collision, so the links never crowd the wordmark.
 */
const SAFETY_GAP = 24;

/** Fade + slide-down duration (ms) for the hamburger menu overlay. */
const MENU_FADE_MS = 200;

type SectionLink = {
  label: string;
  href: string;
  // Extra routes that should also mark this link active (the category galleries
  // live at their own top-level routes but belong to ARTWORK).
  matchPaths?: string[];
};

const SECTION_LINKS: SectionLink[] = [
  { label: "HOME", href: "/" },
  // The ruler (old home) page still exists at /ruler but is intentionally
  // unlinked. Add { label: "RULER", href: "/ruler" } here to restore it.
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
 * Full-screen frosted menu overlay opened from the hamburger.
 *
 * Mirrors the Lightbox overlay: a translucent near-white backdrop with a heavy
 * blur, rendered through a portal to `document.body` so `position: fixed` is
 * relative to the viewport regardless of any transformed ancestor. The backdrop
 * fades in/out and the link list slides down as it appears; with reduced motion
 * it appears/disappears instantly. Closes on ✕, backdrop click, Escape, or
 * selecting a link, and locks body scroll while open. Only mounts client-side
 * (when `open`), so it introduces no server/first-paint markup.
 */
function NavMenuOverlay({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState(false);

  // On open: lock body scroll, focus the close button, and (unless reduced)
  // trigger the fade/slide-in on the next frame.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => setVisible(true));
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf);
    };
  }, []);

  // Animate out, then notify the parent (which clears `open`) — or close
  // immediately when the user prefers reduced motion.
  const requestClose = useCallback(() => {
    if (reduced) {
      onClose();
      return;
    }
    setVisible(false);
    window.setTimeout(onClose, MENU_FADE_MS);
  }, [onClose, reduced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      onClick={requestClose}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        opacity: reduced ? 1 : visible ? 1 : 0,
        transition: reduced ? undefined : `opacity ${MENU_FADE_MS}ms ease`,
      }}
    >
      {/* Close ✕ — mirrors the Lightbox close affordance. */}
      <button
        ref={closeRef}
        type="button"
        aria-label="Close menu"
        onClick={requestClose}
        className="fixed right-7 top-7 text-ink"
      >
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <line x1="2.5" y1="2.5" x2="23.5" y2="23.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="23.5" y1="2.5" x2="2.5" y2="23.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Link list: slides down as the backdrop fades. Clicking inside must not
          close via the backdrop; each link closes explicitly. */}
      <ul
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center gap-6 type-label"
        style={{
          opacity: reduced ? 1 : visible ? 1 : 0,
          transform: reduced || visible ? "translateY(0)" : "translateY(-12px)",
          transition: reduced
            ? undefined
            : `opacity ${MENU_FADE_MS}ms ease, transform ${MENU_FADE_MS}ms ease`,
        }}
      >
        {SECTION_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={requestClose}
              className="text-ink transition-colors hover:text-ink-muted"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  );
}

/**
 * Global navigation.
 *
 * - Default: the entire bar is fixed to the top of the viewport.
 * - `cartOnlyFixed`: the wordmark + section links (and the mobile menu) scroll
 *   away with the page, while only CART stays pinned top-right. Used on the
 *   shop listing so the cart is always reachable while browsing a long grid.
 *
 * The wordmark is always absolutely centred and the cart always sits on the
 * right; only the left slot changes: inline section links when there's room, or
 * the hamburger icon when they'd overlap the wordmark (collapsed). Overlap is
 * measured on the client (see the layout effect below) — not just below a fixed
 * breakpoint. `collapsed` is `null` until mounted so the server and first client
 * paint fall back to the CSS `md:` breakpoint for the left slot, avoiding a
 * hydration mismatch; the measured value then takes over.
 */
export function Nav({ cartOnlyFixed = false }: { cartOnlyFixed?: boolean }) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean | null>(null);

  const containerRef = useRef<HTMLElement | null>(null);
  const measureLinksRef = useRef<HTMLUListElement | null>(null);
  const measureWordmarkRef = useRef<HTMLSpanElement | null>(null);
  const measureCartRef = useRef<HTMLSpanElement | null>(null);

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    const links = measureLinksRef.current;
    const word = measureWordmarkRef.current;
    const cart = measureCartRef.current;
    if (!container || !links || !word || !cart) return;

    const measure = () => {
      const styles = window.getComputedStyle(container);
      const padLeft = parseFloat(styles.paddingLeft) || 0;
      const padRight = parseFloat(styles.paddingRight) || 0;
      // The wordmark is centred on the bar, so each side has half the bar width
      // minus half the wordmark, minus its padding, as room for its content.
      const half = container.clientWidth / 2;
      const wordmarkHalf = word.getBoundingClientRect().width / 2;
      const leftRoom = half - wordmarkHalf - padLeft - SAFETY_GAP;
      const rightRoom = half - wordmarkHalf - padRight - SAFETY_GAP;
      setCollapsed(
        links.getBoundingClientRect().width > leftRoom ||
          cart.getBoundingClientRect().width > rightRoom,
      );
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(links);
    ro.observe(word);
    ro.observe(cart);
    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Resolve the tri-state (`null` = CSS `md:` baseline) into the class variant
  // for a given element: baseline until measured, then collapsed/expanded.
  const pick = <T,>(baseline: T, expanded: T, whenCollapsed: T): T =>
    collapsed === null ? baseline : collapsed ? whenCollapsed : expanded;

  // Section links, left-aligned when expanded (hidden once collapsed).
  const sectionLinks = (
    <ul
      className={`${pick(
        "hidden md:flex",
        "flex",
        "hidden",
      )} items-center gap-[38px] type-label`}
    >
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
  );

  // Wordmark: always absolutely centred, in every state. Only the left slot
  // changes between states (inline links when expanded, hamburger when
  // collapsed); the wordmark stays centred and the cart stays on the right.
  const wordmark = (
    <Link
      href="/"
      className="type-wordmark whitespace-nowrap absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      Grace Chen
    </Link>
  );

  const menuButton = (
    <button
      type="button"
      aria-label="Open menu"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      className={`${pick(
        "flex md:hidden",
        "hidden",
        "flex",
      )} flex-col gap-[5px] p-2`}
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

  const menuOverlay = open && (
    <NavMenuOverlay onClose={() => setOpen(false)} />
  );

  // Off-screen measurer: the links, wordmark and cart at their natural widths,
  // so overlap can be computed regardless of the current collapsed state.
  const measurer = (
    <div
      aria-hidden="true"
      className="pointer-events-none invisible absolute left-[-9999px] top-0 flex items-center"
    >
      <ul
        ref={measureLinksRef}
        className="flex items-center gap-[38px] whitespace-nowrap type-label"
      >
        {SECTION_LINKS.map((link) => (
          <li key={link.href}>{link.label}</li>
        ))}
      </ul>
      <span ref={measureWordmarkRef} className="type-wordmark whitespace-nowrap">
        Grace Chen
      </span>
      <span ref={measureCartRef} className="whitespace-nowrap type-label">
        CART ({count})
      </span>
    </div>
  );

  if (cartOnlyFixed) {
    return (
      <>
        {/* Links (left) + centred wordmark: positioned at the top of the page
            (absolute), so they scroll away as the grid scrolls. */}
        <div
          ref={containerRef as RefObject<HTMLDivElement>}
          className="absolute inset-x-0 top-0 z-40 flex h-[77px] items-center px-6"
        >
          {sectionLinks}
          <div className="flex items-center gap-2">
            {wordmark}
            {menuButton}
          </div>
        </div>

        {/* Fixed transparent layer holding only CART (+ mobile menu). It's
            click-through except for its own controls, so the scrolling links
            beneath stay interactive. */}
        <header className="pointer-events-none fixed inset-x-0 top-0 z-50 w-full">
          <nav className="flex h-[77px] items-center justify-end px-6">
            <div className="pointer-events-auto flex items-center gap-8">
              {cartLink}
            </div>
          </nav>
          {measurer}
        </header>
        {menuOverlay}
      </>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full">
      <nav
        ref={containerRef}
        className="relative flex h-[77px] items-center px-6"
      >
        {sectionLinks}
        <div className="flex items-center gap-2">
          {wordmark}
          {menuButton}
        </div>
        <div className="ml-auto flex items-center gap-8">
          {cartLink}
        </div>
        {measurer}
      </nav>
      {menuOverlay}
    </header>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** The subset of a gallery photo the lightbox needs to render + caption. */
export type LightboxItem = {
  src: string;
  /** Optional title — only known for select photos; caption is hidden without it. */
  title?: string;
  /** Optional year, shown under the title. */
  year?: string;
  /** Optional alt text for the image; falls back to the title, then a default. */
  alt?: string;
};

/** Fade duration (ms) for the light frosted overlay. */
const FADE_MS = 200;

/**
 * Full-screen lightbox for a single gallery photo (Figma node 202:1837).
 *
 * A LIGHT frosted overlay (translucent near-white + backdrop blur) shows the
 * enlarged photo centred, with an optional caption below. It is rendered
 * through a portal to `document.body` so its `position: fixed` layout is
 * relative to the viewport — NOT the fit-to-viewport `transform: scale()`
 * wrapper it is triggered from (a transformed ancestor would otherwise become
 * the containing block for fixed descendants).
 *
 * Closes on ✕, backdrop click, and Escape; locks body scroll while open; moves
 * focus to the close button on open and restores it to the trigger on close
 * (handled by the parent via `onClose`). Fades in/out unless the user prefers
 * reduced motion, in which case it appears/disappears instantly.
 */
export function Lightbox({
  item,
  onClose,
}: {
  item: LightboxItem;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState(false);

  // On open: lock body scroll, focus the close button, and (unless reduced)
  // trigger the fade-in on the next frame.
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

  // Fade out (or, with reduced motion, close immediately), then notify parent —
  // which clears state and restores focus to the triggering image.
  const requestClose = useCallback(() => {
    if (reduced) {
      onClose();
      return;
    }
    setVisible(false);
    window.setTimeout(onClose, FADE_MS);
  }, [onClose, reduced]);

  // Escape closes.
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
      aria-label={item.title ?? "Exhibition photograph"}
      onClick={requestClose}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        opacity: reduced ? 1 : visible ? 1 : 0,
        transition: reduced ? undefined : `opacity ${FADE_MS}ms ease`,
      }}
    >
      {/* Close ✕ — two thin crossing strokes, fixed top-right. */}
      <button
        ref={closeRef}
        type="button"
        aria-label="Close"
        onClick={requestClose}
        className="fixed right-7 top-7 text-ink"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          aria-hidden="true"
        >
          <line
            x1="2.5"
            y1="2.5"
            x2="23.5"
            y2="23.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line
            x1="23.5"
            y1="2.5"
            x2="2.5"
            y2="23.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      {/* Image + caption. Clicking inside must NOT close (only the backdrop does). */}
      <figure
        onClick={(e) => e.stopPropagation()}
        className="m-0 flex flex-col items-center"
      >
        <Image
          src={item.src}
          alt={item.alt ?? item.title ?? "Exhibition photograph"}
          width={0}
          height={0}
          sizes="(min-width:768px) 80vh, 90vw"
          className="h-[80vh] w-auto max-w-[95vw] rounded-[2px] object-contain"
          style={{ width: "auto", height: "80vh" }}
        />

        {item.title && (
          <figcaption className="mt-6 text-center">
            <span
              className="block text-[30px] italic leading-none text-ink"
              style={{ fontFamily: "var(--font-script)" }}
            >
              {item.title}
            </span>
            {item.year && (
              <span className="mt-2 block font-sans text-[13px] leading-none text-ink-muted">
                {item.year}
              </span>
            )}
          </figcaption>
        )}
      </figure>
    </div>,
    document.body,
  );
}

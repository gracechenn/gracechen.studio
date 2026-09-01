"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsDesktop } from "@/lib/useIsDesktop";

/** The subset of a gallery photo the lightbox needs to render + caption. */
export type LightboxItem = {
  src: string;
  /** Optional title — only known for select photos; caption is hidden without it. */
  title?: string;
  /** Optional year, shown under the title. */
  year?: string;
  /** Optional alt text for the image; falls back to the title, then a default. */
  alt?: string;
  /**
   * Optional close-up callout: a second image shown to the right of the main
   * one, joined by a thin line drawn from `anchor` (a 0–1 fraction of the main
   * image's width/height) to the detail image. Desktop only.
   */
  detail?: {
    src: string;
    anchor: { x: number; y: number };
    alt?: string;
  };
};

/** Fade duration (ms) for the light frosted overlay. */
const FADE_MS = 200;

/**
 * Pixels to raise the detail line's anchor (its left end) above the computed
 * point on the main image, nudging it to sit just above the woven patch.
 */
const DETAIL_LINE_RAISE_PX = 50;

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
  onPrev,
  onNext,
}: {
  item: LightboxItem;
  onClose: () => void;
  /** When provided, a left chevron shows and ← navigates to the previous photo. */
  onPrev?: () => void;
  /** When provided, a right chevron shows and → navigates to the next photo. */
  onNext?: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState(false);

  // Detail callout geometry: the main + detail image boxes, measured to draw the
  // connector line. Rendered on desktop only (the annotation needs the width).
  const isDesktop = useIsDesktop();
  const showDetail = Boolean(item.detail) && isDesktop === true;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const [line, setLine] = useState<{
    w: number;
    h: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  const measure = useCallback(() => {
    const anchor = item.detail?.anchor;
    const stage = stageRef.current;
    const main = mainRef.current;
    const detail = detailRef.current;
    if (!anchor || !stage || !main || !detail) return;
    const s = stage.getBoundingClientRect();
    const m = main.getBoundingClientRect();
    const d = detail.getBoundingClientRect();
    if (!m.width || !d.width) return;
    setLine({
      w: s.width,
      h: s.height,
      x1: m.left - s.left + anchor.x * m.width,
      y1: m.top - s.top + anchor.y * m.height - DETAIL_LINE_RAISE_PX,
      x2: d.left - s.left,
      y2: d.top - s.top + d.height,
    });
  }, [item.detail?.anchor]);

  useEffect(() => {
    if (!showDetail) return;
    measure();
    const observer = new ResizeObserver(measure);
    if (stageRef.current) observer.observe(stageRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [showDetail, measure]);

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

  // Escape closes; ←/→ paginate when handlers are provided.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
      else if (e.key === "ArrowLeft") onPrev?.();
      else if (e.key === "ArrowRight") onNext?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose, onPrev, onNext]);

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

      {/* Prev/next chevrons — thin single strokes matching the ✕, vertically centred. */}
      {onPrev && (
        <button
          type="button"
          aria-label="Previous photograph"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="fixed left-7 top-1/2 -translate-y-1/2 text-ink"
        >
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <polyline
              points="16,3 6,13 16,23"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </button>
      )}
      {onNext && (
        <button
          type="button"
          aria-label="Next photograph"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="fixed right-7 top-1/2 -translate-y-1/2 text-ink"
        >
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <polyline
              points="10,3 20,13 10,23"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </button>
      )}

      {/* Image + caption. Clicking inside must NOT close (only the backdrop does). */}
      <figure
        onClick={(e) => e.stopPropagation()}
        className="m-0 flex flex-col items-center"
      >
        <div ref={stageRef} className="relative flex items-center gap-[3vw]">
          <div ref={mainRef} className="flex">
            <Image
              src={item.src}
              alt={item.alt ?? item.title ?? "Exhibition photograph"}
              width={0}
              height={0}
              sizes="(min-width:768px) 80vh, 90vw"
              className="h-[80vh] w-auto max-w-[95vw] rounded-[2px] object-contain"
              style={{ width: "auto", height: "80vh" }}
              onLoad={showDetail ? measure : undefined}
            />
          </div>

          {showDetail && item.detail && (
            <div ref={detailRef} className="flex">
              <Image
                src={item.detail.src}
                alt={
                  item.detail.alt ?? `Detail of ${item.title ?? "the artwork"}`
                }
                width={0}
                height={0}
                sizes="300px"
                quality={90}
                className="h-[21vh] w-auto rounded-[2px] object-contain"
                style={{ width: "auto", height: "21vh" }}
                onLoad={measure}
              />
            </div>
          )}

          {showDetail && line && (
            <svg
              className="pointer-events-none absolute left-0 top-0 text-ink"
              width={line.w}
              height={line.h}
              aria-hidden="true"
            >
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="currentColor"
                strokeWidth={1}
              />
            </svg>
          )}
        </div>

        {item.title && (
          <figcaption className="mt-6 text-center">
            <span className="block font-sans text-[12px] italic uppercase tracking-[0.1em] leading-none text-ink">
              {item.title}
            </span>
            {item.year && (
              <span className="mt-2 block font-sans text-[12px] uppercase tracking-[0.1em] leading-none text-ink-muted">
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

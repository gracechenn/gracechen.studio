"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { clsx } from "@/lib/clsx";
import { GalleryTuningPanel } from "@/components/exhibitions/GalleryTuningPanel";
import { Lightbox } from "@/components/Lightbox";

/** One installation photo cell. `width` is its resting width; height is fixed. */
export type PhotoItem = {
  src: string;
  width: number;
  className?: string;
  /** Optional caption title — only set on photos we actually know. */
  title?: string;
  /** Optional year, shown under the title in the lightbox. */
  year?: string;
};

/** A visual row of photos — carries its own flex layout class + its cells. */
export type PhotoRowConfig = {
  className: string;
  items: PhotoItem[];
};

/** Fixed resting height (px) shared by every cell — matches `h-[100px]`. */
const CELL_HEIGHT = 100;

/**
 * Live-tunable knobs for the hover interaction. The panel edits this state and
 * the same values drive the JS push math + CSS transition, so tweaks are live.
 */
export type GalleryTuning = {
  /** Transition duration (ms) for both expand and settle-back. */
  durationMs: number;
  /** CSS timing-function string (e.g. a cubic-bezier or a keyword). */
  easing: string;
  /** Hovered photo scales so max(width, height) === this (px). */
  expandMax: number;
  /** Max displacement (px) applied to the closest neighbours. */
  pushStrength: number;
  /** Characteristic distance (px) over which the push influence decays. */
  falloffRadius: number;
};

/**
 * Shipped defaults. `expandMax` 425 caps the hovered photo's larger dimension;
 * `pushStrength`/`falloffRadius` are tuned so the nearest neighbours (the
 * cross-row images ~220px away) clearly clear the enlarged 425px photo while
 * distant images barely drift — a natural, organic falloff.
 */
export const DEFAULT_TUNING: GalleryTuning = {
  durationMs: 920,
  easing: "ease",
  expandMax: 425,
  pushStrength: 105,
  falloffRadius: 675,
};

type Point = { x: number; y: number };
type CellTransform = { scale: number; tx: number; ty: number };
const IDENTITY: CellTransform = { scale: 1, tx: 0, ty: 0 };

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Show the dev tuning panel only on a URL with `?tune` (hidden by default).
 * `useSyncExternalStore` keeps this hydration-safe: the server (and first
 * client paint) sees `false`, then it resolves to the real value on the client.
 */
const subscribeNoop = () => () => {};
function useTuningPanelVisible() {
  return useSyncExternalStore(
    subscribeNoop,
    () => new URLSearchParams(window.location.search).has("tune"),
    () => false,
  );
}

/**
 * Gallery-level hover interaction. Because the push must reach ACROSS rows
 * (up/down), a single client component owns every cell across all rows: it
 * holds a ref to each cell, and on hover it measures their resting layout
 * geometry (transform-independent `offsetLeft/Top/Width/Height`, relative to
 * the shared positioned ancestor) to compute a radial repulsion.
 *
 * For a hovered cell H, every other cell C translates away along the vector
 * from H's centre to C's centre. The magnitude falls off with distance via a
 * Gaussian `exp(-(d / falloffRadius)^2)`, so near cells move a lot and far
 * cells barely move. The hovered cell itself scales uniformly (aspect
 * preserved) so its larger dimension hits `expandMax`.
 *
 * Clicking a cell opens the {@link Lightbox}; this coexists with the hover
 * push (hover still animates). The gallery is rendered inside a fit-to-viewport
 * `transform: scale()` wrapper, so both overlays (lightbox + dev tuning panel)
 * are portalled to `document.body` to escape that transform's containing block.
 */
export function PhotoGallery({ rows }: { rows: PhotoRowConfig[] }) {
  // Flatten rows while assigning each cell a stable global index.
  const indexedRows = useMemo(() => {
    let next = 0;
    return rows.map((row) => ({
      className: row.className,
      items: row.items.map((item) => ({ item, index: next++ })),
    }));
  }, [rows]);
  const flat = useMemo(
    () => indexedRows.flatMap((row) => row.items.map((cell) => cell.item)),
    [indexedRows],
  );

  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Mirror of `hovered` readable inside the ResizeObserver without re-subscribing.
  const hoveredRef = useRef<number | null>(null);
  // The cell that opened the lightbox, so focus can be restored on close.
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const [tuning, setTuning] = useState<GalleryTuning>(DEFAULT_TUNING);
  const [hovered, setHovered] = useState<number | null>(null);
  // Resting centres captured at hover time (transform-independent geometry).
  const [centers, setCenters] = useState<Array<Point | null> | null>(null);
  // The currently open lightbox photo, or null when closed.
  const [lightboxItem, setLightboxItem] = useState<PhotoItem | null>(null);

  const reducedMotion = usePrefersReducedMotion();
  const panelVisible = useTuningPanelVisible();

  // Derive each cell's transform purely from hover state + measured centres +
  // live tuning — no effect, so panel tweaks recompute on the next render.
  const transforms = useMemo<CellTransform[] | null>(() => {
    if (hovered === null || reducedMotion || !centers) return null;
    const hc = centers[hovered];
    if (!hc) return null;

    const { pushStrength, falloffRadius, expandMax } = tuning;
    return flat.map((cell, i): CellTransform => {
      if (i === hovered) {
        const base = Math.max(cell.width, CELL_HEIGHT);
        return { scale: expandMax / base, tx: 0, ty: 0 };
      }
      const c = centers[i];
      if (!c) return IDENTITY;
      const dx = c.x - hc.x;
      const dy = c.y - hc.y;
      const dist = Math.hypot(dx, dy) || 1;
      const falloff = Math.exp(-((dist / falloffRadius) ** 2));
      const mag = pushStrength * falloff;
      return { scale: 1, tx: (dx / dist) * mag, ty: (dy / dist) * mag };
    });
  }, [hovered, centers, tuning, reducedMotion, flat]);

  // Measure every cell's resting centre from transform-independent geometry
  // (`offset*`), relative to the shared positioned ancestor. Re-run whenever the
  // layout could have reflowed so the push vectors stay accurate.
  const measureCenters = useCallback(
    (): Array<Point | null> =>
      flat.map((_, k): Point | null => {
        const el = cellRefs.current[k];
        if (!el) return null;
        return {
          x: el.offsetLeft + el.offsetWidth / 2,
          y: el.offsetTop + el.offsetHeight / 2,
        };
      }),
    [flat],
  );

  const handleEnter = (i: number) => {
    hoveredRef.current = i;
    setCenters(measureCenters());
    setHovered(i);
  };

  const handleLeave = () => {
    hoveredRef.current = null;
    setHovered(null);
  };

  const openLightbox = (item: PhotoItem, el: HTMLDivElement) => {
    triggerRef.current = el;
    setLightboxItem(item);
  };

  const closeLightbox = () => {
    setLightboxItem(null);
    // Restore focus to the image that opened the lightbox.
    triggerRef.current?.focus();
  };

  // The flex rows wrap at width-dependent breakpoints, so a resize reflows the
  // grid and shifts every cell. Watch the gallery container and, if a hover is
  // in progress when the layout changes, re-measure the resting centres so the
  // radial push keeps pointing at the correct (post-reflow) positions. (Under
  // the fit-to-viewport scaler the outer `transform` never alters these
  // `offset*` geometries, so the push stays correct without extra work.)
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (hoveredRef.current !== null) setCenters(measureCenters());
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [measureCenters]);

  const transition = reducedMotion
    ? undefined
    : `transform ${tuning.durationMs}ms ${tuning.easing}`;

  return (
    <div ref={rootRef} className="mt-[93px] space-y-[119px]">
      {indexedRows.map((row, rowIndex) => (
        <div key={rowIndex} className={row.className}>
          {row.items.map(({ item, index }) => {
            const t = transforms?.[index] ?? IDENTITY;
            return (
              <div
                key={item.src}
                ref={(el) => {
                  cellRefs.current[index] = el;
                }}
                role="button"
                tabIndex={0}
                aria-label={
                  item.title ? `View ${item.title}` : "View installation photograph"
                }
                className={clsx(
                  "relative h-[100px] shrink-0 cursor-pointer overflow-hidden",
                  item.className,
                )}
                style={{
                  width: item.width,
                  zIndex: hovered === index ? 30 : undefined,
                  transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`,
                  transition,
                }}
                onMouseEnter={() => handleEnter(index)}
                onMouseLeave={handleLeave}
                onClick={(e) => openLightbox(item, e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openLightbox(item, e.currentTarget);
                  }
                }}
              >
                <Image
                  src={item.src}
                  alt="Installation photograph"
                  fill
                  sizes="450px"
                  quality={90}
                  className="object-cover"
                />
              </div>
            );
          })}
        </div>
      ))}

      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={closeLightbox} />
      )}

      {panelVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <GalleryTuningPanel
            tuning={tuning}
            onChange={setTuning}
            defaults={DEFAULT_TUNING}
          />,
          document.body,
        )}
    </div>
  );
}

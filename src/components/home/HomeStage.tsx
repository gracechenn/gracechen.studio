"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { galleryArtworks, type Artwork } from "@/data/gallery";
import { FilmBendCanvas } from "@/components/home/FilmBendCanvas";

/**
 * Homepage interaction — a single centered row of hairline ticks. Each tick is
 * one item (32 gallery images + the intro card). Hovering (desktop) or tapping
 * (touch) a tick expands it in place into its image, pushing neighbours aside.
 * Only one item is ever expanded; leaving collapses it back to a tick.
 */

type Item =
  | { kind: "image"; art: (typeof galleryArtworks)[number] }
  | { kind: "card" };

/** Card sits dead-center; the 32 images split evenly to either side. */
const HALF = Math.floor(galleryArtworks.length / 2);
const ITEMS: Item[] = [
  ...galleryArtworks.slice(0, HALF).map((art): Item => ({ kind: "image", art })),
  { kind: "card" },
  ...galleryArtworks.slice(HALF).map((art): Item => ({ kind: "image", art })),
];

/** Resting/default open item = the centre intro card. */
const DEFAULT_INDEX = HALF;
/** Nothing open — the initial state before the first pointer interaction. */
const NONE = -1;

/* Tick geometry (matches the Figma closed state). */
const TICK_W = 2.5;
const TICK_H = 39;
const TICK_COLOR = "rgba(31,31,31,0.4)";

/**
 * Horizontal clearance (px) between an expanded image and the neighbouring tick
 * on each side. Applied as half this value of inline padding on every item, so
 * the two adjacent items each contribute EXPAND_GAP_PX / 2 and any pairing
 * (collapsed or expanded) lands at exactly EXPAND_GAP_PX between contents.
 */
const EXPAND_GAP_PX = 20;

/**
 * Resting (collapsed) tick-to-tick gap in px — deliberately tighter than the
 * expanded EXPAND_GAP_PX so the hairline row reads compact, while an opened
 * image/card still gets its full EXPAND_GAP_PX clearance from neighbours.
 */
const TICK_GAP_PX = 14;

/* Motion — easeOutCubic so growth glides rather than snaps. No delay. */
const EASE = "ease";
/** Image bloom: open slow & pronounced, collapse quick. */
const OPEN_MS = 1500;
const CLOSE_MS = 1500;
/** Hairline wave stays quick & lively, independent of the image bloom. */
const WAVE_MS = 170;

/** Image-open transition timing. */
const OPEN_DUR = `${OPEN_MS}ms`;
const CLOSE_DUR = `${CLOSE_MS}ms`;
const OPEN_EASE = EASE;
const CLOSE_EASE = EASE;

/* -------------------------------------------------------------------------- */
/* Real 3D film-strip bend lives in FilmBendCanvas (native WebGL): the open     */
/* image is textured onto a subdivided plane and bowed convex about a vertical   */
/* axis under perspective. The intro card is a flat DOM surface revealed by the  */
/* same growing clip-box as images, so it settles at its exact size (no snap).   */
/* -------------------------------------------------------------------------- */
/** Perspective depth of each item's own 3D stage (smaller = stronger 3D). */
const POP_PERSPECTIVE = 900;

/* -------------------------------------------------------------------------- */
/* Proximity wave (macOS-dock style) — dials, easy to tune.                    */
/* -------------------------------------------------------------------------- */
/** Falloff radius in px — how far the swell reaches on each side of the cursor. */
const WAVE_RADIUS = 160;
/** Peak vertical lift: hairline scales up to this multiple of its 39px rest. */
const WAVE_MAX_SCALE_Y = 2.2;
/** Slight overall magnify near the cursor so the row gently breathes (subtle). */
const WAVE_SWELL = 0.25;
/** Resting / peak hairline alpha (darkens toward the cursor). */
const WAVE_MIN_ALPHA = 0.4;
const WAVE_MAX_ALPHA = 0.75;

/** Raised-cosine falloff → 1 at the cursor, easing to 0 at WAVE_RADIUS. */
function waveLift(distance: number): number {
  if (distance >= WAVE_RADIUS) return 0;
  return 0.5 * (1 + Math.cos((Math.PI * distance) / WAVE_RADIUS));
}

/* Expanded card dimensions from Figma. */
const CARD_W = 445;
const CARD_H = 291;
/** Intro/default card display width (px) — larger than the 250 image cap. */
const CARD_OPEN_W = 350;

/**
 * Every expanded item fits a square cap: the longer edge is IMAGE_MAX_PX and the
 * shorter edge follows the aspect ratio, so neither dimension ever exceeds it.
 */
const IMAGE_MAX_PX = 250;

type Size = { w: number; h: number };

/** Expanded footprint before the viewport clamp. Images cap at IMAGE_MAX_PX;
 *  the intro card opens wider (CARD_OPEN_W) at its Figma aspect. */
function baseSize(item: Item): Size {
  if (item.kind === "card") {
    const aspect = CARD_W / CARD_H;
    return { w: CARD_OPEN_W, h: CARD_OPEN_W / aspect };
  }
  const aspect = item.art.display?.aspect ?? item.art.aspect;
  return aspect >= 1
    ? { w: IMAGE_MAX_PX, h: IMAGE_MAX_PX / aspect }
    : { w: IMAGE_MAX_PX * aspect, h: IMAGE_MAX_PX };
}

/** Scale a size down so it never overflows the viewport (preserves aspect). */
function fit({ w, h }: Size, vw: number, vh: number): Size {
  const maxW = vw * 0.9;
  const maxH = vh * 0.68;
  let s = 1;
  if (w > maxW) s = Math.min(s, maxW / w);
  if (h > maxH) s = Math.min(s, maxH / h);
  return { w: Math.round(w * s), h: Math.round(h * s) };
}

/** object-fit / object-position for an image item (cover vs contain; crop anchor). */
function imageFraming(art: Artwork): { fit: "cover" | "contain"; position: string } {
  const fit = art.display?.fit ?? (art.transparent ? "contain" : "cover");
  return { fit, position: `center ${art.display?.position ?? "center"}` };
}

export function HomeStage() {
  const [expanded, setExpanded] = useState<number>(NONE);
  const [bendingIndex, setBendingIndex] = useState<number | null>(null);
  const [viewport, setViewport] = useState<Size>({ w: 1440, h: 900 });

  const rowRef = useRef<HTMLUListElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const pendingY = useRef<number | null>(null);
  const pendingX = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const reducedMotion = useRef(false);
  /** True once the pointer has first engaged the row; only then does the idle
   *  state fall back to the centre card (before that, nothing is open). */
  const hasInteracted = useRef(false);

  useEffect(() => {
    const measure = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotion.current = mq.matches;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(
    () => () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    },
    [],
  );

  /** Touch/click: open a tick, or fall back to the default card if re-tapped. */
  const toggle = useCallback((i: number) => {
    hasInteracted.current = true;
    setExpanded((prev) => (prev === i ? DEFAULT_INDEX : i));
  }, []);

  /**
   * Resolve which item the cursor is selecting from the LIVE, animating element
   * rects. Hold the currently open item while the cursor stays inside its own
   * live footprint ("don't switch until I leave the current image"); otherwise
   * pick whichever tile's live rect the cursor is over, falling back to the
   * nearest tile centre. Off the row vertically, or past either horizontal end,
   * settles on the centre intro card.
   */
  const resolveFromX = useCallback((x: number, y: number) => {
    const row = rowRef.current;
    if (!row) return;
    const tiles = row.querySelectorAll<HTMLElement>("[data-tile]");
    const n = tiles.length;
    if (n === 0) return;

    const rect = row.getBoundingClientRect();

    setExpanded((prev) => {
      if (y < rect.top || y > rect.bottom) return DEFAULT_INDEX;

      const current = tiles[prev]?.getBoundingClientRect();
      if (current && x >= current.left && x <= current.right) return prev;

      const first = tiles[0].getBoundingClientRect();
      const last = tiles[n - 1].getBoundingClientRect();
      if (x < first.left || x > last.right) return DEFAULT_INDEX;

      let nearest = DEFAULT_INDEX;
      let nearestDist = Infinity;
      for (let i = 0; i < n; i++) {
        const r = tiles[i].getBoundingClientRect();
        if (x >= r.left && x <= r.right) return i;
        const dist = Math.abs(x - (r.left + r.right) / 2);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      }
      return nearest;
    });
  }, []);

  /**
   * Imperative dock-style proximity swell: each hairline near the cursor swells
   * — a subtle overall magnify (scaleX) plus the taller vertical lift (scaleY) —
   * and darkens, on a smooth raised-cosine falloff by horizontal distance, so
   * the row gently breathes symmetrically around the pointer. Driven straight on
   * the DOM (not React state) so per-frame updates never re-render the items:
   * reads all centres first, then writes transforms — one layout read per frame.
   * Scale is applied about each tick's centre (transform-origin: center, no
   * translate) so ticks never drift off their midpoint.
   */
  const applyWave = useCallback((x: number) => {
    if (reducedMotion.current) return;
    const row = rowRef.current;
    if (!row) return;
    const ticks = row.querySelectorAll<HTMLElement>("[data-tick]");
    const centres: number[] = [];
    for (const el of ticks) {
      const r = el.getBoundingClientRect();
      centres.push((r.left + r.right) / 2);
    }
    for (let i = 0; i < ticks.length; i++) {
      const s = waveLift(Math.abs(centres[i] - x));
      const scaleX = 1 + WAVE_SWELL * s;
      const scaleY = 1 + s * (WAVE_MAX_SCALE_Y - 1);
      const alpha = WAVE_MIN_ALPHA + s * (WAVE_MAX_ALPHA - WAVE_MIN_ALPHA);
      ticks[i].style.transform = `scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
      ticks[i].style.backgroundColor = `rgba(31,31,31,${alpha.toFixed(3)})`;
    }
  }, []);

  /** Settle every hairline back to a flat, resting tick. */
  const resetWave = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    row.querySelectorAll<HTMLElement>("[data-tick]").forEach((el) => {
      el.style.transform = "scale(1, 1)";
      el.style.backgroundColor = TICK_COLOR;
    });
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLUListElement>) => {
      if (e.pointerType !== "mouse") return; // touch uses tap-to-toggle
      hasInteracted.current = true;
      pendingX.current = e.clientX;
      pendingY.current = e.clientY;
      if (rafId.current != null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const x = pendingX.current;
        const y = pendingY.current;
        if (x == null || y == null) return;

        resolveFromX(x, y);
        applyWave(x);
      });
    },
    [resolveFromX, applyWave],
  );

  /** Pointer left / went idle / tapped away → settle to the idle state: the
   *  centre card once interacted, otherwise nothing open (initial load). */
  const clear = useCallback(() => {
    setExpanded(hasInteracted.current ? DEFAULT_INDEX : NONE);
    resetWave();
  }, [resetWave]);

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-1 items-center justify-center overflow-hidden"
      onMouseLeave={clear}
      onClick={clear}
    >
      <div className="no-scrollbar w-full overflow-x-auto overflow-y-hidden">
        <ul
          ref={rowRef}
          onPointerMove={handlePointerMove}
          onMouseLeave={clear}
          className="mx-auto flex w-max items-center justify-center gap-0 px-[8vw]"
        >
          {ITEMS.map((item, i) => {
            const isOpen = expanded === i;
            const { w, h } = fit(baseSize(item), viewport.w, viewport.h);
            const key = item.kind === "card" ? "intro-card" : item.art.id;
            // Hairline edge for white-background rectangles (never cutouts).
            const whiteBorder = item.kind === "image" && !!item.art.whiteBorder;

            return (
              <li key={key} data-tile className="flex shrink-0">
                <button
                  type="button"
                  aria-label={
                    item.kind === "card"
                      ? "Show intro card"
                      : `Show artwork ${i + 1}`
                  }
                  aria-expanded={isOpen}
                  onFocus={() => {
                    hasInteracted.current = true;
                    setExpanded(i);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(i);
                  }}
                  className="flex min-h-[128px] items-center justify-center bg-transparent"
                  style={{
                    paddingInline: isOpen
                      ? item.kind === "card"
                        ? EXPAND_GAP_PX
                        : EXPAND_GAP_PX - TICK_GAP_PX / 2
                      : TICK_GAP_PX / 2,
                    transition: `padding ${isOpen ? OPEN_DUR : CLOSE_DUR} ${isOpen ? OPEN_EASE : CLOSE_EASE}`,
                  }}
                >
                  <span
                    className="relative block"
                    style={{
                      width: isOpen ? w : TICK_W,
                      height: isOpen ? h : TICK_H * WAVE_MAX_SCALE_Y,
                      perspective: `${POP_PERSPECTIVE}px`,
                      transformStyle: "preserve-3d",
                      transition: `width ${isOpen ? OPEN_DUR : CLOSE_DUR} ${isOpen ? OPEN_EASE : CLOSE_EASE}, height ${isOpen ? OPEN_DUR : CLOSE_DUR} ${isOpen ? OPEN_EASE : CLOSE_EASE}`,
                    }}
                  >
                    {/* Hairline tick — lifts with the proximity wave (transform
                        + colour set imperatively so re-renders never clobber the
                        wave), and fades out on full expand. Centering + rest
                        colour live in classes for the pre-hydration state. */}
                    <span
                      aria-hidden
                      data-tick
                      className="absolute inset-0 m-auto bg-[#1f1f1f]/40"
                      style={{
                        width: TICK_W,
                        height: TICK_H,
                        transformOrigin: "center",
                        opacity: isOpen ? 0 : 1,
                        transition: `transform ${WAVE_MS}ms ${EASE}, background-color ${WAVE_MS}ms ${EASE}, opacity ${isOpen ? OPEN_DUR : CLOSE_DUR} ${isOpen ? OPEN_EASE : CLOSE_EASE}`,
                      }}
                    />

                    {/* Expanded visual. Images show a flat <img> (data-img-box);
                        while opening, FilmBendCanvas overlays the same box and
                        bends the whole surface in WebGL, hiding this <img> until
                        it settles flat. The intro card keeps its CSS forward pop. */}
                    <span
                      className="absolute inset-0 block"
                      style={{
                        opacity: isOpen ? 1 : 0,
                        perspective: `${POP_PERSPECTIVE}px`,
                        transformStyle: "preserve-3d",
                        transition: `opacity ${isOpen ? OPEN_DUR : CLOSE_DUR} ${isOpen ? OPEN_EASE : CLOSE_EASE}`,
                        pointerEvents: isOpen ? "auto" : "none",
                      }}
                    >
                      {item.kind === "card" ? (
                        <span className="absolute inset-0 block overflow-hidden">
                          <span
                            className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2"
                            style={{ width: w, height: h }}
                          >
                            <Image
                              src="/assets/intro-card.png"
                              alt="Grace Chen is a painter and artist based in nyc."
                              fill
                              sizes="350px"
                              className="object-cover"
                              priority
                            />
                            {/* SHOP PRINTS → — centred in the lower portion. */}
                            <Link
                              href="/shop"
                              onClick={(e) => e.stopPropagation()}
                              className="group absolute left-1/2 top-[72%] -translate-x-1/2 whitespace-nowrap type-label"
                            >
                              <span
                                aria-hidden
                                className="absolute inset-0 text-accent-muted blur-[1px]"
                              >
                                Shop prints →
                              </span>
                              <span className="relative inline-block text-accent-muted transition-transform duration-200 group-hover:-translate-y-px group-hover:text-accent">
                                Shop prints →
                              </span>
                            </Link>
                          </span>
                        </span>
                      ) : (
                        (() => {
                          const { fit: objectFit, position: objectPosition } =
                            imageFraming(item.art);
                          return (
                            <span
                              aria-hidden
                              data-img-box
                              className="absolute inset-0 block overflow-hidden"
                              style={{
                                border: whiteBorder ? "1px solid #E2E2E2" : undefined,
                                opacity: bendingIndex === i ? 0 : 1,
                                pointerEvents: "none",
                              }}
                            >
                              <span
                                className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2"
                                style={{ width: w, height: h }}
                              >
                                <Image
                                  src={item.art.image}
                                  alt=""
                                  fill
                                  sizes="250px"
                                  style={{ objectFit, objectPosition }}
                                />
                              </span>
                            </span>
                          );
                        })()
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {(() => {
        const openItem = ITEMS[expanded];
        const openArt = openItem?.kind === "image" ? openItem.art : null;
        return (
          <FilmBendCanvas
            rowRef={rowRef}
            containerRef={sectionRef}
            openIndex={expanded}
            isImage={!!openArt}
            src={openArt ? openArt.image : ""}
            fit={
              openArt
                ? openArt.display?.fit ?? (openArt.transparent ? "contain" : "cover")
                : "cover"
            }
            position={openArt?.display?.position ?? "center"}
            whiteBorder={!!openArt?.whiteBorder}
            onActiveChange={setBendingIndex}
          />
        );
      })()}
    </section>
  );
}

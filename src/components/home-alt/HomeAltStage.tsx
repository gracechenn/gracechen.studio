"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { shoppableHomeAltIndexes, type HomeAltSlide } from "@/data/homeAlt";
import { ShopCursor } from "./ShopCursor";

/** Click sound played on each image change. */
const SOUND_SRC = "/assets/home-alt/click.m4a";

// ── Tick ruler geometry (from Figma 296:1481) ──────────────────────────────
const TICK_SPACING = 20; // px between adjacent ticks
const TICK_MIN = 20.78; // shortest tick height
const TICK_MAX = 39.36; // tallest (centre) tick height
const TICK_SPREAD = 3.2; // ticks out from centre until the height floors
const TICK_W = 1.5; // tick thickness

// Non-selected ticks sit at 40% opacity.
const TICK_DIM_OPACITY = 0.4;

// ── Tunable animation speeds (see HomeAltTuningPanel) ───────────────────────
export type HomeAltTuning = {
  wheelSensitivity: number; // scroll delta → index units (low = slower scrub)
  lerp: number; // wheel easing of progress toward the target each frame
  clickMs: number; // duration of the eased tween when a tick is clicked
  crossfadeMs: number; // image pop in/out duration
  hoverGrowMs: number; // hovered tick grows to full height this fast
  hoverShrinkMs: number; // …and eases back down this slowly on un-hover
};

export const DEFAULT_TUNING: HomeAltTuning = {
  wheelSensitivity: 0.0026,
  lerp: 0.4,
  clickMs: 800,
  crossfadeMs: 350,
  hoverGrowMs: 420,
  hoverShrinkMs: 700,
};

// Chime playback
const CHIME_VOLUME = 0.18; // 0–1
const CHIME_RATE = 0.9; // <1 lowers the pitch (with preservesPitch off)

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Layer = { key: number; idx: number; state: "in" | "out" };

export function HomeAltStage({ slides }: { slides: HomeAltSlide[] }) {
  const count = slides.length;
  const maxIndex = Math.max(0, count - 1);
  const router = useRouter();

  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  // A small pool of pre-unlocked audio elements (round-robined per play) so rapid
  // image changes can overlap and — crucially — so scroll-triggered chimes stay
  // audible across browsers once the audio has been unlocked (see below).
  const audioPoolRef = useRef<HTMLAudioElement[]>([]);
  const audioIdxRef = useRef(0);

  // Continuous scrub position (float). progressRef drives rendering each frame;
  // targetRef is where wheel/hover want us to go; a rAF loop eases between them.
  const progressRef = useRef(0);
  const targetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastIndexRef = useRef(0);
  const layerKeyRef = useRef(1);
  // Active click tween (time-based eased move); null when wheel-scrubbing.
  const tweenRef = useRef<{ from: number; to: number; start: number } | null>(
    null,
  );
  const scrubbingRef = useRef(false);

  const [progress, setProgress] = useState(0);
  const [index, setIndex] = useState(0);
  const [layers, setLayers] = useState<Layer[]>([
    { key: 0, idx: 0, state: "in" },
  ]);
  // Cursor x relative to the strip centre (px), or null when not hovering.
  const [hoverOffsetPx, setHoverOffsetPx] = useState<number | null>(null);
  // True while progress is animating, so ticks track it instantly (no lag).
  const [scrubbing, setScrubbing] = useState(false);
  // Whether the pointer is currently over the artwork.
  const [overImage, setOverImage] = useState(false);
  // Gate the first paint until we've picked a random starting image (avoids a
  // flash of image 0 and any SSR hydration mismatch).
  const [ready, setReady] = useState(false);

  // Animation speeds. Mirrored to a ref so the rAF loop and event handlers
  // always read the values without being re-created.
  const tuning = DEFAULT_TUNING;
  const tuningRef = useRef(tuning);

  // Start on a random SHOPPABLE artwork each time the page mounts (falling back
  // to any slide if none are shoppable). This must be a mount-time effect (not a
  // render-time initializer) so the server and first client render agree on
  // index 0 — then we jump to the random pick before paint, gated behind
  // `ready` to avoid a flash.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const pool = shoppableHomeAltIndexes.length
      ? shoppableHomeAltIndexes
      : null;
    const r = pool
      ? pool[Math.floor(Math.random() * pool.length)]
      : Math.floor(Math.random() * count);
    progressRef.current = r;
    targetRef.current = r;
    lastIndexRef.current = r;
    setProgress(r);
    setIndex(r);
    setLayers([{ key: 0, idx: r, state: "in" }]);
    setReady(true);
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Image box height scales with viewport; per-image width comes from aspect.
  const [boxH, setBoxH] = useState(360);
  useEffect(() => {
    const compute = () =>
      setBoxH(Math.round(clamp(window.innerHeight * 0.46, 260, 520)));
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // Preload a small pool of audio elements. We reuse (not clone) them, because
  // cloned elements are never audio-"unlocked" in Safari and can't play outside
  // a user gesture (e.g. on scroll) — leaving scroll chimes silent.
  useEffect(() => {
    audioPoolRef.current = Array.from({ length: 8 }, () => {
      const a = new Audio(SOUND_SRC);
      a.preload = "auto";
      a.volume = CHIME_VOLUME;
      // Drop the pitch a touch: only works when the browser is told not to
      // preserve pitch across a changed playback rate.
      a.preservesPitch = false;
      a.playbackRate = CHIME_RATE;
      return a;
    });
    return () => {
      audioPoolRef.current = [];
    };
  }, []);

  // Browsers block audio until a real user gesture — and scrolling/wheel does
  // NOT count as one. On the first pointer/key/touch anywhere, "unlock" EVERY
  // pooled element (play muted within the gesture, then reset). From then on,
  // reusing those same elements lets scroll-triggered chimes play — in Chrome
  // AND Safari — without needing to click a tick first.
  useEffect(() => {
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      for (const a of audioPoolRef.current) {
        a.muted = true;
        a
          .play()
          .then(() => {
            a.pause();
            a.currentTime = 0;
            a.muted = false;
          })
          .catch(() => {
            a.muted = false;
          });
      }
      remove();
    };
    const remove = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock);
    return remove;
  }, []);

  const playClick = useCallback(() => {
    const pool = audioPoolRef.current;
    if (!pool.length) return;
    const a = pool[audioIdxRef.current];
    audioIdxRef.current = (audioIdxRef.current + 1) % pool.length;
    try {
      a.currentTime = 0;
      a.volume = CHIME_VOLUME;
      a.playbackRate = CHIME_RATE;
      void a.play().catch(() => {});
    } catch {
      /* audio not available — ignore */
    }
  }, []);

  const commitIndex = useCallback(
    (next: number) => {
      setIndex(next);
      const key = layerKeyRef.current++;
      setLayers((prev) => {
        const fading = prev.map((l) => ({ ...l, state: "out" as const }));
        return [...fading, { key, idx: next, state: "in" as const }].slice(-4);
      });
      // Prune the faded-out layers once the crossfade has finished.
      window.setTimeout(() => {
        setLayers((prev) => prev.slice(-1));
      }, tuningRef.current.crossfadeMs + 40);
      playClick();
    },
    [playClick],
  );

  const runLoop = useCallback(() => {
    if (!scrubbingRef.current) {
      scrubbingRef.current = true;
      setScrubbing(true);
    }
    if (rafRef.current != null) return;
    const step = () => {
      let nextProgress: number;
      let settled: boolean;

      const tween = tweenRef.current;
      if (tween) {
        // Time-based eased tween (clicks).
        const dur = Math.max(1, tuningRef.current.clickMs);
        const e = clamp((performance.now() - tween.start) / dur, 0, 1);
        nextProgress = tween.from + (tween.to - tween.from) * easeInOutCubic(e);
        settled = e >= 1;
        if (settled) {
          nextProgress = tween.to;
          tweenRef.current = null;
        }
      } else {
        // Exponential ease toward the wheel target.
        const cur = progressRef.current;
        const delta = targetRef.current - cur;
        settled = Math.abs(delta) < 0.0015;
        nextProgress = settled
          ? targetRef.current
          : cur + delta * tuningRef.current.lerp;
      }

      progressRef.current = nextProgress;
      setProgress(nextProgress);

      const idx = clamp(Math.round(nextProgress), 0, maxIndex);
      if (idx !== lastIndexRef.current) {
        lastIndexRef.current = idx;
        commitIndex(idx);
      }

      if (settled) {
        rafRef.current = null;
        scrubbingRef.current = false;
        setScrubbing(false);
      } else {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [commitIndex, maxIndex]);

  // Wheel scrub — native non-passive listener so we can prevent page scroll.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Wheel overrides any in-flight click tween.
      if (tweenRef.current) {
        tweenRef.current = null;
        targetRef.current = progressRef.current;
      }
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      targetRef.current = clamp(
        targetRef.current + delta * tuningRef.current.wheelSensitivity,
        0,
        maxIndex,
      );
      runLoop();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [maxIndex, runLoop]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Hovering only lifts the ticks near the cursor (see render); it never moves
  // you. We track the cursor's x offset from the strip centre and derive the
  // hovered position from live progress each render, so the lift stays under
  // the cursor even while the strip is animating.
  const onStripMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoverOffsetPx(e.clientX - (rect.left + rect.width / 2));
  }, []);

  const onStripLeave = useCallback(() => setHoverOffsetPx(null), []);

  // Clicking a tick eases (slowly) to that artwork.
  const onStripClick = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = stripRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const to = clamp(
        Math.round(progressRef.current + (e.clientX - centerX) / TICK_SPACING),
        0,
        maxIndex,
      );
      if (to === Math.round(progressRef.current)) return;
      tweenRef.current = { from: progressRef.current, to, start: performance.now() };
      targetRef.current = to;
      runLoop();
    },
    [maxIndex, runLoop],
  );

  // Fit an artwork inside a square whose side is boxH, so the max width always
  // equals the max height (wide images no longer grow past that box).
  const fit = (s: HomeAltSlide) => {
    const a = s.width / s.height;
    return a >= 1
      ? { w: boxH, h: Math.round(boxH / a) }
      : { w: Math.round(boxH * a), h: boxH };
  };

  const current = slides[index] ?? slides[0];
  const { w: currentW, h: currentH } = fit(current);
  const currentPrintSlug = current.printSlug;

  // The tick strip spans the width of the water painting at the current size.
  const waterSlide =
    slides.find((s) => s.src.includes("p17_water")) ?? current;
  const stripW = fit(waterSlide).w;
  // Show the SHOP cursor only while hovering an artwork that has a print.
  const shopActive = overImage && Boolean(currentPrintSlug);

  // The single tick under the cursor (raised to full height), or null.
  const hoverIndex =
    hoverOffsetPx == null
      ? null
      : clamp(Math.round(progress + hoverOffsetPx / TICK_SPACING), 0, maxIndex);

  // The centred (selected) tick — full opacity; all others dim.
  const selectedIndex = clamp(Math.round(progress), 0, maxIndex);

  return (
    <div
      ref={stageRef}
      className={`relative h-[calc(100dvh-77px)] w-full overflow-hidden overscroll-none transition-opacity duration-300 ${
        ready ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Centred artwork + caption block. Caption width follows the current
          image so its left edge always aligns to the image's left edge. */}
      <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2">
        <div
          className={`relative ${currentPrintSlug ? "cursor-none" : ""}`}
          style={{ width: `${currentW}px`, height: `${currentH}px` }}
          onPointerEnter={() => setOverImage(true)}
          onPointerLeave={() => setOverImage(false)}
          onClick={() => {
            if (currentPrintSlug) router.push(`/shop/${currentPrintSlug}`);
          }}
        >
          {layers.map((layer) => {
            const slide = slides[layer.idx];
            if (!slide) return null;
            const { w, h } = fit(slide);
            return (
              <div
                key={layer.key}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: `${w}px`,
                  height: `${h}px`,
                  animation: `homealt-${layer.state} ${tuning.crossfadeMs}ms ease-out forwards`,
                }}
              >
                <Image
                  src={slide.src}
                  alt={slide.title}
                  fill
                  sizes="700px"
                  quality={90}
                  priority={layer.idx === 0}
                  className="object-contain"
                />
              </div>
            );
          })}
        </div>

        <div style={{ width: `${currentW}px` }} className="mt-[28px] text-left">
          <p className="text-[12px] italic uppercase leading-[1.5] tracking-[0.1em] text-[#6a6a6a]">
            {current.title}
          </p>
          <p className="text-[12px] italic uppercase leading-[1.5] tracking-[0.1em] text-[#6a6a6a]">
            {current.year}
          </p>
        </div>
      </div>

      {/* Tick ruler — peaks at the centre (current image), falls off outward.
          Hovering lifts the ticks nearest the cursor; clicking navigates. */}
      <div
        ref={stripRef}
        onPointerMove={onStripMove}
        onPointerLeave={onStripLeave}
        onClick={onStripClick}
        style={{ width: `min(${stripW}px, 92vw)` }}
        className="absolute bottom-[64px] left-1/2 h-[64px] -translate-x-1/2 cursor-pointer overflow-hidden"
      >
        {slides.map((_, i) => {
          // Base height: proximity to the centre (the selected artwork).
          const baseT = Math.max(0, 1 - Math.abs(i - progress) / TICK_SPREAD);
          const isHovered = i === hoverIndex;
          const isSelected = i === selectedIndex;
          // Hovered tick jumps to full selected height; others sit at base.
          const h = isHovered ? TICK_MAX : TICK_MIN + (TICK_MAX - TICK_MIN) * baseT;
          const x = (i - progress) * TICK_SPACING;
          // Skip ticks past the visible window (clipped by overflow-hidden).
          if (Math.abs(x) > stripW / 2 + 20) return null;
          // Instant while scrubbing; grow fast on hover, shrink slowly off it.
          const transition = scrubbing
            ? "none"
            : `height ${isHovered ? tuning.hoverGrowMs : tuning.hoverShrinkMs}ms ease-out, opacity 200ms ease-out`;
          return (
            <span
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-1/2 block bg-ink"
              style={{
                width: `${TICK_W}px`,
                height: `${h}px`,
                opacity: isSelected ? 1 : TICK_DIM_OPACITY,
                transform: `translateX(${x}px) translateX(-50%)`,
                transition,
              }}
            />
          );
        })}
      </div>

      <ShopCursor active={shopActive} />
    </div>
  );
}

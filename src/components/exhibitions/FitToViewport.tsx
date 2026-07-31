"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** `useLayoutEffect` on the client, `useEffect` on the server (no SSR warning). */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Fit-to-viewport scaler.
 *
 * The exhibitions composition is authored in fixed px at a natural design
 * width (`baseWidth`). This wrapper locks a region to the space below the nav
 * (`overflow: hidden`, so the page never scrolls), measures the composition's
 * NATURAL (un-transformed) size, and applies a single `transform: scale()`
 * (origin centre) so the whole thing fits the available height AND width.
 *
 * `scale = min(availW / (naturalW + 2·sideHeadroom), availH / naturalH)`,
 * allowed to go both below and above 1 — so a shorter window shrinks everything
 * to fit and a taller / wider window grows it to fill, always bounded so neither
 * axis overflows. `sideHeadroom` widens the effective width so the fit leaves
 * horizontal breathing room on each side: the composition is centred, so the
 * slack is symmetric and the hover interaction (which enlarges an edge photo and
 * pushes neighbours OUTWARD past the composition's natural left/right edges) is
 * never cut by the region's `overflow: hidden`.
 *
 * Because the scale is a `transform`, it never changes the measured border-box
 * of the stage, so re-measuring on resize can't feed back into itself. We
 * recompute on any resize of the region (viewport) or the stage (late font /
 * image reflow) via a `ResizeObserver`, plus a window `resize` listener.
 */
export function FitToViewport({
  children,
  baseWidth = 1512,
  offsetTop = 77,
  sideHeadroom = 0,
}: {
  children: ReactNode;
  /** Natural design width (px) the composition is authored at. */
  baseWidth?: number;
  /** Fixed height (px) reserved above the region (the nav). */
  offsetTop?: number;
  /**
   * Extra horizontal room (px, in natural/design units) reserved on EACH side
   * when computing the fit-scale. Use this to reserve space for content that can
   * extend past the composition's natural edges at runtime (e.g. an edge photo
   * that enlarges on hover), so it stays inside the region's clip.
   */
  sideHeadroom?: number;
}) {
  const regionRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useIsomorphicLayoutEffect(() => {
    const region = regionRef.current;
    const stage = stageRef.current;
    if (!region || !stage) return;

    const recompute = () => {
      // Natural, pre-transform size (border-box is unaffected by `transform`).
      const naturalW = stage.offsetWidth;
      const naturalH = stage.offsetHeight;
      if (!naturalW || !naturalH) return;
      const availW = region.clientWidth;
      const availH = region.clientHeight;
      // Reserve `sideHeadroom` on each side so runtime-expanding edge content
      // (the hover-enlarged photos) stays within the region's horizontal clip.
      const fitW = availW / (naturalW + 2 * sideHeadroom);
      const fitH = availH / naturalH;
      setScale(Math.min(fitW, fitH));
    };

    recompute();

    const ro = new ResizeObserver(recompute);
    ro.observe(region);
    ro.observe(stage);
    window.addEventListener("resize", recompute);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [sideHeadroom]);

  return (
    <div
      ref={regionRef}
      className="relative flex w-full items-center justify-center overflow-hidden"
      style={{ height: `calc(100dvh - ${offsetTop}px)` }}
    >
      <div
        ref={stageRef}
        style={{
          width: baseWidth,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

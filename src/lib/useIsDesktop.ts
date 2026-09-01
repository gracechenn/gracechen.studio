"use client";

import { useEffect, useLayoutEffect, useState } from "react";

/** `useLayoutEffect` on the client, `useEffect` on the server (no SSR warning). */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Track whether the viewport is at/above a breakpoint (desktop).
 *
 * Returns `null` until mounted so callers can render nothing on the server and
 * first client paint, then resolve to the real value in a layout effect (before
 * the browser paints) — avoiding both a hydration mismatch and a visible flash.
 * Defaults to Tailwind's `md` breakpoint (768px).
 */
export function useIsDesktop(query = "(min-width: 768px)") {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return isDesktop;
}

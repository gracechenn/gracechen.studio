"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Coordinates a group of images so they reveal together instead of popping in
 * one-by-one as each finishes downloading.
 *
 * Pass the number of images in the group. Call the returned `onImageLoad` from
 * every image's `onLoad` handler; `revealed` flips to `true` only once all
 * `count` images have loaded. A `timeoutMs` safety net reveals the group
 * anyway if an image is slow or fails, so a single broken asset can never hide
 * the gallery forever.
 *
 * The images must load eagerly (`loading="eager"`) for this to fire promptly —
 * otherwise lazy images below the fold never load until scrolled into view.
 */
export function useImagesLoaded(count: number, timeoutMs = 6000) {
  const [revealed, setRevealed] = useState(count === 0);
  const loadedRef = useRef(0);

  const onImageLoad = useCallback(() => {
    loadedRef.current += 1;
    if (loadedRef.current >= count) setRevealed(true);
  }, [count]);

  useEffect(() => {
    if (count === 0) {
      setRevealed(true);
      return;
    }
    const t = setTimeout(() => setRevealed(true), timeoutMs);
    return () => clearTimeout(t);
  }, [count, timeoutMs]);

  return { revealed, onImageLoad };
}

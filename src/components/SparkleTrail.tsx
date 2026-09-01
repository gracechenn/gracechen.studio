"use client";

import { useEffect } from "react";

/** The trailing glyphs, matching gracechen.io. */
const GLYPHS = ["✧", "˖", "°", "⋆", "｡", "˚"];

/**
 * Pink sparkle cursor trail, ported from gracechen.io: on every mousemove a
 * random glyph is dropped at the pointer, then fades and scales out over 0.8s
 * (see `.sparkle` in globals.css) before removing itself.
 *
 * Skipped on touch/coarse pointers and when the user prefers reduced motion.
 */
export function SparkleTrail() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      const el = document.createElement("div");
      el.className = "sparkle";
      el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      el.style.left = `${e.pageX}px`;
      el.style.top = `${e.pageY}px`;
      el.style.fontSize = `${12 + 8 * Math.random()}px`;
      el.style.setProperty("--rot", `${360 * Math.random()}deg`);
      document.body.appendChild(el);
      window.setTimeout(() => el.remove(), 800);
    };

    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  return null;
}

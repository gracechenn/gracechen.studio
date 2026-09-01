"use client";

import { useEffect, useRef } from "react";

/**
 * A circular "SHOP" cursor (Figma 311:2728) that follows the pointer and grows
 * in when `active`. Rendered fixed and pointer-transparent; the hovered element
 * hides the native cursor so only this circle shows.
 */
export function ShopCursor({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  // Track the pointer directly (no React state) so movement stays smooth.
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed z-[60] flex size-[133px] items-center justify-center rounded-full bg-[#0051ff] text-white"
      style={{
        left: 0,
        top: 0,
        transform: `translate(-50%, -50%) scale(${active ? 1 : 0})`,
        // Grow in slowly; shrink out quicker.
        transition: `transform ${active ? 450 : 200}ms ease-out`,
      }}
    >
      <span className="whitespace-nowrap text-[12px] tracking-[0.1em]">
        ˚.⋆ SHOP ⊹.˖
      </span>
    </div>
  );
}

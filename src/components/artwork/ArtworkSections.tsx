"use client";

import Image from "next/image";
import { useCallback, useState, useSyncExternalStore } from "react";
import { Lightbox, type LightboxItem } from "@/components/Lightbox";
import { clsx } from "@/lib/clsx";
import { useImagesLoaded } from "@/lib/useImagesLoaded";
import {
  getArtworkDetail,
  getArtworkMeta,
  type ArtworkImage,
  type ArtworkSection,
} from "@/data/artworkCategories";

/** localStorage key remembering whether the grey tile mat is shown. */
const MAT_KEY = "artwork-mat-bg";

const matListeners = new Set<() => void>();
function readMat(): boolean {
  try {
    return localStorage.getItem(MAT_KEY) === "on";
  } catch {
    return false;
  }
}

/**
 * Persisted on/off state for the grey tile mat, backed by localStorage via
 * `useSyncExternalStore`. The server snapshot is `false` (matching the default
 * no-mat render), then it resolves to the stored value on the client — so the
 * choice sticks across reloads without a hydration mismatch.
 */
function useMatBackground() {
  const mat = useSyncExternalStore(
    (cb) => {
      matListeners.add(cb);
      return () => matListeners.delete(cb);
    },
    readMat,
    () => false,
  );
  const toggle = useCallback(() => {
    try {
      localStorage.setItem(MAT_KEY, readMat() ? "off" : "on");
    } catch {
      /* ignore storage errors */
    }
    matListeners.forEach((cb) => cb());
  }, []);
  return { mat, toggle };
}

/**
 * Show the mat toggle only in development or on a URL with `?grid` (hidden for
 * regular visitors). `useSyncExternalStore` keeps it hydration-safe.
 */
const subscribeNoop = () => () => {};
function useToggleVisible() {
  return useSyncExternalStore(
    subscribeNoop,
    () =>
      process.env.NODE_ENV === "development" ||
      new URLSearchParams(window.location.search).has("grid"),
    () => false,
  );
}

/**
 * The /artwork page body (Figma node 296:1630): a scrolling list of titled
 * collections. Each section is an uppercase label above a 3-column grid of
 * square, light-grey rounded "mat" tiles. Every artwork sits centred inside its
 * tile with `object-contain`, so its exact natural aspect is preserved (never
 * cropped) — the tile is purely a background mat.
 *
 * Below ~1024px the grid steps down to two columns, then one. Clicking any tile
 * opens the shared {@link Lightbox} (image only — artworks carry no title/year).
 * All images load eagerly and the whole page fades in together once loaded, so
 * they appear at once instead of popping in one-by-one.
 */
export function ArtworkSections({ sections }: { sections: ArtworkSection[] }) {
  const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
  const imageCount = sections.reduce((sum, s) => sum + s.images.length, 0);
  const { revealed, onImageLoad } = useImagesLoaded(imageCount);
  const { mat, toggle } = useMatBackground();
  const toggleVisible = useToggleVisible();

  return (
    <div
      className={clsx(
        "mx-auto w-full max-w-[1642px] px-4 py-16 transition-opacity duration-700 sm:py-24",
        revealed ? "opacity-100" : "opacity-0",
      )}
    >
      {sections.map((section) => (
        <section key={section.title} className="mb-[80px] last:mb-0">
          <h2 className="mb-[24px] pl-6 type-label text-[16px] text-ink">
            {section.title}
          </h2>
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3">
            {section.images.map((image) => (
              <ArtworkTile
                key={image.src}
                image={image}
                mat={mat}
                onOpen={() => {
                  const meta = getArtworkMeta(image.src);
                  setLightboxItem({
                    src: image.src,
                    alt: meta?.title ?? image.alt,
                    title: meta?.title,
                    year: meta?.year,
                    detail: getArtworkDetail(image.src),
                  });
                }}
                onLoad={onImageLoad}
              />
            ))}
          </div>
        </section>
      ))}

      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}

      {toggleVisible && (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={mat}
          className="fixed bottom-5 right-5 z-50 border border-hairline bg-bg/90 px-3 py-2 type-label text-ink shadow-sm backdrop-blur"
        >
          Grey mat: {mat ? "On" : "Off"}
        </button>
      )}
    </div>
  );
}

/**
 * A single square mat tile. The 8.5% padding on a square button yields an inner
 * square content box (~83% of the tile) that matches the Figma inset, and the
 * contained image centres within it.
 */
function ArtworkTile({
  image,
  mat,
  onOpen,
  onLoad,
}: {
  image: ArtworkImage;
  /** When true, show the light-grey rounded mat behind the artwork. */
  mat: boolean;
  onOpen: () => void;
  onLoad: () => void;
}) {
  const isLandscape = image.width > image.height;
  return (
    <button
      type="button"
      aria-label={`View ${image.alt.toLowerCase()}`}
      onClick={onOpen}
      className={clsx(
        "relative flex aspect-square w-full cursor-pointer items-center justify-center p-[8.5%]",
        // Flush the gallery's outer edges: the leftmost column drops its left
        // inset and the rightmost column its right inset, tracking the
        // responsive column count (1 → 2 → 3). Inner columns keep the 8.5% mat.
        "pl-0 pr-0",
        "sm:[&:nth-child(2n+1)]:pl-0 sm:[&:nth-child(2n+1)]:pr-[8.5%] sm:[&:nth-child(2n)]:pl-[8.5%] sm:[&:nth-child(2n)]:pr-0",
        "lg:[&:nth-child(3n+1)]:pl-0 lg:[&:nth-child(3n+1)]:pr-[8.5%] lg:[&:nth-child(3n+2)]:pl-[8.5%] lg:[&:nth-child(3n+2)]:pr-[8.5%] lg:[&:nth-child(3n)]:pl-[8.5%] lg:[&:nth-child(3n)]:pr-0",
        mat && "rounded-[8px] bg-[#f6f6f6]",
      )}
    >
      <div className={clsx("relative", isLandscape ? "h-[85%] w-[85%]" : "h-full w-full")}>
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 540px, (min-width: 640px) 50vw, 100vw"
          quality={90}
          loading="eager"
          onLoad={onLoad}
          className="object-contain"
        />
      </div>
    </button>
  );
}

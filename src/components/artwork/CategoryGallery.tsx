"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbox, type LightboxItem } from "@/components/Lightbox";
import { clsx } from "@/lib/clsx";
import { useImagesLoaded } from "@/lib/useImagesLoaded";
import {
  getArtworkDetail,
  getArtworkMeta,
  type ArtworkColumns,
  type ArtworkImage,
} from "@/data/artworkCategories";

/**
 * Shared 3-column artwork gallery used by /painting, /illustration and /textile.
 *
 * Renders three equal columns (~485px each, 60px gap) inside a centred
 * ~1576px content column. Within a column, cells stack with a 100px vertical
 * gap. Each cell holds the Figma 485:550 proportion and shows the artwork with
 * `object-contain` + top alignment, so every image keeps its exact natural
 * aspect ratio without cropping or stretching. Below ~640px the columns
 * collapse to a single column.
 *
 * Clicking an image opens the shared {@link Lightbox} (image only — these
 * artworks have no title/year).
 */
export function CategoryGallery({ columns }: { columns: ArtworkColumns }) {
  const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
  const imageCount = columns.reduce((sum, column) => sum + column.length, 0);
  const { revealed, onImageLoad } = useImagesLoaded(imageCount);

  return (
    <div className="mx-auto w-full max-w-[1576px] px-6 py-16 sm:px-8 sm:py-24">
      <div
        className={clsx(
          "grid grid-cols-1 gap-x-[60px] gap-y-[100px] transition-opacity duration-700 sm:grid-cols-3",
          revealed ? "opacity-100" : "opacity-0",
        )}
      >
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-[100px]">
            {column.map((image) => (
              <ArtworkCell
                key={image.src}
                image={image}
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
        ))}
      </div>

      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}
    </div>
  );
}

/** A single artwork cell: fixed 485:550 proportion, top-aligned contain image. */
function ArtworkCell({
  image,
  onOpen,
  onLoad,
}: {
  image: ArtworkImage;
  onOpen: () => void;
  onLoad: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`View ${image.alt.toLowerCase()}`}
      onClick={onOpen}
      className="relative w-full cursor-pointer aspect-[485/550]"
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 640px) 485px, 100vw"
        quality={90}
        loading="eager"
        onLoad={onLoad}
        className="object-contain object-top"
      />
    </button>
  );
}

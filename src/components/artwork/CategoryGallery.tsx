"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbox, type LightboxItem } from "@/components/Lightbox";
import type { ArtworkColumns, ArtworkImage } from "@/data/artworkCategories";

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

  return (
    <div className="mx-auto w-full max-w-[1576px] px-6 py-16 sm:px-8 sm:py-24">
      <div className="grid grid-cols-1 gap-x-[60px] gap-y-[100px] sm:grid-cols-3">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-[100px]">
            {column.map((image) => (
              <ArtworkCell
                key={image.src}
                image={image}
                onOpen={() => setLightboxItem({ src: image.src, alt: image.alt })}
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
}: {
  image: ArtworkImage;
  onOpen: () => void;
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
        className="object-contain object-top"
      />
    </button>
  );
}

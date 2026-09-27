/**
 * Slides for the experimental /home-alt page.
 *
 * The image set is exactly the /artwork page, flattened top-to-bottom
 * (BY THE WATER → WITH LOVE → A PAINTING A DAY → ILLUSTRATIONS → TEXTILES),
 * so the two pages always stay in sync.
 *
 * Titles + years come from {@link artworkMeta} — the site-wide canonical source
 * of truth for artwork names — keyed by image src.
 */
import {
  artworkMeta,
  artworkSections,
  type ArtworkImage,
} from "./artworkCategories";
import { isShoppableArtworkSrc, products } from "./products";

export type HomeAltSlide = ArtworkImage & {
  title: string;
  year: string;
  /** Shop slug when a print of this artwork is for sale, else undefined. */
  printSlug?: string;
};

const flat: ArtworkImage[] = artworkSections.flatMap((section) => section.images);

// Match each artwork to a print product by image path.
const printByImage = new Map<string, string>();
for (const p of products) {
  if (p.kind === "print") printByImage.set(p.image, p.slug);
}

export const homeAltSlides: HomeAltSlide[] = flat.map((image) => ({
  ...image,
  title: artworkMeta[image.src]?.title ?? image.alt,
  year: artworkMeta[image.src]?.year ?? "",
  printSlug: printByImage.get(image.src),
}));

/**
 * Indexes into {@link homeAltSlides} whose artwork is shoppable (has a shop
 * product). The gallery constrains only its random *starting* slide to these;
 * navigation still reaches every slide.
 */
export const shoppableHomeAltIndexes: number[] = homeAltSlides.reduce<number[]>(
  (acc, slide, i) => {
    if (isShoppableArtworkSrc(slide.src)) acc.push(i);
    return acc;
  },
  [],
);

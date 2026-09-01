import { getArtworkMeta } from "./artworkCategories";

export type ProductKind = "original" | "print";

export type Product = {
  slug: string;
  title: string;
  kind: ProductKind;
  /** Medium / materials line, e.g. "Oil on linen". Omitted for prints. */
  medium?: string;
  /** Human-readable dimensions. */
  dimensions: string;
  /** Whole US dollars. */
  price: number;
  image: string;
  /** Natural pixel width of the image file. */
  width: number;
  /** Natural pixel height of the image file. */
  height: number;
  year: number;
  description: string;
  /** Marks a one-of-a-kind piece that has already sold. */
  sold?: boolean;
};

/**
 * A raw catalog entry. Title + year are NOT stored here — they come from the
 * site-wide canonical `artworkMeta` (via {@link getArtworkMeta}), keyed by the
 * artwork's image, so the shop always shows the same names as /artwork and
 * /home-alt.
 *
 * `artworkSrc` picks which artwork image to look up when the shop's own `image`
 * file differs from the /artwork export (e.g. the Water print/original). A
 * literal `title`/`year` may still be supplied to override the canonical value
 * for a one-off.
 */
type RawProduct = Omit<Product, "title" | "year"> & {
  artworkSrc?: string;
  title?: string;
  year?: number;
};

const RAW: RawProduct[] = [
  // Prints — open edition.
  {
    slug: "beach-print",
    kind: "print",
    dimensions: "12 x 12 in",
    price: 40,
    image: "/assets/painting/p02_img7866.jpg",
    width: 971,
    height: 1020,
    description: "Signed print on archival paper.",
  },
  {
    slug: "water-print",
    kind: "print",
    dimensions: "8 x 10 in",
    price: 30,
    image: "/assets/shop/water.jpg",
    artworkSrc: "/assets/painting/p17_water.jpg",
    width: 1671,
    height: 1263,
    description: "Signed print on archival paper.",
  },
  {
    slug: "persimmons-print",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p03_img0453.jpg",
    width: 782,
    height: 1100,
    description: "Signed print on archival paper.",
  },
  {
    slug: "plant-print",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p09_img0510.jpg",
    width: 768,
    height: 1100,
    description: "Signed print on archival paper.",
  },
  {
    slug: "sashimi-print",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p04_img0757.jpg",
    width: 780,
    height: 1100,
    description: "Signed print on archival paper.",
  },
  {
    slug: "strawberries-print",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p06_img3682.jpg",
    width: 971,
    height: 684,
    description: "Signed print on archival paper.",
  },
  {
    slug: "chickens-print",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p10_img3676.jpg",
    width: 776,
    height: 1100,
    description: "Signed print on archival paper.",
  },
  {
    slug: "ramen-print",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p15_img0755.jpg",
    width: 766,
    height: 1100,
    description: "Signed print on archival paper.",
  },
  {
    slug: "reflection-print",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p11_a2acc6da.jpg",
    width: 971,
    height: 677,
    description: "Signed print on archival paper.",
  },
  {
    slug: "fried-egg-print",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p05_img3688.jpg",
    width: 764,
    height: 1100,
    description: "Signed print on archival paper.",
  },
  {
    slug: "deviled-eggs-print",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p14_img0754.jpg",
    width: 768,
    height: 1100,
    description: "Signed print on archival paper.",
  },
  {
    slug: "autumn-print",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p16_ead68567.jpg",
    width: 971,
    height: 700,
    description: "Signed print on archival paper.",
  },

  // Originals — one-of-a-kind oils.
  {
    slug: "beach-original",
    kind: "original",
    medium: "Oil on canvas",
    dimensions: "24 x 24 in",
    price: 0,
    image: "/assets/painting/p02_img7866.jpg",
    width: 971,
    height: 1020,
    description:
      "Original oil painting. Free local pickup in NYC or $30 domestic shipping.",
    sold: true,
  },
  {
    slug: "water-original",
    kind: "original",
    medium: "Oil on canvas",
    dimensions: "8 x 10 in",
    price: 1200,
    image: "/assets/shop/water.jpg",
    artworkSrc: "/assets/painting/p17_water.jpg",
    width: 1671,
    height: 1263,
    description:
      "Original oil painting. Free local pickup in NYC or $30 domestic shipping.",
  },
];

/**
 * The product catalog: title + year resolved from the canonical `artworkMeta`
 * so shop names always match the rest of the site.
 */
export const products: Product[] = RAW.map(
  ({ artworkSrc, title, year, ...rest }) => {
    const meta = getArtworkMeta(artworkSrc ?? rest.image);
    return {
      ...rest,
      title: title ?? meta?.title ?? rest.slug,
      year: year ?? (meta ? Number(meta.year) : 0),
    };
  },
);

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/**
 * Artwork images that have a corresponding shop product, i.e. are shoppable.
 *
 * Keyed by the product's `artworkSrc` (its /artwork export) when present, else
 * its shop `image` — because a piece's shop file can differ from its artwork
 * file (e.g. the Water print). Each key is stored under both `.jpg`/`.png`
 * extensions so lookups tolerate the extension differing between pages, the
 * same tolerance as {@link getArtworkMeta}.
 */
const shoppableArtworkSrcs: ReadonlySet<string> = new Set(
  RAW.flatMap(({ artworkSrc, image }) => {
    const src = artworkSrc ?? image;
    return [src.replace(/\.png$/, ".jpg"), src.replace(/\.jpg$/, ".png")];
  }),
);

/** Whether an artwork image has a corresponding shop product. */
export function isShoppableArtworkSrc(src: string): boolean {
  return shoppableArtworkSrcs.has(src);
}

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
 * The product catalog. A mix of one-of-a-kind originals and
 * open-edition prints. Print metadata is uniform placeholder copy the
 * artist will refine later.
 */
export const products: Product[] = [
  // Prints — flat $40, open edition.
  {
    slug: "beach-print",
    title: "Memory of a French Noon",
    kind: "print",
    dimensions: "20 x 20 in",
    price: 40,
    image: "/assets/painting/p02_img7866.jpg",
    width: 971,
    height: 1020,
    year: 2026,
    description: "Signed, open-edition print on archival paper.",
  },
  {
    slug: "water-print",
    title: "Water",
    kind: "print",
    dimensions: "8 x 10 in",
    price: 30,
    image: "/assets/shop/water.jpg",
    width: 1671,
    height: 1263,
    year: 2026,
    description: "Signed, open-edition print on archival paper.",
  },
  {
    slug: "persimmons-print",
    title: "Persimmons",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p03_img0453.jpg",
    width: 782,
    height: 1100,
    year: 2024,
    description: "Signed, open-edition print on archival paper.",
  },
  {
    slug: "plant-print",
    title: "Plant",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p09_img0510.jpg",
    width: 768,
    height: 1100,
    year: 2024,
    description: "Signed, open-edition print on archival paper.",
  },
  {
    slug: "sashimi-print",
    title: "Sashimi",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p04_img0757.jpg",
    width: 780,
    height: 1100,
    year: 2024,
    description: "Signed, open-edition print on archival paper.",
  },
  {
    slug: "strawberries-print",
    title: "Strawberries",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p06_img3682.jpg",
    width: 971,
    height: 684,
    year: 2024,
    description: "Signed, open-edition print on archival paper.",
  },
  {
    slug: "chickens-print",
    title: "Chickens",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p10_img3676.jpg",
    width: 776,
    height: 1100,
    year: 2024,
    description: "Signed, open-edition print on archival paper.",
  },
  {
    slug: "ramen-print",
    title: "Ramen",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p15_img0755.jpg",
    width: 766,
    height: 1100,
    year: 2024,
    description: "Signed, open-edition print on archival paper.",
  },
  {
    slug: "reflection-print",
    title: "Reflection",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p11_a2acc6da.jpg",
    width: 971,
    height: 677,
    year: 2024,
    description: "Signed, open-edition print on archival paper.",
  },
  {
    slug: "fried-egg-print",
    title: "Fried Egg",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p05_img3688.jpg",
    width: 764,
    height: 1100,
    year: 2024,
    description: "Signed, open-edition print on archival paper.",
  },
  {
    slug: "deviled-eggs-print",
    title: "Deviled Eggs",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p14_img0754.jpg",
    width: 768,
    height: 1100,
    year: 2024,
    description: "Signed, open-edition print on archival paper.",
  },
  {
    slug: "autumn-print",
    title: "Autumn",
    kind: "print",
    dimensions: "5 x 7 in",
    price: 20,
    image: "/assets/painting/p16_ead68567.jpg",
    width: 971,
    height: 700,
    year: 2024,
    description: "Signed, open-edition print on archival paper.",
  },

  // Originals — one-of-a-kind oils.
  {
    slug: "beach-original",
    title: "Memory of a French Noon",
    kind: "original",
    medium: "Oil on canvas",
    dimensions: "24 x 24 in",
    price: 0,
    image: "/assets/painting/p02_img7866.jpg",
    width: 971,
    height: 1020,
    year: 2026,
    description: "Original oil painting.",
    sold: true,
  },
  {
    slug: "water-original",
    title: "Water",
    kind: "original",
    medium: "Oil on canvas",
    dimensions: "8 x 10 in",
    price: 500,
    image: "/assets/shop/water.jpg",
    width: 1671,
    height: 1263,
    year: 2026,
    description: "Original oil painting.",
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

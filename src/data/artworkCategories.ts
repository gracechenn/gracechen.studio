/**
 * Per-category artwork image data for the /painting, /illustration and /textile
 * pages. Each category is three columns of images, rendered by
 * {@link CategoryGallery} into the shared 3-column gallery grid.
 *
 * Intrinsic pixel `width`/`height` are the true dimensions of each asset so the
 * gallery can preserve exact natural aspect ratios (never guessed/cropped).
 */
export type ArtworkImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

/** Three columns of images, left → right, matching the gallery layout. */
export type ArtworkColumns = [ArtworkImage[], ArtworkImage[], ArtworkImage[]];

/** A titled collection of artworks, rendered as one section on /artwork. */
export type ArtworkSection = { title: string; images: ArtworkImage[] };

/**
 * Painting — kept in the exact 3-column order from the Figma painting page.
 * Column 1 has 6 images; columns 2 and 3 have 5 each.
 */
export const paintingColumns: ArtworkColumns = [
  [
    { src: "/assets/painting/p01_img9160.jpg", width: 930, height: 1100, alt: "Painting" },
    { src: "/assets/painting/p02_img7866.jpg", width: 971, height: 1020, alt: "Painting" },
    { src: "/assets/painting/p03_img0453.jpg", width: 782, height: 1100, alt: "Painting" },
    { src: "/assets/painting/p04_img0757.jpg", width: 780, height: 1100, alt: "Painting" },
    { src: "/assets/painting/p05_img3688.jpg", width: 764, height: 1100, alt: "Painting" },
    { src: "/assets/painting/p06_img3682.jpg", width: 971, height: 684, alt: "Painting" },
  ],
  [
    { src: "/assets/painting/p07_img2375.jpg", width: 842, height: 1100, alt: "Painting" },
    { src: "/assets/painting/p08_img9320.jpg", width: 844, height: 1100, alt: "Painting" },
    { src: "/assets/painting/p09_img0510.jpg", width: 768, height: 1100, alt: "Painting" },
    { src: "/assets/painting/p10_img3676.jpg", width: 776, height: 1100, alt: "Painting" },
    { src: "/assets/painting/p11_a2acc6da.jpg", width: 971, height: 677, alt: "Painting" },
    { src: "/assets/painting/p17_water.jpg", width: 2465, height: 1864, alt: "Painting" },
  ],
  [
    { src: "/assets/painting/p12_img7609.jpg", width: 794, height: 1100, alt: "Painting" },
    { src: "/assets/painting/p13_img4241.jpg", width: 971, height: 736, alt: "Painting" },
    { src: "/assets/painting/p14_img0754.jpg", width: 768, height: 1100, alt: "Painting" },
    { src: "/assets/painting/p15_img0755.jpg", width: 766, height: 1100, alt: "Painting" },
    { src: "/assets/painting/p16_ead68567.jpg", width: 971, height: 700, alt: "Painting" },
  ],
];

/** Illustration — distributed 4 / 4 / 4 across the three columns, in order. */
export const illustrationColumns: ArtworkColumns = [
  [
    { src: "/assets/illustration/i04_vincent4.png", width: 1200, height: 1200, alt: "Illustration" },
    { src: "/assets/illustration/i02_vincent1.png", width: 1200, height: 1200, alt: "Illustration" },
    { src: "/assets/illustration/i03_vincent2.png", width: 1200, height: 1200, alt: "Illustration" },
    { src: "/assets/illustration/i01_videogame.png", width: 1500, height: 1200, alt: "Illustration" },
  ],
  [
    { src: "/assets/illustration/i05_figure1.png", width: 1488, height: 1192, alt: "Illustration" },
    { src: "/assets/illustration/i06_img0325.png", width: 1616, height: 1192, alt: "Illustration" },
    { src: "/assets/illustration/i07_img0431.png", width: 1192, height: 1192, alt: "Illustration" },
    { src: "/assets/illustration/i08_img0457.png", width: 1296, height: 1192, alt: "Illustration" },
  ],
  [
    { src: "/assets/illustration/i09_aoba.png", width: 1324, height: 1192, alt: "Illustration" },
    { src: "/assets/illustration/i10_img0167.png", width: 960, height: 1200, alt: "Illustration" },
    { src: "/assets/illustration/i11_img0420.png", width: 1500, height: 1200, alt: "Illustration" },
    { src: "/assets/illustration/i12_img0494.png", width: 1928, height: 1192, alt: "Illustration" },
  ],
];

/** Textile — distributed 3 / 3 / 3 across the three columns, in order. */
export const textileColumns: ArtworkColumns = [
  [
    { src: "/assets/textile/t01_64477779.jpg", width: 1800, height: 1200, alt: "Textile" },
    { src: "/assets/textile/t02_img2028.jpg", width: 1816, height: 1200, alt: "Textile" },
    { src: "/assets/textile/t03_img2039.jpg", width: 800, height: 1200, alt: "Textile" },
  ],
  [
    { src: "/assets/textile/t04_img2147.jpg", width: 1068, height: 1200, alt: "Textile" },
    { src: "/assets/textile/t05_img2043.jpg", width: 1576, height: 1200, alt: "Textile" },
    { src: "/assets/textile/t06_img2036.jpg", width: 1800, height: 1200, alt: "Textile" },
  ],
  [
    { src: "/assets/textile/t07_img2032.jpg", width: 1192, height: 1200, alt: "Textile" },
    { src: "/assets/textile/t08_quilt.png", width: 941, height: 1024, alt: "Textile" },
    { src: "/assets/textile/t09_img2045.jpg", width: 1392, height: 928, alt: "Textile" },
  ],
];

/**
 * The /artwork page (Figma node 296:1630). Paintings are grouped into three
 * titled collections, followed by the Illustration and Textile bodies of work.
 * Every image is rendered in the shared grey rounded-tile style by
 * {@link ArtworkSections}, and the intrinsic dimensions preserve exact aspect.
 *
 * Painting groupings come straight from the Figma composition: "By the Water"
 * and "With Love" are laid out explicitly there; "A Painting a Day" holds the
 * remaining daily paintings.
 */
export const artworkSections: ArtworkSection[] = [
  {
    title: "BY THE WATER (2026)",
    images: [
      { src: "/assets/painting/p02_img7866.jpg", width: 971, height: 1020, alt: "Painting" },
      { src: "/assets/painting/p17_water.jpg", width: 2465, height: 1864, alt: "Painting" },
      { src: "/assets/painting/p18_garden.jpg", width: 2847, height: 2056, alt: "Painting" },
    ],
  },
  {
    title: "WITH LOVE (2022–2024)",
    images: [
      { src: "/assets/painting/p01_img9160.png", width: 865, height: 1024, alt: "Painting" },
      { src: "/assets/painting/p12_img7609.jpg", width: 794, height: 1100, alt: "Painting" },
      { src: "/assets/painting/p07_img2375.jpg", width: 842, height: 1100, alt: "Painting" },
      { src: "/assets/painting/p08_img9320.jpg", width: 844, height: 1100, alt: "Painting" },
      { src: "/assets/painting/p13_img4241.jpg", width: 971, height: 736, alt: "Painting" },
    ],
  },
  {
    title: "A PAINTING A DAY (2023)",
    images: [
      { src: "/assets/painting/p03_img0453.jpg", width: 782, height: 1100, alt: "Painting" },
      { src: "/assets/painting/p04_img0757.jpg", width: 780, height: 1100, alt: "Painting" },
      { src: "/assets/painting/p05_img3688.jpg", width: 764, height: 1100, alt: "Painting" },
      { src: "/assets/painting/p06_img3682.jpg", width: 971, height: 684, alt: "Painting" },
      { src: "/assets/painting/p09_img0510.jpg", width: 768, height: 1100, alt: "Painting" },
      { src: "/assets/painting/p10_img3676.jpg", width: 776, height: 1100, alt: "Painting" },
      { src: "/assets/painting/p11_a2acc6da.jpg", width: 971, height: 677, alt: "Painting" },
      { src: "/assets/painting/p14_img0754.jpg", width: 768, height: 1100, alt: "Painting" },
      { src: "/assets/painting/p15_img0755.jpg", width: 766, height: 1100, alt: "Painting" },
      { src: "/assets/painting/p16_ead68567.jpg", width: 971, height: 700, alt: "Painting" },
    ],
  },
  { title: "ILLUSTRATIONS", images: illustrationColumns.flat() },
  { title: "TEXTILES", images: textileColumns.flat() },
];

/**
 * Canonical title + year for every artwork, keyed by image `src`.
 *
 * This is the single source of truth for artwork names across the site (e.g. the
 * /home-alt captions). It is keyed by filename because the same image can appear
 * in more than one structure (paintings live in both {@link paintingColumns} and
 * the re-grouped {@link artworkSections}), and because a few titles legitimately
 * repeat across different pieces (several textile shots share a title).
 *
 * Order below follows the flattened /artwork reading order (left → right on
 * /home-alt): BY THE WATER → WITH LOVE → A PAINTING A DAY → ILLUSTRATIONS →
 * TEXTILES.
 */
export const artworkMeta: Record<string, { title: string; year: string }> = {
  // BY THE WATER
  "/assets/painting/p02_img7866.jpg": { title: "A french afternoon", year: "2026" },
  "/assets/painting/p17_water.jpg": { title: "Where the light settles", year: "2026" },
  "/assets/painting/p18_garden.jpg": { title: "A quiet hour in the garden", year: "2026" },
  // WITH LOVE
  "/assets/painting/p01_img9160.png": { title: "Once, I was Entirely Soft", year: "2024" },
  "/assets/painting/p12_img7609.jpg": { title: "Embrace II", year: "2024" },
  "/assets/painting/p07_img2375.jpg": { title: "Embrace I", year: "2022" },
  "/assets/painting/p08_img9320.jpg": { title: "Sarah", year: "2022" },
  "/assets/painting/p13_img4241.jpg": { title: "Party of one", year: "2023" },
  // A PAINTING A DAY
  "/assets/painting/p03_img0453.jpg": { title: "Persimmon", year: "2023" },
  "/assets/painting/p04_img0757.jpg": { title: "Mall sushi", year: "2023" },
  "/assets/painting/p05_img3688.jpg": { title: "Dorm fried egg", year: "2023" },
  "/assets/painting/p06_img3682.jpg": { title: "Strawberries for you?", year: "2023" },
  "/assets/painting/p09_img0510.jpg": { title: "Room with sun", year: "2023" },
  "/assets/painting/p10_img3676.jpg": { title: "Four chickens", year: "2023" },
  "/assets/painting/p11_a2acc6da.jpg": { title: "Two in the taxi", year: "2023" },
  "/assets/painting/p14_img0754.jpg": { title: "Deviled eggs", year: "2023" },
  "/assets/painting/p15_img0755.jpg": { title: "Ramen", year: "2023" },
  "/assets/painting/p16_ead68567.jpg": { title: "Autumn camps", year: "2023" },
  // ILLUSTRATIONS
  "/assets/illustration/i04_vincent4.png": { title: "Vincent I", year: "2025" },
  "/assets/illustration/i02_vincent1.png": { title: "Vincent II", year: "2025" },
  "/assets/illustration/i03_vincent2.png": { title: "Vincent III", year: "2025" },
  "/assets/illustration/i01_videogame.png": { title: "Continue?", year: "2020" },
  "/assets/illustration/i05_figure1.png": { title: "Figure study", year: "2020" },
  "/assets/illustration/i06_img0325.png": { title: "Lighting study", year: "2026" },
  "/assets/illustration/i07_img0431.png": { title: "Sunday salon club", year: "2026" },
  "/assets/illustration/i08_img0457.png": { title: "Dancers study", year: "2026" },
  "/assets/illustration/i09_aoba.png": { title: "Ichiko Aoba", year: "2025" },
  "/assets/illustration/i10_img0167.png": { title: "Cowboy figure study", year: "2026" },
  "/assets/illustration/i11_img0420.png": { title: "Value study - Laufey", year: "2026" },
  "/assets/illustration/i12_img0494.png": { title: "Lonely princess", year: "2026" },
  // TEXTILES
  "/assets/textile/t01_64477779.jpg": { title: "Too large for the drawer", year: "2024" },
  "/assets/textile/t02_img2028.jpg": { title: "Out the back door", year: "2023" },
  "/assets/textile/t03_img2039.jpg": { title: "Too large for the drawer (closeup)", year: "2024" },
  "/assets/textile/t04_img2147.jpg": { title: "Too large for the drawer (closeup)", year: "2024" },
  "/assets/textile/t05_img2043.jpg": { title: "Too large for the drawer (closeup)", year: "2024" },
  "/assets/textile/t06_img2036.jpg": { title: "Too large for the drawer", year: "2024" },
  "/assets/textile/t07_img2032.jpg": { title: "Once, I was Entirely Soft", year: "2024" },
  "/assets/textile/t08_quilt.png": { title: "Out the back door (cloth)", year: "2023" },
  "/assets/textile/t09_img2045.jpg": { title: "Too large for the drawer (closeup)", year: "2024" },
};

/**
 * Look up an artwork's canonical {@link artworkMeta} by image src, tolerating a
 * `.jpg`/`.png` extension difference — the /painting page and /artwork page
 * reference a couple of the same pieces via different exports (e.g. the baby
 * painting is a `.jpg` on /painting but a transparent `.png` on /artwork).
 */
export function getArtworkMeta(
  src: string,
): { title: string; year: string } | undefined {
  return (
    artworkMeta[src] ??
    artworkMeta[src.replace(/\.jpg$/, ".png")] ??
    artworkMeta[src.replace(/\.png$/, ".jpg")]
  );
}

/**
 * A close-up "detail" callout for a single painting, shown in the lightbox: a
 * second image beside the main one, joined by a thin annotation line. `anchor`
 * is the point on the MAIN image where the line begins, as 0–1 fractions of its
 * width/height (from the Figma reference, node 101:590).
 */
export type ArtworkDetail = {
  src: string;
  anchor: { x: number; y: number };
};

/**
 * Look up the optional lightbox detail callout for an artwork. Currently only
 * the painting "Once, I was Entirely Soft" (p01_img9160, referenced as both a
 * `.jpg` on /painting and a `.png` on /artwork) has one — matched by filename
 * so the separately-titled textile of the same name is excluded.
 */
export function getArtworkDetail(src: string): ArtworkDetail | undefined {
  if (src.includes("p01_img9160")) {
    return {
      src: "/assets/painting/p01_detail.png",
      anchor: { x: 0.59, y: 0.75 },
    };
  }
  return undefined;
}

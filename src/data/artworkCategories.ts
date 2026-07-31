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
    { src: "/assets/painting/p17_water.jpg", width: 1671, height: 1263, alt: "Painting" },
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
    { src: "/assets/illustration/i01_videogame.png", width: 1500, height: 1200, alt: "Illustration" },
    { src: "/assets/illustration/i02_vincent1.png", width: 1200, height: 1200, alt: "Illustration" },
    { src: "/assets/illustration/i03_vincent2.png", width: 1200, height: 1200, alt: "Illustration" },
    { src: "/assets/illustration/i04_vincent4.png", width: 1200, height: 1200, alt: "Illustration" },
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
    { src: "/assets/textile/t08_quilt.jpg", width: 1003, height: 1124, alt: "Textile" },
    { src: "/assets/textile/t09_img2045.jpg", width: 1392, height: 928, alt: "Textile" },
  ],
];

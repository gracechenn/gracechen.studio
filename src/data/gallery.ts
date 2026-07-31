export type Artwork = {
  id: string;
  image: string;
  /** Natural aspect ratio (width / height) — drives the masonry sizing. */
  aspect: number;
  /** Transparent-background PNG → render with no frame/box/shadow. */
  transparent: boolean;
  /**
   * Image reads as a white/light-background rectangle that would blend into the
   * white page → render a 1px hairline border to define its edge. Detected by
   * sampling the four corner regions with sharp (all corners ≳ 238/255 per
   * channel); never set on transparent cutouts, which float without a frame.
   */
  whiteBorder?: boolean;
  /**
   * Optional homepage framing override (matches Figma). When omitted, the image
   * is framed at its source `aspect` and fitted by the transparency default
   * (transparent → contain, opaque → cover). Set `aspect`/`fit`/`position` to
   * cover-crop a painting into a specific frame — e.g. the first artwork is
   * framed wider and anchored to the bottom like the Figma hero/collection nodes.
   */
  display?: {
    /** Display frame aspect (width / height); defaults to `aspect`. */
    aspect?: number;
    /** How the image fills its frame; defaults per `transparent`. */
    fit?: "cover" | "contain";
    /** CSS object-position when cover-cropping, e.g. "bottom". */
    position?: string;
  };
};

/**
 * The homepage image pool (the full downloaded collection).
 *
 * Order matters: the first four reproduce the Figma hero composition
 * (artwork 1 foreground, then 2 / 3 / 4 trailing right), after which the rest
 * continue along the horizontal filmstrip.
 *
 * Files are named sequentially by array position (`/assets/gallery/<n>.<ext>`),
 * preserving each source extension (`.png` for transparent cutouts, `.jpg`
 * for opaque paintings).
 *
 * Titles / dimensions / prices intentionally live elsewhere — the homepage
 * renders images only.
 */
export const galleryArtworks: Artwork[] = [
  {
    id: "1",
    image: "/assets/gallery/1.png",
    aspect: 830 / 996,
    transparent: true,
  },
  { id: "2", image: "/assets/gallery/2.jpg", aspect: 1907 / 2493, transparent: false },
  { id: "3", image: "/assets/gallery/3.jpg", aspect: 2566 / 3553, transparent: false },
  { id: "4", image: "/assets/gallery/4.png", aspect: 728 / 1024, transparent: true },

  { id: "5", image: "/assets/gallery/5.jpg", aspect: 3000 / 2700, transparent: false, whiteBorder: true },
  { id: "6", image: "/assets/gallery/6.jpg", aspect: 3000 / 2400, transparent: false, whiteBorder: true },
  { id: "7", image: "/assets/gallery/7.jpg", aspect: 2249 / 3219, transparent: false },
  { id: "8", image: "/assets/gallery/8.jpg", aspect: 1936 / 2771, transparent: false },
  { id: "9", image: "/assets/gallery/9.jpg", aspect: 1812 / 2602, transparent: false },
  { id: "10", image: "/assets/gallery/10.jpg", aspect: 1724 / 2429, transparent: false },
  { id: "11", image: "/assets/gallery/11.jpg", aspect: 2400 / 1600, transparent: false },
  { id: "12", image: "/assets/gallery/12.jpg", aspect: 2972 / 1962, transparent: false },
  { id: "13", image: "/assets/gallery/13.jpg", aspect: 2652 / 3754, transparent: false },
  { id: "14", image: "/assets/gallery/14.jpg", aspect: 3716 / 2618, transparent: false },
  { id: "15", image: "/assets/gallery/15.jpg", aspect: 2561 / 3678, transparent: false },
  { id: "16", image: "/assets/gallery/16.jpg", aspect: 2295 / 3302, transparent: false },
  { id: "17", image: "/assets/gallery/17.jpg", aspect: 1848 / 2626, transparent: false },
  { id: "18", image: "/assets/gallery/18.jpg", aspect: 3788 / 2870, transparent: false },
  { id: "19", image: "/assets/gallery/19.jpg", aspect: 3024 / 4032, transparent: false },
  { id: "20", image: "/assets/gallery/20.jpg", aspect: 4032 / 3024, transparent: false },
  { id: "21", image: "/assets/gallery/21.jpg", aspect: 2051 / 2054, transparent: false },
  { id: "22", image: "/assets/gallery/22.jpg", aspect: 2679 / 3495, transparent: false },
  { id: "23", image: "/assets/gallery/23.jpg", aspect: 2125 / 1482, transparent: false },
  { id: "24", image: "/assets/gallery/24.jpg", aspect: 3672 / 2625, transparent: false },
  { id: "25", image: "/assets/gallery/25.png", aspect: 2400 / 3000, transparent: true },
  { id: "26", image: "/assets/gallery/26.png", aspect: 1024 / 739, transparent: true },
  { id: "27", image: "/assets/gallery/27.png", aspect: 3024 / 4032, transparent: true },

  // Newest additions — appended to the far-right end of the filmstrip.
  { id: "28", image: "/assets/gallery/28.jpg", aspect: 2400 / 1600, transparent: false },
  { id: "29", image: "/assets/gallery/29.jpg", aspect: 2400 / 1600, transparent: false },
  { id: "30", image: "/assets/gallery/30.jpg", aspect: 1536 / 2048, transparent: false },
  { id: "31", image: "/assets/gallery/31.jpg", aspect: 2360 / 3519, transparent: false },
  { id: "32", image: "/assets/gallery/32.jpg", aspect: 2561 / 3678, transparent: false },
];

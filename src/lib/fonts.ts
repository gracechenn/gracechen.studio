import { Beth_Ellen } from "next/font/google";
import localFont from "next/font/local";

/**
 * Beth Ellen — the handwritten script used for the "Grace Chen" wordmark and
 * the hero tagline. Exposed as a CSS variable so it can be referenced from
 * the Tailwind theme (`font-script`).
 */
export const bethEllen = Beth_Ellen({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-beth-ellen",
});

/**
 * TeX Gyre Heros — the sans used for all body copy, labels and navigation
 * (a Helvetica-metric-compatible open font by GUST). Bundled locally and
 * exposed as `--font-tex` for the Tailwind theme (`font-sans`).
 */
export const texGyreHeros = localFont({
  src: [
    { path: "./fonts/texgyreheros-regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/texgyreheros-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/texgyreheros-bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/texgyreheros-bolditalic.woff2", weight: "700", style: "italic" },
  ],
  display: "swap",
  variable: "--font-tex",
  fallback: ["Arial", "sans-serif"],
});

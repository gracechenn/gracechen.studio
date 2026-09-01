import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray parent lockfile can
  // otherwise confuse Next's root inference).
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingRoot: path.join(__dirname),
  // Next 16 restricts the optimizer to `images.qualities` (default [75]). Our
  // galleries request quality 90, so allow it — otherwise those requests 400
  // and the images render blank in production / on a cold cache.
  images: {
    qualities: [75, 90],
  },
};

export default nextConfig;

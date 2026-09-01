"use client";

import Image from "next/image";
import { clsx } from "@/lib/clsx";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { PhotoGallery } from "@/components/exhibitions/PhotoGallery";
import { FitToViewport } from "@/components/exhibitions/FitToViewport";

/**
 * Desktop vs. mobile exhibitions layouts.
 *
 * Only ONE layout is ever mounted (the desktop gallery eager-loads all photos,
 * so rendering it hidden on phones would double the downloads). We render
 * nothing until {@link useIsDesktop} resolves in a layout effect — before the
 * browser paints — so there's no hydration mismatch and no visible flash.
 */
export function ExhibitionsView() {
  const isDesktop = useIsDesktop();
  if (isDesktop === null) return null;
  return isDesktop ? <DesktopExhibitions /> : <MobileExhibitions />;
}

/* ── Desktop: fit-to-viewport composition with the hover-push gallery ──────── */

function DesktopExhibitions() {
  return (
    <div className="relative mx-auto w-full max-w-[1512px]">
      {/* Hanging ribbon tag — hangs from the very top edge, through the
          transparent header. It lives OUTSIDE the fit-to-viewport scaler so it
          is never clipped by the region's `overflow: hidden` and never scaled. */}
      <div className="pointer-events-none absolute right-[7%] top-[-77px] z-10 h-[370px] w-[171px] overflow-hidden">
        <Image
          src="/assets/exhibitions/hanging-tag-v2.png"
          alt="Exhibition ribbon tag"
          fill
          sizes="171px"
          className="object-cover"
        />
      </div>

      {/* Fit-to-viewport: lock the composition to the space below the fixed 77px
          nav and scale it so the poster + caption + gallery always fit the
          viewport height with no page scroll. `sideHeadroom` reserves horizontal
          slack so a hover-enlarged edge photo is never clipped. */}
      <FitToViewport sideHeadroom={120}>
        <div className="px-3 sm:px-4">
          {/* Poster header + caption */}
          <div>
            <div className="relative h-[110px] w-[456px] max-w-full overflow-hidden">
              <Image
                src="/assets/exhibitions/poster-header.png"
                alt="With Love, — a solo exhibition by Grace Chen"
                width={728}
                height={1125}
                className="absolute left-0 top-0 max-w-none"
                style={{ width: "135.74%", height: "871.92%" }}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-8 pl-[25px] font-sans text-[16px] uppercase leading-none tracking-[0.02em] text-ink">
              <span>A solo exhibition by Grace Chen</span>
              <span>May 3-9th, 2024</span>
            </div>
          </div>

          {/* Installation-photo gallery */}
          <PhotoGallery
            rows={[
              {
                className:
                  "flex flex-wrap items-center justify-center gap-8 md:justify-between",
                items: [
                  { src: "/assets/exhibitions/ex1.jpg", width: 150 },
                  { src: "/assets/exhibitions/ex2.jpg", width: 150 },
                  { src: "/assets/exhibitions/ex3.jpg", width: 150 },
                  { src: "/assets/exhibitions/ex4.jpg", width: 151 },
                ],
              },
              {
                className:
                  "flex flex-wrap items-center justify-center gap-8 md:justify-between md:gap-x-0 md:px-[40px]",
                items: [
                  { src: "/assets/exhibitions/ex5.jpg", width: 150 },
                  { src: "/assets/exhibitions/ex6.jpg", width: 150 },
                  {
                    src: "/assets/exhibitions/poster1.png",
                    width: 64,
                    className: "border-[0.5px] border-[#EBEBEB]",
                  },
                  { src: "/assets/exhibitions/ex7.jpg", width: 67 },
                ],
              },
              {
                className:
                  "flex flex-wrap items-center justify-center gap-8 md:justify-between",
                items: [
                  {
                    src: "/assets/exhibitions/ex8.jpg",
                    width: 131,
                    title: "WITH LOVE, (DETAIL PHOTO)",
                    year: "2024",
                  },
                  { src: "/assets/exhibitions/ex9.jpg", width: 150 },
                  { src: "/assets/exhibitions/ex10.jpg", width: 150 },
                  { src: "/assets/exhibitions/ex11.jpg", width: 150 },
                ],
              },
            ]}
          />
        </div>
      </FitToViewport>
    </div>
  );
}

/* ── Mobile: a plain vertical scroll, one near-full-width image per row ────── */

/** Installation photos in reading order, for the single-column mobile scroll. */
const MOBILE_PHOTOS: { src: string; className?: string }[] = [
  { src: "/assets/exhibitions/ex1.jpg" },
  { src: "/assets/exhibitions/ex2.jpg" },
  { src: "/assets/exhibitions/ex3.jpg" },
  { src: "/assets/exhibitions/ex4.jpg" },
  { src: "/assets/exhibitions/ex5.jpg" },
  { src: "/assets/exhibitions/ex6.jpg" },
  {
    src: "/assets/exhibitions/poster1.png",
    className: "border-[0.5px] border-[#EBEBEB]",
  },
  { src: "/assets/exhibitions/ex7.jpg" },
  { src: "/assets/exhibitions/ex8.jpg" },
  { src: "/assets/exhibitions/ex9.jpg" },
  { src: "/assets/exhibitions/ex10.jpg" },
  { src: "/assets/exhibitions/ex11.jpg" },
];

function MobileExhibitions() {
  return (
    <div className="px-5 pb-16">
      {/* Poster header — larger on mobile; same crop, sized to the column. */}
      <div className="relative aspect-[456/110] w-full max-w-[520px] overflow-hidden">
        <Image
          src="/assets/exhibitions/poster-header.png"
          alt="With Love, — a solo exhibition by Grace Chen"
          width={728}
          height={1125}
          className="absolute left-0 top-0 max-w-none"
          style={{ width: "135.74%", height: "871.92%" }}
        />
      </div>

      {/* Info text — larger on mobile. */}
      <div className="mt-3 flex flex-col gap-y-1 pl-1 font-sans text-[20px] uppercase leading-tight tracking-[0.02em] text-ink">
        <span>A solo exhibition by Grace Chen</span>
        <span>May 3-9th, 2024</span>
      </div>

      {/* One near-full-width photo per row. `width/height={0}` + `sizes="100vw"`
          lets each image size itself to the column while Next serves a
          full-width (high-res) variant. */}
      <div className="mt-8 flex flex-col gap-6">
        {MOBILE_PHOTOS.map(({ src, className }) => (
          <Image
            key={src}
            src={src}
            alt="Installation photograph"
            width={0}
            height={0}
            sizes="100vw"
            quality={90}
            className={clsx("h-auto w-full", className)}
          />
        ))}
      </div>
    </div>
  );
}

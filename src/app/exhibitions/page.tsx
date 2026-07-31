import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/PageShell";
import { PhotoGallery } from "@/components/exhibitions/PhotoGallery";
import { FitToViewport } from "@/components/exhibitions/FitToViewport";

export const metadata: Metadata = { title: "Exhibitions" };

export default function ExhibitionsPage() {
  return (
    <PageShell hideFooter>
      <div className="relative mx-auto w-full max-w-[1512px]">
        {/* Hanging ribbon tag — hangs from the very top edge, through the
            transparent header, exactly as before. It lives OUTSIDE the
            fit-to-viewport scaler so it is never clipped by the region's
            `overflow: hidden` and is never scaled. */}
        <div className="pointer-events-none absolute right-[7%] top-[-77px] z-10 h-[370px] w-[171px] overflow-hidden">
          <Image
            src="/assets/exhibitions/hanging-tag-v2.png"
            alt="Exhibition ribbon tag"
            fill
            sizes="171px"
            className="object-cover"
          />
        </div>

        {/* Fit-to-viewport: lock the composition to the space below the fixed
            77px nav and scale it (up or down) so the poster + caption + gallery
            always fit the viewport height with no page scroll, resizing with
            the browser. `sideHeadroom` reserves ~120px of horizontal slack on
            each side (the hover interaction enlarges an edge photo up to 425px,
            extending ~106px past the composition edge) so no edge photo is ever
            clipped by the region's `overflow: hidden`. */}
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
                    { src: "/assets/exhibitions/ex2.png", width: 150 },
                    { src: "/assets/exhibitions/ex3.png", width: 150 },
                    { src: "/assets/exhibitions/ex4.png", width: 150 },
                  ],
                },
                {
                  className:
                    "flex flex-wrap items-center justify-center gap-8 md:justify-between md:gap-x-0 md:px-[40px]",
                  items: [
                    { src: "/assets/exhibitions/ex5.png", width: 151 },
                    { src: "/assets/exhibitions/ex6.png", width: 150 },
                    {
                      src: "/assets/exhibitions/poster1.png",
                      width: 64,
                      className: "border-[0.5px] border-[#EBEBEB]",
                    },
                    { src: "/assets/exhibitions/ex7.png", width: 67 },
                  ],
                },
                {
                  className:
                    "flex flex-wrap items-center justify-center gap-8 md:justify-between",
                  items: [
                    {
                      src: "/assets/exhibitions/ex8.png",
                      width: 150,
                      title: "WITH LOVE, (DETAIL PHOTO)",
                      year: "2024",
                    },
                    { src: "/assets/exhibitions/ex9.png", width: 150 },
                    { src: "/assets/exhibitions/ex10.png", width: 150 },
                    { src: "/assets/exhibitions/ex11.jpg", width: 67 },
                  ],
                },
              ]}
            />
          </div>
        </FitToViewport>
      </div>
    </PageShell>
  );
}

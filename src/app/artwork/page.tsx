import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Artwork" };

type Category = {
  label: string;
  href: string;
  image: string;
  width: number;
  height: number;
  fit: "cover" | "contain";
  position?: string;
  border?: boolean;
};

// Left → right order: Illustration, Painting (centered), Textile.
const categories: Category[] = [
  {
    label: "Illustration",
    href: "/illustration",
    image: "/assets/gallery/5.jpg",
    width: 333,
    height: 300,
    fit: "cover",
    border: true,
  },
  {
    label: "Painting",
    href: "/painting",
    image: "/assets/gallery/1.png",
    width: 296,
    height: 350,
    fit: "contain",
    position: "bottom",
  },
  {
    label: "Textile",
    href: "/textile",
    image: "/assets/artwork/textile.png",
    width: 394,
    height: 300,
    fit: "cover",
  },
];

export default function ArtworkPage() {
  return (
    <PageShell>
      {/* Full-width centering wrapper — wider than the default Container so the
          three cards + two 200px gaps fit on a single, non-wrapping row. */}
      <div className="flex min-h-[calc(100dvh-77px)] items-center justify-center px-6 py-16 sm:py-24">
        <div className="flex w-full max-w-[1440px] flex-nowrap items-stretch justify-center gap-[200px]">
          {categories.map((category) => (
            <Link
              key={category.label}
              href={category.href}
              className="flex w-full flex-col"
              style={{ maxWidth: category.width }}
            >
              <figure className="flex h-full w-full flex-col">
              <div
                className="relative w-full"
                style={{
                  aspectRatio: `${category.width} / ${category.height}`,
                  ...(category.border ? { border: "1px solid #E2E2E2" } : {}),
                }}
              >
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  sizes={`${category.width}px`}
                  className={category.fit === "cover" ? "object-cover" : "object-contain"}
                  style={{ objectPosition: category.position }}
                />
              </div>
              <figcaption className="mt-auto pt-6 text-center type-label text-ink">
                {category.label}
              </figcaption>
              </figure>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

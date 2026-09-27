import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { HomeAltStage } from "@/components/home-alt/HomeAltStage";
import { homeAltSlides } from "@/data/homeAlt";

export default function Home() {
  return (
    <>
      {/* Mobile (< md): the simple hero landing. */}
      <div className="md:hidden">
        <PageShell fullBleed>
          {/* Full-bleed hero — fills the full browser viewport height and crops to
              width via object-cover. Sits flush at the very top so the fixed
              transparent nav overlays it. */}
          <div className="relative h-[100dvh] w-full">
            <Link href="/artwork" className="relative block h-full w-full">
              <Image
                src="/assets/home/hero.jpg"
                alt="Framed baby painting on a gallery wall"
                fill
                sizes="100vw"
                quality={90}
                priority
                className="object-cover"
              />
            </Link>

            {/* Centered SHOP button, overlaid on the hero — canonical solid
                style, inverts on hover. */}
            <ButtonLink
              href="/shop"
              className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            >
              ˚.⋆꒰ SHOP ⊹ ࣪ ˖
            </ButtonLink>
          </div>
        </PageShell>
      </div>

      {/* Desktop (≥ md): the interactive scrubbing home. Its images are lazy
          (only the first is priority), so nothing heavy downloads while this
          branch is hidden on phones. */}
      <div className="hidden md:block">
        <PageShell hideFooter>
          <HomeAltStage slides={homeAltSlides} />
        </PageShell>
      </div>
    </>
  );
}

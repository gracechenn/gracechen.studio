import Image from "next/image";
import { PageShell } from "@/components/PageShell";
import { ButtonLink } from "@/components/ui/Button";

export default function Home() {
  return (
    <PageShell fullBleed>
      {/* Full-bleed hero — fills the full browser viewport height and crops to
          width via object-cover. Sits flush at the very top so the fixed
          transparent nav overlays it. */}
      <div className="relative h-[100dvh] w-full">
        <Image
          src="/assets/home/hero.jpg"
          alt="Framed baby painting on a gallery wall"
          fill
          sizes="100vw"
          quality={90}
          priority
          className="object-cover"
        />
      </div>

      {/* Centered SHOP button — canonical solid style, inverts on hover. */}
      <div className="flex justify-center pt-11 pb-11">
        <ButtonLink href="/shop">˚.⋆꒰ SHOP ⊹ ࣪ ˖</ButtonLink>
      </div>
    </PageShell>
  );
}

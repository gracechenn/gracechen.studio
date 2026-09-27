import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/PageShell";
import { SparkleTrail } from "@/components/SparkleTrail";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PageShell>
      <SparkleTrail />
      <div className="mx-auto w-full max-w-[451px] px-6 pt-10 pb-24 sm:pt-16">
        <div className="relative aspect-[451/558] w-full overflow-hidden bg-card">
          <Image
            src="/assets/about/portrait.jpg"
            alt="Grace Chen"
            fill
            sizes="(max-width: 451px) 100vw, 451px"
            className="object-cover"
          />
        </div>

        <section className="mt-8">
          <h2 className="type-label text-ink">ABOUT</h2>
          <p className="mt-3 type-body-2 text-ink">
            Grace Chen (b. 2002, Canada) is an oil painter and designer living
            and working in New York City. She grew up in San Diego, California and
            holds a B.A. in Visual Arts and Computer Science from Brown
            University (2024).
          </p>
        </section>

        <section className="mt-8">
          <h2 className="type-label text-ink">ARTIST STATEMENT</h2>
          <p className="mt-3 type-body-2 text-ink">
            I work primarily based off of photographs from my daily life. The
            canvas allows me to capture, relive, and reinterpret a memory as I
            remember it. To me, painting is a form of devotion through attention.
            In each painting there is a tension between description and
            simplification–how much can I abstract while still transporting the
            viewer to a moment full of texture and detail? In particular, I often
            focus on light as a unnamed subject, whether that be from warm,
            filtered sunlight or the harsh flash of a digital camera.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="type-label text-ink">CONTACT</h2>
          <p className="mt-3 type-body-2 text-ink">
            <a
              href="mailto:hello@gracechen.studio"
              className="transition-colors hover:text-ink-muted"
            >
              hello@gracechen.studio
            </a>
          </p>
        </section>
      </div>
    </PageShell>
  );
}

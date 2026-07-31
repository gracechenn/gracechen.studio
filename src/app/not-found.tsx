import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex min-h-[calc(100dvh-169px)] flex-col items-center justify-center gap-[40px] px-6 text-center">
        <div className="relative aspect-[328/261] w-[328px] max-w-full">
          <Image
            src="/assets/not-found/page-not-found.png"
            alt="Page not found"
            fill
            sizes="328px"
            priority
            className="object-contain"
          />
        </div>
        <p className="type-body-1 text-ink">
          That page seems to have wandered off. Let&rsquo;s get you back to the
          studio.
        </p>
        <div className="py-[20px]">
          <Link
            href="/"
            className="type-label text-[16px] text-[#0051ff] transition-opacity hover:opacity-70"
          >
            RETURN HOME →
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

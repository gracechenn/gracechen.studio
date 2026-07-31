import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ClearCartOnMount } from "@/components/shop/ClearCartOnMount";

export const metadata: Metadata = { title: "Order confirmed" };

export default function SuccessPage() {
  return (
    <PageShell>
      <ClearCartOnMount />
      {/* Body content is centered in the viewport between the nav (77px) and
          footer (~92px), matching the Figma placement. gap-[40px] between the
          image, copy, and CTA; the CTA carries its own py-[20px] per Figma. */}
      <div className="flex min-h-[calc(100dvh-169px)] flex-col items-center justify-center gap-[40px] px-6 text-center">
        {/* "we've received your order" envelope — exact Figma aspect (394 × 393) */}
        <div className="relative aspect-[394/393] w-[394px] max-w-full">
          <Image
            src="/assets/shop/order-confirmation.png"
            alt="We've received your order"
            fill
            sizes="394px"
            priority
            className="object-contain"
          />
        </div>

        <div className="type-body-1 text-[14px] text-ink">
          <p className="leading-[30px]">
            Your order is confirmed and a receipt is on the way to your inbox.
          </p>
          <p className="leading-[30px]">
            Each piece is packed by hand in the studio and shipped within a few
            days.
          </p>
          <p className="leading-[30px]">
            If you have any questions please contact{" "}
            <a
              href="mailto:hello@gracechen.studio"
              className="underline transition-opacity hover:opacity-70"
            >
              hello@gracechen.studio
            </a>
            .
          </p>
        </div>

        <div className="py-[20px]">
          <Link
            href="/shop"
            className="type-label text-[14px] text-[#0051ff] transition-opacity hover:opacity-70"
          >
            Continue shopping →
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

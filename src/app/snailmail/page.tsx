import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { SnailmailForm } from "@/components/snailmail/SnailmailForm";

export const metadata: Metadata = { title: "Snail mail" };

export default function SnailmailPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-[451px] px-6 pt-10 pb-24 sm:pt-16">
        <h1 className="type-body-1 text-xl text-ink sm:text-2xl">
          Splendid mail club interest form
        </h1>
        <p className="mt-4 type-body-2 text-ink-muted">
          I&rsquo;m trying to figure out how many slots to open, so please leave
          your email if you&rsquo;re interested in joining my snail mail club.
          I&rsquo;ll also send you an email when the mail club officially launches.
        </p>
        <SnailmailForm />
      </div>
    </PageShell>
  );
}

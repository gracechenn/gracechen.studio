import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { SnailmailForm } from "@/components/snailmail/SnailmailForm";

export const metadata: Metadata = { title: "Snail mail" };

export default function SnailmailPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-[451px] px-6 pt-10 pb-24 sm:pt-16">
        <h1 className="type-h1 text-ink">
          Interested in joining the Splendid Mail Club? Leave your email below!
        </h1>
        <p className="mt-4 type-body-2 text-ink-muted">
          I&rsquo;m gauging interest to figure out how many slots to open. I&rsquo;ll
          also send you an email when the mail club officially launches.
        </p>
        <SnailmailForm />
      </div>
    </PageShell>
  );
}

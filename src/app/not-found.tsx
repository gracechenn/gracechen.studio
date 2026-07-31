import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <PageShell>
      <Container className="flex flex-col items-center py-32 text-center">
        <p className="type-h1">
          Not here
        </p>
        <p className="mt-6 max-w-sm type-body-1 text-ink-muted">
          That page seems to have wandered off. Let&rsquo;s get you back to the
          studio.
        </p>
        <Link
          href="/"
          className="mt-8 type-label text-accent-muted transition-colors hover:text-accent"
        >
          Return home →
        </Link>
      </Container>
    </PageShell>
  );
}

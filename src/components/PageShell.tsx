import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/Container";

/**
 * Standard interior-page frame: fixed Nav overlay, content column offset below
 * it, and a site-wide footer.
 *
 * - `fullBleed` cancels the default 77px top offset so content (e.g. a hero
 *   image) sits flush under the transparent nav. Off by default.
 * - `hideFooter` suppresses the footer (e.g. the fit-to-viewport Exhibitions
 *   page). Off by default, so the footer renders everywhere else.
 * - `cartOnlyFixed` lets the wordmark + links scroll away while CART stays
 *   pinned (used on the shop listing). Off by default.
 */
export function PageShell({
  children,
  fullBleed = false,
  hideFooter = false,
  cartOnlyFixed = false,
}: {
  children: React.ReactNode;
  fullBleed?: boolean;
  hideFooter?: boolean;
  cartOnlyFixed?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav cartOnlyFixed={cartOnlyFixed} />
      <main className={fullBleed ? "flex-1" : "flex-1 pt-[77px]"}>{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  return (
    <Container className="pt-10 pb-14 sm:pt-16">
      {eyebrow && (
        <p className="mb-4 type-label">
          {eyebrow}
        </p>
      )}
      <h1 className="type-h1">
        {title}
      </h1>
      {intro && (
        <p className="mt-5 max-w-xl type-body-1 text-ink-muted">
          {intro}
        </p>
      )}
    </Container>
  );
}

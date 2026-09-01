import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ArtworkSections } from "@/components/artwork/ArtworkSections";
import { artworkSections } from "@/data/artworkCategories";

export const metadata: Metadata = { title: "Artwork" };

export default function ArtworkPage() {
  return (
    <PageShell>
      <ArtworkSections sections={artworkSections} />
    </PageShell>
  );
}

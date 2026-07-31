import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { CategoryGallery } from "@/components/artwork/CategoryGallery";
import { textileColumns } from "@/data/artworkCategories";

export const metadata: Metadata = { title: "Textile" };

export default function TextilePage() {
  return (
    <PageShell>
      <CategoryGallery columns={textileColumns} />
    </PageShell>
  );
}

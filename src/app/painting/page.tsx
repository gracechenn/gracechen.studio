import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { CategoryGallery } from "@/components/artwork/CategoryGallery";
import { paintingColumns } from "@/data/artworkCategories";

export const metadata: Metadata = { title: "Painting" };

export default function PaintingPage() {
  return (
    <PageShell>
      <CategoryGallery columns={paintingColumns} />
    </PageShell>
  );
}

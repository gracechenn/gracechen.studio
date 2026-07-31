import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { CategoryGallery } from "@/components/artwork/CategoryGallery";
import { illustrationColumns } from "@/data/artworkCategories";

export const metadata: Metadata = { title: "Illustration" };

export default function IllustrationPage() {
  return (
    <PageShell>
      <CategoryGallery columns={illustrationColumns} />
    </PageShell>
  );
}

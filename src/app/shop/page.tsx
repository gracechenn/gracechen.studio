import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ShopTabs } from "@/components/shop/ShopTabs";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Original paintings and archival prints by Grace Chen.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab =
    tab === "print" || tab === "original" || tab === "commissions"
      ? tab
      : undefined;
  return (
    <PageShell cartOnlyFixed>
      <ShopTabs products={products} initialTab={initialTab} />
    </PageShell>
  );
}

import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ShopTabs } from "@/components/shop/ShopTabs";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Original paintings and archival prints by Grace Chen.",
};

export default function ShopPage() {
  return (
    <PageShell cartOnlyFixed>
      <ShopTabs products={products} />
    </PageShell>
  );
}

import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ShopTabs, type AvailabilityMap } from "@/components/shop/ShopTabs";
import { products } from "@/data/products";
import { getAllStock, resolveAvailability } from "@/lib/inventory";

export const metadata: Metadata = {
  title: "Shop",
  description: "Original paintings and archival prints by Grace Chen.",
};

// Render at request time so availability reflects live inventory.
export const dynamic = "force-dynamic";

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

  const stock = await getAllStock(products.map((p) => p.slug));
  const availability: AvailabilityMap = {};
  for (const product of products) {
    availability[product.slug] = resolveAvailability(
      product,
      stock.get(product.slug) ?? null,
    );
  }

  return (
    <PageShell cartOnlyFixed>
      <ShopTabs
        products={products}
        availability={availability}
        initialTab={initialTab}
      />
    </PageShell>
  );
}

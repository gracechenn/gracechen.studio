import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products } from "@/data/products";
import { getAllStock, resolveAvailability } from "@/lib/inventory";
import { isKvConfigured } from "@/lib/kv";
import { updateStock } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Inventory admin",
  robots: { index: false, follow: false },
};

export default async function InventoryAdminPage() {
  // Disabled entirely when no password is configured.
  if (!process.env.ADMIN_PASSWORD) notFound();

  const kvOn = isKvConfigured();
  const slugs = products.map((p) => p.slug);
  const stock = await getAllStock(slugs);

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Inventory</h1>
      <p style={{ color: "#555", fontSize: 14, marginTop: 8 }}>
        Set a count to track finite stock (0 = sold out). Leave blank / clear to
        make an item unmanaged — prints unlimited, originals follow the catalog.
      </p>
      {!kvOn && (
        <p
          style={{
            marginTop: 16,
            padding: "10px 12px",
            background: "#fff4e5",
            border: "1px solid #ffcf99",
            borderRadius: 6,
            fontSize: 14,
            color: "#7a4a00",
          }}
        >
          KV is not configured — set <code>KV_REST_API_URL</code> and{" "}
          <code>KV_REST_API_TOKEN</code>. Until then, saving is a no-op and all
          items use their catalog fallback.
        </p>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24, fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
            <th style={{ padding: "8px 8px" }}>Product</th>
            <th style={{ padding: "8px 8px" }}>Kind</th>
            <th style={{ padding: "8px 8px" }}>Effective stock</th>
            <th style={{ padding: "8px 8px" }}>Set count</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const kvStock = stock.get(product.slug) ?? null;
            const managed = typeof kvStock === "number";
            const { available } = resolveAvailability(product, kvStock);
            const effective = managed
              ? `${kvStock} in stock`
              : product.kind === "print"
                ? "Unmanaged (unlimited)"
                : available
                  ? "Available (catalog)"
                  : "Sold (catalog)";
            return (
              <tr key={product.slug} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 8px" }}>
                  <div style={{ fontWeight: 500 }}>{product.title}</div>
                  <div style={{ color: "#888", fontSize: 12 }}>{product.slug}</div>
                </td>
                <td style={{ padding: "10px 8px", color: "#555" }}>{product.kind}</td>
                <td
                  style={{
                    padding: "10px 8px",
                    color: available ? "#111" : "#b00020",
                  }}
                >
                  {effective}
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <form action={updateStock} style={{ display: "flex", gap: 8 }}>
                    <input type="hidden" name="slug" value={product.slug} />
                    <input
                      type="number"
                      name="stock"
                      min={0}
                      step={1}
                      defaultValue={managed ? String(kvStock) : ""}
                      placeholder="unmanaged"
                      style={{
                        width: 110,
                        padding: "6px 8px",
                        border: "1px solid #ccc",
                        borderRadius: 6,
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: "6px 14px",
                        border: "1px solid #0051ff",
                        background: "#0051ff",
                        color: "#fff",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}

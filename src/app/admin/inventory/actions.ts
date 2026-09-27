"use server";

import { revalidatePath } from "next/cache";
import { setStock } from "@/lib/inventory";
import { isAdminRequest } from "@/lib/adminAuth";

/**
 * Set (or clear) a product's stock count. Server-side auth check is mandatory:
 * a Server Action is a POST to the route and must not rely on the proxy alone.
 * An empty value clears the entry (back to unmanaged/unlimited).
 */
export async function updateStock(formData: FormData): Promise<void> {
  if (!process.env.ADMIN_PASSWORD) return; // admin disabled
  if (!(await isAdminRequest())) throw new Error("Unauthorized");

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;

  const raw = String(formData.get("stock") ?? "").trim();
  let value: number | null;
  if (raw === "") {
    value = null;
  } else {
    const n = Math.trunc(Number(raw));
    if (!Number.isFinite(n)) return;
    value = Math.max(0, n);
  }

  await setStock(slug, value);
  revalidatePath("/admin/inventory");
}

"use server";

import { revalidatePath } from "next/cache";
import { normalizeEmail, removeSubscriber } from "@/lib/snailmail";
import { isAdminRequest } from "@/lib/adminAuth";

/**
 * Delete a subscriber from the snail-mail list. Server-side auth check is
 * mandatory: a Server Action is a POST to the route and must not rely on the
 * proxy alone.
 */
export async function deleteSubscriber(formData: FormData): Promise<void> {
  if (!process.env.ADMIN_PASSWORD) return; // admin disabled
  if (!(await isAdminRequest())) throw new Error("Unauthorized");

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return;

  await removeSubscriber(email);
  revalidatePath("/admin/snailmail");
}

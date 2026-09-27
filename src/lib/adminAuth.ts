import { headers } from "next/headers";

/**
 * Validate HTTP Basic Auth against the admin env credentials. The `proxy.ts`
 * gate already challenges `/admin/*`, but per Next.js guidance a Server Action
 * (a POST to the same route) must NOT trust the proxy alone — so the write
 * action re-checks here using the credentials the browser re-sends.
 *
 * Returns `false` when `ADMIN_PASSWORD` is unset (admin disabled).
 */
export async function isAdminRequest(): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  const expectedUser = process.env.ADMIN_USER ?? "admin";
  const header = (await headers()).get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const sep = decoded.indexOf(":");
  if (sep === -1) return false;

  return (
    decoded.slice(0, sep) === expectedUser && decoded.slice(sep + 1) === password
  );
}

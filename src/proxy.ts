import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next 16 renamed the `middleware` convention to `proxy`. This gates the admin
// area with HTTP Basic Auth using the env credentials. The write Server Action
// re-checks auth server-side (see src/lib/adminAuth.ts) — the proxy alone is
// never the only guard.
export const config = { matcher: "/admin/:path*" };

export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  // Admin is disabled without a password; the page itself renders a 404, so
  // just let the request through here (no challenge for a non-existent area).
  if (!password) return NextResponse.next();

  const expectedUser = process.env.ADMIN_USER ?? "admin";
  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    if (
      sep !== -1 &&
      decoded.slice(0, sep) === expectedUser &&
      decoded.slice(sep + 1) === password
    ) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"' },
  });
}

import { NextResponse, type NextRequest } from "next/server";

/**
 * 1. ONE ADDRESS. www.dsuniverse.net forwards to dsuniverse.net (found 2026-10-31:
 *    www served the site on its own, so a visitor there got a separate sign-in,
 *    and "Continue with Whop" failed - Whop always returns to dsuniverse.net,
 *    where the visitor's sign-in check was not). Read from the forwarded host,
 *    because behind Hostinger the request URL's own host is the internal one.
 * 2. Members area: passes the requested path to the members layout, so a
 *    signed-out visitor is sent back to the exact page after signing in.
 */
export function middleware(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim().toLowerCase();
  if (host === "www.dsuniverse.net") {
    return NextResponse.redirect(`https://dsuniverse.net${req.nextUrl.pathname}${req.nextUrl.search}`, 308);
  }
  if (!req.nextUrl.pathname.startsWith("/members")) return NextResponse.next();
  const h = new Headers(req.headers);
  h.set("x-ds-path", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: h } });
}
// Everything except Next's own files and the static assets (a www asset request is forwarded by the page it belongs to).
export const config = { matcher: ["/((?!_next/|brand/|covers/|hd/|cursor/|wide/|.*\\.(?:png|jpg|jpeg|webp|svg|ico|mp4|webm|woff2)$).*)"] };

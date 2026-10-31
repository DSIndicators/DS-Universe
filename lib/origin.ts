/**
 * The address the VISITOR used, for building redirects in route handlers.
 *
 * Behind Hostinger, the request URL Next hands a route handler carries the
 * app's internal listener (http://0.0.0.0:3000), so `new URL(path, req.url)`
 * sent people to https://0.0.0.0:3000/... (found 2026-10-31 when a cancelled
 * "Continue with Whop" landed on "can't reach this page"). The public host
 * comes from the proxy's X-Forwarded-Host / Host headers instead; an internal
 * or missing host falls back to the site's own address.
 */
const INTERNAL = /^(0\.0\.0\.0|127\.|\[?::1?\]?|localhost:3000$)/;

export function originOf(req: Request): string {
  const h = req.headers;
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
  if (!host || INTERNAL.test(host)) return "https://dsuniverse.net";
  const local = /^localhost(:\d+)?$/.test(host);
  // The public site is https only (Hostinger forwards http to https). Next fills in x-forwarded-proto
  // from its own plain-http listener when the proxy does not, so it is trusted for localhost only.
  const proto = local ? (h.get("x-forwarded-proto") || "http").split(",")[0].trim() : "https";
  return `${proto}://${host}`;
}

/** The same-site path of the page a request came from (Referer), or null. */
export function backPath(req: Request): string | null {
  const ref = req.headers.get("referer");
  if (!ref) return null;
  try {
    const u = new URL(ref);
    if (u.host !== new URL(originOf(req)).host) return null;
    const p = u.pathname + u.search;
    return p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/api/") ? p : null;
  } catch {
    return null;
  }
}

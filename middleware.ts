import { NextResponse, type NextRequest } from "next/server";

/** Passes the requested path to the members layout, so a signed-out visitor is sent back to the exact page after signing in. */
export function middleware(req: NextRequest) {
  const h = new Headers(req.headers);
  h.set("x-ds-path", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: h } });
}
export const config = { matcher: ["/members/:path*"] };

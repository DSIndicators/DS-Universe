import { NextResponse } from "next/server";
import { authorizeUrl, whopReady } from "@/lib/whop";
import { safeNext } from "@/lib/auth";
import { backPath, originOf } from "@/lib/origin";

/**
 * "Continue with Whop" / "Connect Whop": start OAuth (PKCE). Only exists once
 * the Whop keys are set (lib/whop.ts). Remembers two places for ten minutes:
 * `next`, where to go once signed in, and `back`, the page the visitor pressed
 * the button on - where a cancelled sign-in quietly returns them.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const site = originOf(req);
  if (!whopReady()) return NextResponse.redirect(new URL("/signin", site));
  const { url: to, verifier, state } = authorizeUrl();
  const res = NextResponse.redirect(to);
  const next = safeNext(url.searchParams.get("next"));
  const back = backPath(req) ?? next;
  res.cookies.set("ds_oauth", JSON.stringify({ verifier, state, next, back }), {
    httpOnly: true, sameSite: "lax", secure: site.startsWith("https:"), path: "/api/auth/whop", maxAge: 600,
  });
  return res;
}

import { NextResponse } from "next/server";
import { authorizeUrl, whopReady } from "@/lib/whop";
import { safeNext } from "@/lib/auth";

/** "Continue with Whop": start OAuth (PKCE). Only exists once Whop keys are set (lib/whop.ts). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!whopReady()) return NextResponse.redirect(new URL("/signin", url));
  const { url: to, verifier, state } = authorizeUrl();
  const res = NextResponse.redirect(to);
  const next = safeNext(url.searchParams.get("next"));
  res.cookies.set("ds_oauth", JSON.stringify({ verifier, state, next }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth/whop", maxAge: 600,
  });
  return res;
}

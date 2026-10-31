import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { finishSignIn, whopReady } from "@/lib/whop";
import { connectWhop, getSession, safeNext, startSession } from "@/lib/auth";
import { originOf } from "@/lib/origin";

/**
 * Whop sends the visitor back here with ?code&state. The Whop user is then
 * connected to ONE DS Universe account (lib/auth.ts connectWhop): the account
 * signed in right now if there is one ("Connect Whop"), else the account it is
 * already linked to, else the account with the same email, else a new one.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const site = originOf(req);
  const go = (path: string) => NextResponse.redirect(new URL(path, site));
  const jar = await cookies();
  const raw = jar.get("ds_oauth")?.value;
  jar.delete("ds_oauth");
  const fail = (why: string) => go(`/signin?error=${why}`);
  let saved: { verifier: string; state: string; next: string; back?: string } | null = null;
  try {
    saved = raw ? JSON.parse(raw) : null;
  } catch {}
  // Cancelled or declined on Whop's page (Whop returns ?error=access_denied, no code):
  // nothing went wrong, so no error message - back to the page they pressed the button on.
  if (url.searchParams.get("error") && !url.searchParams.get("code")) {
    return go(safeNext(saved?.back, (await getSession()) ? "/members/account" : "/signin"));
  }
  if (!whopReady() || !saved) return fail("whop");
  const code = url.searchParams.get("code");
  if (!code || url.searchParams.get("state") !== saved.state) return fail("whop");
  let u;
  try {
    u = await finishSignIn(code, saved.verifier);
  } catch {
    return fail("whop");
  }
  const current = await getSession();
  const r = connectWhop(u, current?.id);
  if ("error" in r) {
    const back = current ? `/members/account?error=${r.error}` : `/signin?error=${r.error}`;
    return go(back);
  }
  await startSession(r.member, current?.via === "local" ? "local" : "whop");
  return go(safeNext(saved.next));
}

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
  // Every failure is logged with its reason (never a secret), so a broken sign-in shows up in the
  // Hostinger runtime log instead of only as a message on the visitor's screen.
  const why = (reason: string) => {
    console.error(`[whop] sign-in failed: ${reason}`);
    return fail("whop");
  };
  if (!whopReady()) return why("Whop settings missing on the server");
  if (!saved) return why("no ds_oauth cookie (expired after 10 minutes, or cookies blocked)");
  const code = url.searchParams.get("code");
  if (!code) return why(`no code (Whop said: ${url.searchParams.get("error") ?? "nothing"})`);
  if (url.searchParams.get("state") !== saved.state) return why("state did not match");
  let u;
  try {
    u = await finishSignIn(code, saved.verifier);
  } catch (e) {
    return why((e as Error).message);
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

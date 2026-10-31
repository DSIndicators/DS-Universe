import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { finishSignIn, whopReady } from "@/lib/whop";
import { connectWhop, getSession, safeNext, startSession } from "@/lib/auth";

/**
 * Whop sends the visitor back here with ?code&state. The Whop user is then
 * connected to ONE DS Universe account (lib/auth.ts connectWhop): the account
 * signed in right now if there is one ("Connect Whop"), else the account it is
 * already linked to, else the account with the same email, else a new one.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const raw = jar.get("ds_oauth")?.value;
  jar.delete("ds_oauth");
  const fail = (why: string) => NextResponse.redirect(new URL(`/signin?error=${why}`, url));
  if (!whopReady() || !raw) return fail("whop");
  let saved: { verifier: string; state: string; next: string };
  try {
    saved = JSON.parse(raw);
  } catch {
    return fail("whop");
  }
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
    return NextResponse.redirect(new URL(back, url));
  }
  await startSession(r.member, current?.via === "local" ? "local" : "whop");
  return NextResponse.redirect(new URL(safeNext(saved.next), url));
}

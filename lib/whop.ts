import crypto from "node:crypto";

/**
 * WHOP — the launch provider for sign-in and vault access.
 *
 * WHY WHOP: the Essentials Vault membership is a Whop subscription, and every Free Vault tool is
 * a free Whop listing. So Whop already knows who is a member. On the live site,
 * the question "may this person open the Essentials Vault?" is asked of Whop,
 * on the server, on every members-area request — never trusted from a cookie.
 * (The Essentials checkout is plan_BDcgf0PEsWLeP, $39.99 a month, no trial.)
 * No passwords are stored by DS Universe at all.
 *
 * Built from Whop's developer docs (read 2026-10-30):
 *   OAuth 2.1 + PKCE   https://docs.whop.com/developer/guides/oauth.md
 *     authorize  GET  https://api.whop.com/oauth/authorize
 *                     response_type=code, client_id (app_…), redirect_uri,
 *                     scope "openid profile email", state, nonce,
 *                     code_challenge (S256)
 *     token      POST https://api.whop.com/oauth/token (JSON)
 *                     grant_type=authorization_code, code, redirect_uri,
 *                     client_id, code_verifier
 *     userinfo   GET  https://api.whop.com/oauth/userinfo  (Bearer) → sub = user_…, email, name
 *   Access check       https://docs.whop.com/api-reference/beta/users/check-user-access.md
 *                 GET  https://api.whop.com/api/v1/users/{user_…}/access/{prod_…}
 *                     Authorization: Bearer <account API key> → { has_access, access_level }
 *
 * STATUS: INERT until the four settings below exist (the launcher does not set
 * them, so localhost:3003 uses local accounts). The calls follow the docs as
 * written but have NOT been exercised against live Whop keys yet: test on the
 * Whop sandbox (https://sandbox-api.whop.com) before launch.
 *
 *   WHOP_CLIENT_ID            the OAuth app's app_… id
 *   WHOP_REDIRECT_URI         https://dsuniverse.net/api/auth/whop/callback (registered on the app)
 *   WHOP_API_KEY              an account API key with permission to check access
 *   WHOP_ESSENTIALS_PRODUCT   the Essentials Vault product's prod_… id
 *   WHOP_CLIENT_SECRET        optional; the app's client secret, sent with the code exchange when set
 *   WHOP_API_BASE             optional; https://sandbox-api.whop.com for testing
 */

const BASE = () => process.env.WHOP_API_BASE || "https://api.whop.com";
const VERSION = "2026-10-29";

export const whopReady = () =>
  !!(process.env.WHOP_CLIENT_ID && process.env.WHOP_REDIRECT_URI && process.env.WHOP_API_KEY && process.env.WHOP_ESSENTIALS_PRODUCT);

const b64url = (b: Buffer) => b.toString("base64url");

/** Step 1: where to send the visitor, plus the secrets to keep in a short-lived cookie. */
export function authorizeUrl() {
  const verifier = b64url(crypto.randomBytes(32));
  const state = b64url(crypto.randomBytes(16));
  const nonce = b64url(crypto.randomBytes(16));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  const q = new URLSearchParams({
    response_type: "code",
    client_id: process.env.WHOP_CLIENT_ID!,
    redirect_uri: process.env.WHOP_REDIRECT_URI!,
    scope: "openid profile email",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return { url: `${BASE()}/oauth/authorize?${q}`, verifier, state };
}

/** Step 2: trade the code for a token, then read who it is. */
export async function finishSignIn(code: string, verifier: string) {
  const tok = await fetch(`${BASE()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.WHOP_REDIRECT_URI,
      client_id: process.env.WHOP_CLIENT_ID,
      code_verifier: verifier,
      // Sent only when it is set (Whop's own guide stores it as WHOP_CLIENT_SECRET); PKCE alone works without it.
      ...(process.env.WHOP_CLIENT_SECRET ? { client_secret: process.env.WHOP_CLIENT_SECRET } : {}),
    }),
  });
  // Whop's error body is { error, error_description } - no secrets - so it goes into the server log as it is.
  // (2026-10-31: every sign-in failed with "client_secret lacks oauth:token_exchange permission" until that
  // permission was added on the app's Permissions tab in the Whop dashboard.)
  if (!tok.ok) throw new Error(`token exchange ${tok.status}: ${(await tok.text()).slice(0, 200)}`);
  const { access_token } = (await tok.json()) as { access_token: string };
  const me = await fetch(`${BASE()}/oauth/userinfo`, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!me.ok) throw new Error(`userinfo ${me.status}: ${(await me.text()).slice(0, 200)}`);
  const u = (await me.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string; preferred_username?: string };
  if (!u.sub) throw new Error("userinfo returned no user id");
  return { id: u.sub, email: u.email ?? "", emailVerified: u.email_verified === true, name: u.name ?? u.preferred_username };
}

/* One minute of memory per member, so a page with several checks asks Whop once. */
const cache = new Map<string, { ok: boolean; at: number }>();

/** Does this Whop user hold the Essentials Vault (an active membership)? Fails closed. */
export async function essentialsAccess(userId: string): Promise<boolean> {
  if (!whopReady()) return false;
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < 60_000) return hit.ok;
  try {
    const r = await fetch(
      `${BASE()}/api/v1/users/${encodeURIComponent(userId)}/access/${encodeURIComponent(process.env.WHOP_ESSENTIALS_PRODUCT!)}`,
      { headers: { Authorization: `Bearer ${process.env.WHOP_API_KEY}`, "Api-Version-Date": VERSION }, cache: "no-store" },
    );
    const ok = r.ok && ((await r.json()) as { has_access?: boolean }).has_access === true;
    cache.set(userId, { ok, at: Date.now() });
    return ok;
  } catch {
    return false;
  }
}

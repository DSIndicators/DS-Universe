import crypto from "node:crypto";
import { findByEmail, findByReset, normEmail, setReset } from "@/lib/auth";
import { sendToMember } from "@/lib/notify";

/**
 * FORGOT YOUR PASSWORD (2026-10-31). Passwords are stored only as scrypt
 * hashes, so nobody - not support, not Tom - can read one back. Instead the
 * member asks for a link, and the link lets them choose a new password.
 *
 *   - The link carries 32 random bytes. Only their sha256 is stored, on the
 *     account, so a copy of the account file cannot be used to reset anyone.
 *   - It works once, for 30 minutes. Asking again replaces the earlier link.
 *   - The page says the same thing whether or not the email has an account,
 *     so it cannot be used to find out who is a member.
 *   - At most 3 links per email an hour and 30 for the whole site an hour,
 *     so it cannot be used to flood someone's inbox or ours.
 *   - Choosing the new password signs out every other session (lib/auth.ts).
 *
 * It needs the same SMTP settings as the sign-up notices (lib/notify.ts).
 */
export const RESET_MINUTES = 30;
const HOUR = 60 * 60 * 1000;
const perEmail = new Map<string, number[]>();
const all: number[] = [];

const sha = (t: string) => crypto.createHash("sha256").update(t).digest("hex");
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

function allowed(email: string) {
  const now = Date.now();
  while (all.length && now - all[0] > HOUR) all.shift();
  const mine = (perEmail.get(email) ?? []).filter((t) => now - t < HOUR);
  if (all.length >= 30 || mine.length >= 3) return false;
  mine.push(now);
  all.push(now);
  perEmail.set(email, mine);
  return true;
}

/** Send a reset link if the email has an account. Never says whether it did. */
export function requestReset(email: string, origin: string): void {
  const e = normEmail(email);
  const m = findByEmail(e);
  if (!m || !allowed(e)) return;
  const token = crypto.randomBytes(32).toString("base64url");
  setReset(m.id, sha(token), Date.now() + RESET_MINUTES * 60 * 1000);
  const link = `${origin}/reset?token=${token}`;
  const hello = m.name ? `Hi ${m.name.replace(/[\r\n]+/g, " ").slice(0, 60)},` : "Hi,";
  const text = [
    hello,
    "",
    "Someone asked to reset the password for your DS Universe account. To choose a new one, open this link:",
    "",
    link,
    "",
    `It works once, for the next ${RESET_MINUTES} minutes.`,
    "",
    m.hash ? "If you did not ask for this, ignore this email. Your password stays as it is." : "Your account was opened with Whop. This link adds a password, so you can also sign in with your email. If you did not ask for it, ignore this email.",
    "",
    "DS Universe",
    "support@dsuniverse.net",
  ].join("\n");
  // Not awaited: the reply must take the same time whether or not the email has an account.
  void sendToMember(m.email, "Reset your DS Universe password", text);
}

/** The account a token belongs to, if the token is well formed, unused and not expired. */
export function accountForToken(token: unknown) {
  if (typeof token !== "string" || !TOKEN_RE.test(token)) return undefined;
  return findByReset(sha(token));
}

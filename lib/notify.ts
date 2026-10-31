import nodemailer from "nodemailer";

/**
 * SIGN-UP NOTICE (Tom, 2026-10-31: "check feasibility to get notified when a
 * user signs up for our website" -> "yes Email").
 *
 * One plain email to the support mailbox for every new DS Universe account,
 * sent through the mailbox's own Hostinger SMTP server - the same four
 * settings the white site's help form used, read from the ENVIRONMENT, never
 * from the repository (it is public):
 *     SMTP_HOST   smtp.hostinger.com
 *     SMTP_PORT   465   (implicit TLS)
 *     SMTP_USER   support@dsuniverse.net
 *     SMTP_PASS   that mailbox's password
 *     NOTIFY_TO   optional - where the notice goes; defaults to SMTP_USER
 * Until they exist nothing is sent and nothing breaks.
 *
 * It never slows or blocks a sign-up: the send runs after the account is
 * saved, is not awaited, and any failure is only logged (the reason, never
 * the address). At most 20 notices an hour, so a flood of fake sign-ups
 * cannot flood the inbox; past that, one line in the log per refusal.
 * The new member's address is the only personal detail in the email, and it
 * goes to our own mailbox only - nothing is ever sent to the member.
 */
const HOUR = 60 * 60 * 1000;
const sent: number[] = [];

function config() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT?.trim() || 465);
  if (!host || !user || !pass || !Number.isInteger(port)) return null;
  return { host, port, user, pass, to: process.env.NOTIFY_TO?.trim() || user };
}

export function notifySignup(m: { email: string; name?: string; via: "email" | "whop"; total?: number }) {
  const c = config();
  if (!c) return;
  const now = Date.now();
  while (sent.length && now - sent[0] > HOUR) sent.shift();
  if (sent.length >= 20) {
    console.warn("[notify] sign-up notice skipped: 20 already sent this hour");
    return;
  }
  sent.push(now);
  const when = new Date().toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });
  const clean = (s: string) => s.replace(/[\r\n]+/g, " ").slice(0, 120);
  const lines = [
    `New DS Universe account (${m.via === "whop" ? "Continue with Whop" : "email and password"}).`,
    "",
    `Email:   ${clean(m.email) || "(none given by Whop)"}`,
    `Name:    ${m.name ? clean(m.name) : "-"}`,
    `When:    ${when} (New York)`,
    m.total ? `Accounts on the site: ${m.total}` : "",
    "",
    "It opens the Free Vault. The Essentials Vault opens only with an active Whop membership.",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "");
  const t = nodemailer.createTransport({ host: c.host, port: c.port, secure: c.port === 465, auth: { user: c.user, pass: c.pass } });
  t.sendMail({ from: `"DS Universe" <${c.user}>`, to: c.to, subject: `New sign-up: ${clean(m.email) || "Whop user"}`, text: lines.join("\n") }).catch((e: Error) =>
    console.error("[notify] sign-up notice failed:", e.message),
  );
}

/**
 * A mail TO a member - used only for a password-reset link they asked for
 * (lib/reset.ts). Same mailbox and settings as above. Resolves true when the
 * server accepted it; never throws.
 */
export async function sendToMember(to: string, subject: string, text: string): Promise<boolean> {
  const c = config();
  if (!c) return false;
  try {
    const t = nodemailer.createTransport({ host: c.host, port: c.port, secure: c.port === 465, auth: { user: c.user, pass: c.pass } });
    await t.sendMail({ from: `"DS Universe" <${c.user}>`, replyTo: c.user, to, subject, text });
    return true;
  } catch (e) {
    console.error("[notify] member mail failed:", (e as Error).message);
    return false;
  }
}
export const mailReady = () => !!config();

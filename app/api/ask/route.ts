import { ASK_LIMITS, isEmail } from "@/content/help";
import { BY_SLUG } from "@/content/products";
import { SITE } from "@/content/site";

/**
 * POST /api/ask — one question from the Help panel, sent to the support
 * mailbox (2026-10-02; Tom chose "your own mailbox" over a relay service).
 *
 * HOW IT SENDS. Through the mailbox's own SMTP server, with four values read
 * from the ENVIRONMENT at request time — never from this repository, which is
 * public:
 *     SMTP_HOST   smtp.hostinger.com
 *     SMTP_PORT   465            (implicit TLS; 587 would use STARTTLS)
 *     SMTP_USER   support@dsuniverse.net   (the full address)
 *     SMTP_PASS   that mailbox's password
 *     ASK_TO      optional — where questions land; defaults to SMTP_USER
 * Hostinger: website dashboard → Environment variables → add the four → save
 * (saving redeploys). Until they exist this route answers 503 and the panel
 * hands the visitor their message in their own mail app instead, so nobody is
 * stranded either way. GET /api/ask says whether sending is on.
 * nodemailer 10 needs Node 20 or newer (the app's Node version is a Hostinger
 * setting); on an older Node the send fails and the same fallback shows.
 *
 * WHAT GOES OUT. A plain-text email FROM the support mailbox TO the support
 * mailbox, with the visitor's address as Reply-To — so answering is "Reply".
 * The visitor is never emailed by this route (no auto-reply): a public form
 * that mails whatever address is typed into it is a spam cannon.
 *
 * WHAT IT REFUSES, and why each check is here:
 *  · another site's page posting here (Origin / Sec-Fetch-Site) — a form on
 *    someone else's site must not be able to use our mailbox;
 *  · anything but small JSON; an address that is not an address; a message
 *    that is empty or over the limit (OWASP input validation: allow-list the
 *    shape, cap the length);
 *  · header injection — nothing the visitor types reaches a header except the
 *    validated address (Reply-To, and the end of the subject); the rest of the
 *    subject is built here from the catalogue's own product name;
 *  · bots — a field people cannot see (`hp`) and a form filled faster than a
 *    person can type are answered "ok" and dropped, so a bot is not told it
 *    was caught;
 *  · floods — 4 per connection per 10 minutes and 12 per day, and 40 an hour
 *    from everyone together. The address a connection reports can be forged,
 *    so the last number is the one that actually bounds what can reach the
 *    mailbox; when IT is reached the answer is "busy", and the panel hands the
 *    visitor their message without blaming them for a flood they did not
 *    send. In memory: one process serves the site, and a restart forgetting
 *    the counts is harmless;
 *  · a body it has not measured — the size is checked from Content-Length
 *    BEFORE anything is read, so nobody can make the server hold megabytes.
 * No CAPTCHA: it would cost every honest visitor a puzzle to stop traffic the
 * checks above already stop.
 *
 * Nothing is stored. The message exists in the mailbox and nowhere else; the
 * server log gets the reason for a failure, never the message or the address.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: NO_STORE });

/* ------------------------------------------------------------------ config */

function config() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT?.trim() || 465);
  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  const to = process.env.ASK_TO?.trim() || user;
  if (!isEmail(user) || !isEmail(to)) return null;
  return { host, port, user, pass, to };
}

/* ------------------------------------------------------------- rate limits */

const MIN = 60_000;
const LIMITS = { short: { window: 10 * MIN, max: 4 }, day: { window: 24 * 60 * MIN, max: 12 }, all: { window: 60 * MIN, max: 40 } };
const byIp = new Map<string, number[]>();
let everyone: number[] = [];

/** "ok", or why not: "rate" = this connection has sent too many; "busy" = the
 *  site as a whole has. A refusal never adds to the map, so refused traffic
 *  cannot grow it. */
function allowed(ip: string, now: number): "ok" | "rate" | "busy" {
  everyone = everyone.filter((t) => now - t < LIMITS.all.window);
  // No address reported at all: every visitor would share one bucket and four
  // honest people would lock out the fifth. Only the site-wide limit applies.
  if (!ip) {
    if (everyone.length >= LIMITS.all.max) return "busy";
    everyone.push(now);
    return "ok";
  }
  const mine = (byIp.get(ip) ?? []).filter((t) => now - t < LIMITS.day.window);
  const recent = mine.filter((t) => now - t < LIMITS.short.window).length;
  const verdict = mine.length >= LIMITS.day.max || recent >= LIMITS.short.max ? "rate" : everyone.length >= LIMITS.all.max ? "busy" : "ok";
  if (verdict !== "ok") {
    if (mine.length) byIp.set(ip, mine);
    else byIp.delete(ip);
    return verdict;
  }
  mine.push(now);
  everyone.push(now);
  byIp.set(ip, mine);
  // Entries are only ever added here, at most 40 an hour: sweep out the ones
  // with nothing left inside a day.
  if (byIp.size > 500) for (const [k, v] of byIp) if (!v.some((t) => now - t < LIMITS.day.window)) byIp.delete(k);
  return "ok";
}

/** The connection, as the host reports it: the first X-Forwarded-For entry is
 *  the visitor when the request came through the host's CDN and proxy. It CAN
 *  be forged by the sender — which is why the limit that counts is the
 *  site-wide one. (X-Real-IP is only the fallback: behind a CDN it can be the
 *  CDN's own address, which would put every visitor in one bucket.) */
const ipOf = (req: Request) => {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "").trim().slice(0, 64);
  // This machine or a private network is the host's own proxy talking, not a
  // visitor (Next fills the header in from the socket when nothing else did).
  // Counting it would put every visitor in one bucket — so it counts as "not
  // reported", and only the site-wide limit applies.
  return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|::ffff:(127\.|10\.|192\.168\.)|f[cd][0-9a-f]{2}:|fe80:)/i.test(ip) ? "" : ip;
};

/* ------------------------------------------------------------- same origin */

function fromOurOwnPage(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = req.headers.get("origin");
  if (!origin) return site === "same-origin";
  try {
    const asked = new URL(origin).hostname;
    const ours = new URL(SITE.url).hostname;
    const served = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim().split(":")[0];
    return asked === ours || asked === `www.${ours}` || (served !== "" && asked === served);
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------- text */

/** Line endings to \n, control characters out, edges trimmed. */
const clean = (s: string) =>
  s
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

/** A path on this site, or "/". Never free text. */
const pathOf = (v: unknown) => (typeof v === "string" && /^\/[A-Za-z0-9\-/]{0,120}$/.test(v) ? v : "/");

const when = () =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }).format(new Date()) + " New York";

/* --------------------------------------------------------------------- GET */

/** Is sending switched on? Says which half is missing, and nothing else:
 *  "settings" = the four environment values; "library" = nodemailer did not
 *  load (it needs Node 20 or newer). It never connects to the mail server —
 *  an open URL that logs in to the mailbox on request would be a way to get
 *  the mailbox locked. */
export async function GET() {
  if (!config()) return json({ sending: "off", missing: "settings" });
  try {
    await import("nodemailer");
    return json({ sending: "on" });
  } catch {
    return json({ sending: "off", missing: "library" });
  }
}

/* -------------------------------------------------------------------- POST */

export async function POST(req: Request) {
  if (!fromOurOwnPage(req)) return json({ ok: false, error: "origin" }, 403);
  if (!(req.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) return json({ ok: false, error: "invalid" }, 415);

  // Measure before reading. A browser always states the length of a string
  // body; a request that does not (chunked) or states too much is not ours.
  const stated = Number(req.headers.get("content-length") ?? NaN);
  if (!Number.isInteger(stated) || stated < 2 || stated > 16_000) return json({ ok: false, error: "invalid", field: "message" }, 413);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 16_000) return json({ ok: false, error: "invalid", field: "message" }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("shape");
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "invalid" }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? clean(body.message) : "";
  if (!isEmail(email)) return json({ ok: false, error: "invalid", field: "email" }, 400);
  if (!message) return json({ ok: false, error: "invalid", field: "message" }, 400);
  if (message.length > ASK_LIMITS.message) return json({ ok: false, error: "invalid", field: "message" }, 400);

  // Bots: the unseen field filled in, or the form sent faster than typing.
  // They are told it worked.
  const elapsed = typeof body.elapsed === "number" && Number.isFinite(body.elapsed) ? body.elapsed : 0;
  if ((typeof body.hp === "string" && body.hp !== "") || elapsed < 1500) return json({ ok: true });

  const cfg = config();
  if (!cfg) return json({ ok: false, error: "off" }, 503);

  const verdict = allowed(ipOf(req), Date.now());
  if (verdict === "rate") return json({ ok: false, error: "rate" }, 429);
  if (verdict === "busy") return json({ ok: false, error: "busy" }, 503);

  // hasOwn: "constructor" or "__proto__" must not find something on the object's prototype.
  const product = typeof body.product === "string" && Object.hasOwn(BY_SLUG, body.product) ? BY_SLUG[body.product] : undefined;
  const page = pathOf(body.page);
  // The address is in the subject so two visitors never share one: mail apps
  // thread by subject, and a second question must not hide under the first.
  const subject = `Site question${product ? ` (${product.name})` : ""} from ${email}`;
  const text = [
    `From:   ${email}`,
    `About:  ${product ? `${product.name}  (${page})` : page}`,
    `Sent:   ${when()}`,
    "",
    message,
    "",
    "--",
    `Sent from the Help panel on ${new URL(SITE.url).hostname}. Reply to this email to answer: your reply goes to ${email}.`,
  ].join("\n");

  try {
    const { createTransport } = await import("nodemailer");
    const transport = createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      // Any other port starts in the clear and upgrades (STARTTLS): refuse to
      // log in if the upgrade is not offered, rather than send the password bare.
      requireTLS: cfg.port !== 465,
      auth: { user: cfg.user, pass: cfg.pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transport.sendMail({ from: { name: "DS Universe site", address: cfg.user }, to: cfg.to, replyTo: email, subject, text });
    return json({ ok: true });
  } catch (e) {
    const err = e as { code?: string; responseCode?: number };
    console.error("[ask] the mail server refused or could not be reached:", err.code ?? "unknown", err.responseCode ?? "");
    return json({ ok: false, error: "send" }, 502);
  }
}

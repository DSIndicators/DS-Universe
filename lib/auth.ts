import { cookies } from "next/headers";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { essentialsAccess, whopReady } from "./whop";
import { notifySignup } from "./notify";

/**
 * MEMBER ACCOUNTS — the LOCAL provider (localhost:3003).
 *
 * What it is: real accounts that work end to end on Tom's PC, so the whole
 * member journey can be walked and judged before launch: create a free
 * account, sign in, open the Free Vault, see the Essentials Vault locked,
 * unlock it, sign out.
 *
 *   accounts  .data/members.json on the PC; ~/ds-universe-data on Hostinger (see DIR)
 *   password  scrypt (N=16384, r=8, p=1), 16-byte salt, constant-time compare
 *   session   HttpOnly, SameSite=Lax cookie "ds_session": base64url payload
 *             + HMAC-SHA256 signature; 30 days; secret in .data/secret
 *   lockout   5 failed sign-ins per email per 15 minutes
 *
 * ONE ACCOUNT PER PERSON (Tom, 2026-10-30: "make sure it links perfectly well
 * with Whop, workflow does not complicate each other"). The DS Universe account
 * is always this record; Whop is CONNECTED to it, never a second account:
 *   - free account first (email + password), Whop later: "Connect Whop" while
 *     signed in links that Whop user to this account, whatever its email.
 *   - Whop first ("Continue with Whop", signed out): the Whop user's account is
 *     found by its link, else by the same email (the link is added), else a new
 *     account is made with no password - Whop is how it signs in.
 *   - one Whop user belongs to one account; a second claim is refused.
 * WHO OPENS THE ESSENTIALS VAULT: once Whop is on (lib/whop.ts whopReady), only
 * Whop decides, live on the server - a linked account with an active membership
 * is Essentials, anything else is free. The `plan` stored here is only the
 * local stand-in used while Whop is off (localhost preview).
 */

export type Plan = "free" | "essentials";
export type Member = {
  id: string;
  email: string;
  name?: string;
  plan: Plan;
  createdAt: string;
  /** Absent on an account opened with Whop: it signs in with Whop only. */
  salt?: string;
  hash?: string;
  /** The connected Whop user (user_...), and the email Whop gave for it. */
  whopId?: string;
  whopEmail?: string;
  /** Password reset (lib/reset.ts): sha256 of the emailed token, and when it stops working. Cleared on use. */
  resetHash?: string;
  resetExp?: number;
  /** When the password last changed; sessions started before it are signed out. */
  pwAt?: number;
};
/** `via` = how this visit signed in; `whop` = a Whop user is connected to the account. */
export type Session = { id: string; email: string; name?: string; plan: Plan; via: "local" | "whop"; whop: boolean; whopEmail?: string; hasPassword: boolean };

/**
 * WHERE ACCOUNTS LIVE. On Tom's PC: .data in the project. On Hostinger, every
 * deployment builds into a fresh hbuilds/versions/<id> folder and removes the
 * old one, so a .data inside the app would be wiped on every push (Hostinger
 * docs, Node.js file structure, read 2026-10-31). There the accounts and the
 * session secret live in the hosting account's home folder instead, outside
 * any build, and survive deployments. DS_DATA_DIR overrides both.
 */
const DIR =
  process.env.DS_DATA_DIR ||
  (process.cwd().split(path.sep).includes("hbuilds") ? path.join(os.homedir(), "ds-universe-data") : path.join(process.cwd(), ".data"));
const FILE = path.join(DIR, "members.json");
const SECRET_FILE = path.join(DIR, "secret");
export const COOKIE = "ds_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function secret(): Buffer {
  if (process.env.DS_AUTH_SECRET) return Buffer.from(process.env.DS_AUTH_SECRET);
  ensureDir();
  if (!fs.existsSync(SECRET_FILE)) fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
  return Buffer.from(fs.readFileSync(SECRET_FILE, "utf8").trim());
}

function readAll(): Member[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Member[];
  } catch {
    return [];
  }
}
function writeAll(list: Member[]) {
  ensureDir();
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, FILE);
}

export const normEmail = (e: string) => e.trim().toLowerCase();
/** Practical address check; the real proof is the confirmation Whop sends at checkout. */
export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
/**
 * PASSWORDS: at least 8 characters (Tom, 2026-10-30: "let users create
 * passwords up to 8 characters. 15 is too long"). 8 is the floor NIST SP
 * 800-63B Rev 4 sets for a password used with a second factor; for a password
 * that is the only factor NIST asks for 15. What keeps 8 sound here: no forced
 * mix of character types, a refusal list of the passwords people pick most, 5
 * tries per email per 15 minutes, and scrypt on the server. The free account
 * guards nothing paid: the Essentials Vault is opened by Whop, never by this
 * password.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
const COMMON = new Set([
  "password", "password1", "password12", "password123", "passw0rd", "12345678", "123456789", "1234567890",
  "87654321", "11111111", "00000000", "12341234", "11223344", "abcd1234", "abc12345", "qwerty12", "qwerty123",
  "qwertyuiop", "asdfghjkl", "1q2w3e4r", "1qaz2wsx", "iloveyou", "iloveyou1", "letmein1", "welcome1",
  "sunshine", "princess", "football", "baseball", "superman", "trustno1", "monkey123", "dragon12",
  "trading1", "trading123", "trader123", "ninjatrader", "ninjatrader8", "dsuniverse", "dsuniverse1",
  "futures1", "nasdaq100", "1234567890123456", "passwordpassword",
]);
/** Why a new password is refused, or null when it is fine. */
export function passwordProblem(pw: string, email: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (pw.length > PASSWORD_MAX) return `Keep it under ${PASSWORD_MAX} characters.`;
  const low = pw.toLowerCase();
  const local = normEmail(email).split("@")[0];
  const isEmailish = local.length > 3 && low.includes(local);
  if (COMMON.has(low) || /^(.)\1+$/.test(pw) || isEmailish)
    return "That one is too easy to guess. Try a phrase only you would think of.";
  return null;
}

const hashOf = (password: string, salt: string) =>
  crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex");

export function findByEmail(email: string) {
  const e = normEmail(email);
  return readAll().find((m) => m.email === e);
}
export function findById(id: string) {
  return readAll().find((m) => m.id === id);
}

export function createMember(email: string, password: string, name?: string): Member {
  const list = readAll();
  const e = normEmail(email);
  if (list.some((m) => m.email === e)) throw new Error("exists");
  const salt = crypto.randomBytes(16).toString("hex");
  const m: Member = {
    id: crypto.randomUUID(),
    email: e,
    name: name?.trim() || undefined,
    plan: "free",
    createdAt: new Date().toISOString(),
    salt,
    hash: hashOf(password, salt),
  };
  list.push(m);
  writeAll(list);
  notifySignup({ email: m.email, name: m.name, via: "email", total: list.length });
  return m;
}

/** Store (or clear) a reset token's hash on an account. */
export function setReset(id: string, hash: string | null, exp = 0) {
  const list = readAll();
  const m = list.find((x) => x.id === id);
  if (!m) return;
  if (hash) {
    m.resetHash = hash;
    m.resetExp = exp;
  } else {
    delete m.resetHash;
    delete m.resetExp;
  }
  writeAll(list);
}

/** The account a live reset token belongs to (compared in constant time), or undefined. */
export function findByReset(hash: string): Member | undefined {
  const now = Date.now();
  const want = Buffer.from(hash, "hex");
  return readAll().find((m) => {
    if (!m.resetHash || !m.resetExp || m.resetExp < now) return false;
    const got = Buffer.from(m.resetHash, "hex");
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  });
}

/** A new password: replaces the old one, uses up the reset token, signs out every other session. */
export function setPassword(id: string, password: string): Member | undefined {
  const list = readAll();
  const m = list.find((x) => x.id === id);
  if (!m) return;
  m.salt = crypto.randomBytes(16).toString("hex");
  m.hash = hashOf(password, m.salt);
  m.pwAt = Date.now();
  delete m.resetHash;
  delete m.resetExp;
  writeAll(list);
  fails.delete(m.email);
  return m;
}

export function setPlan(id: string, plan: Plan) {
  const list = readAll();
  const m = list.find((x) => x.id === id);
  if (!m) return;
  m.plan = plan;
  writeAll(list);
}

/* ---- Whop, connected to the one account ---- */
export type WhopUser = { id: string; email: string; emailVerified?: boolean; name?: string };
export type Connect = { member: Member } | { error: "whop-taken" | "email-taken" | "email-unverified" };

/**
 * Attach a Whop user to the right account (rules at the top of this file).
 * `currentId` is the account signed in when "Connect Whop" was pressed.
 */
export function connectWhop(u: WhopUser, currentId?: string): Connect {
  const list = readAll();
  const owner = list.find((m) => m.whopId === u.id);
  const email = u.email ? normEmail(u.email) : "";
  const link = (m: Member) => {
    m.whopId = u.id;
    if (email) m.whopEmail = email;
    if (!m.name && u.name) m.name = u.name.split(" ")[0];
    writeAll(list);
    return { member: m };
  };
  if (currentId) {
    const cur = list.find((m) => m.id === currentId);
    if (cur) {
      if (owner && owner.id !== cur.id) return { error: "whop-taken" };
      return link(cur);
    }
  }
  if (owner) return link(owner);
  const same = email ? list.find((m) => m.email === email) : undefined;
  if (same) {
    if (same.whopId && same.whopId !== u.id) return { error: "email-taken" };
    // Joining a Whop account to an EXISTING account by email alone is only safe when Whop has verified
    // that email; otherwise anyone could open a Whop account under someone else's address and walk in.
    if (!u.emailVerified) return { error: "email-unverified" };
    return link(same);
  }
  const m: Member = { id: crypto.randomUUID(), email, name: u.name?.split(" ")[0] || undefined, plan: "free", createdAt: new Date().toISOString() };
  list.push(m);
  const r = link(m);
  notifySignup({ email: m.email, name: m.name, via: "whop", total: list.length });
  return r;
}

/* ---- sign-in throttle (per email, in memory) ---- */
const fails = new Map<string, number[]>();
const WINDOW = 15 * 60 * 1000;
export function lockedOut(email: string) {
  const now = Date.now();
  const list = (fails.get(normEmail(email)) ?? []).filter((t) => now - t < WINDOW);
  fails.set(normEmail(email), list);
  return list.length >= 5;
}
function noteFail(email: string) {
  const k = normEmail(email);
  fails.set(k, [...(fails.get(k) ?? []), Date.now()]);
}

export function verify(email: string, password: string): Member | null {
  const m = findByEmail(email);
  // Hash even when the account does not exist (or has no password), so timing does not reveal which emails have accounts.
  const salt = m?.salt ?? "0000000000000000";
  const got = Buffer.from(hashOf(password, salt), "hex");
  const want = Buffer.from(m?.hash ?? "00".repeat(64), "hex");
  const ok = !!m?.hash && got.length === want.length && crypto.timingSafeEqual(got, want);
  if (!ok) noteFail(email);
  return ok ? m! : null;
}

/* ---- the session cookie ---- */
const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (data: string) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

type Payload = { id: string; exp: number; via?: "local" | "whop"; iat?: number };

export async function startSession(m: Pick<Member, "id">, via: "local" | "whop" = "local") {
  const payload: Payload = { id: m.id, exp: Date.now() + MAX_AGE * 1000, via, iat: Date.now() };
  const data = b64(JSON.stringify(payload));
  const jar = await cookies();
  jar.set(COOKIE, `${data}.${sign(data)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.DS_INSECURE_COOKIE !== "1",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The signed-in member, or null. Reads the member file each time, so a plan change shows at once. */
export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [data, mac] = raw.split(".");
  if (!data || !mac) return null;
  const want = Buffer.from(sign(data));
  const got = Buffer.from(mac);
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
    if (Date.now() > p.exp) return null;
    const m = findById(p.id);
    if (!m) return null;
    // A password change signs out sessions that began before it (a reset from a lost or shared device).
    if (m.pwAt && (p.iat ?? p.exp - MAX_AGE * 1000) < m.pwAt) return null;
    return {
      id: m.id, email: m.email, name: m.name, plan: await planOf(m), via: p.via === "whop" ? "whop" : "local",
      whop: !!m.whopId, whopEmail: m.whopEmail, hasPassword: !!m.hash,
    };
  } catch {
    return null;
  }
}

/**
 * Which vaults this account opens. Whop on: Whop alone decides, live (cached a
 * minute in lib/whop.ts) - a connected Whop user with an active Essentials
 * membership, or free. Whop off (localhost preview): the stored stand-in.
 */
async function planOf(m: Member): Promise<Plan> {
  if (!whopReady()) return m.plan;
  return m.whopId && (await essentialsAccess(m.whopId)) ? "essentials" : "free";
}

/** Only follow `next` to a path on this site (no open redirect). */
export const safeNext = (n: unknown, fallback = "/members") =>
  typeof n === "string" && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : fallback;

/** The local preview switch ("view as an Essentials member") exists only when the launcher sets DS_LOCAL_PREVIEW=1. */
export const localPreview = () => process.env.DS_LOCAL_PREVIEW === "1" && !whopReady();

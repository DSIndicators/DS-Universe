"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  EMAIL_RE, createMember, endSession, findByEmail, getSession, localPreview, lockedOut, passwordProblem, safeNext, setPassword, setPlan, startSession, verify,
} from "@/lib/auth";
import { accountForToken, requestReset } from "@/lib/reset";
import { originOfHeaders } from "@/lib/origin";

export type FormState = { error?: string; field?: "email" | "password" | "name"; email?: string; name?: string } | undefined;

/** Create a free account. Asks for two things; the name is optional. */
export async function join(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const name = String(fd.get("name") ?? "").trim().slice(0, 60);
  const vault = String(fd.get("vault") ?? "");
  const keep = { email, name };
  if (!EMAIL_RE.test(email)) return { ...keep, field: "email", error: "That email does not look complete. Check for a missing @ or dot." };
  const existing = findByEmail(email);
  if (existing)
    return {
      ...keep,
      field: "email",
      error: existing.hash
        ? "There is already an account for this email. Sign in instead, it takes a second."
        : "This email already has an account, opened with Whop. Sign in with Continue with Whop.",
    };
  const problem = passwordProblem(password, email);
  if (problem) return { ...keep, field: "password", error: problem };
  const m = createMember(email, password, name);
  await startSession(m);
  redirect(vault === "essentials" ? "/members/unlock?welcome=1" : safeNext(fd.get("next"), "/members?welcome=1"));
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!EMAIL_RE.test(email)) return { email, field: "email", error: "Enter the email you joined with." };
  if (lockedOut(email)) return { email, error: "Too many tries for this email. Wait fifteen minutes, or write to support@dsuniverse.net and we will help." };
  const m = verify(email, password);
  if (!m) {
    if (findByEmail(email) && !findByEmail(email)?.hash)
      return { email, field: "email", error: "This account was opened with Whop. Use Continue with Whop above." };
    return { email, field: "password", error: "That email and password do not match. Check for a typo, or create a free account." };
  }
  await startSession(m);
  redirect(safeNext(fd.get("next")));
}

export type ForgotState = { sent?: boolean; error?: string; email?: string } | undefined;

/** Ask for a reset link. The answer is the same whether or not the email has an account. */
export async function forgot(_: ForgotState, fd: FormData): Promise<ForgotState> {
  const email = String(fd.get("email") ?? "").trim();
  if (!EMAIL_RE.test(email)) return { email, error: "That email does not look complete. Check for a missing @ or dot." };
  requestReset(email, originOfHeaders(await headers()));
  return { sent: true, email };
}

export type ResetState = { error?: string; expired?: boolean } | undefined;

/** Choose a new password from a reset link, then sign straight in. */
export async function resetPassword(_: ResetState, fd: FormData): Promise<ResetState> {
  const m = accountForToken(fd.get("token"));
  if (!m) return { expired: true, error: "This link has expired or has already been used. Ask for a new one below." };
  const password = String(fd.get("password") ?? "");
  const problem = passwordProblem(password, m.email);
  if (problem) return { error: problem };
  const done = setPassword(m.id, password);
  if (!done) return { expired: true, error: "This link has expired or has already been used. Ask for a new one below." };
  await startSession(done);
  redirect("/members?reset=1");
}

export async function signOut() {
  await endSession();
  redirect("/?signed-out=1");
}

/**
 * LOCAL PREVIEW ONLY: switch the signed-in account between Free and
 * Essentials, so the members area can be seen both ways on localhost:3003.
 * Refused unless the launcher set DS_LOCAL_PREVIEW=1. On the live site the
 * vault comes from Whop (lib/whop.ts) and this does nothing.
 */
export async function previewPlan(fd: FormData) {
  if (!localPreview()) return;
  const s = await getSession();
  if (!s) return;
  setPlan(s.id, fd.get("plan") === "essentials" ? "essentials" : "free");
  redirect(safeNext(fd.get("back"), "/members"));
}

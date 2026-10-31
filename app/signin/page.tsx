import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/AuthForms";
import { AuthSide } from "@/components/AuthSide";
import { getSession } from "@/lib/auth";
import { whopReady } from "@/lib/whop";

export const metadata: Metadata = { title: "Sign in" };

const ERR: Record<string, string> = {
  whop: "Whop could not sign you in just now. Try again, or sign in with your email.",
  "email-taken": "That email is already connected to a different Whop account. Sign in with your email and password, or write to support@dsuniverse.net.",
  "email-unverified": "There is already an account for this email, and Whop has not verified the email yet. Sign in with your email and password, then connect Whop from your account page.",
  "whop-taken": "That Whop account is already connected to a different DS Universe account. Write to support@dsuniverse.net and we will sort it out.",
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  if (await getSession()) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/members");
  return (
    <div className="auth">
      <AuthSide />
      <div className="auth-main">
        <div style={{ width: "100%", maxWidth: 400 }}>
          {error && ERR[error] && (
            <p className="form-err" role="alert" style={{ marginBottom: 18 }}>
              {ERR[error]}
            </p>
          )}
          <SignInForm next={next} whop={whopReady()} />
        </div>
      </div>
    </div>
  );
}

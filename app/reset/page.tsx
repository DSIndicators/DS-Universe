import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/AuthForms";
import { AuthSide } from "@/components/AuthSide";
import { PASSWORD_MIN } from "@/lib/auth";
import { accountForToken } from "@/lib/reset";

// The link's token is in the address: never send it on to another site.
export const metadata: Metadata = { title: "Choose a new password", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const m = accountForToken(token);
  return (
    <div className="auth">
      <AuthSide />
      <div className="auth-main">
        {m && token ? (
          <ResetForm token={token} email={m.email} min={PASSWORD_MIN} />
        ) : (
          <div className="auth-form">
            <div className="stack-s">
              <h1 className="d2">This link has expired.</h1>
              <p className="body">Reset links work once, for 30 minutes. Ask for a new one and use the newest email.</p>
            </div>
            <Link className="btn btn-wide" href="/forgot">
              Send a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

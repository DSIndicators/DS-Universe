import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotForm } from "@/components/AuthForms";
import { AuthSide } from "@/components/AuthSide";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Forgot your password", robots: { index: false } };

export default async function ForgotPage() {
  if (await getSession()) redirect("/members/account");
  return (
    <div className="auth">
      <AuthSide />
      <div className="auth-main">
        <ForgotForm />
      </div>
    </div>
  );
}

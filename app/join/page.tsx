import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JoinForm } from "@/components/AuthForms";
import { AuthSide } from "@/components/AuthSide";
import { PASSWORD_MIN, getSession } from "@/lib/auth";
import { whopReady } from "@/lib/whop";

export const metadata: Metadata = { title: "Join free" };

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ vault?: string; next?: string }> }) {
  const { vault, next } = await searchParams;
  if (await getSession()) redirect(vault === "essentials" ? "/members/unlock" : "/members");
  return (
    <div className="auth">
      <AuthSide essentials={vault === "essentials"} />
      <div className="auth-main">
        <JoinForm vault={vault} next={next} min={PASSWORD_MIN} whop={whopReady()} />
      </div>
    </div>
  );
}

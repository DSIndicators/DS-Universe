import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { MemberNav } from "@/components/MemberNav";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Your vault", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Everything under /members needs a signed-in member; the check runs on the server for every request. */
export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) {
    const path = (await headers()).get("x-ds-path") || "/members";
    redirect(`/signin?next=${encodeURIComponent(path)}`);
  }
  const first = s.name?.split(" ")[0] || s.email.split("@")[0];
  return (
    <div className="wrap mem">
      <MemberNav first={first} email={s.email} essentials={s.plan === "essentials"} />
      <div className="mem-main">{children}</div>
    </div>
  );
}

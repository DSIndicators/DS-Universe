import { notFound } from "next/navigation";
import { ReplayLab } from "./ReplayLab";

export const metadata = { title: "DS Replay lab", robots: { index: false, follow: false } };

/** The DS Replay test bench: every study on every session. Local preview only — a production build answers 404. */
export default function Page({ searchParams }: { searchParams: Promise<{ s?: string; d?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <ReplayLab searchParams={searchParams} />;
}

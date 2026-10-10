"use client";
import { use } from "react";
import { Engine } from "@/components/engine/Engine";
import { STUDY } from "@/content/engine";
import { EXAMPLES } from "@/content/examples";

/** Internal test bench (404 in production): /replay-lab?s=<slug> */
export function ReplayLab({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const sp = use(searchParams);
  const slug = sp.s ?? "oracle";
  const load = STUDY[slug], ex = EXAMPLES[slug];
  if (!load || !ex?.length) return <p className="wrap py-10">No examples for {slug}</p>;
  return (
    <section className="wrap py-10">
      <p className="label">Lab · {slug}</p>
      <div className="mt-6"><Engine key={slug} load={load} examples={ex} productName={slug} /></div>
    </section>
  );
}

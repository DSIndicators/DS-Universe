"use client";

import { Engine } from "@/components/engine/Engine";
import { STUDY } from "@/content/engine";
import { EXAMPLES } from "@/content/examples";

/** A product page's DS Replay — mounted by ProductPage inside ui/Defer, so nothing loads until it is near. */
export function ProductReplay({ slug, name }: { slug: string; name: string }) {
  const load = STUDY[slug], ex = EXAMPLES[slug];
  if (!load || !ex?.length) return null;
  return <Engine load={load} examples={ex} productName={name} />;
}

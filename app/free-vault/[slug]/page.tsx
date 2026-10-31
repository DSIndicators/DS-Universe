import type { Metadata } from "next";
import { ProductPage } from "@/components/ProductPage";
import { BY_SLUG } from "@/content/products";
import { lineFor } from "@/components/Tile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = BY_SLUG[(await params).slug];
  return p ? { title: p.name, description: lineFor(p) } : {};
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ProductPage slug={(await params).slug} vault="free" />;
}

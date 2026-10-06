import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage, productMetadata } from "@/components/ProductPage";
import { VAULT_PRODUCTS } from "@/content/release";

/**
 * /free-vault/<slug> — a free product's own page, under the Free Vault
 * (2026-10-05). The page itself is components/ProductPage.tsx, the same one
 * the store's products use. Only vault products exist here; anything else 404s.
 */
type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return VAULT_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  return VAULT_PRODUCTS.some((p) => p.slug === slug) ? productMetadata(slug) : {};
}

export default async function VaultProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  if (!VAULT_PRODUCTS.some((p) => p.slug === slug)) notFound();
  return <ProductPage slug={slug} />;
}

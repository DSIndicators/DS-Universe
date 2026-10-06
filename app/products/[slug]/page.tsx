import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ProductPage, productMetadata } from "@/components/ProductPage";
import { isVault } from "@/content/products";
import { STORE_PRODUCTS, productHref } from "@/content/release";

/**
 * /products/<slug> — a product in the store (and DS ASL and DS Toolkit, which
 * come free with DS Complete). The page itself is components/ProductPage.tsx.
 *
 * A FREE product does not live here any more (2026-10-05): its page is
 * /free-vault/<slug>. The five that were on the site before forward by name in
 * next.config.mjs; the check below sends any other vault slug the same way, so
 * a free product can never be served from a store address. (DS Toolkit went
 * the other way on 2026-10-05: /free-vault/toolkit forwards here.)
 */
type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return STORE_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  return STORE_PRODUCTS.some((p) => p.slug === slug) ? productMetadata(slug) : {};
}

export default async function StoreProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  if (isVault(slug)) permanentRedirect(productHref(slug));
  if (!STORE_PRODUCTS.some((p) => p.slug === slug)) notFound();
  return <ProductPage slug={slug} />;
}

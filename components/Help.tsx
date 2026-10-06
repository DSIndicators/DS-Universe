import { FAQ } from "@/content/faq";
import { marketsFor } from "@/content/markets";
import { WITH_BUNDLE, isPaid, money, priceFor } from "@/content/pricing";
import { PRODUCTS } from "@/content/products";
import { SITE } from "@/content/site";
import { TRIAL, hasTrial } from "@/content/trial";
import { HelpPanel, type HelpProduct } from "@/components/HelpPanel";

/**
 * The Help marker, mounted once in app/layout.tsx so it is on every page and
 * keeps a half-written question while the visitor moves between pages.
 *
 * This half runs on the SERVER. It reads the catalogue, the prices, the
 * markets and the trial and hands the panel a few short lines per product —
 * so the browser is sent about a hundred bytes a product, not the catalogue's
 * long descriptions, and every figure in the panel is the one the product page
 * shows (content/pricing.ts, content/markets.ts, content/trial.ts).
 * The questions are content/faq.ts, the same list the store page renders.
 */
export function Help() {
  const products: Record<string, HelpProduct> = Object.fromEntries(
    PRODUCTS.map((p) => {
      const price = priceFor(p.slug);
      return [
        p.slug,
        {
          name: p.name,
          price: price?.free ? "Free" : price?.withComplete ? `${WITH_BUNDLE.label} · ${WITH_BUNDLE.short.toLowerCase()}` : isPaid(price) ? `${money(price.now)}, one payment` : "",
          runs: marketsFor(p.slug)?.headline ?? "",
          trial: hasTrial(p.slug) ? TRIAL.label : "",
        },
      ];
    }),
  );
  const faq = FAQ.map((f) => ({ q: f.q, a: f.a, link: f.link }));
  return <HelpPanel faq={faq} products={products} email={SITE.email} platform={`${SITE.platform} · ${SITE.minBuild} or newer`} />;
}

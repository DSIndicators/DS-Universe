import { FAQ } from "@/content/faq";
import { site } from "@/content/links";
import { marketsFor } from "@/content/markets";
import { COMPLETE_HREF } from "@/content/links";
import { IN_COMPLETE_LABEL, PRICE_MONTHLY, PRICE_OWN, priceFor } from "@/content/pricing";
import { PRODUCTS } from "@/content/products";
import { SITE } from "@/content/site";
import { TRIAL, hasTrial } from "@/content/trial";
import { HelpPanel, type HelpProduct } from "@/components/HelpPanel";

/**
 * The Help marker, from the live site (DS-Universe-3 components/Help.tsx,
 * ported 2026-10-27 at Tom's request: "implement our HELP tab that's currently
 * on our current website"). Mounted once in app/layout.tsx so it is on every
 * page and keeps a half-written question while the visitor moves between pages.
 *
 * This half runs on the SERVER. It reads the catalogue, the prices, the
 * markets and the trial and hands the panel a few short lines per product, so
 * every figure in the panel is the one the product page shows. The questions
 * are content/faq.ts, the same list the store page renders. One change from
 * the live file: links go through site() (content/links.ts), so a page this
 * site does not have yet (/contact) opens on dsuniverse.net. v3.1: a paid
 * product's price is DS Complete's, and its trial is DS Complete's 7 days.
 */
export function Help() {
  const products: Record<string, HelpProduct> = Object.fromEntries(
    PRODUCTS.map((p) => {
      const price = priceFor(p.slug);
      return [
        p.slug,
        {
          name: p.name,
          price: price?.free ? "Free · no license" : `${IN_COMPLETE_LABEL} · ${PRICE_MONTHLY} or ${PRICE_OWN}`,
          runs: marketsFor(p.slug)?.headline ?? "",
          trial: hasTrial(p.slug) ? `${TRIAL.label} in ${TRIAL.on}` : "",
          trialHref: COMPLETE_HREF,
        },
      ];
    }),
  );
  const faq = FAQ.map((f) => ({ q: f.q, a: f.a, link: f.link ? { href: site(f.link.href), label: f.link.label } : undefined }));
  return <HelpPanel faq={faq} products={products} email={SITE.email} platform={`${SITE.platform} · ${SITE.minBuild} or newer`} />;
}

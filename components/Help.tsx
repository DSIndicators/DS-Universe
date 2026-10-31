import { HelpPanel, type HelpProduct } from "@/components/HelpPanel";
import { FAQ } from "@/content/faq";
import { PRODUCTS } from "@/content/products";
import { SITE } from "@/content/site";
import { ESSENTIALS, PRICE_MONTHLY, isFree } from "@/content/vaults";

/**
 * HELP, on every page (2026-10-31, Tom: "the HELP box disappeared, please create one for us, i want it
 * horizontal this time, not vertical. longer and noticeable but elegant"). The panel is the white
 * site's (components/HelpPanel.tsx, same behaviour line for line); the marker is now a horizontal bar.
 * This half runs on the server: a product page's own facts and the site's questions (content/faq.ts,
 * the same list /how-it-works shows), so the panel never says anything the pages do not.
 */
export function Help() {
  const products: Record<string, HelpProduct> = Object.fromEntries(
    PRODUCTS.map((p) => [
      p.slug,
      { name: p.name, price: isFree(p) ? "Free, no license" : `In the ${ESSENTIALS.name} · ${PRICE_MONTHLY}`, runs: "", trial: "", trialHref: "" },
    ]),
  );
  const faq = FAQ.map((f) => ({ q: f.q, a: f.a.join(" ") }));
  return <HelpPanel faq={faq} products={products} email={SITE.email} platform={`${SITE.platform} · ${SITE.minBuild} or newer`} />;
}

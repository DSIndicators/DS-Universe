/**
 * The page words the live site (DS-Universe-3) keeps inside its page files
 * rather than its content files, COPIED VERBATIM so the white site's /products,
 * /free-vault and product pages say exactly what dsuniverse.net says. Where
 * each line comes from is noted beside it; change the live page and this
 * together.
 */
export const STORE_PAGE = {
  // DS-Universe-3 app/products/page.tsx
  label: "Products & pricing",
  title: "Every tool, one question each.",
  // v3.1 (2026-10-29): free and affordable — the store is DS Complete, at the
  // founders price, and the Free Vault beside it.
  lede: "Free and affordable. Every paid DS tool comes in one low-priced bundle, DS Complete, on one license, and every free tool stays free in the Free Vault.",
  metaTitle: "Products & pricing",
  metaDescription:
    "The DS Universe store for NinjaTrader 8: every paid DS tool in DS Complete on one license, at the founders price, with a 7-day free trial, and the Free Vault of free tools.",
  faqLink: "Questions before you buy",
  faqAfter: "checkout, download and license",
  // DS-Universe-3 components/BeforeYouBuy.tsx
  terms: "One license. One low price.",
  beforeLabel: "Before you buy",
  beforeTitle: "What happens when you buy.",
} as const;

export const VAULT_PAGE = {
  // DS-Universe-3 app/free-vault/page.tsx
  metaDescription:
    "The Free Vault: free DS Universe indicators and tools for NinjaTrader 8. Each one is its own download, free permanently — not a trial and not a stripped build.",
  freeMark: "Free · permanently",
  howLabel: "How it works",
  howTitle: "Free, with nothing to switch on.",
  storeLabel: "The store",
} as const;

export const PRODUCT_PAGE = {
  // DS-Universe-3 components/ProductPage.tsx
  why: "Why you need it",
  get: "What you get",
  how: "How it works",
  ask: "Ask a question",
  beforeLabel: "Before you buy",
  beforeTitle: "What it needs, where it runs, and what it is not.",
  runs: "Where it runs",
  reads: "What it reads",
  readsFallback: "The chart's own bars.",
  runsLocal: "Everything runs on your machine, on your own data feed.",
  know: "Good to know",
  license: {
    complete: "In DS Complete · one license for every paid DS tool",
    free: "Free, permanently · no license needed",
  },
  more: { vault: "More in the vault", series: "Also in DS Complete" },
  all: { vault: "The whole vault", store: "Every product" },
} as const;

# DS Universe — website (v3, "clean")

The sleek, minimal DS Universe site. Next.js 15 (App Router) + Tailwind 3.4. One other runtime
dependency: `nodemailer`, which sends a Help-panel question to the support mailbox. Fonts are self-hosted (Outfit for display, Inter for body — SIL OFL, in `app/fonts`).

## Run it locally

Double-click **`START 3 PREVIEW (localhost 3000).bat`** in the folder above this one, then open
<http://localhost:3000>. First run installs `node_modules` (a minute or two). Nothing is pushed.

Manual: `npm install` → `npm run dev`. Production check: `npm run build && npm start`.

## Where things are

| Thing | File |
|---|---|
| Every line of site copy (hero, about, principles, facts, closing, disclosure) | `content/site.ts` |
| The catalogue — generated from the Master Product & Pricing Sheet (which series each product is in decides where it lives) | `content/products.ts` |
| Where each series is shelved: the store (`/products`), DS Complete, or the Free Vault — and every product's address (`productHref`) | `content/release.ts` |
| Every price, DS Complete, and the products that come free with it and are not sold on their own (DS ASL, DS Toolkit — `BUNDLED`, `WITH_BUNDLE`) | `content/pricing.ts` |
| The Free Vault: its words | `content/vault.ts` → `components/Vault.tsx`, `app/free-vault/` |
| A product's page (one component, two addresses: `/products/<slug>` and `/free-vault/<slug>`) | `components/ProductPage.tsx` |
| Buy links, and the products whose Whop listing does not exist yet (`PENDING_LISTING`) | `content/whop.ts` |
| Old addresses that forward (renamed products, free products moved to the vault, DS Toolkit moved back out of it) | `next.config.mjs` → `redirects()` |
| The hero monitor's screen (image or mp4) | `content/site.ts` → `MONITOR` |
| Home-page catalogue heading/sub (every product is listed, as rows) | `content/site.ts` → `CATALOGUE` |
| Chart stills, 16:9 webp, one per indicator | `public/covers/<slug>.webp` |
| Which markets each product is built on and runs on (generated from the sheet's Markets tab) | `content/markets.ts` → `components/Markets.tsx`, the last fact on every product page |
| The Help marker (bottom right of every page): its words | `content/help.ts` — the questions are `content/faq.ts`, the same list the store shows |
| The Help marker: how it looks and behaves | `components/Help.tsx` (server half) → `components/HelpPanel.tsx`; opened from elsewhere with `components/AskButton.tsx` |
| Where a Help question is sent, and everything it refuses | `app/api/ask/route.ts` — see "Help: sending questions" below |
| Terms & Conditions | `content/terms.ts` |
| The 3-day free trial — its words and its on/off switch (`TRIAL.active`) | `content/trial.ts` |
| The trial checkout links (a product is in the trial only if it has one) | `content/whop.ts` → `trial` |
| Every place the trial shows (hero note, home band, tiles, product pages, `/trial`) | `components/Trial.tsx` |
| The logo badge (astronaut disc) — navbar, footer, favicon ONLY; add-on tiles keep the ring placeholder | `public/brand/badge-*.png`, `components/ui/Badge.tsx` (ring placeholder: `Mark.tsx`) |
| Design tokens (colours, type, shadows) | `tailwind.config.ts`, `app/globals.css` |

## Help: sending questions

A question typed into the Help panel is emailed to the support mailbox through that mailbox's own
SMTP server, with the visitor's address as Reply-To. The four settings are read from the
**environment** — never from this repository, which is public:

| Name | Value |
|---|---|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `support@dsuniverse.net` (the full address) |
| `SMTP_PASS` | that mailbox's password |
| `ASK_TO` | optional — where questions land; defaults to `SMTP_USER` |

Hostinger: website dashboard → **Environment variables** → add them → save (saving redeploys).
`/api/ask` in a browser answers `{"sending":"on"}` once they are in place — that proves the settings
are there, not that the password is right, so **send yourself one question from the site** and see it
arrive. The app needs Node 20 or newer (a Hostinger setting) for the mail library. Until then — and any time
the mail server says no — the panel keeps the visitor's message and offers it in their own mail app,
so nobody is left without a way to ask. Local preview has no settings, so it shows that fallback.

## Rules this site follows

- **No product counts anywhere.** The lineup changes; the site never says "14 indicators".
- **Every number comes from `content/pricing.ts`.** Nothing else types a price, and the build stops
  if the paid products no longer sum to DS Complete's struck-through figure.
- **Paid and free are kept apart (2026-10-05).** The store (`/products`) and DS Complete hold paid
  products only. Every free product is in the Free Vault (`/free-vault`), each on its own page
  under it; `content/pricing.ts` stops the build if a free product is outside the vault or a vault
  product is not free, and the DS Complete chart cannot draw a product that is not in DS Complete.
- **Free with DS Complete (2026-10-05).** DS ASL and DS Toolkit are not sold or offered on their
  own: each comes free with DS Complete. One label everywhere — "Free with DS Complete" — and one
  sentence — "comes free with DS Complete and is not sold on its own" — both from
  `content/pricing.ts` (`WITH_BUNDLE`); the products are listed in `BUNDLED`. Their pages are
  `/products/asl` and `/products/toolkit`, and every button on them buys DS Complete. The build
  stops if such a product is given a Whop listing, is priced any other way, or sits in any series
  but `exclusive` — and `content/whop.ts` refuses DS Toolkit's retired free plan and listing.
- **Product copy comes from the sheet.** `purpose` (one line) → lists. `hooks` (four) + `helps`
  (one paragraph) → product page. `description` is kept in the data but **not rendered**.
- **No performance claims, no guarantees.** The disclosure block is in the footer and on every
  product page.
- **A new picture gets a new filename.** Assets are cached for a year.

## Adding, removing or renaming a product

1. Change the Master Product & Pricing Sheet, then regenerate the three sheet-driven files:
   `content/products.ts`, `content/listing-copy.ts`, `content/markets.ts` (`python3 tools/gen_site_content.py <sheet.xlsx> <out-folder>`
   writes the three bodies to paste in; slugs and series keys are in its first lines).
2. Give it a price in `content/pricing.ts` and a box in `content/release.ts` → `BOXART` (covers are
   made by `LOCAL3001 Picture Updates\Cover system 2026-10-04\build.py`, into a NEW folder under
   `public/boxart`).
3. Give it its Whop listing in `content/whop.ts` — or list it in `PENDING_LISTING` until the
   listing exists. **A production build refuses to run while anything is pending**;
   `DS_PREVIEW_BUILD=1 npm run build` builds anyway, for looking only.
4. A paid product also needs its layer on the DS Complete chart (`content/complete-chart.ts` says
   which is missing); an indicator in DS Complete gets its switch on the drawn DS Toolkit rail by
   itself (`RAIL_ROWS`). A renamed or moved product needs its old address in `next.config.mjs`.
5. Pictures are optional and per product: `content/charts.ts` (on the chart), `content/shots.ts`
   (product-guide boards), `content/showcase.ts` (the recording).

## Swapping in the "charts in action" recording

Put the mp4 in `public/covers/`, then in `content/site.ts` set
`MONITOR = { kind: "video", src: "/covers/your-clip.mp4", poster: "/covers/oracle.webp", ... }`.
The monitor plays it muted, looped, inline.

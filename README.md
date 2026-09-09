# DS Universe — website (v3, "clean")

The sleek, minimal DS Universe site. Next.js 15 (App Router) + Tailwind 3.4. No other runtime
dependencies. Fonts are self-hosted (Outfit for display, Inter for body — SIL OFL, in `app/fonts`).

## Run it locally

Double-click **`START 3 PREVIEW (localhost 3000).bat`** in the folder above this one, then open
<http://localhost:3000>. First run installs `node_modules` (a minute or two). Nothing is pushed.

Manual: `npm install` → `npm run dev`. Production check: `npm run build && npm start`.

## Where things are

| Thing | File |
|---|---|
| Every line of site copy (hero, about, principles, facts, closing, disclosure) | `content/site.ts` |
| The catalogue — generated from the Product Information Sheet | `content/products.ts` |
| The hero monitor's screen (image or mp4) | `content/site.ts` → `MONITOR` |
| Home-page catalogue heading/sub (every product is listed, as rows) | `content/site.ts` → `CATALOGUE` |
| The storefront link behind every "Get access" | `content/site.ts` → `SITE.storeUrl` |
| Chart stills, 16:9 webp, one per indicator | `public/covers/<slug>.webp` |
| Terms & Conditions | `content/terms.ts` |
| The logo badge (astronaut disc) — navbar, footer, favicon ONLY; add-on tiles keep the ring placeholder | `public/brand/badge-*.png`, `components/ui/Badge.tsx` (ring placeholder: `Mark.tsx`) |
| Design tokens (colours, type, shadows) | `tailwind.config.ts`, `app/globals.css` |

## Rules this site follows

- **No product counts anywhere.** The lineup changes; the site never says "14 indicators".
- **No prices.** Every "Get access" goes to `SITE.storeUrl`.
- **Product copy comes from the sheet.** `purpose` (one line) → lists. `hooks` (four) + `helps`
  (one paragraph) → product page. `description` is kept in the data but **not rendered**.
- **No performance claims, no guarantees.** The disclosure block is in the footer and on every
  product page.

## Adding, removing or renaming a product

Edit `content/products.ts` (or regenerate it from the sheet). For an indicator, drop a
1920×1080 still at `public/covers/<slug>.webp`. Add-ons have `cover: null` and get a quiet
typographic tile. Nothing else needs touching — routes, cards and "more" rails follow the data.

## Swapping in the "charts in action" recording

Put the mp4 in `public/covers/`, then in `content/site.ts` set
`MONITOR = { kind: "video", src: "/covers/your-clip.mp4", poster: "/covers/oracle.webp", ... }`.
The monitor plays it muted, looped, inline.

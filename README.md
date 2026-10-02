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
| The catalogue — generated from the Product Information Sheet | `content/products.ts` |
| The hero monitor's screen (image or mp4) | `content/site.ts` → `MONITOR` |
| Home-page catalogue heading/sub (every product is listed, as rows) | `content/site.ts` → `CATALOGUE` |
| The storefront link behind every "Get access" | `content/site.ts` → `SITE.storeUrl` |
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

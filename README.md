# DS Universe — Marketing Site

A premium, deep-space marketing site for **DS Universe**, a suite of intraday
futures indicators for **MNQ / MES**. _Intraday Futures Intelligence — Precision
from Orbit._

Built with **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion ·
lucide-react**. Dark theme only, glassmorphism, aurora gradients, fully responsive
and accessible.

## Getting started

```bash
npm install
npm run dev      # → http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Project structure

```
app/
  layout.tsx        # fonts (Poppins + JetBrains Mono), metadata, SEO, <body> bg
  page.tsx          # assembles all sections
  globals.css       # brand tokens, aurora gradients, glass utilities, starfield/noise
components/
  Navbar · Hero · Indicators · Registry · Features · HowItWorks · Pricing · CTASection · Footer
  ui/               # GlassCard, GlowButton, SectionHeading, Eyebrow, Reveal, Planet, cn
  data/products.ts  # all nine indicators + copy (single source of truth)
public/brand/
  emblem.png        # square planet logo (nav, footer, favicon)
  banner.png        # wide aurora banner (hero backdrop, Open Graph image)
```

## The indicators

Nine instruments across two suites (copy lifted from the official brochures):

- **DS Radars** — `PILOTS` · `SWEEPER` · `EVERGUARD`
- **DS Systems** — `ORBIT` · `STARS` · `BALANCE` · `EMBER` · `COUNCIL` · `PULSE`

> The original build prompt listed six placeholder products. The real lineup
> (nine, in two suites) and all marketing copy were sourced from
> `DS_Radars_Brochure.pdf` and `DS_Systems_Brochure_1.pdf`.

## Replacing brand assets

Both images live in [`public/brand/`](public/brand). Swap the files (keep the
names) to rebrand:

| File | Where it's used |
|------|-----------------|
| `emblem.png` | Navbar logo, footer logo, favicon (`app/layout.tsx`) |
| `banner.png` | Hero atmospheric backdrop, Open Graph / Twitter card |

The hero's animated planet is **pure CSS** (`components/ui/Planet.tsx`) and is
derived from the emblem's aurora palette — no raster needed.

## Replacing product copy

Edit **one file**: [`components/data/products.ts`](components/data/products.ts).
Each entry drives a card in the Indicators grid (name, codename, tagline,
description, icon, glow). Icons are [lucide-react](https://lucide.dev) names,
resolved in `components/Indicators.tsx`.

- `PULSE` currently uses expanded copy — there is no dedicated PULSE brochure
  page yet. Marked with a `// TODO` in the data file.
- Pricing tiers/prices in `components/Pricing.tsx` are placeholders
  (`// TODO: confirm final tiers`).

## Brand tokens

Colors, gradients and the glass/glow utilities are defined in
[`tailwind.config.ts`](tailwind.config.ts) and the `:root` of
[`app/globals.css`](app/globals.css). The two signature gradients:

- `--aurora` — the planet, abstracted (amber/peach core → magenta/violet body → cyan rim)
- `--hero-veil` — legibility vignette over the hero

## Accessibility & performance

- Semantic HTML, alt text, `focus-visible` teal rings, AA-minded contrast.
- `prefers-reduced-motion` honored (ambient + entrance animations collapse).
- `next/image` for the emblem and banner; `next/font` self-hosts the fonts (no FOUT).
- Below-the-fold sections animate in on scroll; no layout shift.

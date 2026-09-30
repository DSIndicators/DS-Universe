import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { COVER_RATIO, boxartFor } from "@/content/release";
import {
  TRIAL,
  keepPrice,
  startsWhen,
  trialHref,
  trialNames,
  trialProducts,
  trialSteps,
  trialTerms,
} from "@/content/trial";
import type { Product } from "@/content/products";

/**
 * THE 3-DAY FREE TRIAL on the page (2026-09-29). Every word and the switch
 * live in content/trial.ts; the links in content/whop.ts. Everything here
 * renders nothing when the trial is off, so no page needs a second edit.
 *
 * THE SYSTEM, so it reads as part of the site rather than a banner bolted on:
 *   · ONE COLOUR. Gold is money on this site; the trial is bull teal — the
 *     house colour for "on your chart, now" (hero status light, bull ticks).
 *     It is used as a hairline, a tint, small type and the mark. Never a fill
 *     behind a button, never a glow.
 *   · ONE MARK. Three candles, rising — one for each day. Drawn on whole
 *     pixels so it is crisp at 12px.
 *   · ONE PHRASE. "3-day free trial", set in the instrument voice (mono, small
 *     caps), the way the site labels prices and series.
 *   · THE CONDITIONS TRAVEL WITH THE WORD "FREE" (16 CFR 251.1(c)): wherever
 *     the offer is made, "no card" and when it ends sit in the same line.
 *
 * WHERE IT APPEARS — each placement answers a different moment:
 *   home hero            TrialHeroNote   first screen: that it exists
 *   home, before lineup  TrialBand       the offer in full: tiles, terms, steps
 *   shelf tiles          BoxCard         which boxes carry it (a legend line)
 *   price list rows      PriceList       a direct link, row by row
 *   /products head       TrialStoreNote  the store's first screen
 *   product page head    TrialHead       the first action on the page
 *   product price card   TrialStrip      at the moment of deciding to pay
 *   "Test it first"      TrialTestNote   how to spend the three days well
 *   /trial               the whole thing, shareable as one URL
 */

/** Three candles, rising. One per day. */
export function TrialMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 15 12" width="15" height="12" className={`shrink-0 ${className}`} fill="currentColor" aria-hidden="true">
      <rect x="1" y="5" width="1" height="6" />
      <rect x="0" y="6" width="3" height="4" />
      <rect x="7" y="3" width="1" height="6" />
      <rect x="6" y="4" width="3" height="4" />
      <rect x="13" y="0" width="1" height="7" />
      <rect x="12" y="1" width="3" height="5" />
    </svg>
  );
}

/** The mark and the phrase, in the instrument voice. */
export function TrialLabel({ className = "", text = TRIAL.label }: { className?: string; text?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-bull-text ${className}`}>
      <TrialMark />
      {text}
    </span>
  );
}

export function External({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 opacity-70 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5 7 9" />
    </svg>
  );
}

/** The trial checkout button. Renders nothing for a product without a trial. */
export function TrialButton({
  slug,
  variant = "primary",
  className = "",
}: {
  slug: string;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const href = trialHref(slug);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener" className={`${variant === "primary" ? "btn-primary" : "btn-ghost"} ${className}`}>
      {TRIAL.cta}
      <External />
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Home                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Under the hero's buttons: that the trial exists, whose it is, and its one
 * condition, as one link down to the band. A hairline above it, no box — it
 * belongs to the hero's column, not on top of it.
 */
export function TrialHeroNote({ className = "", style }: { className?: string; style?: CSSProperties }) {
  if (!trialProducts().length) return null;
  return (
    <a href="#trial" className={`group block max-w-md border-t border-line pt-5 ${className}`} style={style}>
      <TrialLabel />
      <span className="mt-2 block text-[13.5px] leading-relaxed text-slate text-pretty">
        {trialNames()} — the full product on your own charts. No card, nothing charged when it ends.{" "}
        <span className="whitespace-nowrap text-ink underline decoration-bull/60 underline-offset-4 transition-colors group-hover:decoration-bull-text">
          How it works
        </span>
      </span>
    </a>
  );
}

/**
 * THE BAND — the offer in full, on the home page directly before the lineup.
 * A panel built like the series panels (so it reads as part of the store),
 * edged in teal instead of gold (so it does not read as a price).
 *
 * Head: what it is on the left, the terms on the right as a spec sheet.
 * Body: the trial products on the SAME five-column grid as the shelves, so
 * every box is exactly the size it is on its own shelf, and the three steps
 * in the columns that are left.
 */
export function TrialBand({ className = "" }: { className?: string }) {
  const ps = trialProducts();
  if (!ps.length) return null;
  return (
    <section id="trial" className={`scroll-mt-[100px] ${className}`} aria-labelledby="trial-title">
      <Reveal className="trial-panel relative overflow-hidden rounded-xl border p-6 sm:p-8 lg:p-10">
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <TrialLabel />
            <h2 id="trial-title" className="display-lg mt-4 text-ink text-balance">
              Run it on your own charts for three days.
            </h2>
            <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-slate text-pretty">
              {trialNames()} each come with a {TRIAL.label}: the full product, not a demo, on your instrument
              and your timeframe — and no card asked for.
            </p>
          </div>
          <TrialTerms className="md:col-span-5" />
        </div>
        <TrialGrid products={ps} className="mt-10 lg:mt-12" />
      </Reveal>
    </section>
  );
}

/** The terms as a spec sheet: small-caps key, plain value, one hairline each. */
export function TrialTerms({ className = "", slug }: { className?: string; slug?: string }) {
  return (
    <dl className={`border-t border-line ${className}`} aria-label="Trial terms">
      {trialTerms(slug).map((t) => (
        <div key={t.k} className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-4 border-b border-line py-2.5">
          <dt className="pt-[3px] font-mono text-[10px] uppercase tracking-[0.14em] text-mute">{t.k}</dt>
          <dd className="text-[13.5px] leading-snug text-ink text-pretty">{t.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The tiles and the steps, on the shelves' grid. */
export function TrialGrid({ products, className = "" }: { products: Product[]; className?: string }) {
  return (
    <div className={`grid gap-x-5 gap-y-8 sm:grid-cols-3 sm:gap-y-12 lg:grid-cols-5 ${className}`}>
      {products.map((p) => (
        <TrialTile key={p.slug} p={p} />
      ))}
      <TrialSteps className="sm:col-span-3 lg:col-span-2 lg:pl-4" />
    </div>
  );
}

/**
 * One trial product. From 640px it is built exactly like a shelf tile (the box
 * at shelf size, the name, what it is, a hairline) with the trial button where
 * the price would be — visible, not on hover, because touch screens have no
 * hover. On a phone it is a row: the box small on the left, the words and the
 * button beside it.
 */
function TrialTile({ p }: { p: Product }) {
  const keep = keepPrice(p.slug);
  return (
    <div className="group grid min-w-0 grid-cols-[92px_minmax(0,1fr)] items-center gap-x-5 sm:block">
      <Link
        href={`/products/${p.slug}`}
        className="relative block"
        style={{ aspectRatio: String(COVER_RATIO) }}
        tabIndex={-1}
        aria-hidden="true"
      >
        <span className="spotlight absolute inset-0">
          <span className="absolute inset-0 transition-transform duration-500 ease-silk group-hover:-translate-y-1.5">
            <Image
              src={boxartFor(p.slug)}
              alt=""
              fill
              sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 92px"
              className="object-contain"
            />
          </span>
        </span>
      </Link>
      <div className="min-w-0 sm:mt-2 sm:px-0.5">
        <Link href={`/products/${p.slug}`} className="block truncate font-display text-[15px] leading-tight text-ink transition-colors duration-300 hover:text-gold-deep">
          {p.name}
        </Link>
        <span className="mt-1 block truncate text-[12px] text-mute">{p.category}</span>
        <div className="mt-3 border-t border-line pt-3">
          <a
            href={trialHrefOrThrow(p.slug)}
            target="_blank"
            rel="noopener"
            className="btn-primary !h-9 w-full !gap-1.5 !px-3 !text-[13px]"
            aria-label={`${TRIAL.cta} — ${p.name}, ${TRIAL.label}`}
          >
            {TRIAL.cta}
            <External />
          </a>
          <p className="mt-2 text-[12px] leading-snug text-mute">
            No card{keep ? <> · <span className="whitespace-nowrap">then <span className="tabular-nums">{keep}</span> to keep</span></> : null}
          </p>
        </div>
      </div>
    </div>
  );
}

function trialHrefOrThrow(slug: string) {
  const h = trialHref(slug);
  if (!h) throw new Error(`components/Trial.tsx: "${slug}" is listed as a trial product but has no trial link.`);
  return h;
}

/** How it works, in three numbered steps — set like the buy steps in "Before you buy". */
export function TrialSteps({ className = "" }: { className?: string }) {
  return (
    <ol className={`grid content-start gap-6 sm:grid-cols-3 lg:grid-cols-1 lg:gap-5 ${className}`} aria-label="How the trial works">
      {trialSteps().map((s, i) => (
        <li key={s.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 border-t border-line-strong pt-4">
          <span className="font-mono text-[12px] tabular-nums text-bull-text">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <p className="text-[14px] font-medium text-ink">{s.title}</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate text-pretty">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/* The store                                                                   */
/* -------------------------------------------------------------------------- */

/** /products, under the three prices: the trial named once, linking to /trial. */
export function TrialStoreNote({ className = "" }: { className?: string }) {
  if (!trialProducts().length) return null;
  return (
    <Link href="/trial" className={`group flex items-start gap-3 ${className}`}>
      <TrialMark className="mt-[5px] text-bull-text" />
      <span className="text-[14px] leading-relaxed text-slate text-pretty">
        <span className="text-ink">{TRIAL.label}</span> on {trialNames()} — no card.{" "}
        <span className="whitespace-nowrap text-ink underline decoration-bull/60 underline-offset-4 transition-colors group-hover:decoration-bull-text">
          How it works
        </span>
      </span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Product pages                                                               */
/* -------------------------------------------------------------------------- */

/** Under the product's name and purpose: the first action on the page. */
export function TrialHead({ slug, className = "" }: { slug: string; className?: string }) {
  if (!trialHref(slug)) return null;
  const keep = keepPrice(slug);
  return (
    <div className={className}>
      <TrialLabel />
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <TrialButton slug={slug} />
        <p className="max-w-[20rem] text-[13px] leading-snug text-slate text-pretty">
          No card. The three days start {startsWhen()}.
          {keep ? <> <span className="tabular-nums text-ink">{keep}</span> to keep it.</> : null}
        </p>
      </div>
    </div>
  );
}

/**
 * Across the top of the price card — the same place DS Complete carries its
 * Founders strip, so the site says "an offer on this" in one way. The card's
 * own padding is undone so the strip runs edge to edge.
 */
export function TrialStrip({ slug }: { slug: string }) {
  const href = trialHref(slug);
  if (!href) return null;
  return (
    <div className="trial-strip -mx-7 -mt-7 mb-7 flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-7 py-3.5 sm:-mx-8 sm:-mt-8 sm:mb-8 sm:px-8">
      <TrialLabel />
      <span className="text-[13px] text-slate">No card · nothing charged when it ends</span>
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink underline decoration-bull/70 underline-offset-4 transition-colors hover:decoration-bull-text sm:ml-auto"
      >
        {TRIAL.cta}
        <External />
      </a>
    </div>
  );
}

/**
 * Inside "Test it on your own charts first": the trial is exactly the time to
 * do what that section recommends, with the product itself. Market Replay is
 * the practical advice — it runs many past sessions through the indicator
 * inside three calendar days.
 */
export function TrialTestNote({ slug, name }: { slug: string; name: string }) {
  if (!trialHref(slug)) return null;
  return (
    <div className="mt-10 max-w-md border-t border-line-strong pt-6">
      <TrialLabel />
      <p className="mt-3 text-[14px] leading-relaxed text-slate text-pretty">
        {name} itself is free for three days — time to replay sessions you remember and trade it forward on the
        simulator before you pay anything. Replay runs a past session at any speed, so the three days hold far more
        than three sessions.
      </p>
      <TrialButton slug={slug} variant="ghost" className="mt-5" />
    </div>
  );
}

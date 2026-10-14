import type { CSSProperties } from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { productHref } from "@/content/release";
import { COMPLETE } from "@/content/pricing";
import {
  TRIAL,
  TRIAL_OWNER_NOTE,
  inTrial,
  keepPrice,
  trialCheckout,
  trialOn,
  trialShelves,
  trialSteps,
  trialTerms,
} from "@/content/trial";

/**
 * THE DS COMPLETE 7-DAY FREE TRIAL on the page (2026-10-13; it replaces the
 * 3-day trial of 2026-09-29 on three single products). Every word and the
 * switch live in content/trial.ts, the link in content/whop.ts. Everything here
 * renders nothing when the trial is off, so no page needs a second edit.
 *
 * ONE TRIAL, ONE DOOR. The trial belongs to DS Complete. Single products have
 * none of their own, so no tile, row or product button says "try this one":
 * a paid product's page says it is free for 7 days inside DS Complete, and
 * every trial button opens the one DS Complete trial checkout.
 *
 * THE SYSTEM, so it reads as part of the site rather than a banner bolted on:
 *   · ONE COLOUR. Gold is money on this site; the trial is bull teal — the
 *     house colour for "on your chart, now" (hero status light, bull ticks).
 *     It is used as a hairline, a tint, small type and the mark. Never a fill
 *     behind a button, never a glow.
 *   · ONE MARK. Three candles, rising. Drawn on whole pixels so it is crisp at
 *     12px.
 *   · ONE PHRASE. "7-day free trial", set in the instrument voice (mono, small
 *     caps), the way the site labels prices and series.
 *   · THE CONDITIONS TRAVEL WITH THE WORD "FREE" (16 CFR 251.1(c)): wherever
 *     the offer is made, "no card" and when it ends sit in the same line.
 *
 * WHERE IT APPEARS — each placement answers a different moment:
 *   home hero            TrialHeroNote   first screen: that it exists
 *   home, before lineup  TrialBand       the offer in full: terms, what runs, steps
 *   DS Complete panel    TrialCompleteNote  beside the buy button it competes with
 *   /products head       TrialStoreNote  the store's first screen
 *   product page         TrialBuyNote    under the buy button: "inside DS Complete"
 *   "Test it first"      TrialTestNote   how to spend the week well
 *   /trial               the whole thing, shareable as one URL
 */

/** Three candles, rising. */
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
    <span className={`inline-flex items-center gap-2.5 font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-bull-text ${className}`}>
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

/** The trial checkout button — DS Complete's trial. Renders nothing when the trial is off. */
export function TrialButton({
  variant = "primary",
  className = "",
  label = TRIAL.cta,
}: {
  variant?: "primary" | "ghost";
  className?: string;
  label?: string;
}) {
  const href = trialCheckout();
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={`${variant === "primary" ? "btn-primary" : "btn-ghost"} ${className}`}
      aria-label={`${label} — ${COMPLETE.name}, ${TRIAL.label}. Opens Whop in a new tab.`}
    >
      {label}
      <External />
    </a>
  );
}

/** "How it works" — the underlined teal link every short note ends on. */
function HowItWorks() {
  return (
    <span className="whitespace-nowrap text-ink underline decoration-bull/60 underline-offset-4 transition-colors group-hover:decoration-bull-text">
      How it works
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Home                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Under the hero's buttons: that the trial exists, what it covers and its one
 * condition, as one link down to the band. A hairline above it, no box — it
 * belongs to the hero's column, not on top of it. No price: the hero carries none.
 */
export function TrialHeroNote({ className = "", style }: { className?: string; style?: CSSProperties }) {
  if (!trialOn()) return null;
  return (
    <a href="#trial" className={`group block max-w-md border-t border-line pt-5 ${className}`} style={style}>
      <TrialLabel />
      <span className="mt-2 block text-[length:calc(13.5px*var(--type))] leading-relaxed text-slate text-pretty">
        Every paid DS tool on your own charts for {TRIAL.days} days, inside {COMPLETE.name}. No card, nothing charged when it
        ends. <HowItWorks />
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
 * Body: what runs during the trial (by series, every name a link) and the
 * three steps, then the one button.
 */
export function TrialBand({ className = "" }: { className?: string }) {
  if (!trialOn()) return null;
  return (
    <section id="trial" className={`scroll-mt-[100px] ${className}`} aria-labelledby="trial-title">
      <Reveal className="trial-panel relative overflow-hidden rounded-xl border p-6 sm:p-8 lg:p-10">
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <TrialLabel />
            <h2 id="trial-title" className="display-lg mt-4 text-ink text-balance">
              Every paid tool on your own charts, free for seven days.
            </h2>
            <p className="mt-4 max-w-xl text-[length:calc(14.5px*var(--type))] leading-relaxed text-slate text-pretty">
              Download the same {COMPLETE.name} archive buyers get and run every tool in it on your instrument and your
              timeframe, live or in Market Replay. Each tool gets its own week, and no card is asked for.
            </p>
          </div>
          <TrialTerms className="md:col-span-5" />
        </div>
        <TrialBody className="mt-10 lg:mt-12" />
      </Reveal>
    </section>
  );
}

/** The terms as a spec sheet: small-caps key, plain value, one hairline each. */
export function TrialTerms({ className = "" }: { className?: string }) {
  return (
    <dl className={`border-t border-line ${className}`} aria-label="Trial terms">
      {trialTerms().map((t) => (
        <div key={t.k} className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-4 border-b border-line py-2.5">
          <dt className="pt-[3px] font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.14em] text-mute">{t.k}</dt>
          <dd className="text-[length:calc(13.5px*var(--type))] leading-snug text-ink text-pretty">{t.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * What runs and how it works, then the button — the band's body and the
 * /trial page's panel. Left: the trial's contents by series, read off the
 * catalogue (no count is ever typed). Right: the three steps.
 */
export function TrialBody({ className = "", ownerNote = false }: { className?: string; ownerNote?: boolean }) {
  return (
    <div className={className}>
      <div className="grid gap-x-10 gap-y-10 md:grid-cols-12">
        <TrialRuns className="min-w-0 md:col-span-6" />
        <TrialSteps className="min-w-0 md:col-span-6" />
      </div>
      <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-[length:calc(13px*var(--type))] leading-relaxed text-mute text-pretty">
          No card · nothing charged when it ends · <span className="whitespace-nowrap">then <span className="tabular-nums text-ink">{keepPrice()}</span> to keep everything</span>
          {ownerNote && <span className="mt-2 block">{TRIAL_OWNER_NOTE}</span>}
        </p>
        <TrialButton className="shrink-0" />
      </div>
    </div>
  );
}

/** Everything the trial runs, as a short ledger: series key, then its products. */
export function TrialRuns({ className = "" }: { className?: string }) {
  const shelves = trialShelves();
  return (
    <div className={className}>
      <p className="font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.14em] text-mute">What you can run</p>
      <dl className="mt-3 border-t border-line">
        {shelves.map((s) => (
          <div key={s.info.key} className="grid gap-x-4 gap-y-1.5 border-b border-line py-3 sm:grid-cols-[148px_minmax(0,1fr)]">
            <dt className="pt-[3px] font-mono text-[length:calc(10px*var(--type))] uppercase tracking-[0.14em] text-bull-text">{s.info.short}</dt>
            {/* One item per product, so a long name wraps whole, never mid-name. */}
            <dd className="flex min-w-0 flex-wrap gap-x-1.5 gap-y-1 text-[length:calc(13.5px*var(--type))] leading-snug">
              {s.products.map((p, i) => (
                <span key={p.slug} className="whitespace-nowrap">
                  <Link href={productHref(p.slug)} className="text-ink transition-colors hover:text-gold-deep">
                    {p.name}
                  </Link>
                  {i < s.products.length - 1 && <span className="pl-1.5 text-mute" aria-hidden="true">·</span>}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** How it works, in three numbered steps — set like the buy steps in "Before you buy". */
export function TrialSteps({ className = "" }: { className?: string }) {
  return (
    <ol className={`grid content-start gap-5 ${className}`} aria-label="How the trial works">
      {trialSteps().map((s, i) => (
        <li key={s.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 border-t border-line-strong pt-4">
          <span className="font-mono text-[length:calc(12px*var(--type))] tabular-nums text-bull-text">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <p className="text-[length:calc(14px*var(--type))] font-medium text-ink">{s.title}</p>
            <p className="mt-1.5 text-[length:calc(13.5px*var(--type))] leading-relaxed text-slate text-pretty">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/* DS Complete and the store                                                    */
/* -------------------------------------------------------------------------- */

/**
 * In the DS Complete panel, under its buy button: the other way in. One line
 * and a link to /trial — the button beside "Buy" carries the click.
 */
export function TrialCompleteNote({ className = "" }: { className?: string }) {
  if (!trialOn()) return null;
  return (
    <Link href="/trial" className={`group flex max-w-md items-start gap-3 ${className}`}>
      <TrialMark className="mt-[5px] text-bull-text" />
      <span className="text-[length:calc(13px*var(--type))] leading-relaxed text-slate text-pretty">
        <span className="text-ink">Try it first:</span> every tool free for {TRIAL.days} days, each from the first time it loads. No card.{" "}
        <HowItWorks />
      </span>
    </Link>
  );
}

/** /products, under the three prices: the trial named once, linking to /trial. */
export function TrialStoreNote({ className = "" }: { className?: string }) {
  if (!trialOn()) return null;
  return (
    <Link href="/trial" className={`group flex items-start gap-3 ${className}`}>
      <TrialMark className="mt-[5px] text-bull-text" />
      <span className="text-[length:calc(14px*var(--type))] leading-relaxed text-slate text-pretty">
        <span className="text-ink">{TRIAL.label}</span> on {COMPLETE.name}: every paid tool, no card. <HowItWorks />
      </span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Product pages                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Under a paid product's buy button (and DS ASL's and DS Toolkit's): it has
 * no trial of its own, but it is inside the DS Complete trial. Said plainly,
 * because the button opens DS Complete's checkout, not this product's.
 */
export function TrialBuyNote({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  if (!inTrial(slug)) return null;
  return (
    <div className={`border-t border-line pt-5 ${className}`}>
      <TrialLabel text={TRIAL.inLabel} />
      <p className="mt-2.5 max-w-md text-[length:calc(13px*var(--type))] leading-snug text-slate text-pretty">
        {name} has no separate trial: it runs free for {TRIAL.days} days inside the {COMPLETE.name} trial, with every other tool
        in it. No card.{" "}
        <Link href="/trial" className="whitespace-nowrap text-ink underline decoration-bull/60 underline-offset-4 transition-colors hover:decoration-bull-text">
          How it works
        </Link>
      </p>
      <TrialButton variant="ghost" className="mt-4" />
    </div>
  );
}

/**
 * Inside "Test it on your own charts first": the trial week is exactly the
 * time to do what that section recommends, with the product itself. Market
 * Replay is the practical advice — it runs many past sessions through the
 * indicator inside seven calendar days.
 */
export function TrialTestNote({ slug, name }: { slug: string; name: string }) {
  if (!inTrial(slug)) return null;
  return (
    <div className="mt-10 max-w-md border-t border-line-strong pt-6">
      <TrialLabel text={TRIAL.inLabel} />
      <p className="mt-3 text-[length:calc(14px*var(--type))] leading-relaxed text-slate text-pretty">
        {name} is free for {TRIAL.days} days inside the {COMPLETE.name} trial, from the first time it loads: time to replay
        sessions you remember and trade it forward on the simulator before you pay anything. Replay runs a past session at
        any speed, so the week holds far more than a week of sessions.
      </p>
      <TrialButton variant="ghost" className="mt-5" />
    </div>
  );
}

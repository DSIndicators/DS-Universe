import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { BuyButton, CtaNote } from "@/components/BuyButton";
import { APART, COMPLETE, COMPLETE_PCT, COMPLETE_SAVING, FOUNDERS, PRICES, money } from "@/content/pricing";
import { onWaitlist } from "@/content/launch";
import { SHELVES } from "@/content/release";

/**
 * DS COMPLETE AT THE HEAD OF THE LINEUP (2026-09-28).
 *
 * Tom: "the complete package should be the star but its hidden all the way at
 * the bottom, we should move it to the top and have it flow elegantly down to
 * the products, 1 link." It used to be a dark band after the last shelf — the
 * summary of a list most visitors never scrolled to the end of.
 *
 * So the lineup now opens with it, and it reads as the sum of what follows:
 *
 *  · THE VALUE BAR. One bar is everything the paid products cost bought one at
 *    a time, cut into its series in proportion. A gold rule under it runs to
 *    what DS Complete costs; the rest of the bar is what you keep. Every width
 *    and figure is computed from content/pricing.ts — the same numbers printed
 *    on the shelves below — so it cannot drift from them.
 *  · THE LEDGER. One row per series, its subtotal (or "Free · included") on
 *    the right. Each row is a link to that series' panel directly below — the
 *    one link from the offer down into the products.
 *  · THE THREAD. From this panel a single gold line runs down through the gap
 *    before every series panel, with a node where it meets each one
 *    (Marketplace.tsx, <Thread />). The lineup reads as one object: DS
 *    Complete, and what is inside it.
 *
 * Gold is the one accent, as everywhere else prices live. No glow on the
 * panel: the only light is the box art's own, feathered into the ground.
 * No counts in the copy (the lineup changes); no invented "was" price —
 * $749.90 is the real sum, and pricing.ts fails the build if Whop's struck
 * figure ever stops matching it.
 */

type Row = { key: string; name: string; sum: number; free: boolean };

function ledger(): Row[] {
  return SHELVES.map((s) => {
    const paid = s.products.map((p) => PRICES[p.slug]).filter((p) => p && !p.free);
    const sum = Math.round(paid.reduce((n, p) => n + p!.now, 0) * 100) / 100;
    return { key: s.info.key, name: s.info.name, sum, free: paid.length === 0 };
  });
}

// Three greys for the paid segments of the bar — tone, not colour, so gold
// stays the only accent.
const SHADES = ["rgba(236,238,241,0.30)", "rgba(236,238,241,0.19)", "rgba(236,238,241,0.11)", "rgba(236,238,241,0.07)"];

export function CompleteKeystone() {
  const rows = ledger();
  const paid = rows.filter((r) => !r.free);
  const shade = (key: string) => SHADES[Math.max(0, paid.findIndex((r) => r.key === key))];
  const payPct = (COMPLETE.now / APART) * 100;

  return (
    <section id="complete" className="scroll-mt-[148px]" aria-labelledby="complete-title">
      <Reveal className="complete-panel relative overflow-hidden rounded-xl border">
        {/* the box's own gold, behind the art only */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(50% 60% at 22% 50%, rgba(195,155,69,0.10) 0%, rgba(195,155,69,0) 70%)" }}
          aria-hidden="true"
        />
        {/* ------------------------------------------------ founders strip */}
        {/* The sale, said across the top of the panel before anything else:
            a live gold light, the name, what it is, and that it will end.
            No countdown and no date — there is no end date to show. */}
        {FOUNDERS.active && (
          <div className="founders-strip relative flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-6 py-3.5 sm:px-8 lg:px-10">
            <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
              <span className="absolute inset-0 rounded-full bg-gold opacity-60 motion-safe:animate-ping" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-gold">{FOUNDERS.name}</span>
            <span className="hidden h-3 w-px bg-[rgba(205,166,86,0.35)] sm:block" aria-hidden="true" />
            <span className="w-full text-[13.5px] text-ink text-balance sm:w-auto">{FOUNDERS.strip}</span>
            <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.14em] text-gold-deep/80 md:block">
              Can end at any time
            </span>
          </div>
        )}
        <div className="relative grid items-center lg:grid-cols-12">
          {/* ------------------------------------------------------- the box */}
          <div className="lg:col-span-5">
            <div
              className="relative mx-auto aspect-[1500/1049] w-[124%] max-w-none -translate-x-[10%] sm:w-full sm:max-w-[600px] sm:translate-x-0 lg:w-[142%] lg:max-w-none lg:-translate-x-[15%]"
              style={{
                WebkitMaskImage: "radial-gradient(closest-side at 50% 50%, #000 62%, transparent 100%)",
                maskImage: "radial-gradient(closest-side at 50% 50%, #000 62%, transparent 100%)",
              }}
            >
              <Image
                src={COMPLETE.art}
                alt="The DS Complete box"
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* ------------------------------------------------------ the offer */}
          <div className="px-6 pb-8 sm:px-8 sm:pb-10 lg:col-span-7 lg:py-12 lg:pl-4 lg:pr-12">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold">The whole lineup · one purchase</p>
            <h3 id="complete-title" className="display-lg mt-3.5 text-ink">
              {COMPLETE.name}
            </h3>
            <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-slate text-pretty">{COMPLETE.blurb}</p>

            {FOUNDERS.active && (
              <p className="mt-7 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold">Founders price</p>
            )}
            <div className={`${FOUNDERS.active ? "mt-2.5" : "mt-7"} flex flex-wrap items-baseline gap-x-3.5 gap-y-2`}>
              <span className="font-display text-[clamp(2.25rem,4vw,3rem)] font-[350] leading-none tracking-[-0.03em] text-ink tabular-nums">
                {money(COMPLETE.now)}
              </span>
              <s className="text-[15px] tabular-nums text-mute decoration-mute/70" aria-label={`${money(APART)} bought separately`}>
                {money(APART)}
              </s>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold">{COMPLETE_PCT}% off</span>
            </div>
            {/* The value, said in words as well as struck through: the real sum
                of the paid products' own prices (APART, computed). */}
            <p className="mt-3.5 text-[14.5px] leading-snug text-slate">
              A <span className="font-medium text-ink tabular-nums">{money(APART)}</span> value — every paid product, bought one at a time.
            </p>
            <p className="mt-1.5 text-[12.5px] text-mute">One payment · Yours to keep · Updates included</p>

            {/* ------------------------------------------------ the value bar */}
            <figure className="mt-8 max-w-xl" aria-label={`Every paid product bought separately costs ${money(APART)}; ${COMPLETE.name} costs ${money(COMPLETE.now)}; you save ${money(COMPLETE_SAVING)}.`}>
              <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
                <span>Bought one at a time</span>
                <span className="tabular-nums">{money(APART)}</span>
              </div>
              <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-[1px]" aria-hidden="true">
                {paid.map((r, i) => (
                  <a
                    key={r.key}
                    href={`#${r.key}`}
                    tabIndex={-1}
                    className="h-full transition-opacity hover:opacity-70"
                    style={{
                      width: `${(r.sum / APART) * 100}%`,
                      background: shade(r.key),
                      marginLeft: i ? 1 : 0,
                    }}
                  />
                ))}
              </div>
              {/* what you pay (gold) and what you keep (hairline) */}
              <div className="relative mt-2 h-px w-full bg-line-strong" aria-hidden="true">
                <span className="absolute inset-y-0 left-0 bg-gold" style={{ width: `${payPct}%` }} />
                <span className="absolute -top-[3px] h-[7px] w-px bg-gold" style={{ left: `${payPct}%` }} />
              </div>
              <div className="relative mt-2 h-4 font-mono text-[10px] uppercase tracking-[0.12em] tabular-nums" aria-hidden="true">
                <span className="absolute left-0 text-gold">You pay {money(COMPLETE.now)}</span>
                <span className="absolute right-0 text-slate">You save {money(COMPLETE_SAVING)}</span>
              </div>
            </figure>

            {/* ---------------------------------------------------- the ledger */}
            <ul className="mt-6 max-w-xl border-t border-line" aria-label={`What is inside ${COMPLETE.name}`}>
              {rows.map((r) => (
                <li key={r.key}>
                  <a
                    href={`#${r.key}`}
                    className="group flex items-center gap-3 border-b border-line py-2.5 text-[13.5px] transition-colors"
                  >
                    <span
                      className="block h-2 w-2 shrink-0 rounded-[1px]"
                      style={r.free ? { boxShadow: "inset 0 0 0 1px rgba(236,238,241,0.3)" } : { background: shade(r.key) }}
                      aria-hidden="true"
                    />
                    <span className="text-ink transition-colors group-hover:text-gold-deep">{r.name}</span>
                    <span className="ml-auto tabular-nums text-slate">{r.free ? "Free · included" : money(r.sum)}</span>
                    <span className="w-3 text-mute transition-transform group-hover:translate-y-0.5 group-hover:text-gold-deep" aria-hidden="true">
                      ↓
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <BuyButton slug={COMPLETE.key} label={FOUNDERS.active && !onWaitlist() ? FOUNDERS.cta : undefined} />
            </div>
            {/* The terms of the sale, right under the button that acts on
                them; the checkout note after. */}
            {FOUNDERS.active && (
              <p className="mt-5 max-w-xl border-l border-gold pl-4 text-[13px] leading-relaxed text-slate text-pretty">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">{FOUNDERS.name}</span>
                <br />
                {FOUNDERS.note}
              </p>
            )}
            <CtaNote className="mt-4" slug={COMPLETE.key} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

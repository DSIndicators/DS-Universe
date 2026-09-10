import Image from "next/image";
import Link from "next/link";
import { cta } from "@/content/launch";
import { Reveal } from "@/components/ui/Reveal";
import { LIVE_TIERS, money, perUnit, savedPct } from "@/content/pricing";

/**
 * The bundle band. Sits directly under the storefront on the home page, at the
 * moment a visitor has just seen everything priced one at a time — which is the
 * only moment "or take the set" actually means something.
 *
 * Composition is deliberately asymmetric rather than three identical cards:
 * the first tier is a wide feature row with its art beside the copy, the other
 * two sit beneath as a pair with their art on top. All three carry lineup art
 * as of 2026-09-10. The asymmetry now earns its keep by ranking the offers —
 * Complete is the one worth taking, and the layout says so before the price does.
 */
export function Bundles() {
  const [lead, ...rest] = LIVE_TIERS;
  if (!lead) return null;

  return (
    <section className="border-t border-line bg-mist" id="bundles">
      <div className="wrap py-20 lg:py-28">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="label">Bundles</p>
            <h2 className="display-lg mt-4 text-ink text-balance">Or take the set</h2>
          </div>
          <p className="max-w-md text-[15px] leading-relaxed text-slate">
            Everything is sold on its own. These are simply the cheaper way to
            take more than one — same licence, same one payment.
          </p>
        </Reveal>

        {/* ---------------------------------------------------- feature tier */}
        <Reveal className="mt-12">
          <div className="overflow-hidden rounded-2xl border border-gold/40 bg-white shadow-lift">
            <div className="grid lg:grid-cols-12">
              {lead.art && (
                /* aspect ratio on small screens gives the column a definite
                   height; on lg the grid row does, so the ratio is dropped and
                   the art fills the card beside the copy. Do not put both an
                   aspect ratio and h-full on one element — it collapses. */
                <div
                  className="relative aspect-[2.36/1] lg:col-span-7 lg:aspect-auto"
                  /* the art's own corner colour, so the letterboxing that
                     object-contain leaves is invisible rather than a band */
                  style={{ backgroundColor: "#121b25" }}
                >
                  <Image
                    src={lead.art}
                    alt={`${lead.name} — the products it contains`}
                    fill
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    /* contain, not cover: cover crops the outer boxes through
                       their own names. The whole lineup or none of it. */
                    className="object-contain"
                  />
                </div>
              )}
              <div className={`flex flex-col justify-center p-8 lg:p-10 ${lead.art ? "lg:col-span-5" : "lg:col-span-12"}`}>
                <h3 className="display-sm text-ink">{lead.name}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate text-pretty">{lead.blurb}</p>

                <div className="mt-6 flex flex-wrap items-baseline gap-3">
                  <span className="font-display text-[40px] leading-none tabular-nums text-ink">
                    {money(lead.now)}
                  </span>
                  <span className="text-[17px] tabular-nums text-mute line-through">{money(lead.list)}</span>
                </div>
                <p className="mt-2 text-[13.5px] text-slate">
                  {savedPct(lead)}% off
                  {perUnit(lead) !== null && <> · about {money(perUnit(lead)!)} a tool</>}
                </p>
                {lead.bonus && <p className="mt-4 text-[14px] text-gold-deep">{lead.bonus}</p>}

                <div className="mt-7 flex flex-wrap gap-3">
                  {lead.checkout ? (
                    <a href={lead.checkout} target="_blank" rel="noopener" className="btn-primary">
                      {cta("Get access")}
                    </a>
                  ) : (
                    <span className="inline-flex h-12 items-center rounded-md border border-dashed border-line-strong px-5 text-[15px] text-slate">
                      Coming soon
                    </span>
                  )}
                  <Link href="/pricing" className="btn-ghost">
                    Compare
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ------------------------------------------------------ the others */}
        {/* Full-width rows, not a two-up grid (Tom, 2026-09-10). The lineup art
            is a 2.36:1 strip holding five boxes; in a half-width card it landed
            at ~590px, which puts each box at 110px and every product name below
            the size a person can read — the picture was there without saying
            anything. At full width the art doubles and the names carry. The
            lead above keeps its own larger treatment, so the ranking survives. */}
        {rest.length > 0 && (
          <div className="mt-6 space-y-6">
            {rest.map((t, i) => (
              <Reveal key={t.key} delay={i * 90}>
                <div className="overflow-hidden rounded-2xl border border-line bg-white lg:grid lg:grid-cols-12 lg:items-stretch">
                  {t.art && (
                    <div
                      className="relative aspect-[2.36/1] lg:col-span-7 lg:aspect-auto"
                      style={{ backgroundColor: "#121b25" }}
                    >
                      <Image
                        src={t.art}
                        alt={`${t.name} — the products it contains`}
                        fill
                        sizes="(min-width: 1024px) 58vw, 100vw"
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div className={`flex flex-col justify-center p-8 lg:p-10 ${t.art ? "lg:col-span-5" : "lg:col-span-12"}`}>
                    <h3 className="display-sm text-ink">{t.name}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-slate text-pretty">{t.blurb}</p>

                    <div className="mt-6 flex flex-wrap items-baseline gap-3">
                      <span className="font-display text-[32px] leading-none tabular-nums text-ink">
                        {money(t.now)}
                      </span>
                      <span className="text-[16px] tabular-nums text-mute line-through">{money(t.list)}</span>
                    </div>
                    <p className="mt-2 text-[13.5px] text-slate">{savedPct(t)}% off</p>
                    {t.bonus && <p className="mt-3 text-[14px] text-gold-deep">{t.bonus}</p>}

                    <div className="mt-7">
                      {t.checkout ? (
                        <a href={t.checkout} target="_blank" rel="noopener" className="btn-ghost">
                          {cta("Get access")}
                        </a>
                      ) : (
                        <span className="inline-flex h-12 items-center rounded-md border border-dashed border-line-strong px-5 text-[15px] text-slate">
                          Coming soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

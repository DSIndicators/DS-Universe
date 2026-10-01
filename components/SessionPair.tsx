import { Reveal } from "@/components/ui/Reveal";
import { BoxCard } from "@/components/BoxCard";
import { BuyButton } from "@/components/BuyButton";
import { PriceList } from "@/components/PriceList";
import { GIFT } from "@/content/pricing";
import { onWaitlist } from "@/content/launch";
import { giftBuyLabel } from "@/components/Sessions";
import { COMPARE, PAIR } from "@/content/sessions";
import { BY_SLUG } from "@/content/products";
import type { Shelf as ShelfT } from "@/content/release";

/**
 * THE SESSION LEVELS PANEL (Tom, 2026-09-30) — one free tool and its Pro tier,
 * which comes only with DS Complete, in one panel.
 *
 * WHY ONE PANEL. The two are one product at two depths: the same brackets, the
 * same carried levels, and in the Pro tier the volume inside. Shelved apart,
 * the step between them is invisible; side by side, with a sheet of what each
 * draws, it is the whole decision. And because the Pro tier is the Founders
 * gift, the panel is also the plainest case for DS Complete above it.
 *
 * THE SAME PANEL AS EVERY SERIES (Shelf.tsx): the same edge, ground, padding
 * and head grid, and the boxes on the same five-column grid — so the two
 * covers render at exactly the size every other cover does. The three cells a
 * two-product shelf would leave empty carry the sheet instead.
 *
 * THE HEAD PRICE is one figure — both cost nothing — with its two conditions
 * under it, set like PriceTag (gold rule, small-caps label, figure in the
 * display face). No pill, no glow, no gradient (Tom, 2026-09-27).
 *
 * TWO VIEWS on /products, like Shelf: the covers and the sheet (.v-covers), or
 * the price list (.v-list). The paragraph and the sheet belong to the covers
 * view; in the list every row carries its own button.
 */
export function SessionPair({ shelf, priority = false, views = false }: { shelf: ShelfT; priority?: boolean; views?: boolean }) {
  const { info } = shelf;
  const free = BY_SLUG[PAIR.free];
  const pro = BY_SLUG[PAIR.pro];
  const CoversOnly = ({ children }: { children: React.ReactNode }) =>
    views ? <div className="v-covers">{children}</div> : <>{children}</>;

  const covers = (
    <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
      <BoxCard slug={free.slug} priority={priority} />
      <BoxCard slug={pro.slug} priority={priority} />
      <Compare className="col-span-2 sm:col-span-3 lg:col-span-3 lg:pl-5" />
    </div>
  );

  return (
    <section id={info.key} className="scroll-mt-[148px]" aria-labelledby={`${info.key}-title`}>
      <Reveal className="series-panel relative overflow-hidden rounded-xl border border-line p-6 sm:p-8 lg:p-10">
        {/* ---------------------------------------------------------- head */}
        <div className="grid gap-x-10 gap-y-7 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <h3 id={`${info.key}-title`} className="display-md text-ink">
              {info.name}
            </h3>
            <p className="mt-2.5 text-[15px] leading-snug text-ink text-pretty">{info.tagline}</p>
            <CoversOnly>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate text-pretty">{info.blurb}</p>
            </CoversOnly>
          </div>
          <div className="md:col-span-5">
            <div className="flex flex-col md:items-end md:text-right">
              <span className="block h-px w-8 bg-gold" aria-hidden="true" />
              <span className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold-deep">Price</span>
              <span className="mt-2 font-display text-[clamp(2rem,3.2vw,2.6rem)] font-[350] leading-none tracking-[-0.03em] text-ink">Free</span>
              <span className="mt-3 text-[12.5px] leading-relaxed text-slate">
                {free.name}, for everyone
                <br />
                {pro.name}, with DS Complete
              </span>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------- body */}
        {views ? (
          <>
            <div className="v-covers">{covers}</div>
            <div className="v-list">
              <div className="mt-8">
                <PriceList products={shelf.products} buttonWidth={168} />
              </div>
            </div>
          </>
        ) : (
          covers
        )}
      </Reveal>
    </section>
  );
}

/**
 * Free | Pro — what each one draws. A spec sheet in type: hairlines, a filled
 * dot where a product draws it, a short rule where it does not. The Pro
 * tier's own rows mark in gold: that is what DS Complete adds.
 */
function Compare({ className = "" }: { className?: string }) {
  const free = BY_SLUG[PAIR.free];
  const pro = BY_SLUG[PAIR.pro];
  return (
    <div className={`min-w-0 ${className}`}>
      <table className="w-full table-fixed border-collapse text-left">
        <caption className="sr-only">
          {COMPARE.heading}: {free.name} and {pro.name}
        </caption>
        <colgroup>
          <col />
          <col className="w-[60px] sm:w-[112px]" />
          <col className="w-[60px] sm:w-[136px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="pb-3 align-bottom font-mono text-[10.5px] font-normal uppercase tracking-[0.14em] text-mute">
              {COMPARE.heading}
            </th>
            <th scope="col" className="pb-3 text-center align-bottom font-normal">
              <span className="block text-[12.5px] leading-tight text-ink">
                <span className="sm:hidden">Free</span>
                <span className="hidden sm:inline">{free.name.replace(/^DS /, "")}</span>
              </span>
              <span className="mt-1 hidden font-mono text-[10px] uppercase tracking-[0.12em] text-mute sm:block">Free</span>
            </th>
            <th scope="col" className="pb-3 text-center align-bottom font-normal">
              <span className="block text-[12.5px] leading-tight text-ink">
                <span className="sm:hidden">Pro</span>
                <span className="hidden sm:inline">{pro.name.replace(/^DS /, "")}</span>
              </span>
              <span className="mt-1 hidden font-mono text-[10px] uppercase tracking-[0.12em] text-gold-deep sm:block">With DS Complete</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARE.rows.map((r) => (
            <tr key={r.text} className="border-b border-line">
              <th scope="row" className="py-2.5 pr-3 text-[13px] font-normal leading-snug text-ink text-pretty">
                {r.text}
              </th>
              <td className="py-2.5 text-center">
                <Mark on={r.free} label={r.free ? "Yes" : "No"} />
              </td>
              <td className="py-2.5 text-center">
                <Mark on={r.pro} gold={!r.free} label={r.pro ? "Yes" : "No"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 text-[12.5px] leading-relaxed text-mute text-pretty">{COMPARE.note}</p>

      {/* The two ways in, side by side: the free one, and DS Complete for the
          Pro tier. Plain buttons — a phone has no hover, so the panel says
          where each one is had without sending anyone through a product page. */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <BuyButton slug={pro.slug} label={giftBuyLabel()} />
        <BuyButton slug={free.slug} variant="ghost" label={onWaitlist() ? undefined : `Get ${free.name} free`} />
      </div>
      <p className="mt-3 flex items-baseline gap-2.5 text-[12.5px] leading-relaxed text-slate text-pretty">
        <span className="relative top-[-1px] h-[6px] w-[6px] shrink-0 rotate-45 border border-gold" aria-hidden="true" />
        <span>
          <span className="mr-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold">{GIFT.label}</span>
          {GIFT.owners}
        </span>
      </p>
    </div>
  );
}

function Mark({ on, gold = false, label }: { on: boolean; gold?: boolean; label: string }) {
  return on ? (
    <span className={`inline-block h-[7px] w-[7px] rounded-full align-middle ${gold ? "bg-gold" : "bg-ink/80"}`} role="img" aria-label={label} />
  ) : (
    <span className="inline-block h-px w-3 align-middle bg-line-strong" role="img" aria-label={label} />
  );
}

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { BuyButton, CtaNote } from "@/components/BuyButton";
import { APART, COMPLETE, COMPLETE_PCT, COMPLETE_SAVING, money } from "@/content/pricing";
import { SHELVES } from "@/content/release";

/**
 * DS Complete — the only bundle, and the one dark band on a white site.
 *
 * WHY DARK. The Complete box art is its own scene: a black studio, the box lit
 * gold from behind. Dropped onto white it becomes a black rectangle; set into a
 * section of its own ground colour (#0A0B0E, sampled from the art's edges) with
 * the picture's border feathered away, the box simply stands in the page. It
 * also marks the moment: this is the end of the shelf and the one offer that
 * sums it.
 *
 * THE COMPARISON IS ARITHMETIC. $749.90 is not an invented "was" price — it is
 * what the paid products genuinely cost bought one at a time, COMPUTED in
 * content/pricing.ts from the same prices printed on the tiles above, and the
 * build fails if it ever stops matching Whop's struck-through figure. So the
 * page can say "half" and mean it.
 *
 * NO COUNTS in the copy (the lineup changes). The contents list below is built
 * from the catalogue, so it grows and shrinks by itself.
 */
export function CompleteBand() {
  return (
    <section id="complete" className="relative scroll-mt-20 overflow-hidden border-y border-white/[0.06] bg-[#08090B] text-white">
      {/* a breath of the box's own gold, behind everything */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 55% at 28% 45%, rgba(195,155,69,0.10) 0%, rgba(195,155,69,0) 70%)" }}
        aria-hidden="true"
      />
      <div className="wrap relative grid items-center gap-12 py-20 lg:grid-cols-12 lg:gap-10 lg:py-28">
        <Reveal className="lg:col-span-6">
          <div
            className="relative mx-auto aspect-[1500/1049] w-[112%] max-w-none -translate-x-[5%] sm:w-full sm:max-w-[680px] sm:translate-x-0 lg:w-[122%] lg:max-w-none lg:-translate-x-[9%]"
            style={{
              /* closest-side: the ellipse's radii ARE the distances to the
                 edges, so every edge reaches full transparency — a fixed
                 percentage left the middle of each edge 74% opaque. */
              WebkitMaskImage: "radial-gradient(closest-side at 50% 50%, #000 64%, transparent 100%)",
              maskImage: "radial-gradient(closest-side at 50% 50%, #000 64%, transparent 100%)",
            }}
          >
            <Image
              src={COMPLETE.art}
              alt="The DS Complete box"
              fill
              sizes="(min-width: 1024px) 700px, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        <Reveal className="lg:col-span-6" delay={100}>
          <p className="text-[12.5px] font-medium uppercase tracking-[0.14em] text-gold">The bundle</p>
          <h2 className="display-lg mt-4 text-white">{COMPLETE.name}</h2>
          <p className="mt-5 max-w-xl text-[clamp(1.075rem,1.4vw,1.25rem)] leading-[1.55] text-white/70 text-pretty">
            {COMPLETE.blurb}
          </p>

          <div className="mt-9 flex flex-wrap items-baseline gap-x-3.5 gap-y-2">
            <span className="font-display text-[56px] font-light leading-none tabular-nums text-white">
              {money(COMPLETE.now)}
            </span>
            <s className="text-[18px] tabular-nums text-white/55 decoration-white/45" aria-label={`${money(APART)} bought separately`}>
              {money(APART)}
            </s>
            <span className="inline-flex items-center rounded-full bg-gold/20 px-2.5 py-1 text-[12px] font-medium text-gold">
              {COMPLETE_PCT}% off
            </span>
          </div>
          <p className="mt-3 text-[14px] text-white/60">
            One payment · yours to keep · updates included
          </p>

          {/* The only comparison, and it is subtraction. */}
          <table className="mt-8 w-full max-w-md text-[14.5px]">
            <caption className="sr-only">Every paid product bought separately, against {COMPLETE.name}</caption>
            <tbody className="tabular-nums">
              <tr className="border-t border-white/10">
                <th scope="row" className="py-3 pr-3 text-left font-normal text-white/60">Every paid product, one at a time</th>
                <td className="py-3 text-right text-white/60">{money(APART)}</td>
              </tr>
              <tr className="border-t border-white/10">
                <th scope="row" className="py-3 pr-3 text-left font-medium text-white">{COMPLETE.name}</th>
                <td className="py-3 text-right font-medium text-white">{money(COMPLETE.now)}</td>
              </tr>
              <tr className="border-t border-white/25">
                <th scope="row" className="py-3 pr-3 text-left font-normal text-gold">You keep</th>
                <td className="py-3 text-right font-medium text-gold">{money(COMPLETE_SAVING)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 flex flex-wrap gap-3">
            <BuyButton slug={COMPLETE.key} />
            <Link href="/pricing" className="btn border border-white/25 bg-transparent text-white hover:border-white">
              Every price
            </Link>
          </div>
          <CtaNote tone="dark" className="mt-3.5" />
        </Reveal>
      </div>

      {/* ----------------------------------------------------------- inside */}
      <div className="wrap relative pb-20 lg:pb-24">
        <Reveal className="grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {SHELVES.map((s) => (
            <div key={s.info.key}>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/55">{s.info.name}</p>
              <ul className="mt-3.5 space-y-2">
                {s.products.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/products/${p.slug}`}
                      className="text-[15px] text-white/80 underline decoration-white/0 underline-offset-4 transition-colors hover:text-white hover:decoration-gold"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

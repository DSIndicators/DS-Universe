import Image from "next/image";
import { NT_ASSETS, NT_LINKS } from "@/content/ninjatrader";

/**
 * "Test it on your own charts first" — on every product page, under the price.
 *
 * WHY IT IS HERE, in this order:
 *  1. It is the honest advice. Nobody should judge an indicator from four
 *     screenshots; they should watch it behave in their own instrument and
 *     timeframe before it goes anywhere near a live account.
 *  2. It is the right posture for a vendor review. NinjaTrader's guidelines ask
 *     for reward balanced against risk on every claim; a page that ends by
 *     telling you to simulate first is that balance, made concrete.
 *  3. Both ways of testing are free on NinjaTrader, which is where the partner
 *     link earns its place — it is the answer to "how do I test this", not an
 *     advert bolted onto the page.
 *
 * The wording is deliberately conditional — "may", "could", never "will" — and
 * it never suggests a result. The note about simulated fills is not a
 * throwaway: it is the plain-English half of the hypothetical performance
 * disclosure the footer carries in full.
 */
export function TestFirst({ productName }: { productName: string }) {
  const steps = [
    {
      n: "01",
      title: "Replay a session you have already seen",
      text: `Market Replay runs a past session back tick by tick, at whatever speed you like. You get to watch ${productName} print in conditions you remember, and pause on the bars where it mattered.`,
    },
    {
      n: "02",
      title: "Then trade it forward, on the simulator",
      text: "Replay shows you the past with the ending already known. The simulator does not — it runs live, in real time, on real prices, with nothing at stake. That is where you find out whether you can actually act on what you are seeing.",
    },
  ];

  return (
    <section className="border-t border-line bg-mist">
      <div className="wrap py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            {/* The wordmark says whose platform this is before a word is read,
                and it links where the buttons do. Official artwork, unmodified,
                with its required 18px of clear space on every side. */}
            <a
              href={NT_LINKS.partner}
              target="_blank"
              rel="sponsored noopener"
              className="inline-block py-[18px] pr-[18px]"
              aria-label="NinjaTrader — visit ninjatrader.com"
            >
              <Image
                src={NT_ASSETS.wordmark}
                alt="NinjaTrader"
                width={2376}
                height={300}
                sizes="180px"
                className="h-7 w-auto"
              />
            </a>
            <h2 className="display-md mt-2 text-ink text-balance">
              Test it on your own charts first.
            </h2>
            <p className="body mt-5 max-w-md text-pretty">
              Four screenshots and a paragraph are not enough to judge an indicator on. Watch it
              work in your own instrument, on your own timeframe, before it goes anywhere near a
              live account. Both ways of doing that are free.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={NT_LINKS.partner}
                target="_blank"
                rel="sponsored noopener"
                className="btn-primary"
              >
                Get NinjaTrader free
              </a>
              <a href={NT_LINKS.simulator} target="_blank" rel="sponsored noopener" className="btn-ghost">
                About the simulator
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <ol className="space-y-8">
              {steps.map((s) => (
                <li key={s.n} className="border-t border-line-strong pt-6">
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-[15px] tabular-nums text-gold-deep">{s.n}</span>
                    <h3 className="display-sm text-ink">{s.title}</h3>
                  </div>
                  <p className="mt-3 text-[15.5px] leading-relaxed text-slate text-pretty">{s.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 border-t border-line pt-6 text-[15px] leading-relaxed text-slate text-pretty">
              A simulated fill is not a live fill. Replay and the simulator cannot reproduce real
              queue position, slippage, or what it feels like to hold a position with money on it,
              and results from either may differ materially from live trading. Test to learn how a
              tool behaves — not to estimate what it might return.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

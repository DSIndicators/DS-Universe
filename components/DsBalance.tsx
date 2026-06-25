import { Reveal } from "@/components/ui/Reveal";

/**
 * DS Balance — the VWAP dealing-range read. The live UI is shown as the real
 * gold DS Balance panel capture (replacing the older coded cockpit mockup);
 * the explanation, three state cards and closer stay as the surrounding copy.
 */
const PREMIUM = "#f0892e";
const EQUI = "#f0c878";
const DISCOUNT = "#b98f3a";

const CARDS = [
  {
    tag: "Upper Runway",
    name: "Premium",
    sub: "Price is expensive",
    chip: ["87.83%", "−", "RSI 71.8"],
    color: PREMIUM,
    body: "Price has climbed near the ceiling, far above the midpoint, and RSI is overbought (above 70). The − flags the sell-side edge — the engine watches for reversion back toward value.",
    benefit: "Stops you chasing longs into a stretched tape. This is where you hunt shorts back toward value off the orange ceiling.",
  },
  {
    tag: "Mid Runway",
    name: "Equilibrium",
    sub: "Price is at fair value",
    chip: ["49.00%", "+", "RSI 49.4"],
    color: EQUI,
    body: "Price sits dead center of the runway with RSI neutral. There's no stretch to trade against in either direction.",
    benefit: "The stand-aside read. Reversion pays poorly from the middle, so this saves you from forcing trades in the dead zone — wait for an edge.",
  },
  {
    tag: "Lower Runway",
    name: "Discount",
    sub: "Price is cheap",
    chip: ["22.00%", "+", "RSI 27.4"],
    color: DISCOUNT,
    body: "Price has dropped near the floor, well below the midpoint, and RSI is oversold (below 30). The + flags the buy-side edge — reversion back up toward value.",
    benefit: "Your buy-the-dip read. You look for longs back toward value off the teal floor, on BOS confirmation rather than catching the knife.",
  },
];

export function DsBalance() {
  return (
    <div className="relative mt-12">
      {/* Ambient premium glow */}
      <div className="pointer-events-none absolute left-1/2 top-6 -z-10 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-[#8a6a2e]/12 blur-[100px]" />

      {/* Explanation + live panel, side by side */}
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Heading + explanation */}
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[#f0c878]">
            <span className="h-px w-6 bg-[#f0c878]/60" />
            DS Systems · VWAP Dealing Range
          </span>
          <h2 className="font-sans text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            <span className="text-ink-white">DS </span>
            <span className="text-[#f0c878] [text-shadow:0_0_24px_rgba(244, 205, 122,0.45)]">
              Balance
            </span>
          </h2>
          <p className="text-base leading-relaxed text-ink-gray sm:text-lg">
            Price spends most of the session rotating around value. DS Balance reads
            that rotation in one glance —{" "}
            <span className="text-ink-white">cheap, fair, or expensive</span> — and
            points to the side the edge sits on. One runway, one price moving through
            it, every field in agreement.
          </p>
        </div>

        {/* Live cockpit */}
        <Reveal className="flex flex-col items-center gap-3">
          {/* The real DS Balance panel — clean UI, universal bar timer. */}
          <figure className="relative w-full max-w-[340px] overflow-hidden rounded-2xl border border-[#f0c878]/20 bg-[#060409] shadow-[0_30px_70px_-40px_rgba(138,106,46,0.9)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-8 -top-16 h-40 bg-[#f0c878]/12 opacity-70 blur-3xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/showcase/balance-ui.png"
              alt="The DS Balance panel — premium / value / discount runway with %B, RSI and VWAP all aligned on one read."
              width={628}
              height={700}
              loading="lazy"
              decoding="async"
              className="relative block w-full"
            />
          </figure>
          <p className="max-w-md text-center text-xs leading-relaxed text-ink-gray/70">
            The&nbsp;% is where price sits inside the Bollinger Band — 100% pinned to
            the upper band, 0% at the lower band, 50% in the middle. A position in the
            band, not an amount of premium or discount.
          </p>
        </Reveal>
      </div>

      {/* State cards */}
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {CARDS.map((c, i) => (
          <Reveal key={c.name} delay={(i % 3) * 0.08} className="h-full">
            <article
              className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#e3b24f]/[0.06] p-6 sm:p-7"
              style={{
                borderTop: `2px solid ${c.color}`,
                background: "linear-gradient(180deg, #0b0a07, #0a0908 60%)",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-28"
                style={{
                  background: `radial-gradient(120% 80% at 0% 0%, ${c.color}24, transparent 70%)`,
                }}
              />
              <div
                className="relative flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.22em]"
                style={{ color: c.color }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: c.color, boxShadow: `0 0 10px ${c.color}` }}
                />
                {c.tag}
              </div>
              <h3 className="relative mt-3 font-sans text-2xl font-bold uppercase tracking-wide text-ink-white">
                {c.name}
              </h3>
              <p className="relative mt-1 text-xs font-semibold text-ink-gray">
                {c.sub}
              </p>
              <div className="relative mt-4 inline-flex w-fit gap-3 rounded-lg border border-[#e3b24f]/[0.06] bg-[#060409]/60 px-3 py-2 font-mono text-xs text-ink-white">
                {c.chip.map((x, j) => (
                  <span key={j}>{x}</span>
                ))}
              </div>
              <p className="relative mt-4 text-sm leading-relaxed text-ink-white/90">
                {c.body}
              </p>
              <div className="relative my-4 h-px bg-white/[0.08]" />
              <p className="relative mb-1.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ink-gray/55">
                What it does for you
              </p>
              <p className="relative mt-auto text-sm leading-relaxed text-ink-gray">
                {c.benefit}
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      {/* Closer */}
      <Reveal className="mt-6">
        <div className="grid grid-cols-[auto_1fr] items-center gap-7 rounded-2xl border border-[#e3b24f]/[0.06] bg-[#0a0908] px-7 py-7 sm:px-9">
          <span
            aria-hidden
            className="h-12 w-12 shrink-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 50% 40%, #ffb36b, #f0892e 60%, #7a3a0e)",
              boxShadow: "0 0 30px 4px rgba(240,137,46,0.5)",
            }}
          />
          <div>
            <h3 className="font-sans text-lg font-semibold uppercase tracking-wide text-ink-white">
              One read that always agrees with itself
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-gray">
              Because the percentage, zone, sign and RSI all come off the same VWAP
              ±σ runway, they can&apos;t contradict each other — you&apos;ll never
              see a Premium label paired with a buy bias.{" "}
              <span className="text-ink-white">
                Buy the discount, sell the premium, stand aside at equilibrium.
              </span>{" "}
              The single orange glow dot prints only where the Bollinger Band and
              RSI line up on the same candle — price stretched to the band&apos;s
              edge at the moment momentum turns. Location and timing confirm each
              other on one mark, so you&apos;re reading the turn instead of guessing
              it or catching a falling knife.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

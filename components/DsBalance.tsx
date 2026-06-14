"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";

/**
 * DS Balance — the VWAP dealing-range read, ported from the DS Balance explainer
 * and condensed for the page: a live "cockpit" runway panel that cycles through
 * Discount → Equilibrium → Premium, three state cards, and the closer. The
 * heavier decode table and live clock from the source are intentionally dropped
 * so the section stays clean.
 */
const PREMIUM = "#f0892e";
const EQUI = "#b074ff";
const DISCOUNT = "#34cba1";

type State = {
  pct: string;
  zone: string;
  sign: string;
  rsi: string;
  price: string;
  color: string;
  mark: number; // % from top of the runway (low price = lower = higher %)
};

const STATES: State[] = [
  { pct: "22.00%", zone: "DISCOUNT", sign: "+", rsi: "34.2", price: "29916.00", color: DISCOUNT, mark: 78 },
  { pct: "49.00%", zone: "EQUILIBRIUM", sign: "+", rsi: "49.4", price: "29997.00", color: EQUI, mark: 51 },
  { pct: "87.83%", zone: "PREMIUM", sign: "−", rsi: "71.8", price: "30113.50", color: PREMIUM, mark: 12 },
];
const RUN_HIGH = "30150.00";
const RUN_LOW = "29850.00";

const CARDS = [
  {
    tag: "Upper Runway",
    name: "Premium",
    sub: "Price is expensive",
    chip: ["87.83%", "−", "RSI 71.8"],
    color: PREMIUM,
    body: "Price has climbed near the ceiling, far above the midpoint, and RSI is overbought. The − flags the sell-side edge — the engine watches for reversion back toward value.",
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
    chip: ["22.00%", "+", "RSI 34.2"],
    color: DISCOUNT,
    body: "Price has dropped near the floor, well below the midpoint, and RSI is oversold. The + flags the buy-side edge — reversion back up toward value.",
    benefit: "Your buy-the-dip read. You look for longs back toward value off the teal floor, on BOS confirmation rather than catching the knife.",
  },
];

function Cockpit() {
  const [i, setI] = useState(1); // open on Equilibrium

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((p) => (p + 1) % STATES.length), 3500);
    return () => clearInterval(id);
  }, []);

  const s = STATES[i];

  return (
    <div
      role="img"
      aria-label={`DS Balance cockpit — ${s.zone}, ${s.pct}`}
      className="grid w-full max-w-[400px] grid-cols-[auto_1fr] items-center gap-7 rounded-2xl border border-[#b074ff]/20 bg-[#060409] px-7 py-8 shadow-[0_30px_70px_-40px_rgba(122,63,176,0.9)]"
    >
      {/* Runway */}
      <div
        className="relative mx-auto h-56 w-1.5 rounded-full"
        style={{
          background:
            "linear-gradient(180deg, rgba(240,137,46,.7), rgba(176,116,255,.5) 50%, rgba(52,203,161,.7))",
        }}
      >
        <span
          className="absolute left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0a0710] bg-[#ece6f5] transition-[top,box-shadow] duration-700 ease-[cubic-bezier(.5,0,.2,1)]"
          style={{ top: `${s.mark}%`, boxShadow: `0 0 14px ${s.color}` }}
        />
      </div>

      {/* Readout */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span
          className="font-sans text-[2.6rem] font-extrabold leading-none tracking-tight transition-colors duration-500"
          style={{ color: s.color, textShadow: `0 0 26px ${s.color}88` }}
        >
          {s.pct}
        </span>
        <span
          className="flex items-center gap-3 font-sans text-sm font-semibold uppercase tracking-[0.34em] transition-colors duration-500"
          style={{ color: s.color }}
        >
          {s.zone}
          <span className="font-mono text-base text-ink-gray">{s.sign}</span>
        </span>
        <span className="mt-2 font-mono text-[0.7rem] tracking-wide" style={{ color: EQUI }}>
          MNQ · 1m · RSI {s.rsi}
        </span>
        <span className="mt-2 font-mono text-base text-ink-white">{s.price}</span>
        <span className="mt-1 flex gap-5 font-mono text-sm">
          <span style={{ color: PREMIUM }}>
            {RUN_HIGH}
            <sup className="text-[0.5rem] opacity-80">H</sup>
          </span>
          <span style={{ color: DISCOUNT }}>
            {RUN_LOW}
            <sup className="text-[0.5rem] opacity-80">L</sup>
          </span>
        </span>
      </div>
    </div>
  );
}

export function DsBalance() {
  return (
    <div className="relative mt-24">
      {/* Ambient premium glow */}
      <div className="pointer-events-none absolute left-1/2 top-6 -z-10 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-[#7a3fb0]/12 blur-[100px]" />

      {/* Heading */}
      <div className="flex max-w-2xl flex-col gap-4">
        <span className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[#b074ff]">
          <span className="h-px w-6 bg-[#b074ff]/60" />
          DS Systems · VWAP Dealing Range
        </span>
        <h2 className="font-sans text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
          <span className="text-ink-white">DS </span>
          <span className="text-[#b074ff] [text-shadow:0_0_24px_rgba(176,116,255,0.45)]">
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
      <Reveal className="mt-10 flex flex-col items-center gap-3">
        <Cockpit />
        <p className="max-w-md text-center text-xs leading-relaxed text-ink-gray/70">
          The&nbsp;% is where price sits inside the Bollinger Band — 100% pinned to
          the upper band, 0% at the lower band, 50% in the middle. A position in the
          band, not an amount of premium or discount.
        </p>
      </Reveal>

      {/* State cards */}
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        {CARDS.map((c, i) => (
          <Reveal key={c.name} delay={(i % 3) * 0.08} className="h-full">
            <article
              className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] p-6 sm:p-7"
              style={{
                borderTop: `2px solid ${c.color}`,
                background: "linear-gradient(180deg, #180f28, #130c20 60%)",
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
              <div className="relative mt-4 inline-flex w-fit gap-3 rounded-lg border border-white/[0.08] bg-[#060409]/60 px-3 py-2 font-mono text-xs text-ink-white">
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
        <div className="grid grid-cols-[auto_1fr] items-center gap-7 rounded-2xl border border-white/[0.08] bg-[#130c20] px-7 py-7 sm:px-9">
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
              The single orange glow dot only prints once the RSI + Bollinger BOS
              engine confirms the turn — so context and timing land together.
            </p>
          </div>
        </div>
      </Reveal>

      {/* The ping, in the wild — why the engine fired on this exact spot. */}
      <Reveal className="mt-6">
        <figure className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#040406] shadow-glow">
          <div className="bg-ai pointer-events-none absolute -inset-x-10 -top-24 h-56 opacity-[0.08] blur-3xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/balance/bos-engine-ping.webp"
            alt="A live chart — price rotates down into an 85%-confidence Prime Support zone and the RSI + Bollinger BOS engine pings the exact turn."
            width={2271}
            height={993}
            loading="lazy"
            decoding="async"
            className="relative block w-full"
          />
          <figcaption className="relative border-t border-white/[0.06] p-6 sm:p-7">
            <h3 className="font-sans text-lg font-semibold text-ink-white">
              Why it pinged here.
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-gray">
              Price rotated down into a support shelf the system already trusted — an
              85%-confidence zone — right as it reached the discount end of the band
              with RSI oversold. The instant the RSI + Bollinger BOS engine confirmed
              the turn, the glow dot printed on that exact candle.{" "}
              <span className="text-ink-white">
                That&apos;s the whole edge in one mark:
              </span>{" "}
              you&apos;re not guessing the low or catching a falling knife. The system
              waits for a trusted zone, a stretched band, and a confirmed break of
              structure to line up, then pings the single spot where they agree — a
              precise, confirmed entry with its timing attached, instead of a hopeful
              one.
            </p>
          </figcaption>
        </figure>
      </Reveal>
    </div>
  );
}

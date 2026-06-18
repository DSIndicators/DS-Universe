"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  SHOWCASE,
  pageImages,
  type BrochureId,
  type ShowcaseBrochure,
} from "@/components/data/brochures";
import { cn } from "@/components/ui/cn";

const ACCENT_TEXT: Record<ShowcaseBrochure["accent"], string> = {
  teal: "text-accent-teal",
  cyan: "text-space-cyan",
  violet: "text-space-magenta",
};

export function Showcase() {
  const [activeId, setActiveId] = useState<BrochureId>("systems");

  // Deep-link: /showcase#pnl (or any brochure id) opens that tab on load.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (SHOWCASE.some((b) => b.id === id)) setActiveId(id as BrochureId);
  }, []);

  const active = SHOWCASE.find((b) => b.id === activeId) ?? SHOWCASE[0];
  const pages = pageImages(active);

  return (
    <div className="relative">
      {/* Tab selector — segmented glass control */}
      <div className="mb-10 flex justify-center">
        <div
          role="tablist"
          aria-label="Choose a brochure"
          className="glass relative flex w-full max-w-2xl flex-col gap-1.5 rounded-2xl p-1.5 sm:flex-row"
        >
          {SHOWCASE.map((b) => {
            const selected = b.id === activeId;
            return (
              <button
                key={b.id}
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(b.id)}
                className={cn(
                  "relative flex-1 rounded-xl px-4 py-3 text-center transition-colors duration-300",
                  selected ? "text-ink-white" : "text-ink-gray hover:text-ink-white",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="showcase-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-0 -z-10 rounded-xl border border-white/[0.12] bg-white/[0.07] shadow-glow"
                  />
                )}
                <span className="block font-sans text-sm font-semibold">
                  {b.word}{" "}
                  <span className={selected ? ACCENT_TEXT[b.accent] : ""}>
                    {b.wordMuted}
                  </span>
                </span>
                <span className="mt-0.5 block font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-gray/70">
                  {b.tier}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Header — keyed crossfade (lightweight: opacity only) */}
      <motion.div
        key={active.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-ink-gray/70">
            {active.tierNote}
          </span>
          <h2 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-ink-white">{active.word}</span>{" "}
            <span className="text-ink-gray">{active.wordMuted}</span>
            <span
              className={cn(
                "ml-3 align-middle rounded-full border border-white/[0.12] bg-white/[0.05] px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em]",
                ACCENT_TEXT[active.accent],
              )}
            >
              {active.tier}
            </span>
          </h2>
          <p className="text-ink-gray">{active.line}</p>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-gray/70">
            {active.products}
          </p>
        </div>

      </motion.div>

      {/* Stage: the brochure pages as STATIC images, scrolled inside the frame.
          Each page is a plain webp — nothing recomposites, so scrolling is buttery
          even on long brochures. Pages lazy-load as you reach them. */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-space-deep">
        <div className="max-h-[82vh] min-h-[560px] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
            {pages.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={`${active.word} ${active.wordMuted} brochure — page ${i + 1} of ${active.pages}`}
                width={active.pageW}
                height={active.pageH}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className="block w-full rounded-lg border border-white/[0.06] shadow-glow"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Helper line */}
      <p className="mt-4 text-center text-xs text-ink-gray/60">
        Scroll the pages above to read the full brochure.
      </p>
    </div>
  );
}

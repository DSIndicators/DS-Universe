"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download, ExternalLink, FileText, Maximize2, Play } from "lucide-react";
import { SHOWCASE, type BrochureId, type ShowcaseBrochure } from "@/components/data/brochures";
import { cn } from "@/components/ui/cn";

const ACCENT_TEXT: Record<ShowcaseBrochure["accent"], string> = {
  teal: "text-accent-teal",
  cyan: "text-space-cyan",
  violet: "text-space-magenta",
};

export function Showcase() {
  const [activeId, setActiveId] = useState<BrochureId>("crewmates");
  // The inline PDF viewer is heavy, so it only mounts on demand (one at a time).
  const [viewing, setViewing] = useState(false);
  const active = SHOWCASE.find((b) => b.id === activeId) ?? SHOWCASE[0];

  const selectTab = (id: BrochureId) => {
    setActiveId(id);
    setViewing(false); // reset to the light poster when switching
  };

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
                onClick={() => selectTab(b.id)}
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

        <div className="flex shrink-0 gap-3">
          <Link
            href={active.file}
            target="_blank"
            rel="noopener noreferrer"
            className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-ink-white transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
          >
            <Maximize2 size={15} /> Full screen
          </Link>
          <a
            href={active.file}
            download
            className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-ink-white transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
          >
            <Download size={15} /> Download
          </a>
        </div>
      </motion.div>

      {/* Stage: light poster by default, heavy viewer only after the user opts in */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-space-deep">
        {viewing ? (
          // Solid frame, no backdrop-blur, no motion wrapper — nothing recomposites
          // the PDF layer, so scrolling stays smooth.
          <iframe
            key={active.file}
            src={`${active.file}#view=FitH`}
            title={`${active.word} ${active.wordMuted} brochure`}
            className="h-[82vh] min-h-[560px] w-full bg-space-deep"
          />
        ) : (
          <button
            type="button"
            onClick={() => setViewing(true)}
            className="group flex min-h-[420px] w-full flex-col items-center justify-center gap-5 px-6 py-16 text-center sm:min-h-[520px]"
          >
            {/* static accent glow — no animation */}
            <span className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-space-violet/15 blur-[100px]" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-ink-white transition-transform duration-300 group-hover:scale-110">
              <Play size={24} className="ml-0.5" fill="currentColor" />
            </span>
            <span className="relative flex flex-col items-center gap-1.5">
              <span className="font-sans text-xl font-semibold text-ink-white">
                View the {active.word} {active.wordMuted} Showcase
              </span>
              <span className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-gray/70">
                <FileText size={13} /> {active.pages} pages · loads inline
              </span>
            </span>
          </button>
        )}
      </div>

      {/* Helper line */}
      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-gray/60">
        <ExternalLink size={13} />
        For the smoothest read,{" "}
        <Link
          href={active.file}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-teal hover:underline"
        >
          open it full screen
        </Link>
        .
      </p>
    </div>
  );
}

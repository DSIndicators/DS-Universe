"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, ExternalLink, FileText } from "lucide-react";
import { SHOWCASE, type BrochureId, type ShowcaseBrochure } from "@/components/data/brochures";
import { cn } from "@/components/ui/cn";

const ACCENT_TEXT: Record<ShowcaseBrochure["accent"], string> = {
  teal: "text-accent-teal",
  cyan: "text-space-cyan",
  violet: "text-space-magenta",
};
const ACCENT_GLOW: Record<ShowcaseBrochure["accent"], string> = {
  teal: "bg-accent-teal/20",
  cyan: "bg-space-cyan/20",
  violet: "bg-space-violet/25",
};

export function Showcase() {
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState<BrochureId>("crewmates");
  const active = SHOWCASE.find((b) => b.id === activeId) ?? SHOWCASE[0];

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

      {/* Active brochure */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={reduce ? false : { opacity: 0, y: 14, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.99 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-ink-gray/70">
                {active.tierNote}
              </span>
              <h2 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl">
                <span className="text-ink-white">{active.word}</span>{" "}
                <span className="text-ink-gray">{active.wordMuted}</span>
                <span
                  className={cn(
                    "ml-3 align-middle rounded-full border px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em]",
                    "border-white/[0.12] bg-white/[0.05]",
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
                <ExternalLink size={15} /> Open
              </Link>
              <a
                href={active.file}
                download
                className="glass inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-ink-white transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]"
              >
                <Download size={15} /> Download
              </a>
            </div>
          </div>

          {/* Viewer — iframe triggers the browser's native PDF reader reliably */}
          <div className="glass relative overflow-hidden rounded-2xl p-2 sm:p-3">
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute -inset-10 -z-10 rounded-full opacity-60 blur-3xl",
                ACCENT_GLOW[active.accent],
              )}
            />
            <iframe
              key={active.file}
              src={`${active.file}#view=FitH`}
              title={`${active.word} ${active.wordMuted} brochure`}
              className="h-[82vh] min-h-[560px] w-full rounded-xl bg-space-deep"
            />
            <noscript>
              <Link href={active.file} className="label-caps">
                Open the brochure →
              </Link>
            </noscript>
          </div>

          {/* Tiny fallback line under the viewer */}
          <p className="flex items-center justify-center gap-2 text-xs text-ink-gray/60">
            <FileText size={13} />
            Can&apos;t see the PDF?{" "}
            <Link
              href={active.file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-teal hover:underline"
            >
              Open it in a new tab
            </Link>
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

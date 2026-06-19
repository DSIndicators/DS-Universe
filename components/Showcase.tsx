"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles, X } from "lucide-react";
import {
  GUIDES,
  type GuideId,
  type ShowcaseGuide,
} from "@/components/data/brochures";
import { cn } from "@/components/ui/cn";

type AccentClasses = {
  muted: string;
  badge: string;
  cta: string;
  hoverBorder: string;
  hoverGlow: string;
};

const ACCENT: Record<ShowcaseGuide["accent"], AccentClasses> = {
  violet: {
    muted: "text-space-magenta",
    badge: "border-space-magenta/40 bg-space-magenta/10 text-space-magenta",
    cta: "text-space-magenta",
    hoverBorder: "hover:border-space-magenta/40",
    hoverGlow: "hover:shadow-[0_0_50px_-12px_rgba(176,116,255,0.55)]",
  },
  cyan: {
    muted: "text-space-cyan",
    badge: "border-space-cyan/40 bg-space-cyan/10 text-space-cyan",
    cta: "text-space-cyan",
    hoverBorder: "hover:border-space-cyan/40",
    hoverGlow: "hover:shadow-[0_0_50px_-12px_rgba(95,212,224,0.55)]",
  },
  teal: {
    muted: "text-accent-teal",
    badge: "border-accent-teal/40 bg-accent-teal/10 text-accent-teal",
    cta: "text-accent-teal",
    hoverBorder: "hover:border-accent-teal/40",
    hoverGlow: "hover:shadow-[0_0_50px_-12px_rgba(45,212,191,0.55)]",
  },
  amber: {
    muted: "text-[#ffb986]",
    badge: "border-[#ff9a3c]/40 bg-[#ff9a3c]/10 text-[#ffb986]",
    cta: "text-[#ffb986]",
    hoverBorder: "hover:border-[#ff9a3c]/45",
    hoverGlow: "hover:shadow-[0_0_50px_-12px_rgba(255,154,60,0.55)]",
  },
};

export function Showcase() {
  const [openId, setOpenId] = useState<GuideId | null>(null);
  const open = useCallback((id: GuideId) => {
    setOpenId(id);
    history.replaceState(null, "", `#${id}`);
  }, []);
  const close = useCallback(() => {
    setOpenId(null);
    history.replaceState(null, "", window.location.pathname);
  }, []);

  // Deep-link: /showcase#carepack (or any guide id) opens that guide on load.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (GUIDES.some((g) => g.id === id)) setOpenId(id as GuideId);
  }, []);

  // While the overlay is open: lock body scroll and close on Escape.
  useEffect(() => {
    if (!openId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [openId, close]);

  const openGuide = GUIDES.find((g) => g.id === openId) ?? null;

  return (
    <div className="relative">
      {/* Guide cards — each opens its own immersive guide. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {GUIDES.map((g) => {
          const a = ACCENT[g.accent];
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => open(g.id)}
              aria-label={`Open the ${g.word} ${g.wordMuted} guide`}
              className={cn(
                "group glass relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/[0.08] p-6 text-left transition-all duration-300 hover:-translate-y-1 sm:p-7",
                a.hoverBorder,
                a.hoverGlow,
              )}
            >
              {g.exclusive && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#ff9a3c]/20 blur-3xl"
                />
              )}

              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em]",
                    a.badge,
                  )}
                >
                  {g.exclusive && <Sparkles size={11} />}
                  {g.tier}
                </span>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-gray/60">
                  {g.tierNote}
                </span>
              </div>

              <h3 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
                <span className="text-ink-white">{g.word}</span>{" "}
                <span className={a.muted}>{g.wordMuted}</span>
              </h3>

              <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-gray/70">
                {g.products}
              </p>

              <p className="text-sm leading-relaxed text-ink-gray">{g.line}</p>

              <span
                className={cn(
                  "mt-auto inline-flex items-center gap-1.5 pt-1 font-sans text-sm font-semibold transition-transform duration-300 group-hover:gap-2.5",
                  a.cta,
                )}
              >
                Open the guide
                <ArrowUpRight size={16} />
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-ink-gray/60">
        Each guide opens full-screen — press Esc or tap outside the header to return.
      </p>

      {/* Immersive overlay — the live HTML guide in an iframe. */}
      {openGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${openGuide.word} ${openGuide.wordMuted} guide`}
          className="fixed inset-0 z-[100] flex flex-col bg-space-black/95 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-space-black/80 px-4 py-3 sm:px-6">
            <span className="flex items-center gap-2 font-sans text-sm font-semibold">
              <span className="text-ink-white">{openGuide.word}</span>
              <span className={ACCENT[openGuide.accent].muted}>
                {openGuide.wordMuted}
              </span>
              <span className="hidden font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink-gray/60 sm:inline">
                · Guide
              </span>
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close guide"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-white transition-colors hover:bg-white/[0.12]"
            >
              Close <X size={14} />
            </button>
          </div>
          <iframe
            key={openGuide.id}
            src={openGuide.href}
            title={`${openGuide.word} ${openGuide.wordMuted} — DS Universe guide`}
            className="h-full w-full flex-1 border-0 bg-[#07050d]"
          />
        </motion.div>
      )}
    </div>
  );
}

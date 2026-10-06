"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Series } from "@/content/products";
import { COMPLETE_SHELVES } from "@/content/release";

/**
 * The shared state of the DS Complete panel: which part of the lineup is being
 * pointed at, and how far the chart has built. The chart and the list are two
 * separate columns; this is what makes them one instrument.
 *
 * WHO SET THE FOCUS matters (2026-09-29). On a desktop the list beside the
 * chart drives it by hover. On a phone there is no hover, and the list sits a
 * screen below the chart, so the chart carries its own controls and, while
 * nobody touches it, tours the products by itself. The list only mirrors a
 * focus it set itself (`source: "hover"`) — a phone's price list never
 * flickers along with the tour.
 */
export type { Series } from "@/content/products";
/** The build runs in the list's own order — the series DS Complete holds
 *  (content/release.ts COMPLETE_SHELVES), so each step lights its row. The
 *  Free Vault is not among them: nothing free is drawn as part of the bundle. */
export const BUILD_ORDER: Series[] = COMPLETE_SHELVES.map((s) => s.info.key);

export type Focus = { series: Series; slug?: string; source: "hover" | "tap" | "tour" } | null;

type Stage = {
  focus: Focus;
  setFocus: (f: Focus) => void;
  /** 0 = nothing built yet (server render; a <noscript> rule shows it all
   *  without JavaScript), 1..n = that many series drawn, n + 1 = done. */
  step: number;
  setStep: (n: number) => void;
};

const Ctx = createContext<Stage>({ focus: null, setFocus: () => {}, step: 0, setStep: () => {} });

export function CompleteStage({ children }: { children: ReactNode }) {
  const [focus, setFocus] = useState<Focus>(null);
  const [step, setStep] = useState(0);
  return <Ctx.Provider value={{ focus, setFocus, step, setStep }}>{children}</Ctx.Provider>;
}

export const useCompleteStage = () => useContext(Ctx);

/** Is this series' layer shown yet, and is it the one being built right now? */
export function built(series: Series, step: number) {
  const i = BUILD_ORDER.indexOf(series);
  return { shown: i < step, building: step <= BUILD_ORDER.length && i === step - 1 };
}

/** Every product in the list's order: series by series, as the shelves run. */
export const SEQUENCE: { slug: string; series: Series }[] = COMPLETE_SHELVES.flatMap((s) =>
  s.products.map((p) => ({ slug: p.slug, series: s.info.key })),
);

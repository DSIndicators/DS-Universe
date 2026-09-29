"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * The shared state of the DS Complete panel: which part of the lineup the
 * visitor is pointing at (the list on the right) and how far the chart on the
 * left has built. The chart and the list are two separate columns; this is
 * what makes them one instrument.
 */
export type Series = "flagship" | "pro" | "essentials" | "utility";
/** The build runs in the list's own order, so each step lights its row. */
export const BUILD_ORDER: Series[] = ["flagship", "pro", "essentials", "utility"];

export type Focus = { series: Series; slug?: string } | null;

type Stage = {
  focus: Focus;
  setFocus: (f: Focus) => void;
  /** 0 = nothing built yet (server render; a <noscript> rule shows it all
   *  without JavaScript), 1..4 = that many series drawn, 5 = done. */
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

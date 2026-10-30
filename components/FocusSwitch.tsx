"use client";

import { useEffect, useState } from "react";

/**
 * The visitor's switch for TYPOGRAPHY FIXATION (bionic/transform.ts): the
 * first letters of each word set heavier so the eye fixes on them. Off is one
 * class on <html> ("bio-off"); CSS then sets every fixation run back to the
 * text's own weight, so nothing re-renders and nothing moves.
 *
 * OFF BY DEFAULT (Tom, 2026-10-29: "turn default bionic reading OFF. allow
 * users to enable it"). The server sends <html class="bio-off">; the inline
 * script in app/layout.tsx lifts it before first paint only for a visitor who
 * turned it on. Remembered per browser under the key "ds-bionic".
 *
 * NAME (Tom, 2026-10-30: "rename it instead to typography fixation to avoid
 * all legal problems"). "Bionic Reading" is a registered trademark of Bionic
 * Reading AG, so the name appears nowhere a visitor can see it: not on the
 * switch, not in its labels, not in the footer or disclosures. It was "Focus"
 * until 2026-10-29, which visitors did not understand.
 *
 * Three places, one state, kept in step by a window event:
 *  - header: a small square (filled = on) and the words, left of Home
 *  - hero:   the same switch above the home title on phones and tablets, where
 *            the header has no room (Tom: "put a switch above the title on phone")
 *  - footer: "Typography fixation  On / Off" (also in the phone Menu sheet)
 * The words preview the mode: their first letters are heavy only while on. On
 * mid-width screens the header says just "Fixation" so the nav never wraps or
 * runs into the logo; the full name stays in the accessible label and tooltip.
 */
const EVT = "ds-bionic";
export const BIONIC_KEY = "ds-bionic";

export function FocusSwitch({ variant = "footer" }: { variant?: "header" | "hero" | "footer" }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(!document.documentElement.classList.contains("bio-off"));
    sync();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  const flip = () => {
    const next = !on;
    document.documentElement.classList.toggle("bio-off", !next);
    try {
      localStorage.setItem(BIONIC_KEY, next ? "on" : "off");
    } catch {}
    window.dispatchEvent(new Event(EVT));
  };
  const label = on
    ? "Typography fixation is on: the start of each word is set in bold to guide the eye. Turn it off"
    : "Typography fixation is off. Turn it on to set the start of each word in bold and guide the eye";
  if (variant === "header" || variant === "hero") {
    return (
      <button type="button" className={variant === "header" ? "hdr-focus" : "hdr-focus hero-bionic"} aria-pressed={on} aria-label={label} title={label} onClick={flip} data-on={on}>
        <span className="hdr-focus-box" aria-hidden="true" />
        <span className="hdr-focus-word" aria-hidden="true" data-nobio="">
          <span className="lbl-full">
            <b>Typo</b>graphy <b>fix</b>ation
          </span>
          <span className="lbl-short">
            <b>Fix</b>ation
          </span>
        </span>
        {variant === "hero" && (
          <span className="hero-bionic-state" aria-hidden="true" data-nobio="">
            {on ? "On" : "Off"}
          </span>
        )}
      </button>
    );
  }
  return (
    <button type="button" className="focus-switch" aria-pressed={on} aria-label={label} onClick={flip}>
      <span data-nobio="">Typography fixation</span>
      <span className="focus-state" data-nobio="">{on ? "On" : "Off"}</span>
    </button>
  );
}

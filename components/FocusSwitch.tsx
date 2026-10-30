"use client";

import { useEffect, useState } from "react";

/**
 * The visitor's switch for bionic reading (bionic/transform.ts): the first
 * letters of each word set heavier so the eye fixes on them. Off is one class
 * on <html> ("bio-off"); CSS then sets every fixation run back to the text's
 * own weight, so nothing re-renders and nothing moves.
 *
 * OFF BY DEFAULT (Tom, 2026-10-29: "turn default bionic reading OFF. allow
 * users to enable it" — visitors who had never met bionic reading thought the
 * site was broken). The server sends <html class="bio-off">; the inline script
 * in app/layout.tsx lifts it before first paint only for a visitor who turned
 * it on. Remembered per browser under its own key, "ds-bionic" (the old
 * "ds-focus" key recorded opt-OUTs from the on-by-default days and is ignored).
 *
 * Named "Bionic reading" everywhere (Tom, same day: rename "Focus" so users
 * know what it is). Three places, one state, kept in step by a window event:
 *  - header: a small square (filled = on) and the words, left of Home
 *  - hero:   the same switch above the home title on phones, where the
 *            header has no room for it (Tom: "put a switch above the title on
 *            phone")
 *  - footer: "Bionic reading  On / Off" (also in the phone Menu sheet)
 * The header and hero words preview the mode: "Bio" is heavy only while on.
 * On mid-width screens the header says just "Bionic" (the word "reading"
 * drops) so the nav never wraps or runs into the logo; the full name stays in
 * the button's accessible label and tooltip.
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
    ? "Bionic reading is on: the start of each word is set in bold to guide the eye. Turn it off"
    : "Bionic reading is off. Turn it on to set the start of each word in bold and guide the eye";
  if (variant === "header" || variant === "hero") {
    return (
      <button type="button" className={variant === "header" ? "hdr-focus" : "hdr-focus hero-bionic"} aria-pressed={on} aria-label={label} title={label} onClick={flip} data-on={on}>
        <span className="hdr-focus-box" aria-hidden="true" />
        <span className="hdr-focus-word" aria-hidden="true" data-nobio="">
          <b>Bio</b>nic<span className="hdr-focus-more"> reading</span>
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
      <span data-nobio="">Bionic reading</span>
      <span className="focus-state" data-nobio="">{on ? "On" : "Off"}</span>
    </button>
  );
}

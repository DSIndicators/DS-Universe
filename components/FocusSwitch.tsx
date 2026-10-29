"use client";

import { useEffect, useState } from "react";

/**
 * The visitor's switch for focus reading (bionic/transform.ts). Off adds one
 * class to <html>; CSS then sets every fixation run back to the text's own
 * weight, so nothing re-renders and nothing moves. Remembered per browser
 * (a convenience only: without storage it simply starts on). The class is
 * set before first paint by the inline script in app/layout.tsx.
 *
 * Two places, one state (Tom, 2026-10-27: "a little bionic reading on/off
 * button, besides the home button"): the header's compact switch and the
 * footer's line. Flipping either tells the other through a window event.
 *
 * The header's word previews the mode: "Fo" is heavy when it is on, plain when
 * it is off, beside a small square that is filled when on.
 */
const EVT = "ds-focus";

export function FocusSwitch({ variant = "footer" }: { variant?: "header" | "footer" }) {
  const [on, setOn] = useState(true);
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
      localStorage.setItem("ds-focus", next ? "on" : "off");
    } catch {}
    window.dispatchEvent(new Event(EVT));
  };
  const label = on ? "Focus reading is on. Turn it off" : "Focus reading is off. Turn it on";
  if (variant === "header") {
    return (
      <button type="button" className="hdr-focus" aria-pressed={on} aria-label={label} title={label} onClick={flip} data-on={on}>
        <span className="hdr-focus-box" aria-hidden="true" />
        <span className="hdr-focus-word" aria-hidden="true" data-nobio="">
          <b>Fo</b>cus
        </span>
      </button>
    );
  }
  return (
    <button type="button" className="focus-switch" aria-pressed={on} onClick={flip}>
      <span data-nobio="">Focus reading</span>
      <span className="focus-state" data-nobio="">{on ? "On" : "Off"}</span>
    </button>
  );
}

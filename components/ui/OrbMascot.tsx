"use client";

import { useEffect, useRef } from "react";
import { OrbCape } from "@/components/ui/OrbCape";
import { OrbMouth } from "@/components/ui/OrbMouth";

/**
 * A mini DS Universe orb that cruises the background "in space" with cute kawaii
 * eyes. The body bobs gently; the dark eyes curiously glance to the side (never
 * lock forward), blink softly, and the mouth shifts between expressions once in
 * a while. One rAF, transform/attribute writes only, no React re-renders. Fully
 * static under prefers-reduced-motion.
 */
export function OrbMascot() {
  const wrap = useRef<HTMLDivElement>(null);
  const eyes = useRef<HTMLDivElement>(null);
  const pL = useRef<HTMLSpanElement>(null);
  const pR = useRef<HTMLSpanElement>(null);
  const mouth = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = wrap.current;
    if (!w) return;
    const SIZE = 84;
    const M = 48;
    const vw = () => window.innerWidth;
    const vh = () => window.innerHeight;

    // The orb cruises left ↔ right across the page, dwelling beside the panels
    // on each side before gliding back — it keeps to the margins instead of
    // sitting in the center where it would cover content. Vertical is a
    // barely-there bob. One rAF, transform writes only.
    const startedAt = performance.now();
    const place = (px: number, py: number) => {
      w.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
    };

    const TAU = Math.PI * 2;
    const DWELL = 53; // seconds parked beside a panel
    const MOVE = 7; // seconds gliding across → one crossing per minute
    const PERIOD = (DWELL + MOVE) * 2;
    const smooth = (p: number) => p * p * (3 - 2 * p); // ease in + out
    const compute = (now: number) => {
      const t = (now - startedAt) / 1000;
      const left = M;
      const right = vw() - SIZE - M;
      const ay = Math.min(46, vh() * 0.06);
      const cy = vh() * 0.46 - SIZE / 2;
      const tt = ((t % PERIOD) + PERIOD) % PERIOD;
      let xn: number; // 0 = parked left, 1 = parked right
      if (tt < DWELL) xn = 0;
      else if (tt < DWELL + MOVE) xn = smooth((tt - DWELL) / MOVE);
      else if (tt < 2 * DWELL + MOVE) xn = 1;
      else xn = 1 - smooth((tt - (2 * DWELL + MOVE)) / MOVE);
      const px = left + (right - left) * xn;
      const py = cy + ay * Math.sin((t / 6.5) * TAU);
      return { px, py, t };
    };

    const init = compute(startedAt);
    place(init.px, init.py);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Eyes curiously glance around at the panels on screen (never lock forward),
    // smoothly easing from one to the next. Soft, CSS-eased blinks.
    let lx = 0;
    let ly = 0;
    let tlx = 0;
    let tly = 0;
    let raf = 0;
    let lookT = 900;
    let blinkT = 4200;
    let blinking = false;
    let blinkUntil = 0;
    let exprT = 4200;
    let last = startedAt;

    // Mostly happy, with the odd neutral / sad / playful beat — cross-faded by
    // the CSS transition on the mouth shapes for a smooth change of expression.
    const EXPRS = ["happy", "happy", "happy", "neutral", "sad", "playful"];
    const setExpr = (e: string) => {
      if (mouth.current) mouth.current.dataset.expr = e;
    };

    // A lazy random glance to the side — no DOM reads, no forced layout. The orb
    // is a faint background element, so targeting on-screen panels isn't worth a
    // periodic layout pass (a real stutter risk on a long page).
    const pickLook = () => {
      tlx = Math.random() * 2 - 1;
      tly = (Math.random() * 2 - 1) * 0.6;
    };
    pickLook();

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      const c = compute(now); // once per frame — no extra allocations
      place(c.px, c.py);

      lookT -= dt;
      if (lookT <= 0) {
        pickLook();
        lookT = 2600 + Math.random() * 2600; // glance somewhere new
      }
      lx += (tlx - lx) * 0.08;
      ly += (tly - ly) * 0.08;

      blinkT -= dt;
      if (!blinking && blinkT <= 0) {
        blinking = true;
        blinkUntil = now + 110;
        blinkT = 3500 + Math.random() * 3500;
      }
      if (blinking && now > blinkUntil) blinking = false;

      exprT -= dt;
      if (exprT <= 0) {
        setExpr(EXPRS[Math.floor(Math.random() * EXPRS.length)]);
        exprT = 4500 + Math.random() * 4500;
      }

      const pt = `translate(${(lx * 4).toFixed(1)}px, ${(ly * 4).toFixed(1)}px)`;
      if (pL.current) pL.current.style.transform = pt;
      if (pR.current) pR.current.style.transform = pt;
      // CSS transition on .orb-mascot-eyes eases the scaleY → smooth blink.
      if (eyes.current) eyes.current.style.transform = `scaleY(${blinking ? 0.12 : 1})`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrap} aria-hidden className="orb-mascot">
      <span className="orb-cape">
        <OrbCape />
      </span>
      <div className="orb-mascot-body">
        <div ref={eyes} className="orb-mascot-eyes">
          <span className="orb-eye">
            <span ref={pL} className="orb-pupil">
              <span className="orb-shine" />
            </span>
          </span>
          <span className="orb-eye">
            <span ref={pR} className="orb-pupil">
              <span className="orb-shine" />
            </span>
          </span>
        </div>
        <OrbMouth ref={mouth} />
      </div>
    </div>
  );
}

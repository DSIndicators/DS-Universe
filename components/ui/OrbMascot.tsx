"use client";

import { useEffect, useRef } from "react";

/**
 * A mini DS Universe orb that drifts through the background "in space" with
 * cute eyes — like the Las Vegas Sphere. It wanders to random spots and its
 * pupils glance at random panels, then blinks. One rAF, transform-only writes,
 * no React re-renders. Fully static under prefers-reduced-motion.
 */
export function OrbMascot() {
  const wrap = useRef<HTMLDivElement>(null);
  const eyes = useRef<HTMLDivElement>(null);
  const pL = useRef<HTMLSpanElement>(null);
  const pR = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const w = wrap.current;
    if (!w) return;
    const SIZE = 84;
    const M = 40;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const vw = () => window.innerWidth;
    const vh = () => window.innerHeight;

    let px = rand(M, vw() - SIZE - M);
    let py = rand(vh() * 0.28, vh() * 0.62);
    let tx = px;
    let ty = py;
    let lx = 0;
    let ly = 0;
    let tlx = 0;
    let tly = 0;

    const place = () => {
      w.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
    };
    place();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const pickMove = () => {
      tx = rand(M, vw() - SIZE - M);
      ty = rand(M + 60, vh() - SIZE - M);
    };
    const pickLook = () => {
      const cx = px + SIZE / 2;
      const cy = py + SIZE / 2;
      const els = Array.from(
        document.querySelectorAll<HTMLElement>("h2, h3, .glass"),
      ).filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.top < vh();
      });
      if (els.length) {
        const r = els[Math.floor(Math.random() * els.length)].getBoundingClientRect();
        const dx = r.left + r.width / 2 - cx;
        const dy = r.top + r.height / 2 - cy;
        const m = Math.hypot(dx, dy) || 1;
        tlx = Math.max(-1, Math.min(1, dx / m));
        tly = Math.max(-1, Math.min(1, dy / m));
      } else {
        tlx = rand(-1, 1);
        tly = rand(-0.6, 0.6);
      }
    };
    pickLook();

    let raf = 0;
    let last = performance.now();
    let moveT = 1500;
    let lookT = 2000;
    let blinkT = 4000;
    let blinking = false;
    let blinkUntil = 0;

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      moveT -= dt;
      lookT -= dt;
      blinkT -= dt;
      if (moveT <= 0) {
        pickMove();
        moveT = rand(5500, 9500);
      }
      if (lookT <= 0) {
        pickLook();
        lookT = rand(2400, 4200);
      }
      if (!blinking && blinkT <= 0) {
        blinking = true;
        blinkUntil = now + 130;
        blinkT = rand(3500, 7000);
      }
      if (blinking && now > blinkUntil) blinking = false;

      px += (tx - px) * 0.012;
      py += (ty - py) * 0.012;
      lx += (tlx - lx) * 0.07;
      ly += (tly - ly) * 0.07;
      place();

      const pt = `translate(${(lx * 4.5).toFixed(1)}px, ${(ly * 4.5).toFixed(1)}px)`;
      if (pL.current) pL.current.style.transform = pt;
      if (pR.current) pR.current.style.transform = pt;
      if (eyes.current) eyes.current.style.transform = `scaleY(${blinking ? 0.1 : 1})`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrap} aria-hidden className="orb-mascot">
      <div className="orb-mascot-body">
        <div ref={eyes} className="orb-mascot-eyes">
          <span className="orb-eye">
            <span ref={pL} className="orb-pupil" />
          </span>
          <span className="orb-eye">
            <span ref={pR} className="orb-pupil" />
          </span>
        </div>
      </div>
    </div>
  );
}

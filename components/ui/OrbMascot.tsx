"use client";

import { useEffect, useRef } from "react";

/**
 * A mini DS Universe orb that gently hovers in the background "in space" with
 * cute eyes — like the Las Vegas Sphere. The body breathes in place; the pupils
 * curiously glance around at the panels on screen (never lock forward) and blink
 * softly. One rAF, transform-only writes, no React re-renders. Fully static
 * under prefers-reduced-motion.
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
    const M = 48;
    const vw = () => window.innerWidth;
    const vh = () => window.innerHeight;

    // Smooth, perpetual drift along two slow, incommensurate sine waves —
    // it just floats, never jumps or "decides". Amplitudes track the viewport.
    const startedAt = performance.now();
    const phase = Math.random() * 1000;
    const place = (px: number, py: number) => {
      w.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
    };

    const TAU = Math.PI * 2;
    const compute = (now: number) => {
      const t = (now - startedAt) / 1000 + phase;
      // Small amplitudes + long periods → a barely-there gentle hover, never a
      // traverse. It just breathes in place rather than wandering the screen.
      const ax = Math.min(120, vw() * 0.12);
      const ay = Math.min(70, vh() * 0.085);
      const cx = vw() * 0.5 - SIZE / 2;
      const cy = vh() * 0.52 - SIZE / 2;
      const px = clamp(cx + ax * Math.sin((t / 54) * TAU), M, vw() - SIZE - M);
      const py = clamp(cy + ay * Math.sin((t / 73) * TAU + 1.3), M, vh() - SIZE - M);
      return { px, py, t };
    };
    const clamp = (v: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, v));

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
    let last = startedAt;

    const pickLook = () => {
      const cur = compute(performance.now());
      const cx = cur.px + SIZE / 2;
      const cy = cur.py + SIZE / 2;
      const els = Array.from(
        document.querySelectorAll<HTMLElement>("h2, h3, .glass, figure, img"),
      ).filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 40 && r.bottom > 0 && r.top < vh();
      });
      if (els.length) {
        const r = els[Math.floor(Math.random() * els.length)].getBoundingClientRect();
        const dx = r.left + r.width / 2 - cx;
        const dy = r.top + r.height / 2 - cy;
        const m = Math.hypot(dx, dy) || 1;
        tlx = clamp(dx / m, -1, 1);
        tly = clamp(dy / m, -1, 1) * 0.82;
      } else {
        tlx = Math.random() * 2 - 1;
        tly = (Math.random() * 2 - 1) * 0.6;
      }
    };
    pickLook();

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      place(compute(now).px, compute(now).py);

      lookT -= dt;
      if (lookT <= 0) {
        pickLook();
        lookT = 1700 + Math.random() * 1700; // dart to a new panel
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
      <div className="orb-mascot-cape" />
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

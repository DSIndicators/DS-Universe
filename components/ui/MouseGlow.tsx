"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient glow that follows the cursor. A single fixed, GPU-promoted layer that
 * we TRANSLATE to the pointer — transform-only, so it composites and never
 * repaints the screen (the previous version animated a gradient's position,
 * which forced a full-viewport repaint on every move). rAF-coalesced, no React
 * re-renders, no layout. Off under reduced-motion.
 */
export function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let x = window.innerWidth * 0.5;
    let y = window.innerHeight * 0.28;
    const apply = () => {
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      raf = 0;
    };
    apply();
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} aria-hidden className="mouse-glow" />;
}

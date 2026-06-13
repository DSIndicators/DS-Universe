"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient glow that follows the cursor. One fixed layer behind all content;
 * pointermove updates two CSS variables inside a single rAF (compositor-only,
 * no React re-renders, no layout). Disabled under reduced-motion / touch.
 */
export function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let x = 50;
    let y = 28;
    const onMove = (e: PointerEvent) => {
      x = (e.clientX / window.innerWidth) * 100;
      y = (e.clientY / window.innerHeight) * 100;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.setProperty("--mx", `${x.toFixed(1)}%`);
          el.style.setProperty("--my", `${y.toFixed(1)}%`);
          raf = 0;
        });
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} aria-hidden className="mouse-glow" />;
}

import Image from "next/image";
import type { CSSProperties } from "react";
import { loupe, type LoupeShot } from "@/content/loupe";

/**
 * THE LOUPE (2026-10-08) — a product shown by its own NinjaTrader chart,
 * magnified on the place that proves what it does and pulling back to the
 * whole chart when its card is pointed at or focused (the pull-back is driven
 * by the nearest `.group` — the card — in app/globals.css, THE LOUPE).
 * Used by the Free Vault (components/VaultRoom.tsx, brass) and by the store's
 * shelves on the home page (components/BoxCard.tsx `chart`, gold).
 * The pictures and their measurements: content/loupe.ts.
 */

/**
 * The chart through the loupe. `a` is the frame's aspect; the transform is
 * computed for it (content/loupe.ts loupe()) and held in a CSS
 * variable, so the pull-back is one transition on one layer (GPU, no
 * layout). `sizes` asks for the picture at its MAGNIFIED width, so the
 * detail is sharp, not an enlarged thumbnail.
 */
export function Lens({
  shot,
  a,
  cssWidth,
  priority,
  showMark,
  pinMark = false,
  tone = "brass",
  className = "",
}: {
  shot: LoupeShot;
  a: number;
  /** The frame's widest CSS width at each breakpoint, for `sizes`. */
  cssWidth: { lg: number; sm: string; base: string };
  priority?: boolean;
  showMark?: boolean;
  /** Keep the mark on screen when the lens pulls back (the exhibit). */
  pinMark?: boolean;
  /** brass in the Free Vault; gold — the store's colour — on the store's shelves. */
  tone?: "brass" | "gold";
  className?: string;
}) {
  const L = loupe(shot, a);
  const big = Math.round(cssWidth.lg * L.iw * L.z);
  // Below 1024px the frame's width is a vw figure; the picture is drawn wider
  // than the frame by iw·z, so ask for that much more.
  const grow = (v: string) => v.replace(/^(\d+(?:\.\d+)?)(vw|px)$/, (_, n, u) => `${Math.round(Number(n) * L.iw * L.z)}${u}`);
  const sizes = `(min-width: 1024px) ${big}px, (min-width: 640px) ${grow(cssWidth.sm)}, ${grow(cssWidth.base)}`;
  const style = { "--lens": L.transform, aspectRatio: String(a) } as CSSProperties;
  // The label takes the roomier side of its point and wraps rather than leave
  // the frame (its max width is the room on that side, in container units).
  const below = !!shot.mark.below;
  const flip = !below && L.mark.x > 0.5;
  return (
    <div className={`loupe loupe-${tone} relative overflow-hidden bg-[#040404] [container-type:inline-size] ${className}`} style={style}>
      <div className="loupe-lens absolute" style={{ width: `${L.box.w}%`, height: `${L.box.h}%`, left: `${L.box.l}%`, top: `${L.box.t}%` }}>
        <Image src={shot.src} alt={shot.alt} fill sizes={sizes} priority={priority} quality={92} className="object-fill" />
      </div>
      {/* crop marks — the frame is a viewfinder */}
      <span className="loupe-crop loupe-crop-tl" aria-hidden="true" />
      <span className="loupe-crop loupe-crop-tr" aria-hidden="true" />
      <span className="loupe-crop loupe-crop-bl" aria-hidden="true" />
      <span className="loupe-crop loupe-crop-br" aria-hidden="true" />
      {/* the magnification, read out */}
      <span className="loupe-mag pointer-events-none absolute right-3 top-2.5 font-mono text-[10px] tabular-nums tracking-[0.12em]" aria-hidden="true">
        <span className="loupe-mag-in">×{L.z.toFixed(1)}</span>
        <span className="loupe-mag-out">×1.0</span>
      </span>
      {showMark && (L.mark.visible || pinMark) && (
        <span
          className={`loupe-mark pointer-events-none absolute ${pinMark ? "loupe-mark-pinned" : ""}`}
          style={
            {
              "--mx": `${L.mark.x * 100}%`,
              "--my": `${L.mark.y * 100}%`,
              "--fx": `${L.markFull.x * 100}%`,
              "--fy": `${L.markFull.y * 100}%`,
              "--room": String(below ? 0.9 : flip ? L.mark.x : 1 - L.mark.x),
            } as CSSProperties
          }
          aria-hidden="true"
        >
          <span className="loupe-mark-dot" />
          <span className={`loupe-mark-label ${below ? "loupe-mark-below" : flip ? "loupe-mark-left" : ""}`}>{shot.mark.text}</span>
        </span>
      )}
    </div>
  );
}

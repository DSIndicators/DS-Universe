import type { CSSProperties, ReactNode } from "react";

/**
 * Fades content in as it scrolls into view — in CSS alone (rebuilt
 * 2026-10-09, Tom: "as lag free as possible").
 *
 * It used to be a client component: every block started at opacity 0 and an
 * IntersectionObserver revealed it once the page's JavaScript had loaded. On
 * a phone that meant the first screen's own text stayed invisible until
 * hydration finished (measured: the store's opening paragraph painted at
 * ~3.9 s on a throttled phone), and every Reveal on a page was one more piece
 * to hydrate. Now the fade is a scroll-driven CSS animation (globals.css,
 * `.reveal`): whatever is on screen at load is drawn at once, later blocks
 * ease in as they arrive, and a browser without scroll-driven animations
 * simply shows them. No JavaScript at all. `delay` staggers neighbours by
 * starting their fade a little later in their entry.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
  /** For layout values that have to be computed, e.g. PackShelf's --row-max. */
  style?: CSSProperties;
}) {
  const s = delay ? ({ ...style, "--rd": delay } as CSSProperties) : style;
  return (
    <Tag className={`reveal ${className}`} style={s}>
      {children}
    </Tag>
  );
}

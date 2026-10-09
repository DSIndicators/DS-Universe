"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Viewer, Chevron, Expand } from "@/components/Viewer";

/**
 * THE PRODUCT PAGE'S PICTURES (2026-10-09). Tom: "transform it into a product
 * looking page, ours looks like a journal … move our videos to the bottom".
 *
 * A store's media column, beside the buy box: one large stage, the caption of
 * what is on it, and every picture as a thumbnail underneath. The stage holds
 * any shape — a 2560x1440 chart fills it, an annotated board and the square
 * box art sit whole inside it on the chart's own black — so the column never
 * changes height as the pictures change. The recording is NOT here: it closes
 * the page ("In motion").
 *
 * Click the stage (or Enlarge) for the shared full-screen Viewer at full
 * resolution — the boards are meant to be read there. Arrows on the stage, the
 * keyboard's arrow keys and a horizontal swipe all move between pictures.
 * Only the picture on screen, its neighbours and the ones already seen are
 * fetched.
 */
export type MediaItem = {
  src: string;
  w: number;
  h: number;
  blur?: string;
  caption: string;
  alt: string;
  /** "chart" fills the stage; "board" and "cover" sit whole inside it. */
  kind: "chart" | "board" | "cover";
};

const GROUND = "#050608";

export function ProductMedia({
  items,
  label,
  footnote,
  priority = false,
}: {
  items: MediaItem[];
  label: string;
  footnote?: ReactNode;
  priority?: boolean;
}) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0, 1]));
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const swiped = useRef(false);
  const count = items.length;

  const go = useCallback(
    (n: number) => {
      const to = ((n % count) + count) % count;
      setI(to);
      setSeen((s) => {
        const next = new Set(s);
        [to - 1, to, to + 1].forEach((k) => k >= 0 && k < count && next.add(k));
        return next.size === s.size ? s : next;
      });
    },
    [count],
  );

  if (!count) return null;
  const cur = items[i];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div>
      {/* ------------------------------------------------------------ stage */}
      <div
        className="group/stage relative aspect-[16/9] w-full overflow-hidden rounded-[10px] border border-line"
        style={{ background: GROUND, touchAction: "pan-y pinch-zoom" }}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(i + 1);
          if (e.key === "ArrowLeft") go(i - 1);
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        }}
        onPointerUp={(e) => {
          const s = swipe.current;
          swipe.current = null;
          if (!s || s.id !== e.pointerId) return;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.3) {
            swiped.current = true;
            go(i + (dx < 0 ? 1 : -1));
            window.setTimeout(() => (swiped.current = false), 400);
          }
        }}
      >
        <button
          type="button"
          className="absolute inset-0 block cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
          onClick={() => {
            if (swiped.current) return;
            setOpen(true);
          }}
          aria-label={`Enlarge: ${cur.caption}`}
          aria-haspopup="dialog"
        >
          {items.map((it, n) =>
            seen.has(n) ? (
              <span
                key={it.src}
                className="absolute inset-0 block transition-opacity duration-500 ease-silk"
                style={{ opacity: n === i ? 1 : 0 }}
                aria-hidden={n !== i}
              >
                <Image
                  src={it.src}
                  alt={n === i ? it.alt : ""}
                  fill
                  quality={92}
                  priority={priority && n === 0}
                  placeholder={it.blur ? "blur" : "empty"}
                  blurDataURL={it.blur}
                  sizes="(min-width: 1536px) 960px, (min-width: 1024px) 58vw, 100vw"
                  className={it.kind === "chart" ? "object-cover" : it.kind === "cover" ? "object-contain p-[4%]" : "object-contain"}
                />
              </span>
            ) : null,
          )}
        </button>
        {count > 1 && (
          <>
            <StageArrow back onClick={() => go(i - 1)} />
            <StageArrow onClick={() => go(i + 1)} />
          </>
        )}
        <span className="pointer-events-none absolute right-3 top-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-black/60 px-2.5 text-[length:calc(12px*var(--type))] text-ink ring-1 ring-white/10 backdrop-blur-sm transition-opacity duration-300 lg:opacity-0 lg:group-hover/stage:opacity-100">
          <Expand />
          Enlarge
        </span>
      </div>

      {/* ---------------------------------------------------------- caption */}
      <div className="mt-3.5 flex items-baseline gap-4" aria-live="polite">
        <span className="shrink-0 font-mono text-[length:calc(10.5px*var(--type))] tracking-[0.14em] text-mute">
          <span className="text-gold">{pad(i + 1)}</span> / {pad(count)}
        </span>
        <p className="min-w-0 text-[length:calc(13.5px*var(--type))] leading-snug text-slate text-pretty">{cur.caption}</p>
      </div>

      {/* ----------------------------------------------------------- thumbs */}
      {count > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-2.5" role="group" aria-label={`${label}: pick a picture`}>
          {items.map((it, n) => (
            <button
              key={it.src}
              type="button"
              onClick={() => go(n)}
              aria-current={n === i}
              aria-label={`Picture ${n + 1} of ${count}: ${it.caption}`}
              className={`relative aspect-[16/9] overflow-hidden rounded-[5px] border outline-none transition-[border-color,opacity] duration-300 focus-visible:ring-2 focus-visible:ring-gold ${
                n === i ? "border-gold opacity-100" : "border-line opacity-60 hover:opacity-100"
              }`}
              style={{ background: GROUND }}
            >
              <Image
                src={it.src}
                alt=""
                fill
                sizes="160px"
                className={it.kind === "chart" ? "object-cover" : "object-contain"}
              />
            </button>
          ))}
        </div>
      )}

      {footnote && <p className="mt-5 max-w-2xl text-[length:calc(12.5px*var(--type))] leading-relaxed text-mute">{footnote}</p>}

      <Viewer
        open={open}
        onClose={() => setOpen(false)}
        slides={items.map((it) => ({ src: it.src, w: it.w, h: it.h, blur: it.blur ?? "", title: it.caption, alt: it.alt }))}
        index={i}
        onIndex={(n) => go(n)}
        mode="read"
        ground={GROUND}
        label={label}
      />
    </div>
  );
}

function StageArrow({ back = false, onClick }: { back?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={back ? "Previous picture" : "Next picture"}
      className={`absolute top-1/2 z-[1] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md bg-black/55 text-ink ring-1 ring-white/10 backdrop-blur-sm transition-opacity duration-300 hover:bg-black/75 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-gold lg:opacity-0 lg:group-hover/stage:opacity-100 ${
        back ? "left-3" : "right-3"
      }`}
    >
      <Chevron back={back} />
    </button>
  );
}

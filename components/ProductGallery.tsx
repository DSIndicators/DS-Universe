"use client";

import Image from "next/image";
import { useCallback, useId, useRef, useState } from "react";
import type { Shot } from "@/content/shots";

/**
 * The product stage: one picture large, the rest on a rail beside it.
 *
 * Why a rail rather than a stack — a tool with six real views was making its
 * page six screens long, and the pictures below the fold went unseen. Here the
 * page costs the same height whether a product has one picture or six, and the
 * buyer chooses what to look at.
 *
 * Every frame is mounted and cross-faded, so switching never shows a gap while
 * an image loads. The rail is a real tablist: arrow keys move, and the stage is
 * the panel it controls.
 */
export function ProductGallery({ name, shots }: { name: string; shots: Shot[] }) {
  const [i, setI] = useState(0);
  const uid = useId();
  const rail = useRef<HTMLDivElement>(null);
  const many = shots.length > 1;

  const go = useCallback(
    (n: number) => {
      const next = (n + shots.length) % shots.length;
      setI(next);
      rail.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
    },
    [shots.length],
  );

  const onKey = (e: React.KeyboardEvent) => {
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
    const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
    if (!back && !fwd) return;
    e.preventDefault();
    go(i + (fwd ? 1 : -1));
  };

  const caption = shots[i]?.caption;

  return (
    <div className={many ? "grid gap-3 lg:grid-cols-[minmax(0,1fr)_112px] lg:gap-4" : ""}>
      {/* ------------------------------------------------------------ stage */}
      <div className="min-w-0">
        <div className="overflow-hidden rounded-2xl border border-line bg-[#0f1114] shadow-monitor">
          <div className="relative aspect-[16/9]">
            {shots.map((s, n) => (
              <div
                key={`${s.src}-${n}`}
                id={`${uid}-panel-${n}`}
                role={many ? "tabpanel" : undefined}
                aria-labelledby={many ? `${uid}-tab-${n}` : undefined}
                aria-hidden={n !== i}
                className={`absolute inset-0 transition-opacity duration-500 ease-silk ${
                  n === i ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {s.video ? (
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    src={s.video.src}
                    poster={s.video.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={`${name} running in NinjaTrader 8`}
                  />
                ) : (
                  <Image
                    src={s.src}
                    alt={s.caption ? `${name} — ${s.caption}` : `${name} on a NinjaTrader 8 chart`}
                    fill
                    priority={n === 0}
                    loading={n === 0 ? undefined : "lazy"}
                    sizes="(min-width: 1280px) 1080px, (min-width: 1024px) 80vw, 100vw"
                    className="object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* One line of plain description, and where you are in the set. */}
        {(caption || many) && (
          <p className="mt-3 flex items-baseline justify-between gap-6 text-[13px] leading-relaxed text-mute">
            <span className="text-slate">{caption}</span>
            {many && (
              <span className="shrink-0 tabular-nums" aria-hidden="true">
                {i + 1} / {shots.length}
              </span>
            )}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------- rail */}
      {many && (
        <div
          ref={rail}
          role="tablist"
          aria-orientation="vertical"
          aria-label={`${name} pictures`}
          onKeyDown={onKey}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {shots.map((s, n) => (
            <button
              key={`${s.src}-tab-${n}`}
              id={`${uid}-tab-${n}`}
              type="button"
              role="tab"
              aria-selected={n === i}
              aria-controls={`${uid}-panel-${n}`}
              tabIndex={n === i ? 0 : -1}
              onClick={() => setI(n)}
              className={`group relative aspect-[16/9] w-[96px] shrink-0 overflow-hidden rounded-lg bg-[#0f1114] outline-none transition-all duration-300 ease-silk focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 lg:w-full ${
                n === i
                  ? "ring-2 ring-gold"
                  : "opacity-60 ring-1 ring-black/10 hover:opacity-100 hover:ring-black/20"
              }`}
            >
              <Image
                src={s.thumb ?? s.src}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
              />
              <span className="sr-only">
                {s.caption ?? `Picture ${n + 1}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

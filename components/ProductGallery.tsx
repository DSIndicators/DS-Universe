"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { BOARD_GROUND, type Shot } from "@/content/shots";
import { DISCLOSURE } from "@/content/site";

/**
 * The product stage: the product-guide boards, one large, the rest on a rail,
 * and any of them full size on click.
 *
 * SHAPE FROM THE PICTURE. The boards are not 16:9 (1.16:1 to 1.52:1). The
 * stage takes its aspect ratio from the board (`w`/`h`), and stage, rail and
 * lightbox all sit on the boards' own ground colour — so nothing is cropped
 * and no letterbox is ever visible.
 *
 * WHY IT ENLARGES. A board is a chart plus its reading, and the reading is set
 * small: at column width the chart reads, the notes do not. The lightbox shows
 * the board at the full width of the window, from the native 2560px file.
 * Native <dialog> + showModal(): Escape, the top layer, the inert page, focus
 * containment and restoration come free; paging and the scroll lock are ours.
 *
 * COMPLIANCE — both disclosure lines stay. The vendor guidelines (rev
 * 2.11.2025, p.2) forbid "video content or chart images without being
 * accompanied by relevant Risk Disclosures and Hypothetical Performance
 * Disclosures". The band above the stage covers the page; the modal hides the
 * page, so DISCLOSURE.chart travels INTO the dialog too.
 *
 * `backdrop:bg-[rgba(...)]`, not `backdrop:bg-ink/85`: Tailwind's opacity
 * modifier compiles to a CSS variable that ::backdrop does not inherit in
 * Chromium, and the page behind stays undimmed.
 */
export function ProductGallery({ name, shots }: { name: string; shots: Shot[] }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const uid = useId();
  const rail = useRef<HTMLDivElement>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const stageBtn = useRef<HTMLButtonElement>(null);
  const many = shots.length > 1;
  const first = shots[0];

  const go = useCallback(
    (n: number, focus = true) => {
      const next = (n + shots.length) % shots.length;
      setI(next);
      if (focus) rail.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
    },
    [shots.length],
  );

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open]);

  if (!first) return null;
  const shot = shots[i];
  const ratio = first.w / first.h;

  const onRailKey = (e: React.KeyboardEvent) => {
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
    const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
    if (!back && !fwd) return;
    e.preventDefault();
    go(i + (fwd ? 1 : -1));
  };

  const alt = (s: Shot) => `${name} product guide — ${s.caption}`;

  return (
    <div>
      {/* ------------------------------------------------------- disclosure */}
      <p className="mb-4 max-w-4xl text-[14.5px] leading-relaxed text-slate">
        <span className="mr-2 align-middle text-[11.5px] font-medium uppercase tracking-[0.14em] text-gold-deep">
          Risk disclosure
        </span>
        {DISCLOSURE.chart}{" "}
        <Link
          href="/disclosures"
          className="whitespace-nowrap text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-gold"
        >
          Read them in full
        </Link>
        .
      </p>

      <div className={many ? "grid gap-3 lg:grid-cols-[minmax(0,1fr)_120px] lg:gap-4" : ""}>
        {/* ---------------------------------------------------------- stage */}
        <div className="min-w-0">
          <button
            ref={stageBtn}
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-label={`Enlarge: ${alt(shot)}`}
            className="group relative block w-full overflow-hidden rounded-2xl border border-line shadow-monitor outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            style={{ background: BOARD_GROUND }}
          >
            <span className="relative block w-full" style={{ aspectRatio: String(ratio) }}>
              {shots.map((s, n) => (
                <span
                  key={s.src}
                  id={`${uid}-panel-${n}`}
                  role={many ? "tabpanel" : undefined}
                  aria-labelledby={many ? `${uid}-tab-${n}` : undefined}
                  aria-hidden={n !== i}
                  className={`absolute inset-0 transition-opacity duration-500 ease-silk ${n === i ? "opacity-100" : "opacity-0"}`}
                >
                  <Image
                    src={s.src}
                    alt={alt(s)}
                    fill
                    priority={n === 0}
                    loading={n === 0 ? undefined : "lazy"}
                    placeholder="blur"
                    blurDataURL={s.blur}
                    sizes="(min-width: 1280px) 1060px, (min-width: 1024px) 80vw, 100vw"
                    className="object-contain"
                  />
                </span>
              ))}
            </span>
            <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ground/75 px-3 py-1.5 text-[12.5px] font-medium text-ink shadow-card ring-1 ring-white/15 backdrop-blur-sm transition-opacity duration-300 ease-silk lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100">
              <Expand /> Enlarge
            </span>
          </button>

          <p className="mt-3 flex items-baseline justify-between gap-6 text-[13.5px] leading-relaxed text-mute">
            <span className="text-slate">{shot.caption}</span>
            {many && (
              <span className="shrink-0 tabular-nums" aria-hidden="true">
                {i + 1} / {shots.length}
              </span>
            )}
          </p>
        </div>

        {/* ----------------------------------------------------------- rail */}
        {many && (
          <div
            ref={rail}
            role="tablist"
            aria-orientation="vertical"
            aria-label={`${name} pictures`}
            onKeyDown={onRailKey}
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {shots.map((s, n) => (
              <button
                key={`${s.src}-tab`}
                id={`${uid}-tab-${n}`}
                type="button"
                role="tab"
                aria-selected={n === i}
                aria-controls={`${uid}-panel-${n}`}
                tabIndex={n === i ? 0 : -1}
                onClick={() => setI(n)}
                className={`relative w-[104px] shrink-0 overflow-hidden rounded-lg outline-none transition-all duration-300 ease-silk focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 lg:w-full ${
                  n === i ? "ring-2 ring-gold" : "opacity-55 ring-1 ring-white/10 hover:opacity-100 hover:ring-white/25"
                }`}
                style={{ background: BOARD_GROUND, aspectRatio: String(s.w / s.h) }}
              >
                <Image src={s.src} alt="" fill sizes="120px" className="object-contain" />
                <span className="sr-only">{s.caption}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --------------------------------------------------------- lightbox */}
      <dialog
        ref={dlg}
        aria-label={`${name} — product guide`}
        onClose={() => {
          setOpen(false);
          stageBtn.current?.focus();
        }}
        onClick={(e) => {
          if (e.target === dlg.current) setOpen(false);
        }}
        onKeyDown={(e) => {
          if (!many) return;
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            go(i + 1, false);
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            go(i - 1, false);
          }
        }}
        className="m-0 h-[100svh] max-h-none w-screen max-w-none bg-transparent p-2 text-ink backdrop:bg-[rgba(4,5,6,0.9)] sm:p-4"
      >
        {open && (
          /* A READER, not a thumbnail blown up. The board is a chart plus its
             notes in small type, so the picture is shown at the full width of
             the window (up to its native 2560px) in a middle pane that scrolls
             when the board is taller than the window — and the bars above and
             below it never scroll away: the name, the pager and Close on top,
             the risk disclosure underneath, both always in sight of the chart.
             (A height-fitted card made the enlarged board SMALLER than the
             stage on the page it was opened from.) */
          <div className="mx-auto flex h-full max-w-[1680px] flex-col overflow-hidden rounded-2xl border border-line bg-mist shadow-monitor">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line px-4 py-2.5 sm:px-5">
              <p className="min-w-0 truncate text-[15px] font-medium text-ink">
                {name} <span className="font-normal text-slate">— {shot.caption}</span>
              </p>
              <div className="flex shrink-0 items-center gap-1">
                {many && (
                  <>
                    <Step dir="prev" onClick={() => go(i - 1, false)} />
                    <span className="w-14 text-center text-[13.5px] tabular-nums text-mute">
                      {i + 1} / {shots.length}
                    </span>
                    <Step dir="next" onClick={() => go(i + 1, false)} />
                  </>
                )}
                <button
                  type="button"
                  autoFocus
                  onClick={() => setOpen(false)}
                  className="ml-2 inline-flex h-9 items-center rounded-md border border-line-strong bg-surface px-3.5 text-[14px] text-ink transition-colors hover:border-ink/60"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ background: BOARD_GROUND }}>
              <div className="relative mx-auto w-full" style={{ aspectRatio: String(shot.w / shot.h), maxWidth: shot.w }}>
                <Image
                  key={shot.src}
                  src={shot.src}
                  alt={alt(shot)}
                  fill
                  quality={92}
                  placeholder="blur"
                  blurDataURL={shot.blur}
                  sizes="(min-width: 1680px) 1680px, 100vw"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Required beside the picture — the page's own band is behind the modal. */}
            <p className="shrink-0 border-t border-line bg-surface px-4 py-2.5 text-[13px] leading-relaxed text-slate sm:px-5">
              {DISCLOSURE.chart}{" "}
              <Link href="/disclosures" className="text-ink underline decoration-line underline-offset-4 hover:decoration-gold">
                Full risk disclosures
              </Link>
              .
            </p>
          </div>
        )}
      </dialog>
    </div>
  );
}

function Expand() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 2.5H13.5V6.5M6.5 13.5H2.5V9.5M13.5 2.5L9 7M2.5 13.5L7 9" />
    </svg>
  );
}

function Step({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  const back = dir === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={back ? "Previous picture" : "Next picture"}
      className="grid h-9 w-9 place-items-center rounded-md border border-line bg-surface text-slate transition-colors hover:border-ink/60 hover:text-ink"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={back ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} />
      </svg>
    </button>
  );
}

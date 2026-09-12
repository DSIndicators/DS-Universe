"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { DISCLOSURE, SCREENS } from "@/content/site";

/**
 * The picture row under the storefront heading — four real charts, one row,
 * any of them opens full screen.
 *
 * WHY IT IS HERE (Tom, 2026-09-12): the storefront is box art. Box art sells
 * the product; it does not show the software. These four are the stills the
 * hero monitor rotated before the recordings replaced it on 2026-09-11 — real
 * NinjaTrader sessions with the paid stack running — so the shelf is now
 * introduced by the thing itself rather than by five pictures of packaging.
 *
 * WHY IT ENLARGES: at four across the tiles are ~265px wide. That is enough to
 * read the shape of a chart and nothing else; the zone labels, the Sonar lanes
 * and the option-chain levels only exist at full size. The row is the invitation
 * and the dialog is the picture — which is why the tiles load a ~280px variant
 * and the full 2560x1440 file is fetched only when someone asks for it.
 *
 * WHY A NATIVE <dialog>: showModal() brings Escape, the top layer, the inert
 * background, focus containment and focus restoration with it, all of which a
 * div-with-a-fixed-position has to reimplement and usually gets wrong. The only
 * things added here are arrow-key paging and a scroll lock.
 *
 * COMPLIANCE — DO NOT REMOVE THE DISCLOSURE LINE, EITHER OF THEM. The vendor
 * guidelines (rev 2.11.2025, p.2) forbid "video content or chart images without
 * being accompanied by relevant Risk Disclosures and Hypothetical Performance
 * Disclosures". The footer carries both in full on every page, which covers the
 * row. It does NOT cover the dialog: a modal in the top layer hides the whole
 * page behind it, so at the moment the chart is largest the footer is not on
 * screen at all. DISCLOSURE.chart therefore travels with the picture, inside
 * the dialog, and links to the full text.
 */
export function ChartRow({ className = "" }: { className?: string }) {
  const [at, setAt] = useState<number | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const from = useRef(0);

  const open = (n: number) => {
    from.current = n;
    setAt(n);
  };
  const step = useCallback(
    (d: number) => setAt((n) => (n === null ? n : (n + d + SCREENS.length) % SCREENS.length)),
    [],
  );

  /* React state drives the real element. `d.open` guards both directions so a
     double-invoked effect (StrictMode) cannot call showModal on an open dialog,
     which throws. */
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (at !== null && !d.open) d.showModal();
    if (at === null && d.open) d.close();
  }, [at]);

  /* The page behind a modal is inert but, in most browsers, still scrollable. */
  useEffect(() => {
    if (at === null) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [at]);

  const shot = at === null ? null : SCREENS[at];

  return (
    <div className={className}>
      {/* ------------------------------------------------------------- row
          ONE ROW AT EVERY WIDTH, by two different means.

          At lg it is a four-column grid, which is the composition Tom asked
          for. Below lg it becomes a snap rail that bleeds to the page edge,
          because the obvious alternative does not survive a phone: two columns
          inside a 390px screen leave each tile 163x92 CSS pixels, which is a
          texture, not a chart. The rail gives the same tile ~260x146 - three
          times the area - keeps the row one row, and costs no extra height.

          The negative margins must match .wrap's padding exactly (px-6 sm:px-8
          lg:px-10) or the rail will not start flush with the heading above it,
          and scroll-pl must match them too or a snapped tile lands under the
          gutter instead of on it. */}
      <ul className="-mx-6 flex snap-x snap-mandatory scroll-pl-6 gap-4 overflow-x-auto px-6 pb-2 sm:-mx-8 sm:scroll-pl-8 sm:gap-5 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0">
        {SCREENS.map((s, n) => (
          <li key={s.src} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-auto lg:min-w-0">
            <Reveal delay={(n % 4) * 70}>
              <button
                type="button"
                ref={(el) => {
                  tiles.current[n] = el;
                }}
                onClick={() => open(n)}
                aria-haspopup="dialog"
                className="group block w-full text-left outline-none"
              >
                <span className="relative block aspect-[16/9] overflow-hidden rounded-xl border border-line bg-mist shadow-card transition-all duration-500 ease-silk group-hover:-translate-y-1 group-hover:border-line-strong group-hover:shadow-lift group-focus-visible:ring-2 group-focus-visible:ring-gold group-focus-visible:ring-offset-2">
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={s.blur}
                    sizes="(min-width: 1024px) 280px, 46vw"
                    className="object-cover transition-transform duration-700 ease-silk group-hover:scale-[1.03]"
                  />
                  {/* Visible by default where there is no hover to discover it
                      with; on pointer screens it arrives with the lift. */}
                  <span className="pointer-events-none absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink shadow-card backdrop-blur-[2px] transition-opacity duration-300 ease-silk lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100">
                    <Expand />
                  </span>
                </span>
                {/* min-h at lg reserves two lines for every title, so a
                    one-line title does not start its caption a line higher
                    than its neighbours and break the row's baseline. */}
                <span className="mt-3.5 block text-[14.5px] font-medium leading-snug text-ink lg:min-h-[2.6em]">
                  {s.title}
                </span>
                <span className="mt-1.5 block text-[13.5px] leading-snug text-slate transition-colors duration-300 group-hover:text-ink">
                  {s.caption}
                </span>
              </button>
            </Reveal>
          </li>
        ))}
      </ul>

      {/* The row's own disclosure. The footer carries the full text on this page;
          this is the same warning within sight of the pictures. */}
      <p className="mt-7 max-w-3xl text-[15px] leading-relaxed text-slate">
        {DISCLOSURE.chart}{" "}
        <Link
          href="/disclosures"
          className="text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-gold"
        >
          Full risk disclosures
        </Link>
        .
      </p>

      {/* --------------------------------------------------------- lightbox */}
      <dialog
        ref={dlg}
        aria-label="Chart pictures"
        onClose={() => {
          setAt(null);
          tiles.current[from.current]?.focus();
        }}
        onClick={(e) => {
          if (e.target === dlg.current) setAt(null); // the backdrop, not the card
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            step(1);
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            step(-1);
          }
        }}
        /* backdrop:bg-ink/85 does NOT work: Tailwind's opacity modifier compiles
           to rgb(... / var(--tw-bg-opacity)) and the custom property is set on
           the dialog, which ::backdrop does not inherit from in Chromium - the
           page behind stays almost undimmed. An explicit rgba() has no variable
           to lose. Verified at 1440 and 390. */
        className="max-h-[92svh] w-full max-w-[1180px] bg-transparent p-4 text-ink backdrop:bg-[rgba(20,22,26,0.88)] sm:p-6"
      >
        {shot && (
          /* The CARD is sized to the picture, not the other way round.
             Capping the picture's height inside a full-width card was the bug
             Tom caught: object-contain then letterboxes it, and the card's
             right-hand side reads as the chart being cut off. Deriving the
             card's own max width from the height budget (62svh at 16:9) means
             the picture always fills it exactly - no letterbox at any window
             shape - and the whole card, both text bars included, still clears
             a short window. mx-auto keeps it centred in the wider dialog. */
          <div
            className="mx-auto overflow-hidden rounded-2xl bg-white shadow-monitor"
            style={{ maxWidth: "calc(62svh * 16 / 9)" }}
          >
            <div className="relative aspect-[16/9] bg-mist">
              <Image
                key={shot.src}
                src={shot.src}
                alt={shot.alt}
                fill
                quality={92}
                placeholder="blur"
                blurDataURL={shot.blur}
                sizes="(min-width: 1280px) 1140px, 92vw"
                className="object-contain"
              />
            </div>

            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-t border-line px-5 py-4">
              <div className="min-w-0 max-w-2xl">
                <p className="text-[15px] font-medium leading-snug text-ink">{shot.title}</p>
                {/* The tile has room for one line; here there is room for the
                    read, so this is where the picture is actually explained. */}
                <p className="mt-1.5 text-[14px] leading-relaxed text-slate">{shot.detail}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Arrow dir="prev" onClick={() => step(-1)} />
                <span className="w-14 text-center text-[13.5px] tabular-nums text-mute">
                  {(at ?? 0) + 1} / {SCREENS.length}
                </span>
                <Arrow dir="next" onClick={() => step(1)} />
                <button
                  type="button"
                  autoFocus
                  onClick={() => setAt(null)}
                  className="ml-2 inline-flex h-9 items-center rounded-md border border-line-strong bg-white px-3.5 text-[14px] text-ink transition-colors hover:border-ink"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Required beside the picture — the footer is not on screen here. */}
            <p className="border-t border-line bg-mist px-5 py-4 text-[14px] leading-relaxed text-slate">
              {DISCLOSURE.chart}{" "}
              <Link
                href="/disclosures"
                className="text-ink underline decoration-line underline-offset-4 hover:decoration-gold"
              >
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

function Arrow({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  const back = dir === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={back ? "Previous picture" : "Next picture"}
      className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white text-slate transition-colors hover:border-ink hover:text-ink"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={back ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} />
      </svg>
    </button>
  );
}

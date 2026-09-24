"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The full-screen picture viewer, shared by the hero screen, "On the chart"
 * and the product-guide boards (Tom, 2026-09-21: on a phone "the mobile site
 * advises users to turn the screen for bigger image but there's always a huge
 * disclaimer that covers half the screen and the image isn't enlarged. we don't
 * need the disclaimer EVERYWHERE").
 *
 * WHAT CHANGED, AND WHY
 *  · No disclosure bar in here. The line sits on the page beside the same
 *    picture and the footer carries the full text; inside the viewer it only
 *    stole the height the chart needed.
 *  · A phone on its side (any screen under 500px tall) gets the whole screen:
 *    no header, no frame — the chart runs the full height, and Close, the
 *    arrows and the count float in the side margins a 16:9 chart leaves.
 *  · Swipe to move between pictures: the pictures sit on a native scroll-snap
 *    track, so the picture follows the finger and settles with the platform's
 *    own momentum (and a trackpad swipe works the same way on a laptop).
 *    Arrows, the keyboard and the pager still work.
 *  · Pinch-zoom is left to the browser (`touch-action: pan-x pan-y pinch-zoom`).
 *
 * MODES
 *  · "fit"  — charts: the whole picture always visible, centred, letterboxed
 *             on the picture's own ground so the letterbox is invisible;
 *  · "read" — product-guide boards: full width (up to the file's own width),
 *             scrolling down when the board is taller than the window, because
 *             the notes on a board are set small.
 *
 * Native <dialog> + showModal(): Escape, the top layer, the inert page and
 * focus containment come free; focus goes to Close on open and back to the
 * opener on close. Only the picture being viewed and its two neighbours are
 * mounted; the rest paint their 16px blur until they come near.
 */
export type ViewerSlide = {
  src: string;
  w: number;
  h: number;
  blur?: string;
  title: string;
  alt: string;
  /** A second line under the title (e.g. the tools on the picture). */
  sub?: ReactNode;
  /**
   * Set when the slide is a RECORDING rather than a picture (the hero screen's
   * clip, 2026-09-23). The viewer then plays it with real controls instead of
   * rendering an <Image>, and `src`/`w`/`h` above are only used as the key and
   * the "read" mode box. Pass the same file the tile is already using, so
   * enlarging costs no second download. Only the CURRENT slide's video is
   * mounted — neighbours show the poster — so nothing plays off screen.
   */
  video?: { src: string; poster: string };
};

/* "A phone on its side" = any screen under 500px tall. Written out in full in
   each class below: Tailwind only generates classes it can read literally. */

export function Viewer({
  open,
  onClose,
  slides,
  index,
  onIndex,
  mode = "fit",
  ground,
  label,
}: {
  open: boolean;
  onClose: () => void;
  slides: ViewerSlide[];
  index: number;
  onIndex: (n: number) => void;
  mode?: "fit" | "read";
  ground: string;
  label: string;
}) {
  const dlg = useRef<HTMLDialogElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const [seen, setSeen] = useState<Set<number>>(() => new Set());
  const count = slides.length;
  const many = count > 1;
  const slide = slides[Math.min(index, count - 1)];

  // Put the track on the current picture — on opening, and when the phone is
  // turned. The index lives in a ref, so the resize observer below is made once
  // per opening and acts only when the WIDTH really changes (an observer re-made
  // on every index change fires at once and would yank a swipe still settling).
  const at = useRef(index);
  at.current = index;
  const settle = useCallback(() => {
    const t = track.current;
    if (t) t.scrollTo({ left: at.current * t.clientWidth, behavior: "instant" as ScrollBehavior });
  }, []);

  // open / close the dialog, remember who opened it
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement;
      d.showModal();
      // Only now does the track have a width (a closed dialog is display:none),
      // so this is where it can be put on the picture that was tapped.
      settle();
      closeBtn.current?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  // lock the page behind
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open]);


  useEffect(() => {
    if (!open) return;
    const t = track.current;
    if (!t) return;
    let w = t.clientWidth;
    const ro = new ResizeObserver(() => {
      if (t.clientWidth !== w) {
        w = t.clientWidth;
        settle();
      }
    });
    ro.observe(t);
    return () => ro.disconnect();
  }, [open, settle]);

  // neighbours mount; once mounted they stay
  useEffect(() => {
    if (!open) return;
    setSeen((s) => {
      const n = new Set(s);
      [index - 1, index, index + 1].forEach((k) => k >= 0 && k < count && n.add(k));
      return n.size === s.size ? s : n;
    });
  }, [open, index, count]);

  const onScroll = () => {
    const t = track.current;
    if (!t || !t.clientWidth) return;
    const n = Math.round(t.scrollLeft / t.clientWidth);
    if (n !== index && n >= 0 && n < count) onIndex(n);
  };

  const go = (n: number) => {
    const t = track.current;
    if (!t) return;
    const to = (n + count) % count;
    t.scrollTo({ left: to * t.clientWidth, behavior: "smooth" });
  };

  const close = () => onClose();

  return (
    <dialog
      ref={dlg}
      aria-label={label}
      onClose={() => {
        onClose();
        (opener.current as HTMLElement | null)?.focus?.();
      }}
      onClick={(e) => {
        if (e.target === dlg.current) close();
      }}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(index + 1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(index - 1);
        }
      }}
      className={`m-0 h-[100svh] max-h-none w-screen max-w-none bg-transparent p-0 text-ink backdrop:bg-[rgba(4,5,6,0.94)] sm:p-4 [@media(max-height:500px)]:p-0`}
    >
      {open && (
        <div
          className={`relative mx-auto flex h-full max-w-[1680px] flex-col overflow-hidden bg-mist shadow-monitor sm:rounded-2xl sm:border sm:border-line [@media(max-height:500px)]:rounded-none [@media(max-height:500px)]:border-0`}
        >
          {/* ------------------------------------------------ header (not on a phone on its side) */}
          <div className={`flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line px-4 py-2.5 sm:px-5 [@media(max-height:500px)]:hidden`}>
            <div className="min-w-0">
              <p className="text-[15px] font-medium leading-snug text-ink">{slide.title}</p>
              {slide.sub && <div className="mt-0.5">{slide.sub}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {many && (
                <>
                  <Step dir="prev" onClick={() => go(index - 1)} />
                  <span className="w-14 text-center text-[13.5px] tabular-nums text-mute" aria-live="polite">
                    {index + 1} / {count}
                  </span>
                  <Step dir="next" onClick={() => go(index + 1)} />
                </>
              )}
              <button
                ref={closeBtn}
                type="button"
                onClick={close}
                className="ml-2 inline-flex h-9 items-center rounded-md border border-line-strong bg-surface px-3.5 text-[14px] text-ink transition-colors hover:border-ink/60"
              >
                Close
              </button>
            </div>
          </div>

          {/* ------------------------------------------------ the pictures */}
          <div className="relative min-h-0 flex-1" style={{ background: ground }}>
            <div
              ref={track}
              onScroll={onScroll}
              className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
              style={{ touchAction: "pan-x pan-y pinch-zoom" }}
            >
              {slides.map((s, n) => (
                <div
                  key={s.src}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${n + 1} of ${count}`}
                  aria-hidden={n !== index}
                  className={`relative h-full w-full shrink-0 snap-center snap-always ${mode === "read" ? "overflow-y-auto overscroll-contain" : ""}`}
                >
                  {mode === "fit" ? (
                    <div
                      className="absolute inset-0"
                      style={s.video ? (n === index ? undefined : posterBg(s.video.poster)) : s.blur && !seen.has(n) ? blurBg(s.blur) : undefined}
                    >
                      {s.video ? (
                        n === index && (
                          <video
                            src={s.video.src}
                            poster={s.video.poster}
                            aria-label={s.alt}
                            autoPlay
                            muted
                            loop
                            playsInline
                            controls
                            controlsList="nodownload"
                            disablePictureInPicture
                            className="absolute inset-0 h-full w-full object-contain"
                          />
                        )
                      ) : (
                        seen.has(n) && (
                          <Image
                            src={s.src}
                            alt={s.alt}
                            fill
                            quality={92}
                            placeholder={s.blur ? "blur" : "empty"}
                            blurDataURL={s.blur}
                            sizes="100vw"
                            className="object-contain"
                          />
                        )
                      )}
                    </div>
                  ) : (
                    <div
                      className="relative mx-auto w-full"
                      style={{ aspectRatio: String(s.w / s.h), maxWidth: s.w, ...(s.blur && !seen.has(n) ? blurBg(s.blur) : {}) }}
                    >
                      {seen.has(n) && (
                        <Image
                          src={s.src}
                          alt={s.alt}
                          fill
                          quality={92}
                          placeholder={s.blur ? "blur" : "empty"}
                          blurDataURL={s.blur}
                          sizes="(min-width: 1680px) 1680px, 100vw"
                          className="object-contain"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* portrait phones only: the chart gets ~2.5x larger turned sideways */}
            {mode === "fit" && (
              <p className="pointer-events-none absolute inset-x-0 bottom-4 hidden text-center text-[12.5px] text-slate [@media(orientation:portrait)_and_(max-width:767px)]:block">
                Turn your phone sideways for a larger chart.
              </p>
            )}

            {/* ------------------------------------------------ floating controls — phone on its side */}
            <div className={`pointer-events-none absolute inset-0 hidden [@media(max-height:500px)]:block`}>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="pointer-events-auto absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full bg-ground/75 text-ink ring-1 ring-white/15 backdrop-blur-sm"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
              {many && (
                <>
                  <Float dir="prev" onClick={() => go(index - 1)} className="left-2 top-1/2 -translate-y-1/2" />
                  <Float dir="next" onClick={() => go(index + 1)} className="right-2 top-1/2 -translate-y-1/2" />
                  <span className="absolute bottom-2 right-2 rounded-full bg-ground/75 px-2.5 py-1 text-[12px] tabular-nums text-slate ring-1 ring-white/10 backdrop-blur-sm">
                    {index + 1} / {count}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

const blurBg = (url: string) => ({ backgroundImage: `url("${url}")`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" });

/** A video slide that is not the current one shows its poster, not a 16px blur. */
const posterBg = blurBg;

function Step({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  const back = dir === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={back ? "Previous picture" : "Next picture"}
      className="grid h-9 w-9 place-items-center rounded-md border border-line bg-surface text-slate transition-colors hover:border-ink/60 hover:text-ink"
    >
      <Chevron back={back} />
    </button>
  );
}

function Float({ dir, onClick, className }: { dir: "prev" | "next"; onClick: () => void; className: string }) {
  const back = dir === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={back ? "Previous picture" : "Next picture"}
      className={`pointer-events-auto absolute grid h-10 w-10 place-items-center rounded-full bg-ground/75 text-ink ring-1 ring-white/15 backdrop-blur-sm ${className}`}
    >
      <Chevron back={back} />
    </button>
  );
}

export function Chevron({ back, className = "h-4 w-4" }: { back: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={back ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} />
    </svg>
  );
}

export function Expand({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 2.5H13.5V6.5M6.5 13.5H2.5V9.5M13.5 2.5L9 7M2.5 13.5L7 9" />
    </svg>
  );
}

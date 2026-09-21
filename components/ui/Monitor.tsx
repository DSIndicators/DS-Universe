"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { DISCLOSURE, MONITOR, type ScreenFrame } from "@/content/site";
import { BY_SLUG } from "@/content/products";

/**
 * The hero screen: six real NQ charts on NinjaTrader's black ground, rotating
 * (Tom, 2026-09-21: "rotate the 6 black screen... make sure all rotations are
 * elegant and all information makes sense. Also give users the ability to
 * pause the screenshots to read, see it clearly").
 *
 * THE ROTATION
 *  · 7s hold, 1.2s crossfade, and a very slow 3% push-in anchored on the RIGHT
 *    edge — the price axis and the latest bars never leave the screen; only the
 *    oldest bars on the left drift out;
 *  · it never fades to a picture that has not loaded — it waits for it;
 *  · it stops while the pointer rests on the screen, while the tab is hidden,
 *    while the enlarged view is open, and when the visitor presses Pause.
 *
 * READING IT
 *  · Pause / Play sits on the left of the control row, the segments on the
 *    right. Pausing also eases the push-in back to 100%, so the WHOLE chart is
 *    on screen, uncropped, while it is being read;
 *  · the screen itself is a button: it opens the picture at the full width of
 *    the window from the 2560px file, with a pager, Escape to close and the
 *    risk disclosure pinned under it (vendor guidelines rev 2.11.2025 p.2 —
 *    a modal hides the page's own disclosure, so it travels into the modal);
 *  · every picture has a title (what it shows) and the tools on it, named from
 *    their on-chart labels (see content/site.ts).
 *
 * FIXED FURNITURE (2026-09-21): the control row never changes shape, and every
 * picture's caption is laid into ONE grid cell with only the current one
 * visible, so the cell is as tall as the longest caption at the current width
 * and nothing under it moves as the pictures change.
 *
 * MOTION PREFERENCES: for prefers-reduced-motion the screen starts paused and
 * never pushes in; Play still lets that visitor rotate it by choice. Captions
 * are announced to screen readers only when the visitor moves the pictures,
 * never while they rotate by themselves.
 */
const HOLD = 7000; // ms a picture is held
const FADE = 1200; // ms crossfade
const PUSH = 1.03; // push-in over the hold
const EASE = "cubic-bezier(0.2,0.7,0.2,1)";

export function HeroScreen({ priority = false, monitorClassName = "" }: { priority?: boolean; monitorClassName?: string }) {
  const frames = MONITOR.frames;
  const count = frames.length;
  const [i, setI] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [paused, setPaused] = useState(false); // the visitor pressed Pause (or prefers reduced motion)
  const [held, setHeld] = useState(false); // pointer resting on the screen, or the tab hidden
  const [open, setOpen] = useState(false); // the enlarged view
  const [tick, setTick] = useState(0); // restarts the hold (and the segment fill)
  const [moved, setMoved] = useState(false); // the visitor has moved the pictures: captions may be announced
  const loaded = useRef<Set<number>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const screenBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const running = mounted && !paused && !held && !open && count > 1;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMounted(true);
    setReduce(mq.matches);
    if (mq.matches) setPaused(true);
    const onMq = () => {
      setReduce(mq.matches);
      if (mq.matches) setPaused(true);
    };
    mq.addEventListener("change", onMq);
    const onVis = () => setHeld(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mq.removeEventListener("change", onMq);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // The clock. When the hold is up it moves on only once the next picture has
  // loaded (checked every 400ms, for up to 6s, then it moves on regardless).
  useEffect(() => {
    if (!running) return;
    let waited = 0;
    const advance = () => {
      const next = (i + 1) % count;
      if (loaded.current.has(next) || waited >= 6000) {
        setI(next);
      } else {
        waited += 400;
        timer.current = setTimeout(advance, 400);
      }
    };
    timer.current = setTimeout(advance, HOLD);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [running, i, tick, count]);

  const go = useCallback(
    (n: number) => {
      setI(((n % count) + count) % count);
      setTick((t) => t + 1);
      setMoved(true);
    },
    [count],
  );

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
    setTick((t) => t + 1); // Play starts a full hold, never a half-spent one
    setMoved(true);
  }, []);

  // enlarged view: open/close the native dialog, and lock the page behind it
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // showModal() focuses the first focusable element — the header's product
      // links. Close is the right first stop (Escape works either way).
      closeBtn.current?.focus();
    }
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

  const frame = frames[i];

  return (
    <div>
      {/* ------------------------------------------------------------ monitor */}
      <div
        className={`relative ${monitorClassName}`}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHeld(true)}
        onPointerLeave={() => setHeld(document.hidden)}
      >
        <div className="relative rounded-[14px] bg-gradient-to-b from-[#2B2F35] via-[#1C1F24] to-[#15171B] p-[10px] shadow-monitor ring-1 ring-white/[0.08]">
          <button
            ref={screenBtn}
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-label={`Enlarge the chart: ${frame.title}`}
            className="group/screen relative block aspect-[16/9] w-full cursor-zoom-in overflow-hidden rounded-[7px] outline-none ring-1 ring-black/60 focus-visible:ring-2 focus-visible:ring-gold"
            style={{ background: MONITOR.ground }}
          >
            {frames.map((f, n) => {
              const on = n === i;
              const push = on && mounted && !paused && !open && !reduce;
              return (
                <span
                  key={f.src}
                  className="absolute inset-0 block"
                  style={{
                    opacity: on ? 1 : 0,
                    transform: push ? `scale(${PUSH})` : "scale(1)",
                    transformOrigin: "100% 50%",
                    transition: !on
                      ? `opacity ${FADE}ms ${EASE}, transform 0s linear ${FADE}ms`
                      : push
                        ? `opacity ${FADE}ms ${EASE}, transform ${HOLD + FADE}ms linear`
                        : `opacity ${FADE}ms ${EASE}, transform 700ms ${EASE}`,
                  }}
                  aria-hidden="true"
                >
                  <Image
                    src={f.src}
                    alt=""
                    fill
                    priority={priority && n === 0}
                    loading={n === 0 ? undefined : "lazy"}
                    placeholder="blur"
                    blurDataURL={f.blur}
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                    onLoad={() => loaded.current.add(n)}
                  />
                </span>
              );
            })}
            {/* glass */}
            <span className="pointer-events-none absolute inset-0 block bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />
            {/* Top-LEFT: on desktop the monitor runs off the right edge of the
                page, so a right-hand pill would be off screen. A quiet icon on
                phones (always shown — there is no hover), the word from sm up,
                and on desktop only while the pointer is on the screen. */}
            <span className="pointer-events-none absolute left-2 top-2 inline-flex h-7 min-w-7 items-center justify-center gap-1.5 rounded-full bg-ground/75 px-2 text-[12.5px] font-medium text-ink shadow-card ring-1 ring-white/15 backdrop-blur-sm transition-opacity duration-300 ease-silk sm:left-3 sm:top-3 sm:h-8 sm:px-3 lg:opacity-0 lg:group-hover/screen:opacity-100 lg:group-focus-visible/screen:opacity-100">
              <Expand />
              <span className="hidden sm:inline">Enlarge</span>
            </span>
          </button>
          {/* chin with the mark */}
          <div className="flex h-[22px] items-center justify-center">
            <span className="block h-[5px] w-[5px] rounded-full bg-gold/80 shadow-[0_0_8px_rgba(205,166,86,0.6)]" aria-hidden="true" />
          </div>
        </div>
        {/* stand */}
        <div className="mx-auto h-[14px] w-[22%] rounded-b-[6px] bg-gradient-to-b from-[#24272C] to-[#16181C]" />
        <div className="mx-auto h-[6px] w-[34%] rounded-full bg-black/60 blur-[2px]" />
      </div>

      {/* ------------------------------------------------------------ controls
          One row that never changes shape: Pause / Play on the left, the
          segments on the right. */}
      <div className="mt-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={togglePause}
          aria-label={paused ? "Play the chart pictures" : "Pause the chart pictures"}
          className="-ml-2.5 inline-flex h-8 items-center gap-2 rounded-full px-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-mute outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-gold"
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
          <span className="w-[3.2em] text-left" aria-hidden="true">{paused ? "Play" : "Pause"}</span>
        </button>

        {/* Six segments fit a 320px phone: 18px with 4px gaps below sm, 24px + 6px from sm up. */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5" role="group" aria-label="Chart pictures">
          {frames.map((f, n) => (
            <button
              key={f.src}
              type="button"
              onClick={() => go(n)}
              aria-label={`Picture ${n + 1} of ${count}: ${f.title}`}
              aria-current={n === i}
              className="group relative h-6 w-[18px] outline-none focus-visible:ring-2 focus-visible:ring-gold sm:w-6"
            >
              <span className="absolute inset-x-0 top-1/2 block h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-line-strong/70 transition-colors group-hover:bg-line-strong">
                <span
                  key={n === i ? `on-${i}-${tick}-${running ? "r" : "s"}` : "off"}
                  className="block h-full rounded-full bg-gold"
                  style={
                    n < i
                      ? { width: "100%", opacity: 0.45 }
                      : n === i
                        ? running
                          ? { width: "0%", animation: `fill ${HOLD}ms linear forwards` }
                          : { width: "100%" }
                        : { width: "0%" }
                  }
                />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------ caption
          Every picture's caption stacked in one grid cell — the cell is always
          as tall as the longest one, so nothing below it moves. */}
      <div className="mt-2.5 grid" aria-live={moved ? "polite" : "off"}>
        {frames.map((f, n) => (
          <div
            key={f.src}
            className={`[grid-area:1/1] ${n === i ? "animate-[rise_0.6s_cubic-bezier(0.2,0.7,0.2,1)_both]" : "invisible"}`}
          >
            <p className="text-[15px] leading-snug text-ink">{f.title}</p>
            <Tools frame={f} className="mt-1.5" />
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------ enlarged view */}
      <dialog
        ref={dlg}
        aria-label="DS Universe chart pictures"
        onClose={() => {
          setOpen(false);
          screenBtn.current?.focus();
        }}
        onClick={(e) => {
          if (e.target === dlg.current) setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            go(i + 1);
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            go(i - 1);
          }
        }}
        className="m-0 h-[100svh] max-h-none w-screen max-w-none bg-transparent p-2 text-ink backdrop:bg-[rgba(4,5,6,0.92)] sm:p-4 [@media(max-height:500px)]:p-0"
      >
        {open && (
          <div className="mx-auto flex h-full max-w-[1680px] flex-col overflow-hidden rounded-2xl border border-line bg-mist shadow-monitor [@media(max-height:500px)]:rounded-none [@media(max-height:500px)]:border-0">
            {/* A phone on its side has ~390px of height: the bars go compact
                (one-line header, smaller disclosure, no frame) so the chart
                gets the height — otherwise turning the phone would not make
                the chart any bigger. */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line px-4 py-2.5 sm:px-5 [@media(max-height:500px)]:py-1.5">
              <div className="min-w-0">
                <p className="text-[15px] font-medium leading-snug text-ink [@media(max-height:500px)]:text-[14px]">{frame.title}</p>
                <Tools frame={frame} className="mt-0.5 [@media(max-height:500px)]:hidden" />
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Step dir="prev" onClick={() => go(i - 1)} />
                <span className="w-14 text-center text-[13.5px] tabular-nums text-mute">
                  {i + 1} / {count}
                </span>
                <Step dir="next" onClick={() => go(i + 1)} />
                <button
                  ref={closeBtn}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-2 inline-flex h-9 items-center rounded-md border border-line-strong bg-surface px-3.5 text-[14px] text-ink transition-colors hover:border-ink/60 [@media(max-height:500px)]:h-8"
                >
                  Close
                </button>
              </div>
            </div>

            {/* The picture at the full width of the window (up to its 2560px
                file), fitted so the whole chart is always visible. The pane is
                the charts' own black, so any letterbox is invisible. The
                current picture and its neighbours are mounted, cross-fading. */}
            <div className="relative min-h-0 flex-1" style={{ background: MONITOR.ground }}>
              {frames.map((f, n) => {
                const near = n === i || n === (i + 1) % count || n === (i - 1 + count) % count;
                if (!near) return null;
                return (
                  <div
                    key={f.src}
                    className={`absolute inset-0 transition-opacity duration-500 ease-silk ${n === i ? "opacity-100" : "opacity-0"}`}
                    aria-hidden={n !== i}
                  >
                    <Image
                      src={f.src}
                      alt={`${f.title}. On screen: ${f.tools.map((s) => BY_SLUG[s]?.name).filter(Boolean).join(", ")}.`}
                      fill
                      quality={92}
                      placeholder="blur"
                      blurDataURL={f.blur}
                      sizes="(min-width: 1680px) 1680px, 100vw"
                      className="object-contain"
                    />
                  </div>
                );
              })}
              <p className="pointer-events-none absolute inset-x-0 bottom-3 hidden text-center text-[12.5px] text-slate [@media(orientation:portrait)_and_(max-width:767px)]:block">
                Turn your phone sideways for a larger chart.
              </p>
            </div>

            {/* Required beside the picture — the page's own disclosure is behind the modal. */}
            <p className="shrink-0 border-t border-line bg-surface px-4 py-2.5 text-[13px] leading-relaxed text-slate sm:px-5 [@media(max-height:500px)]:py-1.5 [@media(max-height:500px)]:text-[11.5px] [@media(max-height:500px)]:leading-snug">
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

/** "On screen" + the tools on a picture, each linked to its page. */
function Tools({ frame, className = "" }: { frame: ScreenFrame; className?: string }) {
  const tools = frame.tools.map((s) => BY_SLUG[s]).filter(Boolean);
  return (
    <p className={`text-[13.5px] leading-relaxed text-slate ${className}`}>
      <span className="mr-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-mute">On screen</span>
      {tools.map((p, k) => (
        <Fragment key={p.slug}>
          {/* A break opportunity between names, never inside one ("DS / Oracle").
              The dot rides at the END of the name before it, so a wrapped line
              always starts on a name. */}
          {k > 0 && <wbr />}
          <span className="whitespace-nowrap">
            <Link
              href={`/products/${p.slug}`}
              className="text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-gold"
            >
              {p.name}
            </Link>
            {k < tools.length - 1 && (
              <span aria-hidden="true" className="mx-1.5 text-mute/70">
                ·
              </span>
            )}
          </span>
        </Fragment>
      ))}
    </p>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden="true">
      <rect x="2.25" y="1.5" width="2.5" height="9" rx="0.6" />
      <rect x="7.25" y="1.5" width="2.5" height="9" rx="0.6" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden="true">
      <path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l6.6-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z" />
    </svg>
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
      className="grid h-9 w-9 place-items-center rounded-md border border-line bg-surface text-slate transition-colors hover:border-ink/60 hover:text-ink [@media(max-height:500px)]:h-8 [@media(max-height:500px)]:w-8"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={back ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"} />
      </svg>
    </button>
  );
}

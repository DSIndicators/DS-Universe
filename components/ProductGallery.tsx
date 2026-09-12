"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Shot } from "@/content/shots";
import { DISCLOSURE } from "@/content/site";

/** Seconds the risk-disclosure card occupies at the head of every demo. */
const INTRO = 2.0;

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

  const hasVideo = shots.some((s) => s.video);
  /* Nine of the fifteen products have no demo, only chart stills - and the
     guidelines cover "video content OR chart images". Same band, same place,
     wording that matches what is actually on screen. */
  const notice = hasVideo ? DISCLOSURE.demo : DISCLOSURE.chart;

  return (
    <div>
      {/* ------------------------------------------------------- disclosure
          ABOVE the player, not only inside it. The demo opens on the card and
          the footer carries the full text, but a visitor scrolling past should
          meet the warning without waiting for it or hunting for it - and the
          guidelines ask for video to be "accompanied by" the disclosures, which
          this is in the plainest sense. Deliberately two lines, not a wall:
          pushing the picture down the page to make room for legal text is what
          this whole change was meant to stop. */}
      {shots.length > 0 && (
        <p className="mb-4 max-w-4xl text-[14.5px] leading-relaxed text-slate">
          <span className="mr-2 align-middle text-[11.5px] font-medium uppercase tracking-[0.14em] text-gold-deep">
            Risk disclosure
          </span>
          {notice}{" "}
          <Link
            href="/disclosures"
            className="whitespace-nowrap text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-gold"
          >
            Read them in full
          </Link>
          .
        </p>
      )}

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
                  <DemoVideo name={name} src={s.video.src} poster={s.video.poster} active={n === i} />
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
    </div>
  );
}

/**
 * A demo that can be stopped, and that only shows its disclosure card once.
 *
 * Two problems with a plain <video autoplay loop>: the two-second card replays
 * on every single lap, and nobody can hold it still long enough to read it.
 * So the loop is hand-rolled - on `ended` it seeks past the card rather than to
 * zero - and the whole frame is a button that pauses.
 *
 * The card stays in the FILE, not just on the page, so the disclosure travels
 * with the mp4 if it is ever downloaded or shared.
 *
 * Reduced motion or Data Saver: nothing autoplays and nothing is fetched beyond
 * metadata. What shows is the poster, which IS the disclosure card - so the
 * quiet path is the compliant one too.
 */
function DemoVideo({ name, src, poster, active }: { name: string; src: string; poster: string; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  /* Driven by the element's own play/pause events, never by the click alone:
     if autoplay is refused - iOS Low Power, an unsupported codec, a blocked
     tab - the video is stopped while the click handler still thinks it is
     running, and the hint would read "click to pause" over a frozen frame. */
  const [paused, setPaused] = useState(false);
  const [intro, setIntro] = useState(true);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || conn?.saveData) {
      setPaused(true);
      return;
    }
    setAuto(true);
  }, []);

  /* A rail switch should not leave a demo talking to itself off-screen. */
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!active) v.pause();
    else if (auto && !paused) v.play().catch(() => setPaused(true));
  }, [active, auto, paused]);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setPaused(true));
    else v.pause();
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={paused ? `Play the ${name} demo` : `Pause the ${name} demo`}
      className="absolute inset-0 h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
    >
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        src={src}
        poster={poster}
        autoPlay={auto}
        muted
        playsInline
        preload="metadata"
        tabIndex={-1}
        aria-label={`${name} running in NinjaTrader 8`}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onTimeUpdate={(e) => setIntro(e.currentTarget.currentTime < INTRO)}
        onEnded={(e) => {
          /* back to just after the card, never through it again */
          e.currentTarget.currentTime = INTRO;
          e.currentTarget.play().catch(() => {});
        }}
      />
      {/* The hint is HTML, not burnt into the frame, so it stays crisp at any
          size and disappears the moment it stops being true. */}
      <span
        className={`pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/45 px-3.5 py-2 text-[12.5px] font-medium text-white/90 backdrop-blur-sm transition-opacity duration-500 ease-silk ${
          paused || intro ? "opacity-100" : "opacity-0"
        }`}
      >
        {paused ? <PlayGlyph /> : <PauseGlyph />}
        {paused ? "Paused — click to resume" : "Click to pause and read"}
      </span>
    </button>
  );
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden="true">
      <rect x="2" y="1.5" width="3" height="9" rx="1" />
      <rect x="7" y="1.5" width="3" height="9" rx="1" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor" aria-hidden="true">
      <path d="M3 1.8v8.4L10 6z" />
    </svg>
  );
}

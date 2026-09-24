"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { MONITOR, isClip, type ScreenFrame } from "@/content/site";
import { Viewer } from "@/components/Viewer";
import { BY_SLUG } from "@/content/products";

/**
 * The hero screen: one 15s screen recording and five real NQ charts on
 * NinjaTrader's black ground, rotating (Tom, 2026-09-21: "rotate the 6 black
 * screen... make sure all rotations are elegant and all information makes
 * sense. Also give users the ability to pause the screenshots to read, see it
 * clearly"; 2026-09-23: "Video first, played in full ( users can swipe to skip
 * to next) then our 5 pictures").
 *
 * THE ROTATION
 *  · a PICTURE is held 7s, with a 1.2s crossfade and a very slow 3% push-in
 *    anchored on the RIGHT edge — the price axis and the latest bars never
 *    leave the screen; only the oldest bars on the left drift out;
 *  · the CLIP is held for exactly as long as it plays. The rotation moves on
 *    the video's own `ended` event, not a timer, so a slow connection delays
 *    the next picture instead of cutting the recording short;
 *  · it never fades to a picture that has not loaded — it waits for it;
 *  · ONCE THE CLIP HAS FINISHED it is out of the automatic rotation: the wrap
 *    goes back to the first PICTURE, not to the recording. A visitor reading
 *    the page is not interrupted by 15s of video every lap. Paging, swiping or
 *    clicking back to it replays it from the start.
 *
 * PAUSING, AND THE ONE DELIBERATE INCONSISTENCY
 *  · Pause / Play stops everything, the clip included, and Pause also eases a
 *    picture's push-in back to 100% so the WHOLE chart is on screen, uncropped,
 *    while it is being read;
 *  · a hidden tab stops everything too (an invisible video is wasted battery);
 *  · resting the POINTER on the screen holds a PICTURE — someone is reading it
 *    — but deliberately does NOT pause the clip. The hero is the biggest target
 *    on the page and a cursor lands on it by accident constantly; freezing the
 *    recording under an idle mouse would mean a lot of visitors never see the
 *    thing play at all. There is nothing static to read on moving footage, so
 *    the hold buys nothing there; Pause is the honest control and it is right
 *    below the screen.
 *
 * READING IT
 *  · the screen itself is a button: it opens the shared full-screen Viewer
 *    (components/Viewer.tsx) — the 2560px file for a picture, the same video
 *    file with controls for the clip, so it can be scrubbed and re-watched.
 *    Swipe, arrows or keys to page, Escape to close. No disclosure bar inside
 *    it (Tom, 2026-09-21: "we don't need the disclaimer EVERYWHERE"); the line
 *    under this screen and the footer carry it;
 *  · on a phone, a horizontal flick on the screen moves between frames;
 *  · every frame has a title (what it shows) and the tools on it, named from
 *    their on-chart labels (see content/site.ts).
 *
 * WHAT THE VISITOR IS ACTUALLY SENT
 *  · phones (and anyone with saveData on) get the 1280x720 cut, not the
 *    1920x1080 one — same 15 seconds, 1.15MB instead of 2.79MB. The choice is
 *    made after mount, because it needs the real viewport, so the <video> has
 *    no `src` on the server render and paints its poster until then;
 *  · saveData also starts the screen PAUSED, so nobody on a metered connection
 *    is charged for a video they did not ask for. Play is right there.
 *
 * MOTION PREFERENCES: for prefers-reduced-motion the screen starts paused, the
 * clip does not autoplay and pictures never push in; Play still lets that
 * visitor rotate it by choice. Captions are announced to screen readers only
 * when the visitor moves the frames, never while they rotate by themselves.
 *
 * FIXED FURNITURE (2026-09-21): the control row never changes shape, and every
 * frame's caption is laid into ONE grid cell with only the current one visible,
 * so the cell is as tall as the longest caption at the current width and
 * nothing under it moves as the frames change.
 */
const HOLD = 7000; // ms a PICTURE is held (the clip is held for its own length)
const FADE = 1200; // ms crossfade
const PUSH = 1.03; // push-in over the hold — pictures only
const EASE = "cubic-bezier(0.2,0.7,0.2,1)";

export function HeroScreen({ priority = false, monitorClassName = "" }: { priority?: boolean; monitorClassName?: string }) {
  const frames = MONITOR.frames;
  const count = frames.length;
  const [i, setI] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [small, setSmall] = useState(false); // serve the 720p cut of the clip
  const [paused, setPaused] = useState(false); // the visitor pressed Pause (or prefers reduced motion / saves data)
  const [hover, setHover] = useState(false); // pointer resting on the screen — holds a PICTURE only
  const [hidden, setHidden] = useState(false); // the tab is in the background
  const [open, setOpen] = useState(false); // the enlarged view
  const [tick, setTick] = useState(0); // restarts the hold (and the segment fill)
  const [moved, setMoved] = useState(false); // the visitor has moved the frames: captions may be announced
  const [clipDone, setClipDone] = useState(false); // the clip has played through once
  const [clipAt, setClipAt] = useState(0); // 0..1 through the clip, from the video itself
  const loaded = useRef<Set<number>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const swiped = useRef(false); // a swipe just happened: the click that follows it is not "enlarge"
  /* ONE clip in the rotation, so one ref is enough. A second one would need a
     ref per clip — everything else below already works off `isClip`. */
  const vid = useRef<HTMLVideoElement>(null);
  const wasClip = useRef(false);

  const frame = frames[i];
  const clip = isClip(frame);

  /* A picture rotates on a timer; the clip rotates on `ended`. Both stop for
     Pause, a hidden tab and the enlarged view — only a picture also stops for
     the pointer (see the header). */
  const holding = mounted && !paused && !hidden && !open && count > 1;
  const stillRunning = holding && !hover && !clip;
  const clipPlaying = holding && clip;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    const thrifty = !!conn?.saveData;
    setMounted(true);
    setReduce(mq.matches);
    setHidden(document.hidden); // the page can be opened straight into a background tab
    setSmall(thrifty || window.innerWidth < 768);
    if (mq.matches || thrifty) setPaused(true);
    const onMq = () => {
      setReduce(mq.matches);
      if (mq.matches) setPaused(true);
    };
    mq.addEventListener("change", onMq);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mq.removeEventListener("change", onMq);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  /* Where the rotation goes after `from`. Once the clip has played through, the
     wrap skips it and lands on the first picture instead. */
  const nextIndex = useCallback(
    (from: number) => {
      const n = from + 1;
      if (n < count) return n;
      return clipDone && isClip(frames[0]) ? Math.min(1, count - 1) : 0;
    },
    [count, clipDone, frames],
  );

  // The clock for the PICTURES. When the hold is up it moves on only once the
  // next picture has loaded (checked every 400ms, for up to 6s, then it moves
  // on regardless). The clip is always "ready" — it has its poster.
  useEffect(() => {
    if (!stillRunning) return;
    let waited = 0;
    const advance = () => {
      const next = nextIndex(i);
      if (loaded.current.has(next) || isClip(frames[next]) || waited >= 6000) {
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
  }, [stillRunning, i, tick, nextIndex, frames]);

  // The clip plays or pauses with the rotation. If the browser refuses to
  // autoplay, say so instead of showing "Pause" over a frozen frame.
  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    if (!clipPlaying) {
      if (!v.paused) v.pause();
      return;
    }
    const p = v.play();
    if (p) p.catch(() => setPaused(true));
  }, [clipPlaying]);

  const rewind = useCallback(() => {
    const v = vid.current;
    if (v) {
      try {
        v.currentTime = 0;
      } catch {
        /* not seekable yet — it starts at 0 anyway */
      }
    }
    setClipAt(0);
  }, []);

  // Arriving on the clip — by wrap, by swipe or by segment — starts it over.
  useEffect(() => {
    if (clip && !wasClip.current) rewind();
    wasClip.current = clip;
  }, [clip, rewind]);

  const go = useCallback(
    (n: number) => {
      const to = ((n % count) + count) % count;
      setI(to);
      setTick((t) => t + 1);
      setMoved(true);
      if (isClip(frames[to])) rewind(); // includes re-picking the clip it is already on
    },
    [count, frames, rewind],
  );

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
    setTick((t) => t + 1); // Play starts a full hold, never a half-spent one
    setMoved(true);
  }, []);

  return (
    <div>
      {/* ------------------------------------------------------------ monitor */}
      <div
        className={`relative ${monitorClassName}`}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={() => setHover(false)}
      >
        <div className="relative rounded-[14px] bg-gradient-to-b from-[#2B2F35] via-[#1C1F24] to-[#15171B] p-[10px] shadow-monitor ring-1 ring-white/[0.08]">
          {/* SWIPE (Tom, 2026-09-21: "trouble scrolling through the monitor…
              on mobile"). A horizontal flick on the screen moves to the next or
              previous frame with the same crossfade; a vertical one still
              scrolls the page (`touch-action: pan-y`), and a tap still enlarges. */}
          <button
            type="button"
            onClick={() => {
              if (swiped.current) {
                swiped.current = false;
                return;
              }
              setOpen(true);
            }}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse") return;
              swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
            }}
            onPointerUp={(e) => {
              const s0 = swipe.current;
              swipe.current = null;
              if (!s0 || s0.id !== e.pointerId) return;
              const dx = e.clientX - s0.x;
              const dy = e.clientY - s0.y;
              if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                swiped.current = true;
                go(i + (dx < 0 ? 1 : -1));
                window.setTimeout(() => (swiped.current = false), 400);
              }
            }}
            onPointerCancel={() => (swipe.current = null)}
            aria-haspopup="dialog"
            aria-label={`Enlarge the chart: ${frame.title}`}
            className="group/screen relative block aspect-[16/9] w-full cursor-zoom-in select-none overflow-hidden rounded-[7px] outline-none ring-1 ring-black/60 focus-visible:ring-2 focus-visible:ring-gold"
            style={{ background: MONITOR.ground, touchAction: "pan-y pinch-zoom" }}
          >
            {/* With the clip first, no PICTURE is the largest paint any more —
                the video's poster is, and a `poster` attribute is in the server
                HTML, so it starts downloading without a preload hint of its
                own. `priority` therefore only marks an image when the rotation
                genuinely starts on one. */}
            {frames.map((f, n) => {
              const on = n === i;
              const eager = isClip(frames[0]) ? -1 : 0;
              /* The push-in gives a STILL picture a little life. The clip is
                 already moving — pushing in on moving footage only makes it
                 swim — so it never gets one. */
              const push = on && mounted && !paused && !open && !reduce && !isClip(f);
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
                  {isClip(f) ? (
                    <video
                      ref={vid}
                      /* No `src` until mounted: the 720p / 1080p choice needs
                         the real viewport, and a server-rendered src would
                         fetch the wrong file first. The poster paints meanwhile
                         — and it IS frame 0, so nothing jumps when it starts. */
                      src={mounted ? (small ? f.srcSmall : f.src) : undefined}
                      poster={f.poster}
                      muted
                      playsInline
                      preload="auto"
                      disablePictureInPicture
                      tabIndex={-1}
                      className="h-full w-full object-cover"
                      onTimeUpdate={(e) => {
                        const v = e.currentTarget;
                        if (v.duration > 0) setClipAt(Math.min(1, v.currentTime / v.duration));
                      }}
                      onEnded={() => {
                        setClipDone(true);
                        setClipAt(1);
                        setI((at) => nextIndex(at));
                      }}
                    />
                  ) : (
                    <Image
                      src={f.src}
                      alt=""
                      fill
                      priority={priority && n === eager}
                      loading={n === eager ? undefined : "lazy"}
                      placeholder="blur"
                      blurDataURL={f.blur}
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      className="object-cover"
                      onLoad={() => loaded.current.add(n)}
                    />
                  )}
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
              aria-label={`${isClip(f) ? "Recording" : "Picture"} ${n + 1} of ${count}: ${f.title}`}
              aria-current={n === i}
              className="group relative h-6 w-[18px] outline-none focus-visible:ring-2 focus-visible:ring-gold sm:w-6"
            >
              <span className="absolute inset-x-0 top-1/2 block h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-line-strong/70 transition-colors group-hover:bg-line-strong">
                {isClip(f) ? (
                  /* The clip's segment is filled from the video's own
                     currentTime, not a CSS animation: it then tells the truth
                     if the file stalls, and it freezes exactly where the
                     recording froze when Pause is pressed. */
                  <span
                    className="block h-full rounded-full bg-gold"
                    style={
                      n < i
                        ? { width: "100%", opacity: 0.45 }
                        : n === i
                          ? { width: `${Math.round(clipAt * 100)}%`, transition: "width 280ms linear" }
                          : { width: "0%" }
                    }
                  />
                ) : (
                  <span
                    key={n === i ? `on-${i}-${tick}-${stillRunning ? "r" : "s"}` : "off"}
                    className="block h-full rounded-full bg-gold"
                    style={
                      n < i
                        ? { width: "100%", opacity: 0.45 }
                        : n === i
                          ? stillRunning
                            ? { width: "0%", animation: `fill ${HOLD}ms linear forwards` }
                            : { width: "100%" }
                          : { width: "0%" }
                    }
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------ caption
          Every frame's caption stacked in one grid cell — the cell is always
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

      {/* ------------------------------------------------------ enlarged view
          The clip goes in as a video slide; the visitor gets real controls in
          there, on the same file the tile already downloaded. */}
      <Viewer
        open={open}
        onClose={() => setOpen(false)}
        slides={frames.map((f) => ({
          src: f.src,
          w: isClip(f) ? 1920 : 2560,
          h: isClip(f) ? 1080 : 1440,
          blur: f.blur,
          title: f.title,
          alt: `${f.title}. On screen: ${f.tools.map((s) => BY_SLUG[s]?.name).filter(Boolean).join(", ")}.`,
          sub: <Tools frame={f} />,
          video: isClip(f) ? { src: small ? f.srcSmall : f.src, poster: f.poster } : undefined,
        }))}
        index={i}
        onIndex={(n) => go(n)}
        mode="fit"
        ground={MONITOR.ground}
        label="DS Universe chart pictures"
      />
    </div>
  );
}

/** "On screen" + the tools on a frame, each linked to its page. */
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

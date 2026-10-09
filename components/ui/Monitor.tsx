"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { MONITOR, isClip, type ScreenFrame } from "@/content/site";
import { Viewer } from "@/components/Viewer";
import { BY_SLUG } from "@/content/products";
import { productHref } from "@/content/release";

/**
 * The hero screen: two screen recordings and five real NQ charts on
 * NinjaTrader's black ground, rotating (Tom, 2026-09-21: "rotate the 6 black
 * screen... make sure all rotations are elegant and all information makes
 * sense. Also give users the ability to pause the screenshots to read, see it
 * clearly"; 2026-09-23: "Video first, played in full ( users can swipe to skip
 * to next) then our 5 pictures"; 2026-10-02: a second recording, "the 2nd
 * video played... a nice rotation, 1 video with flow and 1 without flow").
 *
 * THE ROTATION
 *  · a PICTURE is held 7s, with a 1.2s crossfade and a very slow 3% push-in
 *    anchored on the RIGHT edge — the price axis and the latest bars never
 *    leave the screen; only the oldest bars on the left drift out;
 *  · a CLIP is held for exactly as long as it plays. The rotation moves on
 *    the video's own `ended` event, not a timer, so a slow connection delays
 *    the next frame instead of cutting the recording short;
 *  · it never fades to a picture that has not loaded — it waits for it;
 *  · ONCE A CLIP HAS FINISHED it is out of the automatic rotation: the
 *    rotation steps over every recording that has already played through, so
 *    after the first lap it is the pictures that loop. A visitor reading the
 *    page is not interrupted by video every lap. Paging, swiping or clicking
 *    back to a recording replays it from the start;
 *  · ANY NUMBER OF CLIPS (2026-10-02). Each has its own <video>, and only the
 *    one on screen ever plays. A later clip is not downloaded with the page:
 *    it is given its file once it is on screen, or once the frame before it
 *    is half-way through — so a visitor who leaves after ten seconds is never
 *    sent a 60-second recording they did not see, and one who stays has it
 *    buffered by the time it starts.
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
 *    1920x1080 one — the same recording at well under half the size. The choice is
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

export function HeroScreen({
  priority = false,
  monitorClassName = "",
  rootClassName = "",
  infoClassName = "",
  infoFooter,
}: {
  priority?: boolean;
  monitorClassName?: string;
  /** Classes for the root. The home page makes it `xl:contents`, so the
   *  monitor and its info block become cells of the hero's own grid. */
  rootClassName?: string;
  /** Classes for the info block: the controls, the caption and `infoFooter`. */
  infoClassName?: string;
  /** Rendered last in the info block (the home page's screen disclosure). */
  infoFooter?: ReactNode;
}) {
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
  const [done, setDone] = useState<ReadonlySet<number>>(() => new Set()); // clips that have played through once
  const [armed, setArmed] = useState<ReadonlySet<number>>(() => new Set([0])); // clips that have been given their file
  const [clipAt, setClipAt] = useState(0); // 0..1 through the clip ON SCREEN, from the video itself
  const loaded = useRef<Set<number>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const swiped = useRef(false); // a swipe just happened: the click that follows it is not "enlarge"
  /* One <video> per clip, by frame index. Only the one on screen plays. */
  const vids = useRef<Map<number, HTMLVideoElement>>(new Map());
  const at = useRef(0); // the frame on screen, for handlers that outlive a render
  const cameFrom = useRef(-1); // the frame that was on screen before this one

  const frame = frames[i];
  const clip = isClip(frame);
  at.current = i;

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

  /* Where the rotation goes after `from`: the next frame, stepping over any
     clip that has already played through. So the first lap runs every frame in
     order, and from then on the pictures loop. `played` lets the `ended`
     handler pass the set it has just updated, before the state has. */
  const nextIndex = useCallback(
    (from: number, played: ReadonlySet<number> = done) => {
      for (let k = 1; k <= count; k++) {
        const n = (from + k) % count;
        if (!(isClip(frames[n]) && played.has(n))) return n;
      }
      return (from + 1) % count; // nothing but finished clips: plain order
    },
    [count, done, frames],
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

  // The clip ON SCREEN plays or pauses with the rotation; every other clip is
  // held still. If the browser refuses to autoplay, say so instead of showing
  // "Pause" over a frozen frame. A clip is only asked to play once it has its
  // file (`armed`): it can reach the screen a moment before that, when a
  // visitor jumps straight to it.
  useEffect(() => {
    vids.current.forEach((v, n) => {
      if (n === i && clipPlaying && armed.has(n)) {
        const p = v.play();
        // Only a REFUSED autoplay pauses the screen. A play() cut short by a
        // swipe to another frame (AbortError) is not the browser saying no.
        if (p) p.catch((e: unknown) => {
          if ((e as { name?: string })?.name === "NotAllowedError" && at.current === n) setPaused(true);
        });
      } else if (!v.paused) {
        v.pause();
      }
    });
  }, [clipPlaying, i, armed]);

  const rewind = useCallback((n: number) => {
    const v = vids.current.get(n);
    if (v) {
      try {
        v.currentTime = 0;
      } catch {
        /* not seekable yet — it starts at 0 anyway */
      }
    }
    setClipAt(0);
  }, []);

  // Arriving on a clip — by rotation, by swipe or by segment — starts it over,
  // including when the frame before it was the other clip.
  useEffect(() => {
    if (clip && cameFrom.current !== i) rewind(i);
    cameFrom.current = i;
  }, [clip, i, rewind]);

  // WHEN A CLIP GETS ITS FILE. The first frame has it from the start. Any other
  // clip gets it when it reaches the screen, or when it is next in line and the
  // frame before it is half-way through (a clip by its own clock; a picture is
  // held 7s, so being on it is enough). Once given, it keeps it.
  useEffect(() => {
    if (!mounted) return;
    const want: number[] = [];
    if (clip) want.push(i);
    const nx = nextIndex(i);
    if (nx !== i && isClip(frames[nx]) && (!clip || clipAt >= 0.5)) want.push(nx);
    if (want.some((n) => !armed.has(n))) setArmed((a) => new Set([...a, ...want]));
  }, [mounted, clip, i, clipAt, armed, frames, nextIndex]);

  const go = useCallback(
    (n: number) => {
      const to = ((n % count) + count) % count;
      setI(to);
      setTick((t) => t + 1);
      setMoved(true);
      if (isClip(frames[to])) rewind(to); // includes re-picking the clip it is already on
    },
    [count, frames, rewind],
  );

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
    setTick((t) => t + 1); // Play starts a full hold, never a half-spent one
    setMoved(true);
  }, []);

  /* A frame's progress fill, shared by the segments and the frame index: a
     clip by its own currentTime, a picture by the hold's CSS animation. */
  const fill = (n: number, f: ScreenFrame): { key: string; style: CSSProperties } => {
    // Drawn with transform: scaleX, never width — a width animation lays the
    // page out again on every frame of a 7-second hold (2026-10-09).
    const base: CSSProperties = { width: "100%", transformOrigin: "0 50%" };
    if (n < i) return { key: "past", style: { ...base, opacity: 0.45 } };
    if (n > i) return { key: "next", style: { ...base, transform: "scaleX(0)" } };
    if (isClip(f)) return { key: "clip", style: { ...base, transform: `scaleX(${clipAt.toFixed(3)})`, transition: "transform 280ms linear" } };
    return {
      key: `on-${i}-${tick}-${stillRunning ? "r" : "s"}`,
      style: stillRunning ? { ...base, transform: "scaleX(0)", animation: `fill ${HOLD}ms linear forwards` } : base,
    };
  };

  return (
    <div className={rootClassName}>
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
                      ref={(el) => {
                        if (el) vids.current.set(n, el);
                        else vids.current.delete(n);
                      }}
                      /* No `src` until mounted: the 720p / 1080p choice needs
                         the real viewport, and a server-rendered src would
                         fetch the wrong file first. The poster paints meanwhile
                         — and it IS frame 0, so nothing jumps when it starts.
                         A later clip also waits until it is `armed` (above). */
                      src={mounted && armed.has(n) ? (small ? f.srcSmall : f.src) : undefined}
                      poster={f.poster}
                      muted
                      playsInline
                      preload="auto"
                      disablePictureInPicture
                      tabIndex={-1}
                      className="h-full w-full object-cover"
                      onTimeUpdate={(e) => {
                        if (at.current !== n) return; // only the clip on screen drives the segment
                        const v = e.currentTarget;
                        if (v.duration > 0) setClipAt(Math.min(1, v.currentTime / v.duration));
                      }}
                      onEnded={() => {
                        if (at.current !== n) return;
                        const played = new Set(done).add(n);
                        setDone(played);
                        setClipAt(1);
                        setI(nextIndex(n, played));
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
                      sizes="(min-width: 1536px) 62vw, (min-width: 1024px) 75vw, 100vw"
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
            <span className="pointer-events-none absolute left-2 top-2 inline-flex h-7 min-w-7 items-center justify-center gap-1.5 rounded-full bg-ground/75 px-2 text-[length:calc(12px*var(--type))] font-medium text-ink shadow-card ring-1 ring-white/15 backdrop-blur-sm transition-opacity duration-300 ease-silk sm:left-3 sm:top-3 sm:h-8 sm:px-3 lg:opacity-0 lg:group-hover/screen:opacity-100 lg:group-focus-visible/screen:opacity-100">
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

      <div className={infoClassName}>
      {/* THE FRAME INDEX (from 1280px, 2026-10-09). Beside the chart reader,
          under the monitor's right half, the rotation is listed whole: every
          frame by number and title, a recording marked with its length, the
          one on screen opened to show the tools on it, its progress filling
          the rule beneath it. Below 1280px the compact controls and the one
          caption below stand in for it. */}
      <FrameIndex
        className="hidden xl:block"
        frames={frames}
        i={i}
        paused={paused}
        moved={moved}
        onPause={togglePause}
        onGo={go}
        fill={fill}
      />
      <div className="xl:hidden">
      {/* ------------------------------------------------------------ controls
          One row that never changes shape: Pause / Play on the left, the
          segments on the right. */}
      <div className="mt-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={togglePause}
          aria-label={paused ? "Play the chart pictures" : "Pause the chart pictures"}
          className="-ml-2.5 inline-flex h-8 items-center gap-2 rounded-full px-2.5 font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.14em] text-mute outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-gold"
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
          <span className="w-[3.2em] text-left" aria-hidden="true">{paused ? "Play" : "Pause"}</span>
        </button>

        {/* Seven 24px segments (a full touch target each, 2026-10-09) fit a 320px phone beside Pause: 192px with 4px gaps below sm, 6px from sm up. */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5" role="group" aria-label="Chart pictures">
          {frames.map((f, n) => (
            <button
              key={f.src}
              type="button"
              onClick={() => go(n)}
              aria-label={`${isClip(f) ? "Recording" : "Picture"} ${n + 1} of ${count}: ${f.title}`}
              aria-current={n === i}
              className="group relative h-6 w-6 outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <span className="absolute inset-x-0 top-1/2 block h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-line-strong/70 transition-colors group-hover:bg-line-strong">
                {/* The clip's segment is filled from the video's own
                    currentTime, not a CSS animation: it then tells the truth
                    if the file stalls, and it freezes exactly where the
                    recording froze when Pause is pressed. */}
                {(() => {
                  const fl = fill(n, f);
                  return <span key={fl.key} className="block h-full rounded-full bg-gold" style={fl.style} />;
                })()}
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
            <p className="text-[length:calc(14px*var(--type))] leading-snug text-ink">{f.title}</p>
            <Tools frame={f} className="mt-1.5" />
          </div>
        ))}
      </div>
      </div>
      {infoFooter}
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

/** m:ss for a recording's length. */
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

function FrameIndex({
  className = "",
  frames,
  i,
  paused,
  moved,
  onPause,
  onGo,
  fill,
}: {
  className?: string;
  frames: ScreenFrame[];
  i: number;
  paused: boolean;
  moved: boolean;
  onPause: () => void;
  onGo: (n: number) => void;
  fill: (n: number, f: ScreenFrame) => { key: string; style: CSSProperties };
}) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className={className}>
      <div className="flex items-center justify-between border-b border-line pb-3">
        <button
          type="button"
          onClick={onPause}
          aria-label={paused ? "Play the chart pictures" : "Pause the chart pictures"}
          className="-ml-2.5 inline-flex h-8 items-center gap-2 rounded-full px-2.5 font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.14em] text-mute outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-gold"
        >
          {paused ? <PlayIcon /> : <PauseIcon />}
          <span className="w-[3.2em] text-left" aria-hidden="true">{paused ? "Play" : "Pause"}</span>
        </button>
        <span className="font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.16em] text-mute">
          On the screen <span className="ml-2 text-ink">{pad(i + 1)}</span>
          <span className="text-mute/70"> / {pad(frames.length)}</span>
        </span>
      </div>
      <ol role="group" aria-label="Chart pictures" aria-live={moved ? "polite" : "off"}>
        {frames.map((f, n) => {
          const on = n === i;
          const fl = fill(n, f);
          return (
            <li key={f.src} className="relative">
              <button
                type="button"
                onClick={() => onGo(n)}
                aria-current={on}
                aria-label={`${isClip(f) ? "Recording" : "Picture"} ${n + 1} of ${frames.length}: ${f.title}`}
                className="group grid w-full grid-cols-[2.4rem_minmax(0,1fr)_auto] items-baseline gap-x-2 pb-2.5 pt-3 text-left outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                <span className={`font-mono text-[length:calc(10.5px*var(--type))] tracking-[0.12em] transition-colors ${on ? "text-gold" : "text-mute/70"}`}>
                  {pad(n + 1)}
                </span>
                <span
                  className={`text-[length:calc(13.5px*var(--type))] leading-snug transition-colors duration-300 text-pretty ${on ? "text-ink" : "text-mute group-hover:text-slate"}`}
                >
                  {f.title}
                </span>
                <span className={`font-mono text-[length:calc(9.5px*var(--type))] uppercase tracking-[0.14em] ${on ? "text-slate" : "text-mute/60"}`}>
                  {isClip(f) ? `Rec ${clock(f.seconds)}` : "Still"}
                </span>
              </button>
              {on && <Tools frame={f} className="-mt-0.5 mb-3 pl-[calc(2.4rem+0.5rem)]" />}
              <span className="absolute inset-x-0 bottom-0 block h-px overflow-hidden bg-line" aria-hidden="true">
                <span key={fl.key} className={`block h-full bg-gold ${n < i ? "!opacity-0" : ""}`} style={fl.style} />
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** "On screen" + the tools on a frame, each linked to its page. */
function Tools({ frame, className = "" }: { frame: ScreenFrame; className?: string }) {
  const tools = frame.tools.map((s) => BY_SLUG[s]).filter(Boolean);
  return (
    <p className={`text-[length:calc(12.5px*var(--type))] leading-relaxed text-slate ${className}`}>
      <span className="mr-2.5 font-mono text-[length:calc(10.5px*var(--type))] uppercase tracking-[0.14em] text-mute">On screen</span>
      {tools.map((p, k) => (
        <Fragment key={p.slug}>
          {/* A break opportunity between names, never inside one ("DS / Oracle").
              The dot rides at the END of the name before it, so a wrapped line
              always starts on a name. */}
          {k > 0 && <wbr />}
          <span className="whitespace-nowrap">
            <Link
              href={productHref(p.slug)}
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

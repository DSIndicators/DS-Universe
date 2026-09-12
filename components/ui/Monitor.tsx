"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MONITOR } from "@/content/site";

/**
 * The hero monitor. The screen is a 16:9 slot fed by content/site.ts → MONITOR.
 *
 * With MONITOR.clips set it plays those recordings and nothing else: silent, in
 * sequence, forever. No controls, no dots, no captions — the monitor is a
 * backdrop for the headline beside it, not a player to be operated.
 *
 * Each recording is letterboxed into 16:9 at encode time in the chart's own
 * #E3E3E3, so nothing is cropped (the indicator list, the price axis, the Sonar
 * lanes and every label survive) and the fill disappears into the screen.
 *
 * One clip hands over to the next by crossfade, which is what a cut cannot do
 * here: each clip is a different session, so a hard switch reads as a glitch.
 *
 * The poster is a real frame of the first clip, so the screen is never empty: it
 * is what paints first, what a blocked autoplay (iOS Low Power Mode) falls back
 * to, and what anyone with prefers-reduced-motion or Data Saver sees instead of
 * the clips. Phones load the smaller encodes; nothing downloads at all when the
 * visitor has asked for less motion or less data, and the second clip is not
 * fetched until the first is halfway through — so the page costs one clip, and
 * the second arrives during the twelve seconds nobody is waiting on it.
 *
 * Without MONITOR.clips it falls back to the still rotation this component had
 * before, so going back to pictures is a data change in site.ts, not a code one.
 */
const HOLD = 5500; // ms a still is held
const FADE = 900; // ms crossfade — stills and clips both, mirrors duration-[900ms] below

export function Monitor({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <div className={`relative ${className}`}>
      {/* panel */}
      <div className="relative rounded-[14px] bg-gradient-to-b from-[#F1F2F5] to-[#DFE2E8] p-[10px] shadow-monitor ring-1 ring-black/[0.06]">
        <div
          className="relative aspect-[16/9] overflow-hidden rounded-[7px] bg-[#E3E3E3] ring-1 ring-black/10"
          role="img"
          aria-label={MONITOR.alt}
        >
          {MONITOR.clips?.length ? <ClipScreen priority={priority} /> : <StillScreen priority={priority} />}
          {/* glass */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.10] via-transparent to-transparent" />
        </div>
        {/* chin with the mark */}
        <div className="flex h-[22px] items-center justify-center">
          <span className="block h-[5px] w-[5px] rounded-full bg-gold/70" aria-hidden="true" />
        </div>
      </div>
      {/* stand */}
      <div className="mx-auto h-[14px] w-[22%] rounded-b-[6px] bg-gradient-to-b from-[#DADDE4] to-[#C6CAD3]" />
      <div className="mx-auto h-[6px] w-[34%] rounded-full bg-[#C6CAD3]/70 blur-[1px]" />
    </div>
  );
}

/** The recordings, one after another. The poster sits under them, so there is a chart from the first paint. */
function ClipScreen({ priority }: { priority: boolean }) {
  const clips = MONITOR.clips!;
  const els = useRef<(HTMLVideoElement | null)[]>([]);
  const [play, setPlay] = useState(false); // false = poster only (reduced motion / Data Saver)
  const [small, setSmall] = useState(false);
  const [front, setFront] = useState(0); // the clip on screen
  const frontRef = useRef(0); // the same, readable from listeners that outlive a render
  const [ready, setReady] = useState(1); // how many clips have been given a src

  /* Decided on the client, once: the poster alone when the visitor has asked for
     less motion or less data, the small encodes on phones. */
  useEffect(() => {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || conn?.saveData) return;
    setSmall(window.matchMedia("(max-width: 767px)").matches);
    setPlay(true);
  }, []);

  useEffect(() => {
    if (!play) return;
    const start = (n: number) => {
      const v = els.current[n];
      if (!v) return;
      try {
        v.currentTime = 0;
      } catch {
        /* not seekable yet: it starts at 0 anyway */
      }
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {}); // autoplay refused: the poster stays
    };

    /* hand over at the end of the clip, and pull the next one down at halfway so
       it is buffered by the time it is needed */
    const onEnded = (n: number) => () => {
      const next = (n + 1) % clips.length;
      frontRef.current = next;
      setFront(next);
      start(next);
      window.setTimeout(() => {
        const v = els.current[n];
        if (!v) return;
        v.pause();
        try {
          v.currentTime = 0;
        } catch {
          /* ignore */
        }
      }, FADE + 100);
    };
    const onTime = (n: number) => () => {
      const v = els.current[n];
      if (v && Number.isFinite(v.duration) && v.currentTime > v.duration / 2) {
        setReady((r) => Math.max(r, Math.min(clips.length, n + 2)));
      }
    };

    const offs: Array<() => void> = [];
    els.current.forEach((v, n) => {
      if (!v) return;
      const e = onEnded(n);
      const t = onTime(n);
      v.addEventListener("ended", e);
      v.addEventListener("timeupdate", t);
      offs.push(() => {
        v.removeEventListener("ended", e);
        v.removeEventListener("timeupdate", t);
      });
    });
    const onVisibility = () => {
      const v = els.current[frontRef.current];
      if (!v) return;
      if (document.hidden) v.pause();
      else {
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    start(frontRef.current);
    return () => {
      offs.forEach((off) => off());
      document.removeEventListener("visibilitychange", onVisibility);
      els.current.forEach((v) => v && v.pause());
    };
  }, [play, clips.length]);

  return (
    <>
      <Image
        src={MONITOR.poster}
        alt=""
        fill
        priority={priority}
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover object-center"
        aria-hidden="true"
      />
      {play
        ? clips.map((clip, n) => (
            <video
              key={clip.src}
              ref={(el) => {
                els.current[n] = el;
              }}
              src={n < ready ? (small && clip.srcSmall ? clip.srcSmall : clip.src) : undefined}
              poster={MONITOR.poster}
              muted
              playsInline
              preload={n === 0 ? "auto" : "metadata"}
              tabIndex={-1}
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[900ms] ease-silk ${
                n === front ? "opacity-100" : "opacity-0"
              }`}
            />
          ))
        : null}
    </>
  );
}

/** The older still rotation, kept working for whenever the screen goes back to pictures. */
function StillScreen({ priority }: { priority: boolean }) {
  const frames = MONITOR.frames;
  const [i, setI] = useState(0);
  const [rotate, setRotate] = useState(false);

  useEffect(() => {
    if (frames.length < 2) return;
    const motionOk = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => setRotate(!motionOk.matches);
    decide();
    motionOk.addEventListener("change", decide);
    return () => motionOk.removeEventListener("change", decide);
  }, [frames.length]);

  useEffect(() => {
    if (!rotate) return;
    let timer: ReturnType<typeof setInterval>;
    const start = () => {
      timer = setInterval(() => setI((n) => (n + 1) % frames.length), HOLD);
    };
    const stop = () => clearInterval(timer);
    const onVisibility = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [rotate, frames.length]);

  return (
    <>
      {frames.map((src, n) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          /* the first frame is what everyone sees first — load it eagerly,
             let the rest arrive in their own time */
          priority={priority && n === 0}
          loading={n === 0 ? undefined : "lazy"}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className={`object-cover object-center transition-opacity duration-[900ms] ease-silk ${
            n === i ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

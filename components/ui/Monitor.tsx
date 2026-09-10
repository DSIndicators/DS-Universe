"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MONITOR } from "@/content/site";

/**
 * The hero monitor. The screen is a 16:9 slot fed by content/site.ts → MONITOR.
 *
 * With more than one frame it rotates, crossfading. The frames are ordered
 * light, dark, light, dark… on purpose (see site.ts): alternating theme makes
 * each change register as a change, where three pale shots in a row would read
 * as one picture slowly wobbling.
 *
 * Three things it deliberately does NOT do: no dots, no arrows, no captions.
 * The monitor is a backdrop for the headline beside it, not a carousel to be
 * operated — controls would invite clicking and pull attention off the copy.
 *
 * It stops rotating for anyone with prefers-reduced-motion (they get the first
 * frame and nothing moves), and while the tab is hidden.
 */
const HOLD = 5500; // ms a frame is held
const FADE = 900; // ms crossfade, matches the duration class below

export function Monitor({ className = "", priority = false }: { className?: string; priority?: boolean }) {
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
    <div className={`relative ${className}`}>
      {/* panel */}
      <div className="relative rounded-[14px] bg-gradient-to-b from-[#F1F2F5] to-[#DFE2E8] p-[10px] shadow-monitor ring-1 ring-black/[0.06]">
        <div
          className="relative aspect-[16/9] overflow-hidden rounded-[7px] bg-[#0f1114] ring-1 ring-black/40"
          role="img"
          aria-label={MONITOR.alt}
        >
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
          {/* glass */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
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

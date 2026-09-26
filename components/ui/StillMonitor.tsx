"use client";

import Image from "next/image";
import { useState } from "react";
import { Viewer, type ViewerSlide } from "@/components/Viewer";

/**
 * A single chart picture in the same monitor as the home hero (bezel, chin,
 * stand) — no rotation, no controls. The screen is a button that opens the
 * shared full-screen Viewer, exactly like the hero screen does.
 *
 * Built for the /products header (Tom, 2026-09-26: "Product page is empty…
 * place a clean neat monitor there, fit nicely that displays this picture").
 * The picture is on NinjaTrader's black ground, so the screen is painted that
 * black too and the letterbox (if any) never shows as a different shade.
 */
export function StillMonitor({
  src,
  w,
  h,
  blur,
  alt,
  title,
  sub,
  ground = "#040404",
  priority = false,
}: {
  src: string;
  w: number;
  h: number;
  blur?: string;
  alt: string;
  title: string;
  sub?: string;
  ground?: string;
  priority?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const slides: ViewerSlide[] = [{ src, w, h, blur, alt, title, sub }];

  return (
    <div>
      <div className="relative">
        <div className="relative rounded-[14px] bg-gradient-to-b from-[#2B2F35] via-[#1C1F24] to-[#15171B] p-[10px] shadow-monitor ring-1 ring-white/[0.08]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-label={`Enlarge the chart: ${title}`}
            className="group/screen relative block aspect-[16/9] w-full cursor-zoom-in select-none overflow-hidden rounded-[7px] outline-none ring-1 ring-black/60 focus-visible:ring-2 focus-visible:ring-gold"
            style={{ background: ground }}
          >
            <Image
              src={src}
              alt={alt}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 620px, 92vw"
              quality={92}
              placeholder={blur ? "blur" : "empty"}
              blurDataURL={blur}
              className="object-cover"
            />
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-white/80 opacity-0 transition-opacity duration-300 group-hover/screen:opacity-100 group-focus-visible/screen:opacity-100">
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Enlarge
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

      <Viewer
        open={open}
        onClose={() => setOpen(false)}
        slides={slides}
        index={0}
        onIndex={() => {}}
        ground={ground}
        label={title}
      />
    </div>
  );
}

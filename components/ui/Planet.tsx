"use client";

import { cn } from "@/components/ui/cn";

type PlanetProps = {
  className?: string;
  /** Diameter in px of the planet body. */
  size?: number;
};

/**
 * Pure-CSS abstraction of the DS Universe emblem: aurora planet body with a
 * tilted orbit ring and a single moon dot tracing it. Echoes the logo without
 * shipping another raster. Animations honor prefers-reduced-motion via globals.
 */
export function Planet({ className, size = 360 }: PlanetProps) {
  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-aurora opacity-40 blur-3xl" />

      {/* Planet body */}
      <div className="absolute inset-[5%] rounded-full bg-aurora shadow-glow animate-float" />

      {/* Cool rim light */}
      <div className="absolute inset-[5%] rounded-full ring-1 ring-space-cyan/40" />

      {/* Tilted orbit ring + moon */}
      <div className="absolute inset-0 animate-orbit [transform:rotateX(74deg)_rotateZ(20deg)]">
        <div className="absolute inset-[4%] rounded-full border border-white/15" />
        <div className="absolute left-1/2 top-[4%] h-2 w-2 -translate-x-1/2 rounded-full bg-space-cyan shadow-glow-cyan" />
      </div>
    </div>
  );
}

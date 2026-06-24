"use client";

import { cn } from "@/components/ui/cn";
import { Orb3D } from "@/components/ui/Orb3D";

type PlanetProps = {
  className?: string;
  /** Diameter in px of the emblem. */
  size?: number;
};

/**
 * The DS Universe emblem — a luminous gold ring "eye" (see Orb3D). The center is
 * intentionally left dark/transparent so the global starfield shows through it.
 * Keeps the `ds-orb` marker so the site-wide sharpen rule never squares it.
 */
export function Planet({ className, size = 360 }: PlanetProps) {
  return (
    <div
      className={cn("ds-orb relative", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Orb3D size={size} className="absolute inset-0" />
    </div>
  );
}

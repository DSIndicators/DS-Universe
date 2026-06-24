import { cn } from "@/components/ui/cn";

type IntelligenceCoreProps = {
  className?: string;
  /** Diameter in px of the core. */
  size?: number;
};

/**
 * The DS Registry "Intelligence Core" — a crisp neon wireframe sphere with a
 * hot cyan center and concentric base rings, echoing the AI-accent system.
 * Pure SVG so it stays razor-sharp at any size; motion honors
 * prefers-reduced-motion via globals. This is the brain the Systems report to.
 */
export function IntelligenceCore({ className, size = 200 }: IntelligenceCoreProps) {
  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Ambient bloom behind the core (kept subtle - no heavy halo) */}
      <div className="bg-ai pointer-events-none absolute inset-[22%] rounded-full opacity-[0.12] blur-2xl animate-pulse-slow" />

      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id="ic-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe7b0" />
            <stop offset="50%" stopColor="#e3b65c" />
            <stop offset="100%" stopColor="#d9a64a" />
          </linearGradient>
          <radialGradient id="ic-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="22%" stopColor="#fff2d6" />
            <stop offset="48%" stopColor="#ffe7b0" />
            <stop offset="100%" stopColor="#ffe7b0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ic-shell" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#e3b65c" stopOpacity="0.18" />
            <stop offset="70%" stopColor="#d9a64a" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#050507" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sphere fill + rim */}
        <circle cx="100" cy="100" r="70" fill="url(#ic-shell)" />
        <circle cx="100" cy="100" r="70" stroke="url(#ic-grad)" strokeWidth="1.5" opacity="0.9" />
        <circle cx="100" cy="100" r="55" stroke="url(#ic-grad)" strokeWidth="0.75" opacity="0.35" />

        {/* Spinning wireframe meridians — the globe turning */}
        <g
          className="origin-center animate-[orbit_16s_linear_infinite]"
          stroke="url(#ic-grad)"
          strokeWidth="0.9"
          opacity="0.55"
        >
          <ellipse cx="100" cy="100" rx="22" ry="70" />
          <ellipse cx="100" cy="100" rx="46" ry="70" />
          <ellipse cx="100" cy="100" rx="68" ry="70" />
        </g>

        {/* Latitude lines */}
        <g stroke="url(#ic-grad)" strokeWidth="0.8" opacity="0.32">
          <line x1="32" y1="100" x2="168" y2="100" />
          <ellipse cx="100" cy="100" rx="70" ry="24" />
          <ellipse cx="100" cy="100" rx="64" ry="48" />
        </g>

        {/* Vertical light axis through the core */}
        <line x1="100" y1="14" x2="100" y2="186" stroke="url(#ic-grad)" strokeWidth="0.75" opacity="0.4" />

        {/* Hot core */}
        <circle cx="100" cy="100" r="34" fill="url(#ic-core)" className="animate-pulse-slow" />
        <circle cx="100" cy="100" r="6" fill="#ffffff" />

        {/* Concentric base rings — the "podium" */}
        <g stroke="url(#ic-grad)" fill="none">
          <ellipse cx="100" cy="172" rx="62" ry="11" strokeWidth="1.4" opacity="0.7" />
          <ellipse cx="100" cy="176" rx="84" ry="14" strokeWidth="0.8" opacity="0.35" />
        </g>
      </svg>
    </div>
  );
}

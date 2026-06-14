import { cn } from "@/components/ui/cn";
import { OrbCape } from "@/components/ui/OrbCape";
import { OrbMouth } from "@/components/ui/OrbMouth";

type FusedCoreProps = {
  className?: string;
  /** Diameter in px of the whole visual. */
  size?: number;
};

/**
 * The Connective Tissue visual — the DS Universe signature orb (aurora body,
 * cute eyes, ember cape) fused inside the DS Registry's Intelligence Core
 * wireframe sphere. The orb literally *is* the hot core the systems report to:
 * the meridians spin around it, the base rings hold it up. Pure CSS + SVG, so
 * it stays sharp at any size; motion honors prefers-reduced-motion via globals.
 */
export function FusedCore({ className, size = 360 }: FusedCoreProps) {
  // The signature orb sits at the center; scale the 84px mascot body to fill
  // roughly the inner sphere.
  const orbScale = (size / 84) * 0.4;

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Ambient bloom behind the fused core */}
      <div className="bg-ai pointer-events-none absolute inset-[10%] rounded-full opacity-30 blur-3xl animate-pulse-slow" />

      {/* Intelligence Core wireframe — the brain's shell, sans the hot core
          (the signature orb takes its place). */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id="fc-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5fe6ee" />
            <stop offset="50%" stopColor="#6d8cff" />
            <stop offset="100%" stopColor="#a86bff" />
          </linearGradient>
          <radialGradient id="fc-shell" cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor="#6d8cff" stopOpacity="0.18" />
            <stop offset="70%" stopColor="#a86bff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#050507" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sphere fill + rim */}
        <circle cx="100" cy="100" r="74" fill="url(#fc-shell)" />
        <circle cx="100" cy="100" r="74" stroke="url(#fc-grad)" strokeWidth="1.5" opacity="0.9" />
        <circle cx="100" cy="100" r="58" stroke="url(#fc-grad)" strokeWidth="0.75" opacity="0.32" />

        {/* Spinning wireframe meridians — the globe turning around the orb */}
        <g
          className="origin-center animate-[orbit_18s_linear_infinite]"
          stroke="url(#fc-grad)"
          strokeWidth="0.9"
          opacity="0.5"
        >
          <ellipse cx="100" cy="100" rx="24" ry="74" />
          <ellipse cx="100" cy="100" rx="50" ry="74" />
          <ellipse cx="100" cy="100" rx="72" ry="74" />
        </g>

        {/* Latitude lines */}
        <g stroke="url(#fc-grad)" strokeWidth="0.8" opacity="0.28">
          <line x1="28" y1="100" x2="172" y2="100" />
          <ellipse cx="100" cy="100" rx="74" ry="26" />
        </g>

        {/* Concentric base rings — the "podium" */}
        <g stroke="url(#fc-grad)" fill="none">
          <ellipse cx="100" cy="178" rx="64" ry="11" strokeWidth="1.4" opacity="0.65" />
          <ellipse cx="100" cy="182" rx="88" ry="14" strokeWidth="0.8" opacity="0.32" />
        </g>
      </svg>

      {/* The signature orb at the heart of the core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{ width: 84, height: 84, transform: `scale(${orbScale})` }}
        >
          <span className="orb-cape">
            <OrbCape />
          </span>
          <div className="orb-mascot-body">
            <div className="orb-mascot-eyes">
              <span className="orb-eye">
                <span className="orb-pupil">
                  <span className="orb-shine" />
                </span>
              </span>
              <span className="orb-eye">
                <span className="orb-pupil">
                  <span className="orb-shine" />
                </span>
              </span>
            </div>
            <OrbMouth />
          </div>
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/components/ui/cn";

/**
 * The DS mascot's ember cape — a full, elegant cloak of fire that wraps the orb
 * and drapes down behind it. It's layered and ambient, not a solid shape: a soft
 * underglow, a broad billowing cloak mass, flowing flame folds, licks rising up
 * its sides, and a gracefully flame-licked hem that flares outward (so it reads
 * as a cloak, not a jetpack). Pure SVG; positioned + swayed by the .orb-cape /
 * .orb-cape-svg classes, with the flame accents flickering via .orb-flame.
 */
export function OrbCape({ className }: { className?: string }) {
  return (
    <svg
      className={cn("orb-cape-svg", className)}
      viewBox="0 0 120 156"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="ember-fall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe7b0" stopOpacity="0.92" />
          <stop offset="30%" stopColor="#ffae4d" />
          <stop offset="64%" stopColor="#ff6a2c" />
          <stop offset="100%" stopColor="#e23015" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ember-bright" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff1cc" stopOpacity="0.95" />
          <stop offset="38%" stopColor="#ffc457" />
          <stop offset="76%" stopColor="#ff7a36" />
          <stop offset="100%" stopColor="#ff5a22" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ember-aura" cx="50%" cy="44%" r="62%">
          <stop offset="0%" stopColor="#ff9a3c" stopOpacity="0.46" />
          <stop offset="58%" stopColor="#ff5a22" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#e23015" stopOpacity="0" />
        </radialGradient>
        <filter id="cape-soft" x="-50%" y="-25%" width="200%" height="175%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="cape-mid" x="-45%" y="-22%" width="190%" height="170%">
          <feGaussianBlur stdDeviation="1.9" />
        </filter>
        <filter id="cape-wisp" x="-80%" y="-20%" width="260%" height="180%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* Soft ambient warmth enveloping the figure. */}
      <ellipse cx="60" cy="98" rx="66" ry="72" fill="url(#ember-aura)" filter="url(#cape-soft)" />

      {/* Cloak back-mass — broad, soft bulk that gives the fire depth. */}
      <path
        filter="url(#cape-soft)"
        fill="url(#ember-fall)"
        opacity="0.5"
        d="M60 40 C 80 40 94 52 100 70 C 114 92 122 116 114 134 C 96 128 84 142 60 142 C 36 142 24 128 6 134 C -2 116 6 92 20 70 C 26 52 40 40 60 40 Z"
      />

      {/* Main cloak — a broad, soft drape that flares wide with a gently waved
          (not pointed) hem, so it reads as billowing fabric of fire. */}
      <path
        filter="url(#cape-mid)"
        fill="url(#ember-fall)"
        opacity="0.78"
        d="M60 42 C 74 42 84 50 88 64 C 102 82 114 104 110 124 C 100 132 96 126 88 130 C 80 134 74 128 66 132 C 62 134 58 134 54 132 C 46 128 40 134 32 130 C 24 126 20 132 10 124 C 6 104 18 82 32 64 C 36 50 46 42 60 42 Z"
      />

      {/* Flowing flame folds — a hint of draped fabric within the fire. */}
      <g fill="url(#ember-bright)" opacity="0.32" filter="url(#cape-wisp)">
        <path d="M48 70 C 51 90 50 110 48 128 C 44 110 44 90 48 70 Z" />
        <path d="M72 70 C 75 90 74 110 72 128 C 68 110 68 90 72 70 Z" />
      </g>

      {/* Flames licking UPWARD around the orb — fire rising and wrapping it,
          varying heights, leaning outward at the edges. This is the elegant
          "fire cloak" energy (rising, not blasting down). */}
      <g fill="url(#ember-fall)" opacity="0.52" filter="url(#cape-wisp)">
        <path className="orb-flame" style={{ animationDelay: "-2.4s" }} d="M16.5 132 C 16 114 15 94 17 86 C 19 94 24 114 23.5 132 Z" />
        <path className="orb-flame" style={{ animationDelay: "-1.1s" }} d="M32.5 134 C 32 116 32 88 34 80 C 36 88 40 116 39.5 134 Z" />
        <path className="orb-flame" style={{ animationDelay: "0s" }} d="M48.5 134 C 48 116 49 84 51 76 C 53 84 56 116 55.5 134 Z" />
        <path className="orb-flame" style={{ animationDelay: "-0.6s" }} d="M64.5 134 C 64 116 67 84 69 76 C 71 84 72 116 71.5 134 Z" />
        <path className="orb-flame" style={{ animationDelay: "-1.7s" }} d="M80.5 134 C 80 116 84 88 86 80 C 88 88 88 116 87.5 134 Z" />
        <path className="orb-flame" style={{ animationDelay: "-2.9s" }} d="M96.5 132 C 96 114 101 94 103 86 C 105 94 104 114 103.5 132 Z" />
      </g>

      {/* Embers drifting up off the fire. */}
      <g fill="#ffd9a0">
        <circle cx="40" cy="112" r="1.2" opacity="0.6" />
        <circle cx="66" cy="118" r="1.3" opacity="0.62" />
        <circle cx="54" cy="104" r="1" opacity="0.5" />
        <circle cx="80" cy="110" r="1.1" opacity="0.55" />
        <circle cx="48" cy="96" r="0.9" opacity="0.45" />
        <circle cx="72" cy="98" r="0.9" opacity="0.45" />
      </g>
    </svg>
  );
}

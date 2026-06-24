import { cn } from "@/components/ui/cn";

type EmblemProps = {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

/**
 * Bespoke DS Universe line-emblems. A unique, cohesive gold icon per product,
 * hand-drawn as thin SVG strokes (stroke = currentColor, so the parent sets the
 * gold). Intentionally NOT from any common icon pack.
 */
export function Emblem({ name, size = 22, className, strokeWidth = 1.5 }: EmblemProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn(className),
    "aria-hidden": true,
  };

  switch (name) {
    // ---- DS Radars -----------------------------------------------------------
    case "pilots":
      return (
        <svg {...common}>
          <path d="M5 14l7-7 7 7" />
          <path d="M7.5 18l4.5-4.5L16.5 18" />
          <circle cx="12" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "sweeper":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
          <path d="M12 12l5-3.2" />
          <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      );
    case "beacon":
      // Watchtower beacon: a lit lamp on a mast emitting signal waves.
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="1.6" fill="currentColor" stroke="none" />
          <path d="M9 5.6a4.2 4.2 0 0 0 0 5.8" />
          <path d="M15 5.6a4.2 4.2 0 0 1 0 5.8" />
          <path d="M6.6 3.6a7.5 7.5 0 0 0 0 9.8" opacity="0.55" />
          <path d="M17.4 3.6a7.5 7.5 0 0 1 0 9.8" opacity="0.55" />
          <path d="M12 10.2V20" />
          <path d="M8.5 20h7" />
        </svg>
      );

    // ---- DS Systems ----------------------------------------------------------
    case "orbit":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.2" />
          <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-28 12 12)" />
          <circle cx="19.4" cy="8.4" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case "stars":
      return (
        <svg {...common}>
          <path d="M9 5.5l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z" />
          <path d="M16.5 12l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" />
          <path d="M8.5 16.5l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5z" />
          <path d="M10.6 8.4l4.6 3.1M15.2 14.4l-5.4 2.6" opacity="0.45" />
        </svg>
      );
    case "balance":
      return (
        <svg {...common}>
          <path d="M12 2.5v19" />
          <path d="M8 6.5l4-4 4 4" />
          <path d="M8 17.5l4 4 4-4" />
          <path d="M5.5 12h13" opacity="0.7" />
        </svg>
      );
    case "ember":
      return (
        <svg {...common}>
          <path d="M13 2.5c.6 3-1 4.6-2.6 6.1S8 11.6 8 13.6a4 4 0 0 0 8 0c0-1.6-.7-2.9-1.6-3.9" />
          <path d="M12 19.2a2.2 2.2 0 0 0 2.2-2.2c0-1.2-1-2.1-2.2-3.1-1.2 1-2.2 1.9-2.2 3.1A2.2 2.2 0 0 0 12 19.2z" />
        </svg>
      );
    case "council":
      return (
        <svg {...common}>
          <circle cx="12" cy="4.8" r="1.7" />
          <circle cx="5.4" cy="17.2" r="1.7" />
          <circle cx="18.6" cy="17.2" r="1.7" />
          <circle cx="12" cy="12.6" r="2.1" />
          <path d="M12 6.5v4M10.4 13.8l-3.6 2M13.6 13.8l3.6 2" opacity="0.6" />
        </svg>
      );
    case "pulse":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M4 12h2.6l1.9-5 3 10 2-7 1.4 2H20" />
        </svg>
      );

    // ---- Features ------------------------------------------------------------
    case "timeframe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3.2 2" />
          <path d="M12 3.5v1.6M20.5 12h-1.6M12 20.5v-1.6M3.5 12h1.6" opacity="0.6" />
        </svg>
      );
    case "registry":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.4" />
          <circle cx="12" cy="4" r="1.2" />
          <circle cx="19" cy="9" r="1.2" />
          <circle cx="16.4" cy="18.6" r="1.2" />
          <circle cx="7.6" cy="18.6" r="1.2" />
          <circle cx="5" cy="9" r="1.2" />
          <path d="M12 9.6V5.2M13.8 10.7 17.6 9.7M13.4 13.9l2.4 3.5M10.6 13.9l-2.4 3.5M10.2 10.7 6.4 9.7" opacity="0.55" />
        </svg>
      );
    case "norepaint":
      return (
        <svg {...common}>
          <path d="M8 3v18" />
          <rect x="6" y="8" width="4" height="7" rx="0.5" />
          <rect x="13" y="12" width="7" height="5.5" rx="1" />
          <path d="M14.6 12v-1.6a2 2 0 0 1 4 0V12" />
        </svg>
      );
    case "nolag":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M13 6.5l-4 6.2h3l-1 4.8 4-6.4h-3z" />
        </svg>
      );

    // ---- Council characters --------------------------------------------------
    case "atlas":
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v13" />
          <path d="M6 13a6 6 0 0 0 12 0" />
          <path d="M3.6 13H6M18 13h2.4" />
        </svg>
      );
    case "sage":
      return (
        <svg {...common}>
          <path d="M5 19l7.5-7.5" />
          <path d="M12.5 11.5c2-2 4.8-3 6-7-4 1.2-5 4-7 6z" />
          <path d="M5 19h4" />
        </svg>
      );
    case "nova":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2" />
          <path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21" />
          <path d="M6.2 6.2l3 3M14.8 14.8l3 3M17.8 6.2l-3 3M9.2 14.8l-3 3" opacity="0.7" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

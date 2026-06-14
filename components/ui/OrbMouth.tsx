import { forwardRef } from "react";

/**
 * The mascot's mouth — four kawaii expressions stacked in one SVG. Only the one
 * matching the wrapper's data-expr is shown; the others fade out. OrbMascot
 * flips data-expr over time for a smooth change of expression. Defaults happy.
 */
export const OrbMouth = forwardRef<HTMLDivElement, { defaultExpr?: string }>(
  function OrbMouth({ defaultExpr = "happy" }, ref) {
    return (
      <div ref={ref} className="orb-mouth" data-expr={defaultExpr}>
        <svg viewBox="0 0 24 16" fill="none" aria-hidden>
          {/* happy — gentle smile */}
          <path
            className="m-shape m-happy"
            d="M6 6 Q12 13 18 6"
            stroke="#161019"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* neutral — slightly tilted line */}
          <path
            className="m-shape m-neutral"
            d="M7 8.5 L17 7.5"
            stroke="#161019"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* sad — small frown */}
          <path
            className="m-shape m-sad"
            d="M6 10 Q12 4 18 10"
            stroke="#161019"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* playful — open smile with a little tongue */}
          <g className="m-shape m-playful">
            <path
              d="M7 6 Q12 12 17 6"
              stroke="#161019"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M10.5 9.4 Q12 12.6 13.5 9.4 Z"
              fill="#ff5a6a"
            />
          </g>
        </svg>
      </div>
    );
  },
);

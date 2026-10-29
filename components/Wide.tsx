import type { Wide } from "@/content/capabilities";
import { srcSetOf, type Rung } from "@/content/catalog";
import HD from "@/content/hd.json";
import { DISCLOSURE } from "@/content/site";

const LADDERS = (HD as { wide?: Record<string, Rung[]> }).wide ?? {};

/**
 * One of Tom's wide charts, edge to edge at its own proportions — never
 * cropped. srcset offers the whole picture at a ladder of widths
 * (content/hd.json, tools/upscale): the original scaled down for smaller
 * screens, the original itself, and the upscaled master above it, so a screen
 * decodes a picture close to the size it shows instead of stretching one.
 *
 * `drawn`: the hero's one orchestrated moment. A paper-white veil slides off
 * the chart left to right. It is a transform on a composited layer, so the
 * GPU does it without repainting the picture on every frame.
 */
export function WideFigure({ pic, drawn = false, caption = true }: { pic: Wide; drawn?: boolean; caption?: boolean }) {
  return (
    <figure className="wide">
      <div className={drawn ? "wide-img drawn" : "wide-img"}>
        <img
          src={pic.src}
          srcSet={srcSetOf(pic.src, pic.w, LADDERS[pic.key])}
          sizes="100vw"
          width={pic.w}
          height={pic.h}
          alt={pic.alt}
          decoding="async"
          loading={drawn ? "eager" : "lazy"}
          fetchPriority={drawn ? "high" : "auto"}
          data-chart=""
        />
      </div>
      {caption && (
        <figcaption className="wb wide-cap">
          <span className="small what" style={{ color: "var(--ink-2)" }}>
            {pic.caption}
          </span>
          {pic.disclosure ? (
            <span className="small risk risk-trade">
              {pic.disclosure}{" "}
              <a className="lnk" href="#disclosures">
                Full risk and hypothetical performance disclosures
              </a>
              .
            </span>
          ) : (
            <span className="small risk">{DISCLOSURE.chart}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

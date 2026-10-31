"use client";

import { useRef } from "react";
import type { Pic } from "@/content/pictures";
import { DISCLOSURE } from "@/content/site";

/**
 * A picture, CONTAINED (2026-10-30 feedback: full- and half-width pictures
 * made the site feel cluttered and people got lost). It is shown at the size
 * of the column it sits in, inside a hairline frame, and a click opens it full
 * size over the page, with the chart disclosure beside it (the vendor
 * guidelines want chart images accompanied by the risk and hypothetical
 * disclosures; in the open view the footer is out of sight).
 * Tom's pixels are never altered: same files, only the display size changes.
 */
export function Shot({
  pic,
  sizes,
  caption,
  priority,
  className,
}: {
  pic: Pic;
  sizes: string;
  caption?: React.ReactNode;
  priority?: boolean;
  className?: string;
}) {
  const dlg = useRef<HTMLDialogElement>(null);
  const open = () => dlg.current?.showModal();
  const close = () => dlg.current?.close();
  return (
    <figure className={`shot${pic.dark ? " shot-dark" : ""}${className ? ` ${className}` : ""}`}>
      <button type="button" className="shot-btn" onClick={open} aria-label={`Open full size: ${pic.alt}`}>
        <span className="shot-frame" style={{ display: "block" }}>
          <img
            src={pic.src}
            srcSet={pic.srcSet}
            sizes={sizes}
            width={pic.w}
            height={pic.h}
            alt={pic.alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            draggable={false}
          />
        </span>
        <span className="shot-hint" aria-hidden="true">
          View full size
        </span>
      </button>
      {caption && <figcaption className="small">{caption}</figcaption>}
      <dialog ref={dlg} className="lb" aria-label="Picture, full size" onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="lb-in" onClick={(e) => e.target === e.currentTarget && close()}>
          <button type="button" className="lb-close" onClick={close} autoFocus>
            Close
          </button>
          <img src={pic.src} srcSet={pic.srcSet} sizes="96vw" width={pic.w} height={pic.h} alt={pic.alt} loading="lazy" decoding="async" />
          <p className="lb-cap">{DISCLOSURE.chart}</p>
        </div>
      </dialog>
    </figure>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * MOUNT LATER, NOT AT LOAD (2026-10-09, Tom: "as lag free as possible").
 *
 * The home page carries interactive pieces that only one kind of screen ever
 * shows (the wide chart reader from 1280px, the vertical one below it) and
 * pieces far down the page (the DS Complete chart). Server-rendered, every one
 * of them is hydrated the moment the page loads — on a phone that is work for
 * pieces it will never display, and it is what made the first two seconds
 * stutter on a mid-range phone. Wrapped in Defer, a piece is not in the
 * server HTML at all; in its place stands an empty box of the same size
 * (`className`, which carries the piece's own layout classes and a height),
 * and the piece is mounted only
 *   · when `query` matches (or there is none), and
 *   · with `near`, once the box is within ~a screen of the viewport,
 * so it is ready before it is reached and nothing on screen moves.
 */
export function Defer({
  query,
  near = false,
  className = "",
  children,
}: {
  query?: string;
  near?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (on) return;
    const mq = query ? window.matchMedia(query) : null;
    let io: IntersectionObserver | null = null;
    const arm = () => {
      if (mq && !mq.matches) return;
      if (!near || typeof IntersectionObserver === "undefined" || !box.current) {
        setOn(true);
        return;
      }
      io?.disconnect();
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            io?.disconnect();
            setOn(true);
          }
        },
        { rootMargin: "900px 0px" },
      );
      io.observe(box.current);
    };
    arm();
    mq?.addEventListener("change", arm);
    return () => {
      mq?.removeEventListener("change", arm);
      io?.disconnect();
    };
  }, [on, query, near]);

  if (on) return <>{children}</>;
  return <div ref={box} className={className} aria-hidden="true" />;
}

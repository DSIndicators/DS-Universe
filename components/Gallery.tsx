"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Chevron, Expand, Viewer, type ViewerSlide } from "@/components/Viewer";

/**
 * A picture carousel for a product page — "On the chart" and the product-guide
 * boards both use it.
 *
 * ONE MECHANISM AT EVERY SIZE: the pictures sit side by side on a native
 * scroll-snap track (MDN, CSS scroll snap). On a phone that is a real swipe —
 * the picture follows the finger and settles with the platform's own momentum —
 * which is what was missing ("i have trouble scrolling through the monitor and
 * product pictures elegantly on mobile", Tom, 2026-09-21). A trackpad swipes it
 * the same way; arrows (from md up) and the thumbnails scroll it for a mouse.
 * The page's own vertical scroll is never captured: the track only takes
 * horizontal gestures.
 *
 * FIXED FURNITURE: the stage has one shape for the whole set (`ratio`), and
 * every caption is laid into one grid cell with only the current one visible,
 * so nothing on the page moves as the pictures change.
 *
 * Tap / click a picture for the full-screen Viewer, opened on that picture.
 * Only the current picture and its neighbours are mounted until visited.
 *
 * ARIA: the WAI-ARIA APG carousel pattern — a labelled region with
 * aria-roledescription "carousel", slides as labelled groups, and the position
 * announced politely only after the visitor moves it.
 *
 * A SLIDE CAN BE A RECORDING (`slide.video`, the product showcases, 2026-09-28).
 * It plays muted and inline only while it is the current slide AND the stage is
 * on screen AND the tab is visible; it loops; the visitor can pause it (WCAG
 * 2.2.2 — anything that moves for more than five seconds gets a pause). With
 * prefers-reduced-motion it starts paused on its first frame. The file is
 * picked after mount (the lighter cut on phones and saveData), so the server
 * HTML carries only the poster — which is frame 0, so nothing jumps.
 */
export function Gallery({
  slides,
  ratio,
  ground,
  label,
  mode = "fit",
  priority = false,
  thumbs = true,
  footnote,
}: {
  slides: ViewerSlide[];
  /** width / height of the stage — the whole set shares it */
  ratio: number;
  ground: string;
  label: string;
  mode?: "fit" | "read";
  priority?: boolean;
  thumbs?: boolean;
  /** one quiet line under the captions (the risk line on the first gallery of a page) */
  footnote?: React.ReactNode;
}) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const [moved, setMoved] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0, 1]));
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const count = slides.length;
  const many = count > 1;
  const hasVideo = slides.some((s) => s.video);

  // Recording state: on screen, tab visible, visitor's own pause, and what the
  // video element itself reports (the label follows the element, not the click).
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [held, setHeld] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [kick, setKick] = useState(0);
  const [small, setSmall] = useState<boolean | null>(null);
  useEffect(() => {
    if (!hasVideo) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    setSmall(window.matchMedia("(max-width: 767px)").matches || !!conn?.saveData);
    if (reduce) setHeld(true);
    const el = stage.current;
    const io = el ? new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting && e.intersectionRatio >= 0.35), { threshold: [0, 0.35, 0.6] }) : null;
    if (el && io) io.observe(el);
    const vis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [hasVideo]);
  const current = slides[i];

  useEffect(() => {
    setSeen((s) => {
      const n = new Set(s);
      [i - 1, i, i + 1].forEach((k) => k >= 0 && k < count && n.add(k));
      return n.size === s.size ? s : n;
    });
  }, [i, count]);

  const onScroll = () => {
    const t = track.current;
    if (!t || !t.clientWidth) return;
    const n = Math.round(t.scrollLeft / t.clientWidth);
    if (n !== i && n >= 0 && n < count) {
      setI(n);
      setMoved(true);
    }
  };

  const go = (n: number, behavior: ScrollBehavior = "smooth") => {
    const t = track.current;
    if (!t) return;
    const to = Math.max(0, Math.min(count - 1, n));
    t.scrollTo({ left: to * t.clientWidth, behavior });
  };

  // after the full-screen viewer was paged, the page shows the same picture
  const fromViewer = (n: number) => {
    setI(n);
    setMoved(true);
    go(n, "instant" as ScrollBehavior);
  };

  // keep the current picture in place if the track changes width (rotation,
  // window resize). One observer for the life of the gallery, acting only on a
  // real width change — re-made per index, it would fire at once and yank a
  // swipe that is still settling.
  const at = useRef(i);
  at.current = i;
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let w = t.clientWidth;
    const ro = new ResizeObserver(() => {
      if (t.clientWidth !== w) {
        w = t.clientWidth;
        t.scrollTo({ left: at.current * w, behavior: "instant" as ScrollBehavior });
      }
    });
    ro.observe(t);
    return () => ro.disconnect();
  }, []);

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      {/* ------------------------------------------------------------ stage */}
      <div ref={stage} className="group/stage relative overflow-hidden rounded-2xl border border-line shadow-monitor" style={{ background: ground }}>
        <div
          ref={track}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
          style={{ aspectRatio: String(ratio), touchAction: "pan-x pan-y pinch-zoom" }}
          onKeyDown={(e) => {
            if (!many) return;
            if (e.key === "ArrowRight") {
              e.preventDefault();
              go(i + 1);
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              go(i - 1);
            }
          }}
        >
          {slides.map((s, n) => (
            <div
              key={s.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${n + 1} of ${count}`}
              className="relative h-full w-full shrink-0 snap-center snap-always"
            >
              <button
                type="button"
                onClick={() => {
                  setI(n);
                  setOpen(true);
                }}
                tabIndex={n === i ? 0 : -1}
                aria-haspopup="dialog"
                aria-label={`Enlarge: ${s.alt}`}
                className="absolute inset-0 block cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
                style={
                  s.video
                    ? { backgroundImage: `url("${s.video.poster}")`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
                    : s.blur && !seen.has(n)
                      ? { backgroundImage: `url("${s.blur}")`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
                      : undefined
                }
              >
                {s.video ? (
                  <Recording
                    video={s.video}
                    small={small}
                    run={n === i && onScreen && tabVisible && !held && !open}
                    kick={kick}
                    onPlaying={(p) => n === i && setPlaying(p)}
                  />
                ) : seen.has(n) && (
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    priority={priority && n === 0}
                    loading={priority && n === 0 ? undefined : "lazy"}
                    placeholder={s.blur ? "blur" : "empty"}
                    blurDataURL={s.blur}
                    sizes="(min-width: 1280px) 1200px, (min-width: 1024px) 90vw, 100vw"
                    className="object-contain"
                  />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Enlarge — an icon on a phone (no hover there), the word from sm up,
            on a pointer screen only while the pointer is over the stage. */}
        <span className="pointer-events-none absolute left-2.5 top-2.5 inline-flex h-7 min-w-7 items-center justify-center gap-1.5 rounded-full bg-ground/75 px-2 text-[12px] font-medium text-ink shadow-card ring-1 ring-white/15 backdrop-blur-sm transition-opacity duration-300 ease-silk sm:left-3 sm:top-3 sm:h-8 sm:px-3 lg:opacity-0 lg:group-hover/stage:opacity-100">
          <Expand />
          <span className="hidden sm:inline">Enlarge</span>
        </span>

        {/* Pause / Play — only while the current slide is a recording */}
        {current?.video && (
          <button
            type="button"
            onClick={() => {
              // a real click can start playback even where autoplay was refused
              setHeld(playing);
              if (!playing) setKick((k) => k + 1);
            }}
            aria-label={playing ? "Pause the recording" : "Play the recording"}
            className="absolute bottom-2.5 left-2.5 inline-flex h-7 items-center gap-1.5 rounded-full bg-ground/75 px-2.5 text-[12px] font-medium text-ink shadow-card ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:ring-white/30 sm:bottom-3 sm:left-3 sm:h-8 sm:px-3"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
            <span>{playing ? "Pause" : "Play"}</span>
          </button>
        )}

        {/* arrows — for a mouse; a finger or trackpad just swipes */}
        {many && (
          <>
            <Arrow dir="prev" disabled={i === 0} onClick={() => go(i - 1)} />
            <Arrow dir="next" disabled={i === count - 1} onClick={() => go(i + 1)} />
          </>
        )}
      </div>

      {/* ------------------------------------------------------------ caption + position
          `relative` on purpose: the stage is positioned, so its deep shadow
          would otherwise paint OVER the caption's first line and dim it. */}
      <div className="relative mt-3.5 flex items-start justify-between gap-5">
        <div className="grid min-w-0 flex-1" aria-live={moved ? "polite" : "off"}>
          {slides.map((s, n) => (
            <p
              key={s.src}
              className={`[grid-area:1/1] text-[13.5px] leading-relaxed text-slate ${n === i ? "" : "invisible"}`}
              aria-hidden={n !== i}
            >
              {s.video && (
                <span className="mr-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold">
                  Recording{s.video.seconds ? ` · ${s.video.seconds} s` : ""}
                </span>
              )}
              {s.title}
            </p>
          ))}
        </div>
        {many && (
          <div className="flex shrink-0 items-center pt-1" aria-hidden="true">
            {/* The dashes are tap targets on a phone (2026-09-30 mobile scan):
                each button is a full 24px square (28 wide from sm) with the
                dash drawn inside it, so the visible rhythm barely moves — an
                18px dash at a 24px pitch on phones, the same 24px dash at a 28px
                pitch as before from sm — and a thumb can no longer land
                between two of them. */}
            {slides.map((s, n) => (
              <button
                key={s.src}
                type="button"
                tabIndex={-1}
                onClick={() => go(n)}
                aria-label={`Picture ${n + 1} of ${count}`}
                className="group relative h-6 w-6 sm:w-7"
              >
                <span className={`absolute inset-x-[3px] top-1/2 block h-[3px] -translate-y-1/2 rounded-full transition-colors duration-300 sm:inset-x-[2px] ${n === i ? "bg-gold" : "bg-line-strong/70 group-hover:bg-line-strong"}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------ thumbnails (from sm up) */}
      {/* Each thumb is 120px (136 from lg) and gives way evenly when the row
          would run past the column (2026-09-30 mobile scan: DS Flow's six —
          a recording and five charts — ran 34px off a 768px tablet). */}
      {many && thumbs && (
        <div className="relative mt-4 hidden gap-2.5 sm:flex" aria-label={`${label} — pick a picture`}>
          {slides.map((s, n) => (
            <button
              key={s.src}
              type="button"
              onClick={() => go(n)}
              aria-label={`Picture ${n + 1} of ${count}: ${s.title}`}
              aria-current={n === i}
              className={`relative min-w-0 flex-[0_1_120px] overflow-hidden rounded-lg outline-none transition-all duration-300 ease-silk focus-visible:ring-2 focus-visible:ring-gold lg:flex-[0_1_136px] ${
                n === i ? "ring-2 ring-gold" : "opacity-55 ring-1 ring-white/10 hover:opacity-100 hover:ring-white/25"
              }`}
              style={{ background: ground, aspectRatio: String(ratio) }}
            >
              <Image src={s.video ? s.video.poster : s.src} alt="" fill sizes="136px" className="object-contain" loading="lazy" />
              {s.video && (
                <span className="absolute bottom-1 left-1 grid h-5 w-5 place-items-center rounded-full bg-ground/80 text-ink ring-1 ring-white/15">
                  <PlayIcon className="h-2.5 w-2.5" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {footnote && <p className="relative mt-5 max-w-4xl text-[12.5px] leading-relaxed text-mute">{footnote}</p>}

      <Viewer
        open={open}
        onClose={() => setOpen(false)}
        slides={slides}
        index={i}
        onIndex={fromViewer}
        mode={mode}
        ground={ground}
        label={label}
      />
    </div>
  );
}

/**
 * The recording on a slide. `run` is the whole decision (current slide, stage on
 * screen, tab visible, not paused, viewer closed); the element reports back
 * through onPlaying so the Pause/Play label can never disagree with it.
 */
function Recording({
  video,
  small,
  run,
  kick,
  onPlaying,
}: {
  video: NonNullable<ViewerSlide["video"]>;
  small: boolean | null;
  run: boolean;
  kick: number;
  onPlaying: (p: boolean) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  // the file is chosen once the viewport is known; until then only the poster shows
  const src = small === null ? undefined : small && video.srcSmall ? video.srcSmall : video.src;
  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    if (run) v.play().catch(() => onPlaying(false));
    else v.pause();
  }, [run, src, kick]);
  return (
    <video
      ref={ref}
      src={src}
      poster={video.poster}
      muted
      loop
      playsInline
      preload={run ? "auto" : "metadata"}
      disablePictureInPicture
      aria-hidden="true"
      tabIndex={-1}
      onPlay={() => onPlaying(true)}
      onPause={() => onPlaying(false)}
      className="absolute inset-0 h-full w-full object-contain"
    />
  );
}

function PlayIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} fill="currentColor" aria-hidden="true">
      <path d="M3 1.8v8.4L10 6z" />
    </svg>
  );
}

function PauseIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} fill="currentColor" aria-hidden="true">
      <path d="M2.5 1.8h2.4v8.4H2.5zM7.1 1.8h2.4v8.4H7.1z" />
    </svg>
  );
}

function Arrow({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  const back = dir === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={back ? "Previous picture" : "Next picture"}
      className={`absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-ground/75 text-ink ring-1 ring-white/15 backdrop-blur-sm transition-opacity duration-300 ease-silk disabled:pointer-events-none disabled:!opacity-0 md:grid lg:opacity-0 lg:group-hover/stage:opacity-100 ${
        back ? "left-3" : "right-3"
      }`}
    >
      <Chevron back={back} />
    </button>
  );
}

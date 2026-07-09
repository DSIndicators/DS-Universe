"use client";

import { useEffect, useState } from "react";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DS UNIVERSE — full-screen "Coming Soon" cover.
 *
 *  Sits ON TOP of the entire live site (every page) so the public sees only this
 *  gate until launch. The real website is fully intact underneath — this
 *  is a pure overlay and changes nothing about the pages themselves.
 *
 *  ┌── TAKE IT DOWN (go live) ────────────────────────────────────────────────┐
 *  │  Delete the  <ComingSoon />  line from app/layout.tsx (and optionally      │
 *  │  delete this file). That's the whole teardown — nothing else changes.      │
 *  └───────────────────────────────────────────────────────────────────────────┘
 *
 *  ┌── PREVIEW THE LIVE SITE FOR YOURSELF (bypass the cover) ──────────────────┐
 *  │  Visit:      https://dsuniverse.net/?preview=gargantua                     │
 *  │    → unlocks THIS browser permanently (remembered locally). Safe to share  │
 *  │      the link with anyone you trust for an early look.                     │
 *  │  Re-lock this browser (to test what the public sees):  ?preview=off        │
 *  │  Change the secret word below whenever you like.                           │
 *  └───────────────────────────────────────────────────────────────────────────┘
 */

const PREVIEW_KEY = "gargantua"; // ← your secret preview word (edit freely)
const STORAGE_FLAG = "ds-universe-preview";

export function ComingSoon() {
  // Default = covered. We only lift the cover on the client if this browser
  // holds the preview unlock, so the public (and no-JS visitors) always see it.
  const [covered, setCovered] = useState(true);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("preview");
      let unlocked = localStorage.getItem(STORAGE_FLAG) === PREVIEW_KEY;

      if (p !== null) {
        const v = p.trim().toLowerCase();
        if (v === PREVIEW_KEY.toLowerCase()) {
          localStorage.setItem(STORAGE_FLAG, PREVIEW_KEY);
          unlocked = true;
        } else if (v === "off" || v === "lock" || v === "reset") {
          localStorage.removeItem(STORAGE_FLAG);
          unlocked = false;
        }
        // Scrub the ?preview=… token out of the address bar either way.
        params.delete("preview");
        const qs = params.toString();
        const clean =
          window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
        window.history.replaceState(null, "", clean);
      }

      if (unlocked) setCovered(false);
    } catch {
      /* if storage is blocked, fail safe = keep the cover up */
    }
  }, []);

  // Lock background scroll while the cover is up.
  useEffect(() => {
    if (!covered) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [covered]);

  if (!covered) return null;

  return (
    <div
      className="cs-root"
      role="dialog"
      aria-modal="true"
      aria-label="DS Universe — coming soon"
    >
      <style>{cs}</style>

      {/* Ambient layers */}
      <div className="cs-stars" aria-hidden="true" />
      <div className="cs-grid" aria-hidden="true" />
      <div className="cs-glow" aria-hidden="true" />
      <div className="cs-vignette" aria-hidden="true" />

      {/* Corner brackets — a subtle HUD / targeting frame. */}
      <span className="cs-corner cs-tl" aria-hidden="true" />
      <span className="cs-corner cs-tr" aria-hidden="true" />
      <span className="cs-corner cs-bl" aria-hidden="true" />
      <span className="cs-corner cs-br" aria-hidden="true" />

      <div className="cs-inner">
        <div className="cs-orb-wrap" aria-hidden="true">
          <span className="cs-orb-glow" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cs-orb" src="/brand/emblem.png" alt="" />
        </div>

        <p className="cs-wordmark">DS&nbsp;UNIVERSE</p>

        <h1 className="cs-title">
          COMING&nbsp;SOON
          <span className="cs-sheen" aria-hidden="true" />
        </h1>

        <div className="cs-rule" aria-hidden="true" />

        <p className="cs-sub">
          The command center is being calibrated. Futures intelligence for every
          timeframe — DS&nbsp;Universe opens shortly.
        </p>

        <span className="cs-tag">
          <span className="cs-dot" aria-hidden="true" />
          Opening soon
        </span>

        <p className="cs-foot">dsuniverse.net · Precision from orbit</p>
      </div>
    </div>
  );
}

/* Everything scoped under .cs-* so the whole gate lives in this one file. */
const cs = `
.cs-root{
  position:fixed; inset:0; z-index:2147483000;
  display:flex; align-items:center; justify-content:center;
  padding:24px; overflow:hidden;
  background:
    radial-gradient(120% 90% at 50% 8%, #12100b 0%, #0a0805 42%, #050505 100%);
  color:#f4f0e6;
  font-family:var(--font-poppins), ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing:antialiased;
  animation:cs-fade .6s ease both;
}
@keyframes cs-fade{ from{opacity:0} to{opacity:1} }

/* faint starfield */
.cs-stars{
  position:absolute; inset:0; pointer-events:none; opacity:.55;
  background-image:
    radial-gradient(1px 1px at 18% 26%, rgba(255,248,230,.55) 0, transparent 100%),
    radial-gradient(1px 1px at 72% 16%, rgba(255,248,230,.45) 0, transparent 100%),
    radial-gradient(1.4px 1.4px at 86% 62%, rgba(244,205,122,.6) 0, transparent 100%),
    radial-gradient(1px 1px at 33% 82%, rgba(255,248,230,.35) 0, transparent 100%),
    radial-gradient(1.4px 1.4px at 12% 64%, rgba(227,178,79,.5) 0, transparent 100%),
    radial-gradient(1px 1px at 58% 48%, rgba(255,248,230,.3) 0, transparent 100%);
  background-repeat:repeat; background-size:620px 620px;
  animation:cs-twinkle 6s ease-in-out infinite alternate;
}
@keyframes cs-twinkle{ from{opacity:.4} to{opacity:.7} }

/* faint intelligence grid */
.cs-grid{
  position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(227,178,79,.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(227,178,79,.045) 1px, transparent 1px);
  background-size:52px 52px;
  -webkit-mask-image:radial-gradient(120% 100% at 50% 40%, #000 0%, transparent 78%);
  mask-image:radial-gradient(120% 100% at 50% 40%, #000 0%, transparent 78%);
}

/* warm gold bloom behind the mark */
.cs-glow{
  position:absolute; left:50%; top:38%; width:min(880px,120vw); height:min(880px,120vw);
  transform:translate(-50%,-50%); pointer-events:none;
  background:radial-gradient(circle at 50% 50%,
    rgba(244,205,122,.16) 0%, rgba(227,178,79,.10) 34%,
    rgba(184,128,31,.05) 55%, transparent 72%);
  animation:cs-breathe 7s ease-in-out infinite alternate;
}
@keyframes cs-breathe{ from{opacity:.75; transform:translate(-50%,-50%) scale(1)} to{opacity:1; transform:translate(-50%,-50%) scale(1.06)} }

.cs-vignette{
  position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(120% 90% at 50% 50%, transparent 58%, rgba(0,0,0,.55) 100%);
}

/* HUD corner brackets */
.cs-corner{
  position:absolute; width:34px; height:34px; pointer-events:none;
  border-color:rgba(227,178,79,.45); border-style:solid; border-width:0;
}
.cs-tl{ top:20px; left:20px; border-top-width:2px; border-left-width:2px }
.cs-tr{ top:20px; right:20px; border-top-width:2px; border-right-width:2px }
.cs-bl{ bottom:20px; left:20px; border-bottom-width:2px; border-left-width:2px }
.cs-br{ bottom:20px; right:20px; border-bottom-width:2px; border-right-width:2px }

.cs-inner{
  position:relative; z-index:1; text-align:center;
  display:flex; flex-direction:column; align-items:center;
  max-width:720px; width:100%;
}

/* orb */
.cs-orb-wrap{ position:relative; display:grid; place-items:center; margin-bottom:26px;
  animation:cs-rise .8s .05s ease both; }
.cs-orb{
  position:relative; z-index:1;
  width:clamp(128px,22vw,208px); height:auto; display:block;
  filter:drop-shadow(0 18px 44px rgba(227,178,79,.28));
  animation:cs-float 6s ease-in-out infinite;
}
.cs-orb-glow{
  position:absolute; width:150%; height:150%; border-radius:50%;
  background:radial-gradient(circle,
    rgba(255,231,176,.28) 0%, rgba(227,178,79,.14) 40%, transparent 68%);
  filter:blur(6px); animation:cs-breathe 5.5s ease-in-out infinite alternate;
}
@keyframes cs-float{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }

.cs-wordmark{
  margin:0 0 14px; font-weight:600;
  font-size:clamp(.82rem,1.6vw,1.02rem);
  letter-spacing:.42em; text-indent:.42em;
  color:#e9d6a6;
  animation:cs-rise .8s .12s ease both;
}

.cs-title{
  margin:0; font-weight:700; line-height:.98;
  font-size:clamp(2.9rem,10vw,6.6rem);
  letter-spacing:.02em;
  position:relative; display:inline-block;
  background:linear-gradient(180deg,#fff4d6 0%,#f4cd7a 40%,#e3b24f 66%,#b8801f 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  text-shadow:0 1px 0 rgba(0,0,0,.25);
  animation:cs-rise .8s .18s ease both;
}
/* moving light sweep across the headline */
.cs-sheen{
  position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(100deg, transparent 38%, rgba(255,255,255,.55) 50%, transparent 62%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  mix-blend-mode:screen; opacity:.9;
  background-size:220% 100%; background-position:120% 0;
  animation:cs-sweep 5.2s ease-in-out infinite;
}
@keyframes cs-sweep{ 0%{background-position:120% 0} 55%,100%{background-position:-40% 0} }

.cs-rule{
  width:min(320px,72%); height:1px; margin:26px 0 22px;
  background:linear-gradient(90deg, transparent, rgba(227,178,79,.7), transparent);
  position:relative; animation:cs-rise .8s .24s ease both;
}
.cs-rule::after{
  content:""; position:absolute; top:-1px; left:0; width:80px; height:3px;
  background:linear-gradient(90deg, transparent, #ffe7b0, transparent);
  filter:blur(.4px); animation:cs-scan 4.6s ease-in-out infinite;
}
@keyframes cs-scan{ 0%{left:-80px; opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{left:100%; opacity:0} }

.cs-sub{
  margin:0; max-width:46ch;
  font-size:clamp(.95rem,1.5vw,1.12rem); line-height:1.6;
  color:#b9b2a2;
  animation:cs-rise .8s .3s ease both;
}

.cs-tag{
  margin-top:30px; display:inline-flex; align-items:center; gap:9px;
  padding:9px 18px;
  border:1px solid rgba(227,178,79,.3);
  background:linear-gradient(180deg, rgba(255,231,176,.05), rgba(6,5,3,.35));
  font-family:var(--font-mono), ui-monospace, monospace;
  font-size:.66rem; font-weight:600; letter-spacing:.28em; text-transform:uppercase;
  color:#f0d9a4;
  box-shadow:inset 0 1px 0 rgba(255,231,176,.08);
  animation:cs-rise .8s .36s ease both;
}
.cs-dot{
  width:7px; height:7px; border-radius:50%;
  background:#f4cd7a; box-shadow:0 0 10px 1px rgba(244,205,122,.85);
  animation:cs-pulse 1.9s ease-in-out infinite;
}
@keyframes cs-pulse{ 0%,100%{opacity:.45; transform:scale(.82)} 50%{opacity:1; transform:scale(1)} }

.cs-foot{
  margin:34px 0 0;
  font-family:var(--font-mono), ui-monospace, monospace;
  font-size:.62rem; letter-spacing:.22em; text-transform:uppercase;
  color:#6f6a5f;
  animation:cs-rise .8s .42s ease both;
}

@keyframes cs-rise{ from{opacity:0; transform:translateY(14px)} to{opacity:1; transform:translateY(0)} }

@media (max-width:520px){
  .cs-corner{ width:24px; height:24px }
  .cs-tag{ letter-spacing:.2em }
}

/* respect reduced motion */
@media (prefers-reduced-motion: reduce){
  .cs-root, .cs-root *{ animation:none !important }
}
`;

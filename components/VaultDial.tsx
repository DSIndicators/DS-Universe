/**
 * THE VAULT DOOR'S DIAL — the Free Vault's entrance (2026-10-08).
 *
 * Tom: "i want the free vault to feel luxurious, like they've just stepped
 * into a vault... hints of gold... Elegance and precision."
 *
 * Drawn the way a bank-vault dial and a watch face are made, because both
 * are the vocabulary of precision money already trusts:
 *   · a GRADUATED BEZEL — a hundred divisions, every fifth longer, every
 *     tenth numbered in the instrument face (the site's mono);
 *   · a GUILLOCHÉ rosette — the engine-turned pattern of banknotes and watch
 *     dials, generated here as exact epitrochoids (no image, no texture),
 *     in brass at a whisper;
 *   · the door's WHEEL — five spokes on a hub carrying the vault mark.
 * All of it is hairline on the dark ground: no fill, no glow, no gradient.
 *
 * MOTION, once, on arrival: the bezel turns a third of a revolution to its
 * index and the wheel counter-turns to rest — the door being opened — then
 * the rosette drifts at one revolution every four minutes, like a second
 * hand you only notice when you look for it. prefers-reduced-motion stops
 * all of it (app/globals.css). Decorative: hidden from assistive tech.
 */

const C = 240;

/** An epitrochoid rosette: k lobes, as one closed path. */
function rosette(rBase: number, amp: number, k: number, phase = 0, steps = 720) {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = rBase + amp * Math.cos(k * t + phase);
    const x = C + r * Math.cos(t);
    const y = C + r * Math.sin(t);
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + "Z";
}

function ticks() {
  const out: { x1: number; y1: number; x2: number; y2: number; w: number; o: number }[] = [];
  for (let i = 0; i < 100; i++) {
    const a = (i / 100) * Math.PI * 2 - Math.PI / 2;
    const major = i % 10 === 0;
    const mid = i % 5 === 0;
    const r1 = 222;
    const r2 = major ? 204 : mid ? 210 : 215;
    out.push({
      x1: C + r1 * Math.cos(a),
      y1: C + r1 * Math.sin(a),
      x2: C + r2 * Math.cos(a),
      y2: C + r2 * Math.sin(a),
      w: major ? 1.1 : 0.7,
      o: major ? 0.9 : mid ? 0.6 : 0.38,
    });
  }
  return out;
}

const NUMERALS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
  return { n: String(i * 10).padStart(2, "0"), x: C + 192 * Math.cos(a), y: C + 192 * Math.sin(a) };
});

const SPOKES = Array.from({ length: 5 }, (_, i) => (i / 5) * 360);

// Two engine-turned bands: one fine wave each, repeated a few degrees on
// from the last so the lines weave into the moiré of a banknote rather than
// draw one bold flower. Rotating a k-lobed wave by (360/k)/n degrees is the
// same as shifting its phase, so each band is ONE path drawn n times (<use>)
// — the page carries two paths, not two dozen.
const BAND_A = { d: rosette(146, 14, 18, 0, 720), k: 18, n: 4 };
const BAND_B = { d: rosette(112, 10, 14, 0, 600), k: 14, n: 3 };
const turns = (b: { k: number; n: number }) => Array.from({ length: b.n }, (_, i) => ((360 / b.k) * i) / b.n);

export function VaultDial({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 480" className={`vault-dial ${className}`} aria-hidden="true" focusable="false">
      {/* the door's edge */}
      <circle cx={C} cy={C} r={236} fill="none" stroke="currentColor" strokeOpacity={0.5} strokeWidth={0.8} />
      <circle cx={C} cy={C} r={229} fill="none" stroke="currentColor" strokeOpacity={0.22} strokeWidth={0.6} />

      {/* the bezel: graduations and numerals — turns to its index on arrival */}
      <g className="vault-dial-bezel">
        {ticks().map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="currentColor" strokeWidth={t.w} strokeOpacity={t.o} />
        ))}
        {NUMERALS.map((n) => (
          <text
            key={n.n}
            x={n.x}
            y={n.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="font-mono"
            fontSize="9.5"
            letterSpacing="0.08em"
            fill="currentColor"
            fillOpacity={0.78}
          >
            {n.n}
          </text>
        ))}
      </g>
      <circle cx={C} cy={C} r={180} fill="none" stroke="currentColor" strokeOpacity={0.3} strokeWidth={0.6} />

      {/* the guilloché — engine-turned, drifting */}
      <defs>
        <path id="vault-band-a" d={BAND_A.d} />
        <path id="vault-band-b" d={BAND_B.d} />
      </defs>
      <g className="vault-dial-rose" fill="none" stroke="currentColor" strokeWidth={0.55}>
        {turns(BAND_A).map((deg) => (
          <use key={`a${deg}`} href="#vault-band-a" transform={`rotate(${deg.toFixed(3)} ${C} ${C})`} strokeOpacity={0.32} />
        ))}
        {turns(BAND_B).map((deg) => (
          <use key={`b${deg}`} href="#vault-band-b" transform={`rotate(${deg.toFixed(3)} ${C} ${C})`} strokeOpacity={0.24} />
        ))}
      </g>
      {[96, 92, 88].map((r) => (
        <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="currentColor" strokeOpacity={r === 96 ? 0.34 : 0.12} strokeWidth={0.5} />
      ))}

      {/* the wheel: five spokes on a hub — counter-turns to rest */}
      <g className="vault-dial-wheel">
        {SPOKES.map((deg) => (
          <g key={deg} transform={`rotate(${deg} ${C} ${C})`}>
            <line x1={C} y1={C - 30} x2={C} y2={C - 74} stroke="currentColor" strokeOpacity={0.62} strokeWidth={1} />
            <circle cx={C} cy={C - 79} r={4.5} fill="none" stroke="currentColor" strokeOpacity={0.62} strokeWidth={0.9} />
          </g>
        ))}
        <circle cx={C} cy={C} r={30} fill="none" stroke="currentColor" strokeOpacity={0.62} strokeWidth={0.9} />
        <circle cx={C} cy={C} r={22} fill="none" stroke="currentColor" strokeOpacity={0.3} strokeWidth={0.6} />
      </g>
      {/* the vault mark at the hub — fixed, upright */}
      <g transform={`translate(${C - 9} ${C - 9}) scale(1.5)`} fill="none" stroke="currentColor" strokeWidth={0.7} strokeOpacity={0.95}>
        <path d="M1.5 1.5h9v9h-9z" />
        <path d="M6 3.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0 -5z" />
        <path d="M6 6V4.2" strokeLinecap="square" />
      </g>

      {/* the index — fixed at twelve o'clock */}
      <path d={`M${C} 15 L${C - 4.5} 7 L${C + 4.5} 7 Z`} fill="currentColor" />
    </svg>
  );
}

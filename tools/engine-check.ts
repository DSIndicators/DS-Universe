/**
 * DS Replay — study checker. Run:  npx tsx tools/engine-check.ts <slug> [day ...]
 *
 * For each session it:
 *  1. runs the study on the full session and prints its events (time, title, price);
 *  2. NO-REPAINT PROOF: re-runs it on the session cut off at several bars k and
 *     requires that every event stamped <= k, and status(k), and readout(k),
 *     are IDENTICAL to the full run's — i.e. nothing the study shows at k
 *     depends on a later bar;
 *  3. calls under()/draw() against a recording fake canvas at several k, so a
 *     draw path that throws is caught before a browser ever sees it;
 *  4. times run().
 */
import { readFileSync } from "node:fs";
import { fromRaw } from "../components/engine/data";
import type { Draw, Session, StudyDef } from "../components/engine/types";
import { DARK, LIGHT, alpha } from "../components/engine/theme";
import { geometry, makeDraw } from "../components/engine/render";
import { hhmm } from "../components/engine/ta";

const slug = process.argv[2];
const days = process.argv.slice(3).length ? process.argv.slice(3) : ["2026-09-14", "2026-09-15", "2026-09-28"];

function cut(s: Session, n: number): Session {
  const sl = <T extends { slice: (a: number, b: number) => T }>(a: T) => a.slice(0, n);
  return { ...s, n, t: sl(s.t), o: sl(s.o), h: sl(s.h), l: sl(s.l), c: sl(s.c), v: sl(s.v), buy: sl(s.buy), sell: sl(s.sell),
    fp: { lo: sl(s.fp.lo), bid: s.fp.bid.slice(0, n), ask: s.fp.ask.slice(0, n) }, path: s.path.slice(0, n), pathReal: sl(s.pathReal) };
}

function fakeCtx(): CanvasRenderingContext2D {
  const h: ProxyHandler<object> = {
    get(_t, p) {
      if (p === "measureText") return (s: string) => ({ width: s.length * 6 });
      if (p === "createLinearGradient" || p === "createRadialGradient") return () => ({ addColorStop() {} });
      if (p === "getLineDash") return () => [];
      return typeof p === "string" && /^[a-z]/.test(p) ? () => {} : undefined;
    },
    set() { return true; },
  };
  return new Proxy({}, h) as unknown as CanvasRenderingContext2D;
}

async function main() {
  const mod = await import(`../components/engine/studies/${slug}.ts`);
  const def: StudyDef = mod.study;
  let fails = 0;
  for (const day of days) {
    const isFile = day.endsWith(".json");
    const raw = JSON.parse(readFileSync(isFile ? day : `tools/fixtures/nq-${day}.json`, "utf8"));
    let s = fromRaw(raw);
    if (raw.extra) s = { ...s, extra: raw.extra };
    else if (def.needs?.extra && !isFile) {
      try { s = { ...s, extra: JSON.parse(readFileSync(`tools/fixtures/${def.needs.extra}-${day}.json`, "utf8")) }; } catch { console.log(`  (no ${def.needs.extra} feed for ${day})`); }
    }
    const t0 = performance.now();
    const full = def.run(s);
    const ms = performance.now() - t0;
    const rep = full.events.filter((e) => e.i >= s.replayFrom - 1);
    console.log(`\n=== ${slug} · ${day} · run ${ms.toFixed(0)} ms · events in replay: ${rep.length} (total ${full.events.length})`);
    for (const e of rep.slice(0, 60)) console.log(`  ${hhmm(s, e.i)}  ${e.tone.padEnd(10)} ${e.title.padEnd(28)} ${e.price !== undefined ? e.price.toFixed(2) : ""}  | ${e.text.slice(0, 110)}`);
    if (rep.length > 60) console.log(`  … ${rep.length - 60} more`);
    // events sorted?
    for (let j = 1; j < full.events.length; j++) if (full.events[j].i < full.events[j - 1].i) { console.log("  FAIL events not sorted"); fails++; break; }
    // no-repaint
    const ks = [s.replayFrom - 1, s.replayFrom + 45, s.replayFrom + 150, s.replayFrom + 271, s.n - 30].filter((k) => k > 0 && k < s.n);
    for (const k of ks) {
      const part = def.run(cut(s, k + 1));
      const a = JSON.stringify(full.events.filter((e) => e.i <= k));
      const b = JSON.stringify(part.events.filter((e) => e.i <= k));
      const sa = JSON.stringify(full.status?.(k, null) ?? []), sb = JSON.stringify(part.status?.(k, null) ?? []);
      const ra = JSON.stringify(full.readout?.(k) ?? []), rb = JSON.stringify(part.readout?.(k) ?? []);
      const ca = JSON.stringify(Array.from({ length: 40 }, (_, j) => full.candle?.(k - j) ?? null));
      const cb = JSON.stringify(Array.from({ length: 40 }, (_, j) => part.candle?.(k - j) ?? null));
      const ok = a === b && sa === sb && ra === rb && ca === cb;
      if (!ok) {
        fails++;
        console.log(`  FAIL no-repaint at k=${k} (${hhmm(s, k)}): events ${a === b ? "ok" : "DIFF"} status ${sa === sb ? "ok" : "DIFF"} readout ${ra === rb ? "ok" : "DIFF"} candles ${ca === cb ? "ok" : "DIFF"}`);
        if (a !== b) { const fa = full.events.filter((e) => e.i <= k), fb = part.events.filter((e) => e.i <= k); console.log(`    full ${fa.length} vs cut ${fb.length}`); for (let j = 0; j < Math.max(fa.length, fb.length); j++) if (JSON.stringify(fa[j]) !== JSON.stringify(fb[j])) { console.log("    full:", JSON.stringify(fa[j])?.slice(0, 220)); console.log("    cut :", JSON.stringify(fb[j])?.slice(0, 220)); break; } }
        if (sa !== sb) { console.log("    full:", sa.slice(0, 300)); console.log("    cut :", sb.slice(0, 300)); }
        if (ra !== rb) { console.log("    full:", ra.slice(0, 300)); console.log("    cut :", rb.slice(0, 300)); }
      }
    }
    // draw smoke test
    for (const th of [DARK, LIGHT]) for (const k of ks) {
      const ctx = fakeCtx();
      const st = { s, def, run: full, th, k, live: k + 1 < s.n ? { i: k + 1, o: s.o[k + 1], h: s.h[k + 1], l: s.l[k + 1], c: s.c[k + 1], frac: 0.5 } : null, view: { right: k + 5, bw: 7, follow: true }, hover: null, layers: Object.fromEntries((def.layers ?? []).map((l) => [l.id, true])), focus: null, fonts: { mono: "m", sans: "s" }, now: 0 };
      const g = geometry(st, 1400, 620);
      const d: Draw = makeDraw(ctx, st, g);
      try { full.under?.(d); full.draw(d); } catch (e) { fails++; console.log(`  FAIL draw at k=${k} ${th.name}: ${(e as Error).stack?.split("\n").slice(0, 3).join(" | ")}`); }
    }
    const st = full.status?.(s.n - 1, null) ?? [];
    console.log(`  status at close: ${st.map((r) => `${r.label}=${r.value}`).join(" · ")}`);
    const ro = full.readout?.(s.n - 1) ?? [];
    console.log(`  readout at close: ${ro.map((r) => `${r.label}=${r.value}`).join(" · ")}`);
    void alpha;
  }
  console.log(fails ? `\n${fails} FAILURE(S)` : `\nALL CHECKS PASS`);
  process.exit(fails ? 1 : 0);
}
main();

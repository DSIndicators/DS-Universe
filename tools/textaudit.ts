import { readFileSync } from "node:fs";
import { fromRaw } from "../components/engine/data";
import { DARK } from "../components/engine/theme";
import { geometry, makeDraw } from "../components/engine/render";
const slugs = process.argv.slice(2);
(async () => {
  for (const slug of slugs) {
    const def = (await import(`/home/claude/site/components/engine/studies/${slug}.ts`)).study;
    const day = slug === "gex" ? "2026-10-08" : "2026-09-28";
    let s = fromRaw(JSON.parse(readFileSync(`tools/fixtures/nq-${day}.json`, "utf8")));
    if (def.needs?.extra) s = { ...s, extra: JSON.parse(readFileSync(`tools/fixtures/gex-${day}.json`, "utf8")) };
    const run = def.run(s); const bad = new Set<string>();
    const ctx = new Proxy({}, { get(_t, p) { if (p === "fillText") return (t: string) => { if (/\d,\d{3}/.test(t)) bad.add(t); }; if (p === "measureText") return (t: string) => ({ width: t.length * 6 }); if (p === "createLinearGradient" || p === "createRadialGradient") return () => ({ addColorStop() {} }); if (p === "getLineDash") return () => []; return typeof p === "string" && /^[a-z]/.test(p) ? () => {} : undefined; }, set() { return true; } }) as any;
    for (const k of [s.replayFrom + 30, s.replayFrom + 120, s.replayFrom + 250, s.n - 1]) {
      const st = { s, def, run, th: DARK, k, live: null, view: { right: k + 30, bw: 8, follow: true }, hover: null, layers: Object.fromEntries((def.layers ?? []).map((l: any) => [l.id, true])), focus: null, fonts: { mono: "m", sans: "s" }, now: 0 };
      const g = geometry(st as any, 1500, 640); const d = makeDraw(ctx, st as any, g); run.under?.(d); run.draw(d);
    }
    console.log(slug, bad.size ? [...bad].slice(0, 6) : "clean");
  }
})();

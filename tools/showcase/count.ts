/**
 * How often a study's events happen in the library's cash sessions — a quick read
 * before writing a judge.   npx tsx tools/showcase/count.ts <slug> [tf]
 */
import { cut, days, loadDay, resampleDay } from "./library";
import { toSession } from "./build";
const slug = process.argv[2], tf = Number(process.argv[3] ?? 1);
(async () => {
  const def = (await import(`../../components/engine/studies/${slug}.ts`)).study;
  const tally: Record<string, number> = {};
  let nd = 0;
  for (const day of days()) {
    const d = resampleDay(loadDay(day), tf);
    const open = d.t.findIndex((t) => ((t % 1440) + 1440) % 1440 >= 571 && ((t % 1440) + 1440) % 1440 < 600);
    if (open < 0) continue;
    nd++;
    const s = toSession(cut(d, 0, open, d.n - 1));
    const run = def.run(s);
    for (const e of run.events) if (e.i >= open && ((s.t[e.i] % 1440) + 1440) % 1440 <= 960) tally[e.title] = (tally[e.title] ?? 0) + 1;
  }
  console.log(`${nd} cash sessions (09:30–16:00), events per session:`);
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(30)} ${(v / nd).toFixed(2)}`);
})();

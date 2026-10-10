# DS Replay examples: how they are made

Each product page shows two DS Replay examples (`public/engine/ex/<slug>-a.json`, `-b.json`).
An example is a **designed scenario**: we write the pattern, every candle is a real recorded
one-minute NQ candle, and everything drawn is the shipped study's own output (studies are never
edited to look better, only display-only hygiene gates, logged under DEVIATIONS in the study header).

## Pieces
| File | Role |
|---|---|
| `components/engine/studies/<slug>.ts` | The study, ported from the shipped C#. |
| `tools/showcase/examples/<slug>.ts` | The product's scenario script(s) + strict zero-flaw judge + moments. |
| `tools/showcase/design.ts` | Composer: script → bars. Legs are filled by real consecutive candle stretches matched by net move and time of day; stages look at what the study drew and aim the next move; walls / touches keep wicks on one side of a level. |
| `tools/showcase/build.ts` | Composes every seed, runs the study, the judge scores it, realism gate (max run ≤ 9, overlap ≥ 0.55), writes the best seed. |
| `tools/showcase/library.ts` | The recorded-candle library (one file per CME session). |
| `tools/library/build_library.py` | Rebuilds the library from the NinjaTrader database. |
| `tools/showcase/manifest.ts` | Registers built examples in `content/examples.ts`. |
| `tools/engine-check.ts` | No-repaint and consistency proof for a study on an example or a fixture day. |
| `tools/fixtures/` | Recorded test days for engine-check (kept out of `public/` so they are never served). |
| `tools/dev/shot.py` | Playwright screenshot helper for the lab page. |

## Library
Saved outside the repo at `DS Website Command Center\DS Replay Library\nq` (213 sessions, Dec 2025 – Oct 2026).
Point the tools at it with `DS_LIB=<path to nq>`. Rebuild or extend from NinjaTrader:
`python tools/library/build_library.py "<NinjaTrader 8 folder>\db" <out> "NQ 03-26" ...`

## Adding or redoing a product
1. Read the study + README; list what it draws and what makes each object fire.
2. Write `tools/showcase/examples/<slug>.ts` (copy `zones.ts`): `design: (seed) => Script` with stages aimed at the
   study's own levels/signals; a judge that rejects any flaw on stage (level born then broken, failed or noise signal,
   flicker, anything from the warm-up); 3–6 moments from the study's own events.
3. `WHY=1 npx tsx tools/showcase/build.ts <slug>` until both examples build with plenty of qualifying seeds.
4. Look at it: `npm run dev`, then `/replay-lab?s=<slug>` (404 in production builds).
5. `npx tsx tools/engine-check.ts <slug> public/engine/ex/<slug>-a.json public/engine/ex/<slug>-b.json` → ALL CHECKS PASS.
6. `npx tsx tools/showcase/manifest.ts`.

Text follows NinjaTrader vendor rules (no profit, win rate, "will", predictions, superlatives, endorsement); house palette.

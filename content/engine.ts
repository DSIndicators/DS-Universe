import type { StudyDef } from "@/components/engine/types";
import { EXAMPLES } from "@/content/examples";

/**
 * DS REPLAY — which study draws each product's examples (2026-10-09, v4).
 *
 * THE EXAMPLES are optimal scenarios (Tom: "OPTIMAL SCENARIOS. IT DOES NOT
 * HAVE TO BE REAL, THE CANDLES JUST MUST LOOK REAL"): the pattern is written
 * per product (tools/showcase/examples/<slug>.ts) and every candle is a real
 * recorded one-minute NQ bar with its real wicks, volume and footprint
 * (tools/showcase/design.ts, library from tools/library/build_library.py).
 * Each example's judge rejects any scenario where the tool shows a flaw (a
 * level created then broken, a signal that fails, a flicker). The tool is the
 * shipped rules, ported from its .cs (components/engine/studies/<slug>.ts,
 * DEVIATIONS in each header), run unchanged. No instrument or date anywhere.
 *
 * Build:     npx tsx tools/showcase/build.ts <slug>
 * Prove:     npx tsx tools/engine-check.ts <slug> public/engine/ex/<slug>-a.json
 * Register:  npx tsx tools/showcase/manifest.ts
 */
export const STUDY: Record<string, () => Promise<{ study: StudyDef }>> = {
  zones: () => import("@/components/engine/studies/zones"),
  iceberg: () => import("@/components/engine/studies/iceberg"),
  oracle: () => import("@/components/engine/studies/oracle"),
  gex: () => import("@/components/engine/studies/gex"),
  flow: () => import("@/components/engine/studies/flow"),
  prorsi: () => import("@/components/engine/studies/prorsi"),
  proliquidityhunter: () => import("@/components/engine/studies/proliquidityhunter"),
  proheikinashi: () => import("@/components/engine/studies/proheikinashi"),
  protrendrange: () => import("@/components/engine/studies/protrendrange"),
  asl: () => import("@/components/engine/studies/asl"),
  "adaptive-priceline": () => import("@/components/engine/studies/adaptive-priceline"),
  "chart-price": () => import("@/components/engine/studies/chart-price"),
  "ds-258": () => import("@/components/engine/studies/ds-258"),
  parallax: () => import("@/components/engine/studies/parallax"),
  "session-levels": () => import("@/components/engine/studies/session-levels"),
  stochastics: () => import("@/components/engine/studies/stochastics"),
  squeeze: () => import("@/components/engine/studies/squeeze"),
  macd: () => import("@/components/engine/studies/macd"),
  vwap: () => import("@/components/engine/studies/vwap"),
};

/** a product page shows DS Replay once its study has at least one built example */
export const hasReplay = (slug: string) => slug in STUDY && (EXAMPLES[slug]?.length ?? 0) > 0;

import type { CSSProperties } from "react";

/**
 * A display line that holds one long word (DS ProLiquidityHunter, the support
 * address) cannot wrap, so on a phone it would run past the screen edge. The
 * `.fit` class caps the type size at what lets that word fit the column:
 * (screen width − both gutters) / (0.56em per letter × letters in the longest
 * word). On wider screens the cap is far above the normal size and changes
 * nothing. Pass the heading's text; this returns the letter count as --len.
 */
export function fitWord(text: string): CSSProperties {
  const len = Math.max(...text.split(/\s+/).map((w) => w.length), 1);
  return { ["--len" as string]: len } as CSSProperties;
}

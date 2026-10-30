/**
 * TYPOGRAPHY FIXATION (2026-10-27, Tom: "We will use Bionic Reading for our website
 * ... implement ALL texts as bionic reading texts so our users with short
 * attention span stays").
 *
 * The technique: the first part of every word is set heavier, so the eye can
 * anchor on it and the brain completes the rest. It is our own
 * implementation, labelled "Typography fixation" on the page since 2026-10-30
 * ("Focus" before that). "Bionic Reading" is a registered trademark of Bionic
 * Reading AG, so that name never appears where a visitor can see it.
 *
 * Research at the time of writing found no speed or comprehension gain for
 * skilled adult readers (Readwise, n=1,916; Parker et al., Royal Society Open
 * Science 2026, n=90, eye-tracking), and some readers find plain text easier.
 * So it is OFF by default since 2026-10-29 and a visitor turns it on with the
 * switch (components/FocusSwitch.tsx): one class on <html>, remembered per
 * browser.
 *
 * HOW it reaches ALL text: tsconfig "jsxImportSource" points every .tsx file
 * at this folder's JSX runtime, which hands every element to React unchanged
 * except that plain text children are split into words with their fixation
 * part wrapped in <b class="bf">. It runs identically on the server (static
 * HTML) and in the browser (hydration), so nothing flashes, nothing shifts
 * after load, and the DOM React manages is the DOM it rendered. Copy, paste,
 * find-in-page and screen readers read the words whole.
 *
 * Left alone: numbers and anything touching a digit (prices, levels, "5.3x"),
 * text inside script/style/title/textarea/option/code/pre, and any element
 * marked data-nobio (the wordmark).
 */
import type { ReactNode } from "react";

export const SKIP = new Set(["script", "style", "title", "textarea", "option", "code", "pre", "kbd", "samp", "noscript", "template", "svg", "text", "tspan"]);

/** How many letters of a word carry the weight. */
export const fixation = (n: number) => (n <= 3 ? 1 : Math.ceil(n * 0.45));

const WORD = /\p{L}[\p{L}\p{M}'’]*/gu;
const DIGIT = /\p{N}/u;

/** Split one string into plain runs and fixation runs. Returns null when the
 *  string has no word to emphasise (so the caller keeps the original string). */
export function split(text: string): Array<string | { b: string }> | null {
  if (!text || !/\p{L}/u.test(text)) return null;
  const out: Array<string | { b: string }> = [];
  let last = 0;
  for (const m of text.matchAll(WORD)) {
    const w = m[0], i = m.index ?? 0;
    const before = text[i - 1], after = text[i + w.length];
    // a word glued to a digit (5.3x, 4h, 1D, NQ12) is data, not prose
    if ((before && DIGIT.test(before)) || (after && DIGIT.test(after))) continue;
    const k = fixation([...w].length);
    const head = [...w].slice(0, k).join("");
    if (i > last) out.push(text.slice(last, i));
    out.push({ b: head });
    last = i + head.length;
  }
  if (!out.length) return null;
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export type Make = (parts: Array<string | { b: string }>) => ReactNode;

/** Rewrite an element's props: string children become focus-reading runs. */
export function bio(type: unknown, props: Record<string, unknown> | null, make: Make) {
  if (!props || props["data-nobio"] !== undefined) return props;
  if (typeof type === "string" && SKIP.has(type)) return props;
  const c = props.children;
  if (c === undefined || c === null) return props;
  const conv = (x: unknown): unknown => {
    if (typeof x !== "string") return x;
    const parts = split(x);
    return parts ? make(parts) : x;
  };
  if (typeof c === "string") {
    const n = conv(c);
    return n === c ? props : { ...props, children: n };
  }
  if (Array.isArray(c) && c.some((x) => typeof x === "string")) {
    return { ...props, children: c.map(conv) };
  }
  return props;
}

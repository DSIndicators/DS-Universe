// Runs before every build (package.json "prebuild").
// Draws the site's pointers (public/cursor/). They are set with CSS `cursor`, so
// the OPERATING SYSTEM draws them: they sit exactly where the pointer is, at
// the screen's own refresh rate, with no script and no lag.
//
// Pass 5 (Tom: "our mouse pointer is still not smooth and very pixelated").
// What was wrong with pass 3, and the fix:
//   1. The resting ring was a 1 px hairline at 55% opacity. At 96 DPI (Tom's
//      2560x1440, DPR 1) a 1 px circle can never sit on whole pixels, so it
//      rendered as broken grey steps. Every stroke is now 1.75 px or more,
//      at full strength, so anti-aliasing reads as a smooth curve.
//   2. Only 1x and 2x existed. At any browser zoom other than 100% / 200%
//      (Edge 110%, 125%, 150%... and Windows scaling 125%/150%/175%) the
//      browser resampled the nearest one, which is what looks pixelated.
//      There is now a rung for every common factor: 1, 1.25, 1.5, 1.75, 2,
//      2.5, 3. Each is drawn from the vector at its own size, never scaled.
//   3. ONE colour everywhere (Tom, same night: "make it a unique color, the
//      teal disappears over the teal panels. White crosshair also
//      disappears with the white letterings on the teal panels"). Every
//      mark is DS violet #A33DFF, the house palette's second colour: it is
//      a different hue from the teal panels, darker than the white words on
//      them, and reads on white and on the dark Live Background page alike.
//      No halos, no keylines, one clean line.
//
//   rest   a violet ring and dot                    (everywhere)
//   link   the ring opens, the dot grows            (links, buttons)
//   press  the ring tightens                        (while a link is held)
//   chart  a violet reticle: four ticks and a dot   (over every chart)
// Hotspot = the centre (16,16 in CSS px), where the dot is.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("public", "cursor");
fs.mkdirSync(OUT, { recursive: true });
const VIOLET = "#A33DFF";
export const SCALES = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];

const ring = (r, color, w) => `<circle cx="16" cy="16" r="${r}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
const dot = (r, color) => `<circle cx="16" cy="16" r="${r}" fill="${color}"/>`;
const ticks = (a, b, color) =>
  [[16, 16 - b, 16, 16 - a], [16, 16 + a, 16, 16 + b], [16 - b, 16, 16 - a, 16], [16 + a, 16, 16 + b, 16]]
    .map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`)
    .join("");

const MARKS = {
  rest: ring(8, VIOLET, 2) + dot(2.75, VIOLET),
  link: ring(10.5, VIOLET, 2.25) + dot(3.5, VIOLET),
  press: ring(7, VIOLET, 2.5) + dot(3.5, VIOLET),
  chart: ticks(5, 12.5, VIOLET) + dot(2.25, VIOLET),
};

const name = (m, s) => (s === 1 ? `${m}.png` : `${m}@${s}x.png`);
for (const [m, body] of Object.entries(MARKS)) {
  for (const s of SCALES) {
    const px = Math.round(32 * s);
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 32 32" shape-rendering="geometricPrecision">${body}</svg>`);
    await sharp(svg, { density: 72 }).png({ compressionLevel: 9 }).toFile(path.join(OUT, name(m, s)));
  }
}
// The CSS for these lives in app/globals.css ("the pointer"); its image-set
// lists every rung above.
console.log(`  cursors: ${Object.keys(MARKS).join(", ")} at ${SCALES.join("/")}x in public/cursor`);

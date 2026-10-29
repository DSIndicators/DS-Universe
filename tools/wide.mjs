// Tom's wide website pictures (DS Media\1025 New Media Cover\Website
// Pictures, 2026-10-26) -> lossless webp, then proves every pixel is the same.
// No resize, no crop, no colour change. Also reports the ground colour of every
// picture so the page's white can match it.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = String.raw`C:\Users\dsnin\Desktop\DS Indicators\DS Media\1025 New Media Cover\Website Pictures`;
const OUT = path.resolve("public/wide/1026");
const MAP = {
  "DS_20261026_014639.png": "desk-orderflow.webp",
  "DS_20261026_014137.png": "desk-sessions.webp",
  "DS_20261026_015302.png": "desk-liquidity.webp",
  "DS_20261026_030406.png": "desk-free-vault.webp", // the Free Vault tools only (Tom, 03:04)
  "Trade ideas New.png": "desk-trade-ideas.webp", // THE HERO since 2026-10-27 (Tom: "cleaner and better")
};

const raw = async (input) => sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (const [src, out] of Object.entries(MAP)) {
  const inPath = path.isAbsolute(src) ? src : path.join(SRC, src);
  const outPath = path.join(OUT, out);
  await sharp(inPath).webp({ lossless: true, effort: 6 }).toFile(outPath);
  const a = await raw(inPath);
  const b = await raw(outPath);
  const same = a.info.width === b.info.width && a.info.height === b.info.height && a.data.equals(b.data);
  const kb = (n) => Math.round(n / 1024);
  console.log(`${out}  ${a.info.width}x${a.info.height}  png ${kb(fs.statSync(inPath).size)}KB -> webp ${kb(fs.statSync(outPath).size)}KB  pixel-identical=${same}`);
  if (!same) process.exitCode = 1;
  // The srcset ladder (smaller copies for smaller screens, the upscaled master
  // for larger ones) is made by tools/upscale and listed in content/hd.json.
}

// ground colour: the most common pixel in each picture
const ground = async (p) => {
  const { data } = await sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = new Map();
  for (let i = 0; i < data.length; i += 3 * 7) {
    const k = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    n.set(k, (n.get(k) ?? 0) + 1);
  }
  const [k, c] = [...n.entries()].sort((x, y) => y[1] - x[1])[0];
  return `#${k.toString(16).padStart(6, "0")} (${Math.round((c / (data.length / 21)) * 100)}%)`;
};
for (const f of Object.values(MAP).map((f) => path.join(OUT, f))) {
  console.log(path.basename(f).padEnd(30), await ground(f));
}

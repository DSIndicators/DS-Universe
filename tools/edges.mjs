// Reports dark lines along the four edges of each picture (window borders,
// axis dividers) so the layout can account for them. Read-only.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const files = [
  ...fs.readdirSync("public/wide/1026").filter((f) => !/-\d+\.webp$/.test(f)).map((f) => path.join("public/wide/1026", f)),

];
for (const f of files) {
  const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const lum = (x, y) => { const i = (y * W + x) * 3; return (data[i] + data[i + 1] + data[i + 2]) / 3; };
  const col = (x) => { let s = 0; for (let y = 0; y < H; y++) s += lum(x, y) < 200 ? 1 : 0; return Math.round((s / H) * 100); };
  const row = (y) => { let s = 0; for (let x = 0; x < W; x++) s += lum(x, y) < 200 ? 1 : 0; return Math.round((s / W) * 100); };
  const left = [0, 1, 2, 3].map(col), right = [W - 1, W - 2, W - 3, W - 4].map(col);
  const top = [0, 1, 2].map(row), bottom = [H - 1, H - 2, H - 3].map(row);
  // the darkest full-height column anywhere (an axis divider)
  let best = [0, 0];
  for (let x = 0; x < W; x++) { const c = col(x); if (c > best[1]) best = [x, c]; }
  console.log(path.basename(f).padEnd(28), `${W}x${H}`, "L%", left.join(","), "R%", right.join(","), "T%", top.join(","), "B%", bottom.join(","), "darkest col", best.join("@"));
}

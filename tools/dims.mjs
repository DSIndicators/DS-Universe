// Prints width x height of every picture in the folders given (review aid).
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
for (const dir of process.argv.slice(2)) {
  for (const f of fs.readdirSync(dir)) {
    if (!/\.(png|webp|jpe?g)$/i.test(f)) continue;
    const m = await sharp(path.join(dir, f)).metadata();
    console.log(`${m.width}x${m.height}  ${m.density ?? ""}dpi  ${path.join(dir, f)}`);
  }
}

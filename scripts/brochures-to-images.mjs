// Build-time: rasterize each brochure PDF into per-page webp images so the
// Showcase can render static pages (no laggy inline PDF viewer).
// Uses MuPDF (WASM) which renders the brand's gradient shadings correctly.
// Run: node scripts/brochures-to-images.mjs
import * as mupdf from "mupdf";
import sharp from "sharp";
import { mkdir, rm, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public", "brochures");

const JOBS = [
  { id: "crewmates", file: "DS_Crewmate_Series_Brochure.pdf" },
  { id: "radars", file: "DS_Radars_Brochure.pdf" },
  { id: "systems", file: "DS_Systems_Brochure.pdf" },
];

const SCALE = 2; // 2x for crisp retina pages

for (const job of JOBS) {
  const outDir = path.join(pub, job.id);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const data = await readFile(path.join(pub, job.file));
  const doc = mupdf.Document.openDocument(data, "application/pdf");
  const count = doc.countPages();

  for (let i = 0; i < count; i++) {
    const page = doc.loadPage(i);
    const pixmap = page.toPixmap(
      mupdf.Matrix.scale(SCALE, SCALE),
      mupdf.ColorSpace.DeviceRGB,
      false,
      true,
    );
    const png = pixmap.asPNG();
    const name = `page-${String(i + 1).padStart(2, "0")}.webp`;
    const info = await sharp(Buffer.from(png))
      .webp({ quality: 82 })
      .toFile(path.join(outDir, name));
    console.log(`${job.id}/${name}  ${(info.size / 1024).toFixed(0)}KB  ${info.width}x${info.height}`);
    pixmap.destroy?.();
    page.destroy?.();
  }
  console.log(`-> ${job.id}: ${count} pages\n`);
}

// Runs before every build (package.json "prebuild").
// Takes whatever Tom dropped in "Product Covers - drop new white covers here"
// (and, for a product with none there, its picture in DS Master Folder\<Product>\),
// matches each file to a product by its name, and copies it BYTE FOR BYTE into
// public/covers/drop/<slug>.<ext>. Writes content/drop-covers.json with each
// picture's size. Never resizes, re-encodes, crops or recolours.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import crypto from "node:crypto";

const ROOT = path.resolve(".");
const DROP = process.env.COVER_DROP ?? path.join(ROOT, "Product Covers - drop new white covers here");
const OUT = process.env.COVER_OUT ?? path.join(ROOT, "public", "covers", "drop");
const MANIFEST = process.env.COVER_MANIFEST ?? path.join(ROOT, "content", "drop-covers.json");

// slug + name of every product, straight from content/products.ts
const src = fs.readFileSync(path.join(ROOT, "content", "products.ts"), "utf8");
const products = [...src.matchAll(/"slug":\s*"([^"]+)",\s*"name":\s*"([^"]+)"/g)].map((m) => ({ slug: m[1], name: m[2] }));
if (products.length < 10) throw new Error("tools/covers.mjs: could not read the product list.");

// A picture may say what it is in its name ("DS Zones Updated.png", "DS VWAP new.png"):
// those words are not part of the product's name, so they are dropped before matching.
const norm = (s) =>
  s.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/\b(updated|update|new|final|white|cover|v\d+)\b/g, "").replace(/[^a-z0-9]/g, "");
const lev = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const keys = products.map((p) => ({ ...p, keys: [norm(p.name), norm(p.slug), norm("ds" + p.slug)] }));
function match(file) {
  const f = norm(file);
  const exact = keys.filter((p) => p.keys.includes(f));
  if (exact.length === 1) return exact[0];
  const pre = keys.filter((p) => p.keys.some((k) => k.length >= 6 && (f.startsWith(k) || k.startsWith(f)) && Math.abs(k.length - f.length) <= 3));
  if (pre.length === 1) return pre[0];
  const near = keys.map((p) => ({ p, d: Math.min(...p.keys.map((k) => lev(k, f))) })).sort((a, b) => a.d - b.d);
  if (near[0] && near[0].d <= 2 && (!near[1] || near[1].d > near[0].d)) return near[0].p;
  return null;
}

fs.mkdirSync(DROP, { recursive: true });
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// THE ONE DARK EXCEPTION (Tom, 2026-10-26 night: "Please put in the cover image
// for Live Background, that is the one exception with product page background
// as not white"). Its own folder, read after the white drop folder, and only
// for the products listed here; a white cover dropped for it later still wins.
const DARK = process.env.COVER_DARK ?? path.join(ROOT, "Product Covers - dark exception (DS Live Background only)");
const DARK_OK = new Set(["live-background"]);

// THE UPSCALED LADDERS (content/hd.json, written by tools/upscale). Keyed by
// the SHA-1 of the cover file, so a ladder is only ever attached to the exact
// picture it was made from.
const HD = path.join(ROOT, "content", "hd.json");
const hd = fs.existsSync(HD) ? JSON.parse(fs.readFileSync(HD, "utf8")) : {};
const sha1 = (f) => crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex");

const manifest = {};
// Newest first, so a fresh picture dropped beside an old one for the same
// product wins (the older file is reported and skipped).
const listOf = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => /\.(png|webp|jpe?g)$/i.test(f))
        .sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs)
        .map((f) => ({ f, dir }))
    : [];
// TOM'S NEW-PICTURE FOLDERS (2026-10-29: "New folder in the website folder, 3 new
// pictures"): every folder beside the site whose name ends in "White Website
// Pictures" (e.g. "1029 New White Website Pictures"). Read together with the drop
// folder, NEWEST FILE FIRST across all of them, so a newer picture of a product
// replaces the older one wherever each was dropped.
const SIBLINGS = path.resolve(ROOT, "..");
const PICTURE_DIRS = fs.existsSync(SIBLINGS)
  ? fs.readdirSync(SIBLINGS, { withFileTypes: true }).filter((d) => d.isDirectory() && /White Website Pictures$/i.test(d.name)).map((d) => path.join(SIBLINGS, d.name))
  : [];
const newestFirst = (dirs) => dirs.flatMap(listOf).sort((a, b) => fs.statSync(path.join(b.dir, b.f)).mtimeMs - fs.statSync(path.join(a.dir, a.f)).mtimeMs);
for (const { f, dir } of [...newestFirst([DROP, ...PICTURE_DIRS]), ...listOf(DARK)]) {
  const p = match(f);
  const dark = dir === DARK;
  if (!p) { console.log(`  covers: "${f}" - no product matches this name, skipped`); continue; }
  if (dark && !DARK_OK.has(p.slug)) { console.log(`  covers: "${f}" - only ${[...DARK_OK].join(", ")} may use the dark folder, skipped`); continue; }
  if (manifest[p.slug]) { console.log(`  covers: "${f}" - ${p.name} already has "${manifest[p.slug].file}", skipped`); continue; }
  const ext = path.extname(f).toLowerCase().replace(".jpeg", ".jpg");
  const full = path.join(dir, f);
  fs.copyFileSync(full, path.join(OUT, p.slug + ext));
  const meta = await sharp(full).metadata();
  const v = Math.round(fs.statSync(full).mtimeMs).toString(36);
  const ladder = hd.covers?.[sha1(full)];
  manifest[p.slug] = { src: `/covers/drop/${p.slug}${ext}?v=${v}`, w: meta.width, h: meta.height, file: f, ...(ladder ? { ladder } : {}), ...(dark ? { dark: true } : {}) };
  console.log(`  covers: "${f}" -> ${p.name} (${meta.width}x${meta.height})${ladder ? `, upscaled to ${Math.max(...ladder.map((r) => r.w))}` : ", no upscale yet"}${dark ? ", dark" : ""}`);
}
// THE MASTER FOLDERS (Tom, 2026-10-29: "product images come from each
// product's own DS Master Folder\<Product>\ folder"; every existing cover
// stays exactly as it is). Read LAST and only for a product that still has no
// cover: DS Master Folder\<Product name>\<Product name>.png (or .webp/.jpg),
// copied byte for byte. A product whose folder has no picture shows none.
const MASTER = process.env.COVER_MASTER ?? path.resolve(ROOT, "..", "..", "DS Master Folder");
for (const p of products) {
  if (manifest[p.slug]) continue;
  const dir = path.join(MASTER, p.name);
  const f = ["png", "webp", "jpg"].map((e) => `${p.name}.${e}`).find((n) => fs.existsSync(path.join(dir, n)));
  if (!f) continue;
  const full = path.join(dir, f);
  const ext = path.extname(f).toLowerCase();
  fs.copyFileSync(full, path.join(OUT, p.slug + ext));
  const meta = await sharp(full).metadata();
  const v = Math.round(fs.statSync(full).mtimeMs).toString(36);
  const ladder = hd.covers?.[sha1(full)];
  manifest[p.slug] = { src: `/covers/drop/${p.slug}${ext}?v=${v}`, w: meta.width, h: meta.height, file: f, ...(ladder ? { ladder } : {}) };
  console.log(`  covers: "${p.name}\\${f}" (master folder) -> ${p.name} (${meta.width}x${meta.height})${ladder ? `, upscaled to ${Math.max(...ladder.map((r) => r.w))}` : ", no upscale yet"}`);
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
const missing = products.filter((p) => !manifest[p.slug]).map((p) => p.name);
console.log(`  covers: ${Object.keys(manifest).length} of ${products.length} products have a cover${missing.length ? `; still empty: ${missing.join(", ")}` : ""}.`);

// DS Universe site - THE CATALOGUE SYNC (2026-11-01, Tom: "The workflow should be made extremely easy to add new
// indicators to both vaults").
//
// One source for every product on the site: the Master Product & Pricing Sheet (and the version from Patch Notes &
// Versions), exported by tools/catalog/export.ps1 into content/catalog/sheet.json. This script turns that into:
//   content/products.ts   the PRODUCTS list (only the list between its markers is rewritten; types and helpers stay)
//   content/pointers.ts   the POINTERS map (cover line + what it reads)
//   public/covers/drop/   a product's cover, copied BYTE FOR BYTE from DS Master Folder\<Product>\<Product>.png
//                         when it has no cover yet (or when that master picture changed) - never resized or recoloured
//   public/hd/covers/     360 and 720 px copies of that cover for the tiles (smaller only, never upscaled)
//   content/drop-covers.json, content/hd.json   the cover records the site reads
// Which vault a product is in comes from the sheet's section: the FREE VAULT section is the Free Vault, every other
// section is the DS Essentials Vault (On the price chart / In a panel of their own / Add-ons).
// The site's own settings (web address, New marks, Whop links) are content/catalog/site.json.
//
//   node tools/catalog/sync.mjs           write everything, print what changed
//   node tools/catalog/sync.mjs --check   change nothing, print what would change (exit 1 if anything would)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const C = (...p) => path.join(ROOT, ...p);
const CHECK = process.argv.includes("--check");
const MASTER_DIR = process.env.DS_MASTER_FOLDER ?? path.resolve(ROOT, "..", "..", "DS Master Folder");

const sheet = JSON.parse(fs.readFileSync(C("content", "catalog", "sheet.json"), "utf8").replace(/^﻿/, ""));
const site = JSON.parse(fs.readFileSync(C("content", "catalog", "site.json"), "utf8"));
const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []);   // PowerShell writes a one-row list as an object

// ---------------------------------------------------------------- products from the sheet
const SERIES = new Set(["chart", "panel", "addon", "vault"]);
const dash = (s) => String(s ?? "").replace(/\r?\n/g, " ").replace(/ - /g, " — ").replace(/\s+$/g, "");
const byName = (rows) => Object.fromEntries(arr(rows).map((r) => [r.product, r]));
const det = byName(sheet.details), mkt = byName(sheet.markets), nt8 = byName(sheet.nt8);
const slugOf = (name) => site.slugs?.[name] ?? name.replace(/^DS\s+/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const problems = [];

const products = [];
for (const r of arr(sheet.catalog)) {
  if (!SERIES.has(r.section)) continue;                       // the Vault itself (the bundle row) has no product page
  const name = r.product.trim();
  const slug = slugOf(name);
  if ((site.hide ?? []).includes(slug)) continue;
  const d = det[name], v = sheet.versions?.[name] ?? {};
  const hooks = [1, 2, 3, 4].map((i) => dash(r[`Hook ${i}`]));
  const p = {
    slug,
    name,
    kind: /add-?on/i.test(r.Type ?? "") ? "addon" : "indicator",
    series: r.section,
    category: dash(r.Category),
    version: (v.version && v.version !== "—" ? v.version : "v3.2").trim(),
    assembly: String(v.assembly ?? "").split("·")[0].trim() || name.replace(/\s+/g, ""),
    isNew: (site.isNew ?? []).includes(slug),
    purpose: dash(r.Purpose),
    hooks,
    helps: dash(d?.["How It Helps Traders"]),
    description: dash(d?.["Full Description"]),
  };
  for (const k of ["category", "purpose", "helps", "description"]) if (!p[k]) problems.push(`${name}: the sheet has no ${k}`);
  if (hooks.some((h) => !h)) problems.push(`${name}: the sheet is missing a hook`);
  products.push(p);
}
if (products.length < 10) throw new Error(`sync: only ${products.length} products read from sheet.json - is the export complete?`);
const slugs = products.map((p) => p.slug);
const dup = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (dup.length) throw new Error(`sync: two products share the web address ${dup.join(", ")} - set one in site.json "slugs".`);

// pointers: the NT8 cover line (no line for a product with none) and what it reads (Markets)
const pointers = {};
for (const p of products) {
  const line = dash(nt8[p.name]?.["Cover Line  (250×250 image)"] ?? "");
  const reads = dash(mkt[p.name]?.["What It Reads"] ?? "");
  const o = {};
  if (line && line !== "—") o.line = line;
  if (reads && reads !== "—") o.reads = reads;
  pointers[p.slug] = o;
}

// ---------------------------------------------------------------- write products.ts / pointers.ts between markers
const changes = [];
function splice(file, startRe, endTok, body) {
  const t = fs.readFileSync(file, "utf8");
  const m = startRe.exec(t);
  if (!m) throw new Error(`sync: ${path.basename(file)} - start marker not found`);
  const a = m.index + m[0].length;
  const b = t.indexOf(endTok, a);
  if (b < 0) throw new Error(`sync: ${path.basename(file)} - end marker not found`);
  return t.slice(0, a) + body + t.slice(b);
}
const PFILE = C("content", "products.ts");
const oldList = (() => {
  const t = fs.readFileSync(PFILE, "utf8");
  const a = t.indexOf("export const PRODUCTS: Product[] = ") + "export const PRODUCTS: Product[] = ".length;
  return JSON.parse(t.slice(a, t.indexOf("];", a) + 1));
})();
const newPT = splice(PFILE, /export const PRODUCTS: Product\[\] = /, ";\n", JSON.stringify(products, null, 4).replace(/\n/g, "\n"));
const PNTS = C("content", "pointers.ts");
const pointerBody = "{\n" + products.map((p) => {
  const o = pointers[p.slug]; const rows = [];
  if (o.line) rows.push(`    line: ${JSON.stringify(o.line)},`);
  if (o.reads) rows.push(`    reads: ${JSON.stringify(o.reads)},`);
  return `  ${JSON.stringify(p.slug)}: {\n${rows.join("\n")}\n  },`;
}).join("\n") + "\n}";
const newPN = splice(PNTS, /const POINTERS: Record<string, Pointers> = /, ";\n\nexport const pointersFor", pointerBody);

// what changed, in plain words
const oldBy = Object.fromEntries(oldList.map((p) => [p.slug, p]));
for (const p of products) {
  const o = oldBy[p.slug];
  if (!o) { changes.push(`NEW      ${p.name}  ->  ${p.series === "vault" ? "Free Vault" : "Essentials Vault"} (/${p.series === "vault" ? "free-vault" : "essentials"}/${p.slug})`); continue; }
  const f = Object.keys(p).filter((k) => JSON.stringify(p[k]) !== JSON.stringify(o[k]));
  if (f.length) changes.push(`CHANGED  ${p.name}: ${f.map((k) => (k === "version" ? `version ${o[k]} -> ${p[k]}` : k)).join(", ")}`);
}
for (const o of oldList) if (!products.some((p) => p.slug === o.slug)) changes.push(`REMOVED  ${o.name} (no longer on the sheet - its page will 404; add a redirect in next.config.mjs if it had one)`);

// ---------------------------------------------------------------- covers from the product's own DS Master Folder
const DROPF = C("content", "drop-covers.json"), HDF = C("content", "hd.json");
const drop = JSON.parse(fs.readFileSync(DROPF, "utf8"));
const hd = JSON.parse(fs.readFileSync(HDF, "utf8"));
const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");
let sharp = null;
const coverJobs = [];
for (const p of products) {
  const dir = path.join(MASTER_DIR, p.name);
  const f = ["png", "webp", "jpg"].map((e) => `${p.name}.${e}`).find((n) => fs.existsSync(path.join(dir, n)));
  const cur = drop[p.slug];
  if (!f) { if (!cur) problems.push(`${p.name}: no cover yet - put ${p.name}.png in DS Master Folder\\${p.name}\\ (the tile says "Picture coming" until then)`); continue; }
  // a cover that came from somewhere else (Tom's drop folders, the white site) is left exactly as it is
  if (cur && cur.file !== f) continue;
  const full = path.join(dir, f);
  const buf = fs.readFileSync(full);
  const ext = path.extname(f).toLowerCase();
  const out = C("public", "covers", "drop", p.slug + ext);
  const same = cur && fs.existsSync(out) && sha1(fs.readFileSync(out)) === sha1(buf);
  if (same) continue;
  coverJobs.push({ p, full, buf, ext, out, f });
}
for (const j of coverJobs) {
  changes.push(`COVER    ${j.p.name}: ${j.f} from DS Master Folder (copied as it is)`);
  if (CHECK) continue;
  sharp ??= (await import("sharp")).default;
  fs.copyFileSync(j.full, j.out);
  const meta = await sharp(j.buf).metadata();
  const h = sha1(j.buf);
  const ladder = [];
  for (const w of [360, 720]) {
    if (w >= meta.width) continue;                              // smaller copies only: Tom's pixels are never upscaled
    const name = `${j.p.slug}-${h.slice(0, 10)}-${w}.webp`;
    await sharp(j.buf).resize({ width: w }).webp({ quality: 88, effort: 6 }).toFile(C("public", "hd", "covers", name));
    ladder.push({ src: `/hd/covers/${name}`, w });
  }
  hd.covers ??= {};
  hd.covers[h] = ladder;
  const v = Math.round(fs.statSync(j.full).mtimeMs).toString(36);
  drop[j.p.slug] = { src: `/covers/drop/${j.p.slug}${j.ext}?v=${v}`, w: meta.width, h: meta.height, file: j.f, ...(ladder.length ? { ladder } : {}) };
}

// ---------------------------------------------------------------- downloads (Free Vault)
const whop = site.whop ?? {};
for (const p of products) {
  if (p.series !== "vault") continue;
  const w = whop[p.slug];
  if (!w?.plan) problems.push(`${p.name}: no Whop checkout yet - its Download shows "Opening soon". Add it: node tools/catalog/whop.mjs ${p.slug} <checkout link>`);
}
for (const s of Object.keys(whop)) if (!products.some((p) => p.slug === s && p.series === "vault")) problems.push(`site.json whop: "${s}" is not a Free Vault product`);

// ---------------------------------------------------------------- write
const oldPT = fs.readFileSync(PFILE, "utf8"), oldPN = fs.readFileSync(PNTS, "utf8");
const textChanged = oldPT !== newPT || oldPN !== newPN;
if (!CHECK) {
  if (oldPT !== newPT) fs.writeFileSync(PFILE, newPT);
  if (oldPN !== newPN) fs.writeFileSync(PNTS, newPN);
  if (coverJobs.length) { fs.writeFileSync(DROPF, JSON.stringify(drop, null, 2) + "\n"); fs.writeFileSync(HDF, JSON.stringify(hd, null, 2) + "\n"); }
}

const free = products.filter((p) => p.series === "vault"), ess = products.filter((p) => p.series !== "vault");
console.log(`\n  DS Universe catalogue  -  sheet exported ${String(sheet.exported).replace("T", " ")}`);
console.log(`  Free Vault ${free.length}   Essentials Vault ${ess.length}\n`);
for (const p of products) {
  const cov = drop[p.slug] || coverJobs.some((j) => j.p.slug === p.slug) ? "cover" : "NO COVER";
  const dl = p.series === "vault" ? (whop[p.slug]?.plan ? "download live" : "opening soon") : "in the membership";
  console.log(`  ${(p.series === "vault" ? "FREE" : "ESS ").padEnd(5)} ${p.name.padEnd(28)} ${p.version.padEnd(6)} ${cov.padEnd(9)} ${dl}`);
}
console.log(changes.length ? `\n  ${CHECK ? "Would change" : "Changed"}:\n    ${changes.join("\n    ")}` : "\n  Nothing changed: the site already matches the sheet.");
if (problems.length) console.log(`\n  To look at:\n    ${problems.join("\n    ")}`);
console.log("");
if (CHECK && (textChanged || coverJobs.length)) process.exitCode = 1;

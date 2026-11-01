// Puts a Free Vault tool's Whop download on the site (2026-11-01).
//   node tools/catalog/whop.mjs <slug> <checkout link> [listing link]
//   e.g. node tools/catalog/whop.mjs htf-po3 https://whop.com/checkout/plan_AbC123 https://whop.com/dsuniverse/products/ds-htf-po3-.../
// Writes content/catalog/site.json. The checkout link is what the Download button opens; the listing link (optional)
// is the product's page on Whop. Run tools/catalog/sync.mjs afterwards to see the vault as the site will show it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const F = path.join(ROOT, "content", "catalog", "site.json");
const [slug, checkout, listing] = process.argv.slice(2);
if (!slug || !checkout) { console.log("usage: node tools/catalog/whop.mjs <slug> <checkout link> [listing link]"); process.exit(1); }
const plan = /(plan_[A-Za-z0-9]+)/.exec(checkout)?.[1];
if (!plan) { console.log(`"${checkout}" is not a Whop checkout link - it should contain plan_...`); process.exit(1); }
const lst = listing ? /\/products\/([^/?#]+)/.exec(listing)?.[1] ?? /whop\.com\/dsuniverse\/([^/?#]+)/.exec(listing)?.[1] : undefined;
if (listing && !lst) { console.log(`"${listing}" is not a whop.com/dsuniverse listing link`); process.exit(1); }
const products = fs.readFileSync(path.join(ROOT, "content", "products.ts"), "utf8");
if (!new RegExp(`"slug": "${slug}",[\\s\\S]{0,200}?"series": "vault"`).test(products)) { console.log(`"${slug}" is not a Free Vault product on the site (check its web address).`); process.exit(1); }
const site = JSON.parse(fs.readFileSync(F, "utf8"));
site.whop ??= {};
const used = Object.entries(site.whop).find(([s, w]) => s !== slug && w.plan === plan);
if (used) { console.log(`${plan} is already the checkout of "${used[0]}".`); process.exit(1); }
site.whop[slug] = { listing: lst ?? site.whop[slug]?.listing ?? slug, plan };
fs.writeFileSync(F, JSON.stringify(site, null, 2) + "\n");
console.log(`${slug}: Download now opens https://whop.com/checkout/${plan}${lst ? ` (listing ${lst})` : ""}.`);

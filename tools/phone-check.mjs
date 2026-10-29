// PHONE SWEEP (2026-10-29): every page of the sitemap on three phones (360,
// 390, 430 wide, DPR 3, touch), in headless Edge on its own profile.
// Per page: sideways scroll, anything poking past the screen edge, pictures
// drawn at the wrong shape (squished), text under 11 px, tap targets under
// 32 px, broken pictures, console errors. Then the Menu sheet and the Help
// sheet are opened and used. Screenshots of every page top at 390 go to <out>.
// usage: node tools/phone-check.mjs <outdir>   (env BASE=http://localhost:3003, ROUTES=/a,/b to narrow)
import { spawn } from "node:child_process";
import fs from "node:fs";
const [out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9371;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", `--user-data-dir=${process.env.TEMP}\\ds_edge_phone_white`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = process.env.BASE || "http://localhost:3002";
const errors = [];
let issues = 0;
try {
  let ws;
  for (let i = 0; i < 40 && !ws; i++) { await sleep(500); try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) ws = pg.webSocketDebuggerUrl; } catch {} }
  const sock = new WebSocket(ws); await new Promise((r) => sock.addEventListener("open", r));
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });
  let route = "";
  sock.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errors.push(route + " " + m.params.exceptionDetails.text + " " + (m.params.exceptionDetails.exception?.description ?? ""));
    if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) errors.push(route + " " + m.params.type + ": " + m.params.args.map((a) => a.value ?? a.description).join(" "));
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push(route + " log: " + m.params.entry.text + " " + (m.params.entry.url ?? ""));
  });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  const shot = async (name, full = false) => {
    let clip;
    if (full) { const h = await ev("document.documentElement.scrollHeight"); clip = { x: 0, y: 0, width: await ev("innerWidth"), height: Math.min(h, 16000), scale: 1 }; }
    const s = await send("Page.captureScreenshot", { format: "jpeg", quality: 80, ...(clip ? { clip, captureBeyondViewport: true } : {}) });
    fs.writeFileSync(`${out}\\${name}.jpg`, Buffer.from(s.data, "base64"));
  };
  await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
  const xml = await (await fetch(BASE + "/sitemap.xml")).text();
  const routes = process.env.ROUTES ? process.env.ROUTES.split(",") : [...xml.matchAll(/<loc>https?:\/\/[^/<]+(\/[^<]*)?<\/loc>/g)].map((m) => m[1] || "/");
  const AUDIT = `(() => {
    const iw = innerWidth, r = { sw: document.documentElement.scrollWidth, iw, poke: [], squish: [], tiny: [], taps: [], broken: [], clash: [] };
    const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0 && b.width > 0 && b.height > 0; };
    const clipped = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) return true; } return false; };
    const name = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') + ' "' + (el.innerText || el.alt || '').trim().slice(0, 40) + '"';
    for (const el of document.querySelectorAll('body *')) {
      if (!vis(el)) continue;
      const b = el.getBoundingClientRect();
      if (b.right > iw + 1 && !clipped(el) && getComputedStyle(el).position !== 'fixed') r.poke.push(name(el) + ' right=' + Math.round(b.right));
    }
    for (const img of document.images) {
      if (!vis(img)) continue;
      if (img.complete && img.naturalWidth === 0) { r.broken.push(img.currentSrc || img.src); continue; }
      if (!img.naturalWidth) continue;
      const s = getComputedStyle(img); if (s.objectFit === 'contain' || s.objectFit === 'cover') continue;
      const b = img.getBoundingClientRect(); const want = img.naturalWidth / img.naturalHeight, got = b.width / b.height;
      if (Math.abs(got / want - 1) > 0.02) r.squish.push((img.alt || img.src).slice(0, 60) + ' drawn ' + Math.round(b.width) + 'x' + Math.round(b.height) + ' natural ' + img.naturalWidth + 'x' + img.naturalHeight);
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) { const t = walker.currentNode; const el = t.parentElement; if (!el || !t.textContent.trim() || seen.has(el)) continue; seen.add(el); if (!vis(el)) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 11) r.tiny.push(fs + 'px ' + name(el)); }
    for (const a of document.querySelectorAll('a[href], button')) { if (!vis(a)) continue; const b = a.getBoundingClientRect(); const pb = getComputedStyle(a, '::before'); const hit = pb.content !== 'none' && pb.position === 'absolute'; const pad = hit ? -2 * parseFloat(pb.top || '0') : 0; const padW = hit ? -2 * parseFloat(pb.left || '0') : 0; const inline = getComputedStyle(a).display === 'inline' && a.closest('p, li, dd, span.small'); if (!inline && (b.height + pad < 32 || b.width + padW < 32)) r.taps.push(name(a) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height)); }
    // text that runs out of its own box: a long word that cannot wrap draws
    // past its block and over whatever sits beside it. Measured on the glyphs
    // themselves (Range rects of each text node) against the content edge of
    // the nearest block that holds them.
    {
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const rg = document.createRange();
      while (tw.nextNode()) {
        const t = tw.currentNode; if (!t.textContent.trim()) continue;
        let blk = t.parentElement; while (blk && /^inline/.test(getComputedStyle(blk).display) && getComputedStyle(blk).display !== 'inline-block') blk = blk.parentElement;
        if (!blk || !vis(blk)) continue;
        const cs = getComputedStyle(blk); if (cs.overflowX !== 'visible') continue;
        const br = blk.getBoundingClientRect(); const edge = br.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
        rg.selectNodeContents(t);
        for (const q of rg.getClientRects()) if (q.width > 0 && q.right > edge + 1.5) { r.clash.push(name(blk) + ' "' + t.textContent.trim().slice(0, 24) + '" +' + Math.round(q.right - edge) + 'px'); break; }
      }
    }
    for (const k of ['poke', 'squish', 'tiny', 'taps', 'broken', 'clash']) r[k] = [...new Set(r[k])];
    return r;
  })()`;
  for (const [w, h] of [[360, 780], [390, 844], [430, 932]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 3, mobile: true });
    await send("Emulation.setTouchEmulationEnabled", { enabled: true });
    for (const rt of routes) {
      route = `${rt} @${w}`;
      await send("Page.navigate", { url: BASE + rt }); await sleep(1800);
      const H = await ev("document.documentElement.scrollHeight");
      for (let y = 0; y < H; y += 700) { await ev(`window.scrollTo({top:${y},behavior:"instant"})`); await sleep(40); }
      await ev("window.scrollTo({top:0,behavior:'instant'})"); await sleep(300);
      const r = await ev(AUDIT);
      const bad = r.sw > r.iw || r.poke.length || r.squish.length || r.broken.length || r.clash.length;
      if (bad) issues++;
      console.log(`${rt.padEnd(32)} ${w}: ${r.sw > r.iw ? "SIDEWAYS " + r.sw : "ok"}${r.poke.length ? " | past edge: " + r.poke.slice(0, 4).join("; ") : ""}${r.squish.length ? " | SQUISHED: " + r.squish.join("; ") : ""}${r.broken.length ? " | BROKEN: " + r.broken.join(", ") : ""}${r.clash.length ? " | TEXT CLASH: " + r.clash.slice(0, 4).join("; ") + (r.clash.length > 4 ? ` (+${r.clash.length - 4})` : "") : ""}${r.tiny.length ? " | small text: " + r.tiny.slice(0, 3).join("; ") + (r.tiny.length > 3 ? ` (+${r.tiny.length - 3})` : "") : ""}${r.taps.length ? " | small taps: " + r.taps.slice(0, 3).join("; ") + (r.taps.length > 3 ? ` (+${r.taps.length - 3})` : "") : ""}`);
      if (w === 390) await shot(`390${rt.replace(/\//g, "_") || "_home"}`, rt === "/" || rt === "/products" || rt === "/about" || rt === "/products/zones" || rt === "/free-vault");
    }
  }
  // the Menu sheet and the Help sheet, at 390
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  route = "menu";
  await send("Page.navigate", { url: BASE + "/" }); await sleep(1800);
  console.log("menu:", JSON.stringify(await ev(`(async () => { const b = document.querySelector('.hdr-menu'); if (!b) return 'no menu button'; b.click(); await new Promise(r => setTimeout(r, 500)); const sheet = document.getElementById('menu-sheet'); const links = [...sheet.querySelectorAll('a')].filter(a => a.getBoundingClientRect().height > 0).map(a => a.textContent.trim()); return { expanded: b.getAttribute('aria-expanded'), links }; })()`)));
  await shot("390_menu-open");
  await ev(`[...document.querySelectorAll('#menu-sheet a')].find(a => a.textContent.trim() === 'Products')?.click()`); await sleep(1500);
  console.log("menu -> Products:", await ev("location.pathname"), "menu closed:", await ev("document.querySelector('.hdr-menu')?.getAttribute('aria-expanded')"));
  route = "help";
  await send("Page.navigate", { url: BASE + "/products/compass" }); await sleep(1800);
  console.log("help:", JSON.stringify(await ev(`(async () => { const m = document.querySelector('.help-marker, [class*="help-mark"], button[aria-controls*="help"]'); if (!m) return 'no marker'; m.click(); await new Promise(r => setTimeout(r, 700)); const p = document.querySelector('.help-panel'); const b = p?.getBoundingClientRect(); return { open: !!p, w: b && Math.round(b.width), h: b && Math.round(b.height), modal: p?.getAttribute('aria-modal'), facts: p?.querySelector('dl')?.innerText.replace(/\\s+/g, ' ').slice(0, 160) }; })()`)));
  await shot("390_help-open");
  route = "buy";
  await send("Page.navigate", { url: BASE + "/products/compass" }); await sleep(1800);
  console.log("compass buy:", JSON.stringify(await ev(`[...document.querySelectorAll('.pp-buy a.btn, .pp-buy button.btn, .pp-buy a.lnk, .pp-buy button.lnk')].map(a => (a.textContent.trim()) + ' -> ' + (a.getAttribute('href') || '(opens Help)'))`)));
  await send("Page.navigate", { url: BASE + "/free-vault/volume" }); await sleep(1800);
  console.log("volume buy:", JSON.stringify(await ev(`[...document.querySelectorAll('.pp-buy a.btn, .pp-buy button.btn')].map(a => a.textContent.trim() + ' -> ' + (a.getAttribute('href') || '(opens Help)'))`)));
  console.log(`\npages with layout issues: ${issues}`);
  console.log("console errors/warnings:", errors.length ? "\n  " + errors.join("\n  ") : "none");
} finally { child.kill(); }

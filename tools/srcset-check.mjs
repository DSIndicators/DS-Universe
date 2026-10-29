// Which picture each screen is handed (srcset), and how far the browser has to
// stretch or shrink it: per screen size and density, the hero, a desk shot and
// a product cover. ratio = device pixels drawn / picture pixels; 1.00 is
// pixel-exact, above 1 the browser is stretching (soft), below 1 shrinking.
// usage: node tools/srcset-check.mjs
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9361;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", `--user-data-dir=${process.env.TEMP}\\ds_edge_srcset`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let ws;
  for (let i = 0; i < 40 && !ws; i++) { await sleep(500); try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) ws = pg.webSocketDebuggerUrl; } catch {} }
  const sock = new WebSocket(ws); await new Promise((r) => sock.addEventListener("open", r));
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });
  sock.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); } });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  await send("Page.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true }); await send("Network.enable");
  // The file's own width: its srcset descriptor, or (no srcset) its natural width.
  const probe = `(sel) => { const i = document.querySelector(sel); if (!i) return '-'; const w = i.getBoundingClientRect().width * devicePixelRatio; const s = i.currentSrc.split('/').pop().split('?')[0]; const m = (i.srcset || '').split(',').map(x => x.trim().split(' ')).find(([u]) => u && i.currentSrc.split('?')[0].endsWith(u.split('?')[0].replace(/^\\//, ''))); const fw = m ? parseInt(m[1]) : i.naturalWidth; return s + ' (' + fw + 'w)  ratio ' + (w / fw).toFixed(2); }`;
  for (const [w, h, d] of [[1920, 1080, 1], [2048, 1152, 1.25], [2560, 1440, 1], [2560, 1440, 1.5], [3440, 1440, 1], [1440, 900, 2]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: d, mobile: false });
    await send("Page.navigate", { url: "http://localhost:3002/" }); await sleep(2500);
    const hero = await ev(`(${probe})('.hero .wide-img img')`);
    await send("Page.navigate", { url: "http://localhost:3002/products/flow" }); await sleep(2500);
    const cover = await ev(`(${probe})('.pp-cover img')`);
    const desk = await ev(`(() => { document.querySelector('.wide img').scrollIntoView(); return new Promise(r => setTimeout(() => r((${probe})('.wide img')), 1500)); })()`);
    console.log(`${w}x${h} @${d}x  hero: ${hero} | flow cover: ${cover} | desk: ${desk}`);
  }
  sock.close();
} finally { try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: "ignore" }); } catch {} }

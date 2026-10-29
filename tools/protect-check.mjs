// Checks the pointer and the picture protection on every page, in headless Edge.
// usage: node tools/protect-check.mjs
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9365;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", `--user-data-dir=${process.env.TEMP}\\ds_edge_protect`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let ws;
  for (let i = 0; i < 40 && !ws; i++) { await sleep(500); try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) ws = pg.webSocketDebuggerUrl; } catch {} }
  const sock = new WebSocket(ws); await new Promise((r) => sock.addEventListener("open", r));
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });
  sock.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); } });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  for (const route of ["/", "/products", "/free-vault", "/products/zones", "/products/asl", "/products/bulk-replay-downloader", "/free-vault/session-levels", "/free-vault/live-background", "/ninjatrader", "/about"]) {
    await send("Page.navigate", { url: "http://localhost:3002" + route }); await sleep(3000);
    const H = await ev("document.documentElement.scrollHeight");
    for (let y = 0; y < H; y += 900) { await ev(`window.scrollTo({top:${y},behavior:"instant"})`); await sleep(80); }
    const r = await ev(`(() => {
      const cur = (el) => el ? getComputedStyle(el).cursor.replace(/https?:\\/\\/[^/]+/g, '').slice(0, 70) : '-';
      const imgs = [...document.images];
      const hits = imgs.filter(i => i.offsetParent !== null).map(i => { const b = i.getBoundingClientRect(); i.scrollIntoView({block:'center'}); const c = i.getBoundingClientRect(); const e = document.elementFromPoint(c.x + c.width/2, c.y + c.height/2); return e && e.tagName === 'IMG'; });
      const frames = [...document.querySelectorAll('.wide-img, .stage-box, .vault-pic, .thumb-a, .pp-cover, .ftr-logo, .nt-devices, .nt-mark, .kt-mark')];
      const blocked = frames.map(f => { const m = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); f.dispatchEvent(m); const d = new Event('dragstart', { bubbles: true, cancelable: true }); f.dispatchEvent(d); return m.defaultPrevented && d.defaultPrevented; });
      const text = document.querySelector('p'); const tm = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); text.dispatchEvent(tm);
      return {
        images: imgs.length, broken: imgs.filter(i => i.complete && i.naturalWidth === 0).length,
        anyImageHittable: hits.some(Boolean), framesBlocked: blocked.filter(Boolean).length + '/' + frames.length, textMenuStillWorks: !tm.defaultPrevented,
        cursorPage: cur(document.body), cursorLink: cur(document.querySelector('a.lnk, .hdr-nav a')), cursorChart: cur(document.querySelector('.wide-img, .stage-box')),
        zonesOnStage: !!document.querySelector('.stage-box img[data-on="true"][src*="zones"]'),
      };
    })()`);
    console.log(route, JSON.stringify(r, null, 1));
  }
  sock.close();
} finally { try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: "ignore" }); } catch {} }

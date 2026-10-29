// Frame-time check on localhost:3002 in Edge (headless, GPU on, motion on).
// For each page: scrolls the whole page a few pixels per frame, the way a
// wheel or trackpad does, and records the time between frames; then moves the
// mouse across the page and checks the pointer ring follows. Reports the
// median and 95th-percentile frame time and how many frames ran long.
// usage: node tools/perf.mjs
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9357;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", "--enable-gpu-rasterization", `--user-data-dir=${process.env.TEMP}\\ds_edge_perf`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
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
  const stats = (d) => { const s = [...d].sort((a, b) => a - b); const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return `frames ${s.length}, median ${q(0.5).toFixed(1)}ms, p95 ${q(0.95).toFixed(1)}ms, max ${s[s.length - 1].toFixed(1)}ms, long (>25ms) ${s.filter((x) => x > 25).length}`; };
  for (const route of ["/", "/ninjatrader", "/about"]) {
    await send("Page.navigate", { url: "http://localhost:3002" + route }); await sleep(3500);
    // warm: let lazy pictures load, as a reader's first pass would
    const H = await ev("document.documentElement.scrollHeight");
    for (let y = 0; y < H; y += 900) { await ev(`window.scrollTo({top:${y},behavior:'instant'})`); await sleep(120); }
    await ev("window.scrollTo({top:0,behavior:'instant'})"); await sleep(800);
    const d = await ev(`new Promise((done) => {
      const out = []; let last = performance.now(); const H = document.documentElement.scrollHeight - innerHeight; let y = 0;
      const f = (t) => { out.push(t - last); last = t; y += 14; window.scrollTo({ top: y, behavior: 'instant' }); if (y < H) requestAnimationFrame(f); else done(out.slice(2)); };
      requestAnimationFrame(f);
    })`);
    console.log(`${route.padEnd(13)} scroll: ${stats(d)}`);
  }
  // the pointer ring
  await send("Page.navigate", { url: "http://localhost:3002/" }); await sleep(3000);
  await ev(`(window.__f = [], (function loop(l){ requestAnimationFrame((t)=>{ window.__f.push(t-l); if (window.__f.length < 400) loop(t); }); })(performance.now()), 0)`);
  for (let i = 0; i < 120; i++) { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 200 + i * 12, y: 300 + Math.sin(i / 9) * 160, pointerType: "mouse" }); await sleep(8); }
  await sleep(500);
  const ring = await ev(`(() => { const c = document.querySelector('.cur'); return { on: c.dataset.on, mode: c.dataset.mode, transform: c.style.transform, cursor: document.documentElement.dataset.cursor }; })()`);
  console.log("pointer ring:", JSON.stringify(ring));
  const pf = await ev("window.__f.slice(2)");
  console.log(`pointer moving: ${stats(pf)}`);
  const r = await ev(`(() => { const b = [...document.querySelectorAll('.hdr-nav a')][1].getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.x, y: r.y, pointerType: "mouse" }); await sleep(600);
  console.log("over a header link, mode:", await ev("document.querySelector('.cur').dataset.mode"));
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 900, y: 800, pointerType: "mouse" }); await sleep(600);
  console.log("over the hero chart, mode:", await ev("document.querySelector('.cur').dataset.mode"), "| system cursor:", await ev("getComputedStyle(document.elementFromPoint(900,800)).cursor"));
  sock.close();
} finally { try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: "ignore" }); } catch {} }

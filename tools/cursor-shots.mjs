// Close-up shots of the pointer ring in its three states, for review.
// usage: node tools/cursor-shots.mjs <outdir>
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
const [out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9359;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", `--user-data-dir=${process.env.TEMP}\\ds_edge_cur`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 2, mobile: false });
  await send("Page.navigate", { url: "http://localhost:3002/" }); await sleep(4500);
  const at = async (name, x, y, w = 360, h = 220) => {
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x - 40, y: y - 20, pointerType: "mouse" }); await sleep(50);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, pointerType: "mouse" }); await sleep(900);
    const s = await send("Page.captureScreenshot", { format: "png", clip: { x: x - w / 2, y: y - h / 2, width: w, height: h, scale: 1 } });
    fs.writeFileSync(`${out}\\cursor-${name}.png`, Buffer.from(s.data, "base64"));
    console.log(name, await ev("document.querySelector('.cur').dataset.mode"));
  };
  await at("rest", 1500, 300);
  const r = await ev(`(() => { const b = document.querySelector('.hero-links a').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  await at("link", r.x, r.y);
  await at("chart", 1100, 760);
  sock.close();
} finally { try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: "ignore" }); } catch {} }

// Renders tools/banner/banner.html to PNG at each banner size, in headless
// Edge with its own profile. usage: node tools/banner/render.mjs <outdir>
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const [out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const html = pathToFileURL(path.resolve("tools/banner/banner.html")).href;
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9355;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", "--allow-file-access-from-files", `--user-data-dir=${process.env.TEMP}\\ds_edge_banner`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const JOBS = [
  { name: "DS Universe - White Banner 1920x600 (logo)", w: 1920, h: 600, v: "logo" },
  { name: "DS Universe - White Banner 1920x600 (chart)", w: 1920, h: 600, v: "chart" },
  { name: "DS Universe - White Whop Banner 2200x838 (logo)", w: 2200, h: 838, v: "logo" },
  { name: "DS Universe - White Whop Banner 2200x838 (chart)", w: 2200, h: 838, v: "chart" },
];
try {
  let ws;
  for (let i = 0; i < 40 && !ws; i++) { await sleep(500); try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) ws = pg.webSocketDebuggerUrl; } catch {} }
  const sock = new WebSocket(ws); await new Promise((r) => sock.addEventListener("open", r));
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });
  sock.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); } });
  await send("Page.enable"); await send("Runtime.enable");
  for (const j of JOBS) {
    await send("Emulation.setDeviceMetricsOverride", { width: j.w, height: j.h, deviceScaleFactor: 1, mobile: false });
    await send("Page.navigate", { url: `${html}?w=${j.w}&h=${j.h}&v=${j.v}` });
    await sleep(1500);
    const ok = (await send("Runtime.evaluate", { expression: "document.fonts.ready.then(() => [document.fonts.check('300 40px Manrope'), document.getElementById('art').complete && document.getElementById('art').naturalWidth > 0].join(','))", awaitPromise: true, returnByValue: true })).result.value;
    const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: j.w, height: j.h, scale: 1 } });
    const file = path.join(out, j.name + ".png");
    fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
    console.log(`${j.name}.png  fonts,art loaded: ${ok}`);
  }
  sock.close();
} finally { try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: "ignore" }); } catch {} }

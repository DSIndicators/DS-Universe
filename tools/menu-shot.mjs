// Phone: opens the Menu, shoots it, follows "About", and checks it closed.
// usage: node tools/menu-shot.mjs <outdir>
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
const [out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9363;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", `--user-data-dir=${process.env.TEMP}\\ds_edge_menu`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let ws;
  for (let i = 0; i < 40 && !ws; i++) { await sleep(500); try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) ws = pg.webSocketDebuggerUrl; } catch {} }
  const sock = new WebSocket(ws); await new Promise((r) => sock.addEventListener("open", r));
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });
  sock.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); } });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  const shot = async (n) => { const s = await send("Page.captureScreenshot", { format: "jpeg", quality: 88 }); fs.writeFileSync(`${out}\\${n}.jpg`, Buffer.from(s.data, "base64")); };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send("Page.navigate", { url: "http://localhost:3002/" }); await sleep(3000);
  await shot("phone-header");
  await ev("document.querySelector('.hdr-menu').click()"); await sleep(700);
  console.log("menu open:", await ev("document.querySelector('.sheet').dataset.open"), "| button says:", await ev("document.querySelector('.hdr-menu').textContent"));
  await shot("phone-menu-open");
  await ev("[...document.querySelectorAll('.sheet a')].find(a => a.textContent === 'About').click()"); await sleep(1800);
  console.log("after About:", await ev("location.pathname"), "| menu open:", await ev("document.querySelector('.sheet').dataset.open"));
  await shot("phone-about");
  sock.close();
} finally { try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: "ignore" }); } catch {} }

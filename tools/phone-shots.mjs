// Phone review shots: each route at 390x844 (DPR 2, touch), one viewport
// screenshot per screen while scrolling down, as a visitor sees it (sticky
// header and pinned sections behave as they really do).
// usage: node tools/phone-shots.mjs <outdir> <route> [route...]
import { spawn } from "node:child_process";
import fs from "node:fs";
const [out, ...routes] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9372;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", `--user-data-dir=${process.env.TEMP}\\ds_edge_phone_shots`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
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
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true });
  for (const rt of routes) {
    await send("Page.navigate", { url: (process.env.BASE || "http://localhost:3002") + rt }); await sleep(2000);
    const H = await ev("document.documentElement.scrollHeight");
    let n = 0;
    for (let y = 0; y < H; y += 760) {
      await ev(`window.scrollTo({top:${y},behavior:"instant"})`); await sleep(450);
      const s = await send("Page.captureScreenshot", { format: "jpeg", quality: 72 });
      fs.writeFileSync(`${out}\\${(rt.replace(/\//g, "_") || "_home")}-${String(++n).padStart(2, "0")}.jpg`, Buffer.from(s.data, "base64"));
    }
    console.log(rt, n, "shots");
  }
} finally { child.kill(); }

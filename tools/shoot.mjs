// Review shots of localhost:3002 in headless Edge (own profile, never Tom's).
// usage: node tools/shoot.mjs <outdir> <width> <height> [full]
// Takes viewport shots at named places (hero, reader steps, lineup, DS Complete,
// Free Vault, footer) because the pinned reader cannot be judged from one
// full-page capture; "full" adds a full-page capture too.
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
const [out, width, height, full, route = "/"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const prof = process.env.TEMP + "\\ds_edge_shoot_white";
const port = 9351;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", `--user-data-dir=${prof}`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let ws;
  for (let i = 0; i < 40 && !ws; i++) { await sleep(500); try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) ws = pg.webSocketDebuggerUrl; } catch {} }
  const sock = new WebSocket(ws); await new Promise((r) => sock.addEventListener("open", r));
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });
  sock.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); } });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  await send("Page.enable"); await send("Runtime.enable");
  const w = Number(width), h = Number(height), mobile = w < 700;
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.navigate", { url: "http://localhost:3002" + route }); await sleep(3500);
  const H = await ev("document.documentElement.scrollHeight");
  for (let y = 0; y < H; y += 600) { await ev(`window.scrollTo({top:${y},behavior:"instant"})`); await sleep(120); }
  await sleep(800);
  const tag = route === "/" ? "" : route.replace(/\W+/g, "") + "-";
  const places = route !== "/" ? await ev(`(() => { const p = []; const H = document.documentElement.scrollHeight; for (let y = 0, i = 1; y < H; y += Math.round(innerHeight * 0.9), i++) p.push([String(i).padStart(2, "0"), Math.min(y, H - innerHeight)]); return p; })()`) : await ev(`(() => {
    const top = (el) => el ? Math.round(el.getBoundingClientRect().top + scrollY) : null;
    const p = [["01-hero", 0]];
    const r = document.querySelector('.reader');
    if (r && r.offsetParent !== null) {
      const n = document.querySelectorAll('.reader-index li').length, t = top(r), tot = r.offsetHeight - innerHeight;
      for (const i of [0, 1, 3, 4, 6, 9, 10]) p.push(["02-reader-" + String(i).padStart(2, "0"), Math.round(t + ((i + 0.5) / n) * tot)]);
    } else {
      const m = [...document.querySelectorAll('.cap-m')];
      [0, 3].forEach((k) => m[k] && p.push(["02-cap-" + k, top(m[k]) - 70]));
    }
    const wides = [...document.querySelectorAll('figure.wide')];
    wides.forEach((f, k) => k > 0 && p.push(["03-wide-" + k, top(f) - 120]));
    p.push(["04-lineup", top(document.getElementById('lineup')) + 60]);
    p.push(["05-lineup-mid", top(document.getElementById('lineup')) + Math.round(innerHeight * 1.1)]);
    p.push(["06-complete", top(document.querySelector('.complete')) + 80]);
    p.push(["07-vault", top(document.getElementById('free-vault')) + 40]);
    p.push(["08-footer", document.documentElement.scrollHeight - innerHeight]);
    return p;
  })()`);
  for (const [name, y] of places) {
    await ev(`window.scrollTo({top:${y},behavior:"instant"})`); await sleep(900);
    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 86 });
    fs.writeFileSync(`${out}\\${tag}${w}-${name}.jpg`, Buffer.from(shot.data, "base64"));
    console.log(`${tag}${w}-${name}.jpg @${y}`);
  }
  if (full === "full") {
    await ev("window.scrollTo({top:0,behavior:\"instant\"})"); await sleep(600);
    const fh = Math.min(16000, await ev("document.documentElement.scrollHeight"));
    const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: fh, scale: 1 } });
    fs.writeFileSync(`${out}\\${tag}${w}-full.jpg`, Buffer.from(shot.data, "base64"));
    console.log(`${w}-full.jpg ${fh}`);
  }
  // console errors
  sock.close();
} finally { try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: "ignore" }); } catch {} }

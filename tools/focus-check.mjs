// The typography-fixation switch, end to end in headless Edge (2026-10-29: OFF by
// default). Fresh visit must be plain; click the header switch on, check the
// footer agrees, reload (remembered), turn it off from the footer; then the
// phone switch above the home title at 390 wide. usage: node tools/focus-check.mjs
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9355;
const child = spawn(edge, ["--headless=new", `--user-data-dir=${process.env.TEMP}\\ds_edge_focus`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
try {
  let ws;
  for (let i = 0; i < 40 && !ws; i++) { await sleep(500); try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) ws = pg.webSocketDebuggerUrl; } catch {} }
  const sock = new WebSocket(ws); await new Promise((r) => sock.addEventListener("open", r));
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });
  sock.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); } if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.text); if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value ?? a.description).join(" ")); });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  const state = () => ev(`(() => { const b = document.querySelector('.hero-title .bf'); return { htmlOff: document.documentElement.classList.contains('bio-off'), headerPressed: document.querySelector('.hdr-focus')?.getAttribute('aria-pressed'), footer: document.querySelector('.focus-switch .focus-state')?.textContent, heroFixationWeight: b ? getComputedStyle(b).fontWeight : null, stored: (()=>{try{return localStorage.getItem('ds-bionic')}catch(e){return 'n/a'}})() }; })()`);
  await send("Page.navigate", { url: "http://localhost:3002/" }); await sleep(2500);
  await ev("try{localStorage.removeItem('ds-bionic')}catch(e){}"); await send("Page.reload"); await sleep(2500);
  console.log("fresh visit      ", JSON.stringify(await state()));
  await ev("document.querySelector('.hdr-focus').click()"); await sleep(400);
  console.log("after header on  ", JSON.stringify(await state()));
  await send("Page.reload"); await sleep(2500);
  console.log("after reload     ", JSON.stringify(await state()));
  await send("Page.navigate", { url: "http://localhost:3002/products" }); await sleep(2500);
  console.log("on /products     ", JSON.stringify(await ev("({ htmlOff: document.documentElement.classList.contains('bio-off'), headerPressed: document.querySelector('.hdr-focus')?.getAttribute('aria-pressed') })")));
  await ev("document.querySelector('.focus-switch').click()"); await sleep(400);
  console.log("after footer off ", JSON.stringify(await ev("({ htmlOff: document.documentElement.classList.contains('bio-off'), headerPressed: document.querySelector('.hdr-focus')?.getAttribute('aria-pressed'), footer: document.querySelector('.focus-switch .focus-state')?.textContent })")));
  await ev("try{localStorage.removeItem('ds-bionic')}catch(e){}");
  // phone: the switch above the home title
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send("Page.navigate", { url: "http://localhost:3002/" }); await sleep(2500);
  const phone = () => ev(`(() => { const s = document.querySelector('.hero-bionic'); const r = s?.getBoundingClientRect(); const t = document.querySelector('.hero-kicker')?.getBoundingClientRect(); return { visible: !!r && r.height > 0, aboveKicker: !!(r && t && r.bottom <= t.top), size: r ? Math.round(r.width) + 'x' + Math.round(r.height) : null, text: s?.innerText.replace(/\\s+/g, ' '), pressed: s?.getAttribute('aria-pressed'), htmlOff: document.documentElement.classList.contains('bio-off'), headerHidden: getComputedStyle(document.querySelector('.hdr-nav .hdr-focus')).display === 'none' }; })()`);
  console.log("phone fresh      ", JSON.stringify(await phone()));
  await ev("document.querySelector('.hero-bionic').click()"); await sleep(400);
  console.log("phone tapped on  ", JSON.stringify(await phone()));
  await ev("document.querySelector('.hero-bionic').click()"); await sleep(400);
  console.log("phone tapped off ", JSON.stringify(await phone()));
  await ev("try{localStorage.removeItem('ds-bionic')}catch(e){}");
  console.log("console errors:", errors.length ? errors.join(" | ") : "none");
  sock.close();
} finally { try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: "ignore" }); } catch {} }

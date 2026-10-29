// The Help panel, end to end in headless Edge, with screenshots:
// open on a product page (its facts first), search the answers, ask a
// question (no mail settings locally -> the mail-app fallback must appear),
// the phone sheet, and the DS Complete band's button (focus-reading flex fix).
// usage: node tools/help-check.mjs <outdir>
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
const [out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9357;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", `--user-data-dir=${process.env.TEMP}\\ds_edge_help`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
try {
  let ws;
  for (let i = 0; i < 40 && !ws; i++) { await sleep(500); try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) ws = pg.webSocketDebuggerUrl; } catch {} }
  const sock = new WebSocket(ws); await new Promise((r) => sock.addEventListener("open", r));
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });
  sock.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); } if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.text + " " + (m.params.exceptionDetails.exception?.description ?? "")); if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value ?? a.description).join(" ")); });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  const shot = async (name) => { const s = await send("Page.captureScreenshot", { format: "jpeg", quality: 88 }); fs.writeFileSync(`${out}\\${name}.jpg`, Buffer.from(s.data, "base64")); };
  const type = async (sel, text) => { await ev(`document.querySelector('${sel}').focus()`); await send("Input.insertText", { text }); };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "http://localhost:3002/products/zones" }); await sleep(2500);
  await ev("document.querySelector('.help-marker').click()"); await sleep(600);
  console.log("open:", JSON.stringify(await ev("({ panel: !document.querySelector('.help-panel').hidden, facts: document.querySelector('.hp-name')?.textContent, rows: [...document.querySelectorAll('.hp-dl dt')].map(d=>d.textContent), faqs: document.querySelectorAll('.hp-faq li').length })")));
  await shot("help-1-answers");
  await type(".hp-pane input[type=search]", "refund"); await sleep(300);
  console.log("search 'refund':", await ev("document.querySelectorAll('.hp-faq li').length"));
  await ev("document.querySelector('.hp-faq summary')?.click()"); await sleep(300);
  await shot("help-2-search");
  await ev("[...document.querySelectorAll('.hp-tab')][1].click()"); await sleep(300);
  await type("input[type=email]", "tom@example.com");
  await type("textarea", "Does DS Zones run on MES as well as MNQ?");
  await ev("document.querySelector('.hp-send .btn').click()"); await sleep(3500);
  console.log("ask:", JSON.stringify(await ev("({ fallback: !!document.querySelector('.hp-fallback'), mailto: document.querySelector('.hp-fallback a')?.getAttribute('href')?.slice(0, 60), kept: document.querySelector('textarea')?.value })")));
  await shot("help-3-ask-fallback");
  await ev("try{sessionStorage.clear()}catch(e){}");
  await send("Page.navigate", { url: "http://localhost:3002/products" }); await sleep(2500);
  await ev("document.getElementById('complete').scrollIntoView()"); await sleep(800);
  console.log("complete button:", JSON.stringify(await ev("({ text: document.querySelector('#complete .btn')?.innerText, label: document.querySelector('.complete-label')?.innerText })")));
  await shot("complete-band");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url: "http://localhost:3002/" }); await sleep(2500);
  await shot("help-4-phone-marker");
  await ev("document.querySelector('.help-marker').click()"); await sleep(600);
  await shot("help-5-phone-sheet");
  console.log("console errors:", errors.length ? errors.join(" | ") : "none");
  sock.close();
} finally { try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: "ignore" }); } catch {} }

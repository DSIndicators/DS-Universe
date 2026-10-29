// Behaviour checks on localhost:3002 in headless Edge, motion ON (as a visitor
// sees it): console errors, horizontal overflow at each width, the hero draw,
// the reader's scroll walk, a product pick swapping the picture, the index
// jump, broken images, and every outbound link.
// usage: node tools/check.mjs <outdir>
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
const [out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9353;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", `--user-data-dir=${process.env.TEMP}\\ds_edge_check_white`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];
try {
  let ws;
  for (let i = 0; i < 40 && !ws; i++) { await sleep(500); try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) ws = pg.webSocketDebuggerUrl; } catch {} }
  const sock = new WebSocket(ws); await new Promise((r) => sock.addEventListener("open", r));
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });
  sock.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.text + " " + (m.params.exceptionDetails.exception?.description ?? ""));
    if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) errors.push(m.params.type + ": " + m.params.args.map((a) => a.value ?? a.description).join(" "));
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push("log: " + m.params.entry.text + " " + (m.params.entry.url ?? ""));
  });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  const shot = async (name) => { const s = await send("Page.captureScreenshot", { format: "jpeg", quality: 86 }); fs.writeFileSync(`${out}\\${name}.jpg`, Buffer.from(s.data, "base64")); };
  await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");

  for (const route of ["/", "/products", "/free-vault", "/products/zones", "/products/compass", "/products/data-candles", "/products/asl", "/products/bulk-replay-downloader", "/free-vault/session-levels", "/free-vault/live-background", "/ninjatrader", "/about"]) for (const [w, h] of [[390, 844], [768, 1024], [1100, 800], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440], [3440, 1440]]) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 700 });
    await send("Page.navigate", { url: "http://localhost:3002" + route }); await sleep(2000);
    const H = await ev("document.documentElement.scrollHeight");
    for (let y = 0; y < H; y += 800) { await ev(`window.scrollTo({top:${y},behavior:"instant"})`); await sleep(60); }
    await sleep(600);
    const o = await ev(`({ sw: document.documentElement.scrollWidth, iw: innerWidth, broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && getComputedStyle(i).display !== 'none' && i.offsetParent !== null).map(i => i.src) })`);
    console.log(`${route.padEnd(13)} ${w}x${h}: scrollWidth ${o.sw} vs ${o.iw}${o.sw > o.iw ? "  <-- HORIZONTAL OVERFLOW" : ""}; broken images: ${o.broken.length ? o.broken.join(", ") : "none"}`);
  }

  // motion on, 1920: the hero draw mid-way and finished
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "http://localhost:3002/" }); await sleep(1300);
  await shot("motion-hero-drawing");
  await sleep(2500); await shot("motion-hero-drawn");

  // reader: walk, pick, jump
  const r = await ev(`(() => { const r = document.querySelector('.reader'); return { top: r.getBoundingClientRect().top + scrollY, h: r.offsetHeight, n: document.querySelectorAll('.reader-index li').length }; })()`);
  const tot = r.h - 1080;
  const seen = [];
  for (let i = 0; i < r.n; i++) {
    await ev(`window.scrollTo({top:${Math.round(r.top + ((i + 0.5) / r.n) * tot)},behavior:"instant"})`); await sleep(250);
    seen.push(await ev(`document.querySelector('.reader-index button[aria-current="true"]')?.textContent + ' | ' + document.querySelector('.stage-box img[data-on="true"]')?.getAttribute('src')`));
  }
  console.log("reader walk:\n  " + seen.join("\n  "));
  await ev(`window.scrollTo({top:${Math.round(r.top + (0.5 / r.n) * tot)},behavior:"instant"})`); await sleep(400);
  await ev(`[...document.querySelectorAll('.reader-copy .panel[data-on="true"] .row')].find(b => b.textContent.includes('DS Iceberg')).click()`); await sleep(900);
  console.log("after picking DS Iceberg:", await ev(`document.querySelector('.stage-box img[data-on="true"]').getAttribute('src') + ' | acts: ' + [...document.querySelectorAll('.reader-copy .panel[data-on="true"] .row-acts a')].map(a => a.textContent + ' -> ' + a.href).join(' ; ')`));
  await shot("reader-picked-iceberg");
  await ev(`[...document.querySelectorAll('.reader-index button')].find(b => b.textContent === 'Dealer gamma').click()`); await sleep(1800);
  console.log("after index jump to Dealer gamma:", await ev(`document.querySelector('.reader-index button[aria-current="true"]').textContent`));
  await shot("reader-jump-gamma");

  // every internal link on every product and index page answers 200 (pass 4)
  {
    const seen = new Set();
    const queue = ["/", "/products", "/free-vault", "/ninjatrader", "/about"];
    const bad = [];
    while (queue.length) {
      const r = queue.shift();
      if (seen.has(r)) continue;
      seen.add(r);
      const res = await fetch("http://localhost:3002" + r);
      if (res.status !== 200) { bad.push(r + " -> " + res.status); continue; }
      const html = await res.text();
      for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) if (!m[1].startsWith("/_next") && !seen.has(m[1]) && !/\.(png|webp|ico|css|js)$/.test(m[1])) queue.push(m[1]);
    }
    console.log(`internal pages crawled: ${seen.size}; not 200: ${bad.length ? bad.join(", ") : "none"}`);
    console.log("  " + [...seen].sort().join("\n  "));
  }

  // links
  const links = await ev(`[...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')))]`);
  console.log(`links (${links.length}):\n  ` + links.join("\n  "));
  console.log("console errors/warnings:", errors.length ? "\n  " + errors.join("\n  ") : "none");
  sock.close();
} finally { try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: "ignore" }); } catch {} }

// Where does the first-load wait go? Opens each URL cold (cache off, fresh
// profile) in headless Edge and reports: time to the server's first byte,
// first paint, first contentful paint, the largest paint (LCP) and when the
// load finished; plus the heaviest downloads.
// usage: node tools/loadtime.mjs <url> [<url> ...]
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
const urls = process.argv.slice(2);
const edge = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => fs.existsSync(p));
const port = 9361;
const prof = `${process.env.TEMP}\\ds_edge_load_${Date.now()}`;
const child = spawn(edge, ["--headless=new", "--hide-scrollbars", `--user-data-dir=${prof}`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let ws;
  for (let i = 0; i < 40 && !ws; i++) { await sleep(500); try { const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const pg = t.find((x) => x.type === "page"); if (pg) ws = pg.webSocketDebuggerUrl; } catch {} }
  const sock = new WebSocket(ws); await new Promise((r) => sock.addEventListener("open", r));
  let id = 0; const pend = new Map();
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); sock.send(JSON.stringify({ id: i, method, params })); });
  sock.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id); } });
  const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__lcp=0; new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});` });
  for (const url of urls) {
    for (const run of ["cold", "warm"]) {
      await send("Page.navigate", { url: "about:blank" }); await sleep(300);
      await send("Page.navigate", { url }); await sleep(9000);
      const r = await ev(`(() => { const n = performance.getEntriesByType('navigation')[0]; const p = Object.fromEntries(performance.getEntriesByType('paint').map(x => [x.name, Math.round(x.startTime)]));
        const res = performance.getEntriesByType('resource').map(x => [x.name.replace(location.origin,''), Math.round(x.transferSize/1024), Math.round(x.responseEnd)]).sort((a,b)=>b[1]-a[1]).slice(0,5);
        return { ttfb: Math.round(n.responseStart), html: Math.round(n.responseEnd), domReady: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fp: p['first-paint'], fcp: p['first-contentful-paint'], lcp: Math.round(window.__lcp), heaviest: res }; })()`);
      console.log(`${url} [${run}] first byte ${r?.ttfb}ms | html ${r?.html}ms | first paint ${r?.fp}ms | first content ${r?.fcp}ms | largest paint ${r?.lcp}ms | DOM ready ${r?.domReady}ms | load ${r?.load}ms`);
      if (run === "cold") console.log("   heaviest: " + (r?.heaviest ?? []).map(([n, kb, t]) => `${n.slice(-48)} ${kb}KB @${t}ms`).join("  ·  "));
      await send("Network.setCacheDisabled", { cacheDisabled: run === "warm" });
    }
    await send("Network.setCacheDisabled", { cacheDisabled: true });
  }
  sock.close();
} finally { try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: "ignore" }); } catch {} }

// Minimal Chrome DevTools Protocol driver for checking the interactive pages.
// Usage: node cdp.mjs plan.json   — plan: { width, height, dark, steps: [ {nav}, {wait}, {eval}, {shot:{sel|clip, file, pad}} ] }
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const plan = JSON.parse(readFileSync(process.argv[2], "utf8"));
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9300 + Math.floor(Math.random() * 500);
const prof = mkdtempSync(join(process.env.SP || tmpdir(), "chprof-"));
const chrome = spawn(CH, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`,
  `--blink-settings=preferredColorScheme=${plan.dark ? 0 : 1}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
async function connect() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/list`); const list = await r.json(); const pg = list.find((t) => t.type === "page"); if (pg) return pg.webSocketDebuggerUrl; } catch (e) {}
    await sleep(150);
  }
  throw new Error("chrome did not start");
}
function send(method, params = {}) {
  return new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
}
async function evaluate(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error("eval failed: " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text));
  return r.result.value;
}
try {
  ws = new WebSocket(await connect());
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: plan.width || 1440, height: plan.height || 1000, deviceScaleFactor: 1, mobile: !!plan.mobile });
  const logs = [];
  for (const st of plan.steps) {
    if (st.nav) { await send("Page.navigate", { url: st.nav }); await sleep(st.after || 2500); }
    if (st.wait) await sleep(st.wait);
    if (st.eval) { const v = await evaluate(st.eval); if (v !== undefined) logs.push(v); }
    if (st.shot) {
      let clip = st.shot.clip;
      if (st.shot.sel) {
        clip = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(st.shot.sel)}); if (!e) return null; e.scrollIntoView({block:"start"}); const r = e.getBoundingClientRect(); return { x: Math.max(0, r.left - ${st.shot.pad || 8}), y: r.top + window.scrollY - ${st.shot.pad || 8}, width: Math.min(r.width + ${2 * (st.shot.pad || 8)}, window.innerWidth), height: r.height + ${2 * (st.shot.pad || 8)} }; })()`);
        if (!clip) { logs.push("no element " + st.shot.sel); continue; }
        await sleep(st.shot.settle || 900);
        clip = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(st.shot.sel)}); const r = e.getBoundingClientRect(); return { x: Math.max(0, r.left - ${st.shot.pad || 8}), y: r.top + window.scrollY - ${st.shot.pad || 8}, width: Math.min(r.width + ${2 * (st.shot.pad || 8)}, window.innerWidth), height: r.height + ${2 * (st.shot.pad || 8)} }; })()`);
      }
      const r = await send("Page.captureScreenshot", { format: "png", clip: Object.assign({ scale: 1 }, clip), captureBeyondViewport: true });
      writeFileSync(st.shot.file, Buffer.from(r.data, "base64"));
    }
  }
  console.log(JSON.stringify(logs, null, 1));
} catch (e) { console.error("ERROR", e.message); process.exitCode = 1; }
finally { try { ws && ws.close(); } catch (e) {} chrome.kill("SIGKILL"); }

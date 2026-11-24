import { dirname, resolve, join as pjoin } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
// General correctness harness: node harness.mjs NN
// Compiles lesson NN's .md TypeScript (plus added code), loads the guide's scripts, and checks every animator
// declared in hcfg/NN.mjs against the reference functions on presets + random inputs.
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import vm from "node:vm";

// tools live in <guide>/interactive/tools; the guide root is two levels up
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const IA = ROOT + "/interactive/assets/js";
const SP = process.env.SP || HERE;
const NN = process.argv[2];
const cfg = await import(join(SP, "hcfg", `${NN}.mjs`));

const md = readdirSync(ROOT).find((f) => f.startsWith(NN + " ") && f.endsWith(".md"));
const tsBlocks = (file) => [...readFileSync(file, "utf8").matchAll(/^```ts\n([\s\S]*?)^```/gm)].map((m) => m[1]);
let src = tsBlocks(join(ROOT, md));
if (cfg.added) src = src.concat(tsBlocks(join(SP, cfg.added)));
const work = mkdtempSync(join(tmpdir(), `h${NN}-`));
writeFileSync(work + "/ref.ts", src.join("\n") + "\nexport {};\n" + (cfg.expose || ""));
execFileSync("tsc", ["--strict", "--outDir", work, "--module", "commonjs", "--target", "es2022", "--lib", "es2022,dom", work + "/ref.ts"]);
const ref = vm.createContext({ console: { log() {} }, exports: {} });
vm.runInContext(readFileSync(work + "/ref.js", "utf8"), ref);

const noop = () => {};
const el = { getAttribute: () => null, setAttribute: noop, addEventListener: noop };
const sandbox = {
  console, structuredClone, localStorage: { getItem: () => null, setItem: noop }, location: { search: "" },
  requestAnimationFrame: (f) => f(), matchMedia: () => ({ matches: false, addEventListener: noop }),
  document: { documentElement: el, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: () => ({}) },
};
sandbox.window = sandbox;
const ctx = vm.createContext(sandbox);
for (const f of ["core.js", "stage.js", "viz/array.js", "viz/kit.js", "viz/bars.js", "viz/graph.js", "viz/timeline.js", `lessons/${NN}.js`]) vm.runInContext(readFileSync(`${IA}/${f}`, "utf8"), ctx, { filename: f });
const G = sandbox.Guide;
const A = G.animators;

let fails = 0, checks = 0;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (cond, msg) => { checks++; if (!cond) { fails++; if (fails < 30) console.log("FAIL", msg); } };
const R = ref;
const H = { A, R, G, eq, check, rnd: (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1)) };
H.arr = (n, lo, hi) => Array.from({ length: n }, () => H.rnd(lo, hi));
H.sorted = (a) => a.slice().sort((x, y) => x - y);

const specs = cfg.specs(H);
for (const [key, sp] of Object.entries(specs)) {
  const s = A[key];
  check(!!s, `animator ${key} is registered`);
  if (!s) continue;
  const inputs = s.presets.map((p) => p.input).concat(sp.gen ? Array.from({ length: sp.n || 200 }, sp.gen) : []);
  for (const inp of inputs) {
    let tr;
    try { tr = s.trace(s.parse(inp)); } catch (e) { check(false, `${key} threw on "${inp}": ${e.message}`); continue; }
    if (sp.ok) check(sp.ok(inp, tr.result), `${key} "${inp}": result ${JSON.stringify(tr.result)} is not valid`);
    if (sp.want) { const want = sp.want(inp); const got = sp.got ? sp.got(tr.result) : tr.result; check(eq(got, want), `${key} "${inp}": got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
    tr.frames.forEach((f, i) => {
      if (f.at) check(!!(s.lines && s.lines[f.at]), `${key}: unknown line key ${f.at}`);
      if (f.ask) {
        check(f.ask.answer >= 0 && f.ask.answer < f.ask.options.length, `${key}: ask answer out of range`);
        const want = sp.askNext && sp.askNext[f.ask.answer];
        if (want) { const nx = tr.frames[i + 1]; check(nx && want.includes(nx.at), `${key} "${inp}" frame ${i}: ask option ${f.ask.answer} but next frame is ${nx && nx.at}`); }
      }
    });
  }
  if (s.table) {
    const tr = s.trace(s.parse(s.presets[s.table.preset].input));
    const keys = new Set(tr.frames.map((f) => f.key));
    s.table.rows.forEach((r) => check(keys.has(r), `${key}: trace-table row "${r}" never lights up`));
  }
}
if (cfg.extra) cfg.extra(H);
console.log(`lesson ${NN}: ${fails ? "FAILED" : "OK"}: ${checks} checks, ${fails} failures`);
process.exitCode = fails ? 1 : 0;

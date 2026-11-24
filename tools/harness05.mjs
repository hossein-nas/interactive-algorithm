import { dirname, resolve, join as pjoin } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
// Verifies lesson 05 animators against the lesson's own compiled TypeScript (plus the added, verified code).
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import vm from "node:vm";

// tools live in <guide>/interactive/tools; the guide root is two levels up
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const IA = ROOT + "/interactive/assets/js";
const SP = process.env.SP || HERE;

// ---- 1. reference implementations: compile the .md TypeScript exactly as tools/verify.py does ----
const tsBlocks = (file) => [...readFileSync(file, "utf8").matchAll(/^```ts\n([\s\S]*?)^```/gm)].map((m) => m[1]);
const src = tsBlocks(ROOT + "/05 two-pointers.md").concat(tsBlocks(SP + "/added-05.md")).join("\n") + "\nexport {};\n";
const work = mkdtempSync(join(tmpdir(), "h05-"));
writeFileSync(work + "/ref.ts", src);
execFileSync("tsc", ["--strict", "--outDir", work, "--module", "commonjs", "--target", "es2022", "--lib", "es2022,dom", work + "/ref.ts"]);
const ref = vm.createContext({ console: { log() {} }, exports: {} });
vm.runInContext(readFileSync(work + "/ref.js", "utf8"), ref);

// ---- 2. load the guide's scripts with tiny DOM stubs ----
const noop = () => {};
const el = { getAttribute: () => null, setAttribute: noop, addEventListener: noop };
const sandbox = {
  console, structuredClone,
  localStorage: { getItem: () => null, setItem: noop },
  location: { search: "" },
  requestAnimationFrame: (f) => f(),
  matchMedia: () => ({ matches: false, addEventListener: noop }),
  document: { documentElement: el, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [] },
};
sandbox.window = sandbox;
const ctx = vm.createContext(sandbox);
for (const f of ["core.js", "stage.js", "viz/array.js", "viz/bars.js", "lessons/05.js"]) vm.runInContext(readFileSync(`${IA}/${f}`, "utf8"), ctx, { filename: f });
const G = sandbox.Guide;
const A = G.animators;

// ---- helpers ----
let fails = 0, checks = 0;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function check(cond, msg) { checks++; if (!cond) { fails++; if (fails < 40) console.log("FAIL", msg); } }
const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const arr = (n, lo, hi) => Array.from({ length: n }, () => rnd(lo, hi));
const sorted = (a) => a.slice().sort((x, y) => x - y);
const run = (key, input) => { const s = A[key]; return s.trace(s.parse(input)); };

// reference wrappers: input string -> expected result in the animator's result shape
const R = ref;
const expected = {
  heightsLine: (s) => { const { h, t } = A.heightsLine.parse(s); return R.pairSumSorted(h, t); },
  reverseString: (s) => { const c = s.split(""); R.reverseString(c); return c.join(""); },
  readWrite: (s) => { const a = A.readWrite.parse(s); const k = R.readWrite(a, (x) => x % 2 === 0); return { k, arr: a.slice(0, k) }; },
  pairSum: (s) => { const { nums, target } = A.pairSum.parse(s); return R.pairSumSorted(nums, target); },
  removeDuplicates: (s) => { const a = A.removeDuplicates.parse(s); const k = R.removeDuplicates(a); return { k, arr: a.slice(0, k) }; },
  sortColors: (s) => { const a = A.sortColors.parse(s); R.sortColors(a); return a; },
  threeSum: (s) => R.threeSum(A.threeSum.parse(s)),
  maxArea: (s) => R.maxArea(A.maxArea.parse(s)),
  trapRain: (s) => R.trapRainWater(A.trapRain.parse(s)),
  trapArrays: (s) => R.trapWithArrays(A.trapArrays.parse(s)),
  moveZeroes: (s) => { const a = A.moveZeroes.parse(s); R.moveZeroes(a); return a; },
  isPalindrome: (s) => R.isPalindrome(s),
  mergeSorted: (s) => { const { a, b } = A.mergeSorted.parse(s); const n1 = a.concat(new Array(b.length).fill(0)); R.mergeSorted(n1, a.length, b.slice(), b.length); return n1; },
};
const gens = {
  heightsLine: () => { const h = sorted(arr(rnd(2, 8), 2, 16).map((x) => x / 2)); const t = rnd(0, 1) ? h[rnd(0, h.length - 1)] + h[rnd(0, h.length - 1)] : rnd(4, 17) / 1; return `${h.join(" ")} ; ${t}`; },
  reverseString: () => Array.from({ length: rnd(1, 14) }, () => "abcxyz! ."[rnd(0, 8)]).join(""),
  readWrite: () => arr(rnd(1, 10), -20, 20).join(" "),
  pairSum: () => { const a = sorted(arr(rnd(1, 12), -30, 30)); const t = rnd(0, 1) && a.length > 1 ? a[rnd(0, a.length - 1)] + a[rnd(0, a.length - 1)] : rnd(-60, 60); return `${a.join(" ")} ; ${t}`; },
  removeDuplicates: () => sorted(arr(rnd(0, 12), 0, 6)).join(" ") || "[]",
  sortColors: () => arr(rnd(1, 12), 0, 2).join(" "),
  threeSum: () => arr(rnd(3, 10), -6, 6).join(" "),
  maxArea: () => arr(rnd(2, 12), 0, 12).join(" "),
  trapRain: () => arr(rnd(0, 14), 0, 9).join(" ") || "[]",
  trapArrays: () => arr(rnd(1, 14), 0, 9).join(" "),
  moveZeroes: () => arr(rnd(1, 10), 0, 3).join(" "),
  isPalindrome: () => { const base = Array.from({ length: rnd(1, 6) }, () => "abAB1 ,!"[rnd(0, 7)]).join(""); return rnd(0, 1) ? base + base.split("").reverse().join("") : base + "x" + base; },
  mergeSorted: () => `${sorted(arr(rnd(0, 6), -9, 9)).join(" ")} ; ${sorted(arr(rnd(1, 6), -9, 9)).join(" ")}`,
};
// For each predict question, option k must equal what the very next frame actually does.
const askNext = {
  heightsLine: [null, null, null],
  readWrite: [["write"], ["loop"]],
  pairSum: [["left"], ["right"], ["found"]],
  removeDuplicates: [["copy"], ["loop"]],
  sortColors: [["swap0"], ["inc1"], ["swap2"]],
  threeSum: [["lpp"], ["rmm"], ["push"]],
  maxArea: [["left"], ["right"]],
  trapRain: [["lmax", "lwater"], ["rmax", "rwater"]],
  moveZeroes: [["swap"], ["loop"]],
  isPalindrome: [["move"], ["fail"]],
  mergeSorted: [["take1"], ["take2"]],
};

for (const key of Object.keys(expected)) {
  const s = A[key];
  const inputs = s.presets.map((p) => p.input).concat(Array.from({ length: 200 }, gens[key]));
  for (const inp of inputs) {
    let tr;
    try { tr = run(key, inp); } catch (e) { check(false, `${key} threw on "${inp}": ${e.message}`); continue; }
    const want = expected[key](inp);
    check(eq(tr.result, want), `${key} "${inp}": got ${JSON.stringify(tr.result)} want ${JSON.stringify(want)}`);
    // every frame has a line key that exists, and every ask points at the real next move
    tr.frames.forEach((f, i) => {
      if (f.at) check(!!(s.lines && s.lines[f.at]), `${key}: unknown line key ${f.at}`);
      if (f.ask) {
        check(f.ask.answer >= 0 && f.ask.answer < f.ask.options.length, `${key}: ask answer out of range`);
        const want = askNext[key] && askNext[key][f.ask.answer];
        if (want) { const nx = tr.frames[i + 1]; check(nx && want.includes(nx.at), `${key} "${inp}" frame ${i}: ask says option ${f.ask.answer} but next frame is ${nx && nx.at}`); }
      }
    });
  }
  if (s.table) {
    const tr = run(key, s.presets[s.table.preset].input);
    const keys = new Set(tr.frames.map((f) => f.key));
    s.table.rows.forEach((r) => check(keys.has(r), `${key}: trace-table row "${r}" never lights up`));
  }
}

// ---- bug replays must actually go wrong on their preset input ----
const bug = (key, i) => { const s = A[key]; const b = s.bugs[i]; return b.trace(s.parse(b.input)).result; };
check(!eq(bug("sortColors", 0), expected.sortColors(A.sortColors.bugs[0].input)), "sortColors bug does not show a wrong result");
const dupRes = bug("threeSum", 0);
check(new Set(dupRes.map((t) => t.join())).size < dupRes.length, "threeSum dup bug shows no duplicates");
check(bug("threeSum", 1).length === 0 && expected.threeSum(A.threeSum.bugs[1].input).length === 1, "threeSum skip-before bug does not miss [0,0,0]");
check(bug("maxArea", 0) < expected.maxArea(A.maxArea.bugs[0].input), "maxArea bug finds the right answer");

console.log(`${fails ? "FAILED" : "OK"}: ${checks} checks, ${fails} failures`);
process.exitCode = fails ? 1 : 0;

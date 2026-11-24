/* Lesson 02 · Big O — animators that make the cost visible as a counter, and quizzes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;
  const fmtN = (x) => (x >= 1e15 ? x.toExponential(1).replace("e+", " × 10^") : Math.round(x).toLocaleString("en-US"));

  /* ---------------- growth race ---------------- */
  const FAM = [
    ["O(1)", () => 1], ["O(log n)", (n) => Math.max(1, Math.log2(n))], ["O(n)", (n) => n], ["O(n log n)", (n) => n * Math.max(1, Math.log2(n))],
    ["O(n²)", (n) => n * n], ["O(2ⁿ)", (n) => Math.pow(2, n)],
  ];
  G.viz.growth = function (scene, st) {
    const left0 = 96, W = 560, rowH = 40, maxLog = 15;
    const X = (ops) => left0 + (Math.min(maxLog, Math.log10(Math.max(1, ops))) / maxLog) * W;
    G.drawText(scene, "gt", left0, 10, `operations for n = ${fmtN(st.n)} (log scale)`, "lbl panel-title");
    const lim = X(1e8);
    G.drawLine(scene, "limit", lim, 24, lim, 30 + FAM.length * rowH, "edge limit");
    G.drawText(scene, "limt", lim + 4, 30 + FAM.length * rowH + 8, "≈ 1 second (10^8 steps)", "lbl");
    FAM.forEach(([name, f], i) => {
      const ops = f(st.n), y = 30 + i * rowH;
      G.drawText(scene, `gn${i}`, left0 - 10, y + 13, name, "row-label", "end");
      const r = scene.el(`gb${i}`, "rect", "mid");
      r.setAttribute("class", "gbar" + (ops > 1e8 ? " slow" : ""));
      Object.assign(r.style, { x: left0 + "px", y: y + "px", height: "26px", width: Math.max(3, X(ops) - left0) + "px" });
      G.drawText(scene, `gv${i}`, Math.min(X(ops), left0 + W - 150) + 8, y + 13, ops > 1e15 ? "astronomically many" : fmtN(ops), "lbl gval", "start", "front");
    });
    return { x: 0, y: 0, w: left0 + W + 40, h: 30 + FAM.length * rowH + 22 };
  };
  A.growthRace = {
    title: "The growth race: how much work as n grows",
    viz: "growth", noCodeBlock: true,
    noCode: "Each step multiplies n by 10. Watch which bars cross the one-second line first.",
    legend: ["answer:fast enough", "bug:too slow for about one second"],
    inputLabel: "Largest n to show",
    hint: "1000000",
    presets: [{ label: "up to a million", input: "1000000" }, { label: "up to 100", input: "100" }, { label: "up to a billion", input: "1000000000" }],
    parse(s) { const n = P.num(s, "n"); if (n < 1 || n > 1e12) throw new Error("Pick n between 1 and 10^12."); return n; },
    trace(max) {
      const T = new G.Trace();
      for (let n = 1; n <= max; n *= 10) {
        const slow = FAM.filter(([, f]) => f(n) > 1e8).map(([k]) => k);
        T.add({ state: { n }, vars: { n }, say: slow.length ? `n = ${fmtN(n)}: ${slow.join(", ")} ${slow.length > 1 ? "are" : "is"} past one second. ${n >= 1e5 ? "You need `O(n log n)` or better." : ""}` : `n = ${fmtN(n)}: every family is still under a second.` });
      }
      return T.done(null);
    },
  };

  /* ---------------- 4.1 loop shapes ---------------- */
  const parseNumsT = (s) => { const [a, t] = P.parts(s, 2, 'Numbers, then ";" and the target, e.g. 1 2 3 4 ; 5'); return { nums: P.nums(a, { minLen: 1, maxLen: 8, min: -20, max: 20 }), target: P.num(t) }; };
  A.countPairs = {
    title: "Nested loops: every pair is one check",
    short: "Loop inside a loop: n²/2",
    viz: "grid",
    legend: ["focus:pair being checked", "answer:pair adds up", "done:already checked"],
    varRoles: { checks: "focus", count: "answer" },
    inputLabel: "Numbers ; target",
    hint: "1 2 3 4 ; 5",
    presets: [{ label: "[1,2,3,4] → 5", input: "1 2 3 4 ; 5" }, { label: "8 numbers", input: "1 2 3 4 5 6 7 8 ; 9" }],
    parse: parseNumsT,
    lines: {
      outer: { ts: "function countPairsWithSum>>for (let i = 0; i < nums.length; i++)", go: "func countPairsWithSum>>for i := 0; i < len(nums); i++" },
      check: { ts: "if (nums[i] + nums[j] === target) count++;", go: "if nums[i]+nums[j] == target" },
      ret: { ts: "function countPairsWithSum>>return count;", go: "func countPairsWithSum>>return count" },
    },
    trace({ nums, target }) {
      const T = new G.Trace();
      const n = nums.length;
      const cells = nums.map((_, i) => nums.map((__, j) => ({ v: "", m: j <= i ? "ghost" : null })));
      let checks = 0, count = 0;
      const st = () => ({ cells: G.copy(cells), rowLabels: nums.map((v, i) => `i${i}: ${v}`), colLabels: nums.map((v, j) => `j${j}:${v}`), cell: 34 });
      for (let i = 0; i < n; i++) {
        T.add({ at: "outer", state: st(), vars: { i, checks, count }, say: `Outer loop: \`i\` = ${i}. The inner loop will check ${n - 1 - i} partner${n - 1 - i === 1 ? "" : "s"}.` });
        for (let j = i + 1; j < n; j++) {
          checks++;
          const hit = nums[i] + nums[j] === target;
          if (hit) count++;
          cells[i][j] = { v: nums[i] + nums[j], m: hit ? "answer" : "focus" };
          T.add({ at: "check", state: st(), vars: { i, j, checks, count }, say: `${nums[i]} + ${nums[j]} = ${nums[i] + nums[j]}${hit ? `: a pair! count = ${count}.` : "."}` });
          if (!hit) cells[i][j].m = "done";
        }
      }
      T.add({ at: "ret", state: st(), vars: { checks, count, "n(n-1)/2": (n * (n - 1)) / 2 }, say: `${checks} checks for n = ${n}: the filled triangle is n(n−1)/2 cells, about n²/2, so \`O(n²)\`.` });
      return T.done(count);
    },
  };
  A.countCommon = {
    title: "Nested loops: every pair is one check",
    short: "One loop after another: a + b",
    viz: "array",
    legend: ["focus:being read", "answer:counted (in both)"],
    varRoles: { count: "answer", steps: "focus" },
    inputLabel: "Array a ; array b",
    hint: "1 2 3 ; 2 3 4",
    presets: [{ label: "[1,2,3] and [2,3,4]", input: "1 2 3 ; 2 3 4" }, { label: "different sizes", input: "5 1 ; 1 2 3 4 5 6" }],
    parse(s) { const [x, y] = P.parts(s, 2, 'Array a, then ";" and array b'); return { a: P.nums(x, { minLen: 1, maxLen: 8, min: -99, max: 99 }), b: P.nums(y, { minLen: 1, maxLen: 8, min: -99, max: 99 }) }; },
    lines: {
      build: { ts: "const set = new Set(a); // O(a)", go: "set[x] = struct{}{}" },
      scan: { ts: "for (const x of b) if (set.has(x)) count++; // O(b)", go: "for _, x := range b { // O(b)" },
      ret: { ts: "return count; // total O(a + b)", go: "return count // total O(a + b)" },
    },
    trace({ a, b }) {
      const T = new G.Trace();
      const set = [];
      let count = 0, steps = 0;
      const st = (ra, rb, mk) => ({ labelW: 40, rows: [{ label: "a", cells: G.cells(a), marks: ra != null ? { [ra]: "focus" } : {} }, { label: "b", cells: G.cells(b), marks: Object.assign({}, rb != null ? { [rb]: "focus" } : {}, mk) }], panels: [{ title: "set", entries: set.map((x) => [x]), hi: ra != null ? [a[ra]] : rb != null ? [b[rb]] : [] }] });
      const got = {};
      a.forEach((x, i) => { steps++; if (!set.includes(x)) set.push(x); T.add({ at: "build", state: st(i, null, got), vars: { steps, count }, say: `Loop over a: add ${x} to the set.` }); });
      b.forEach((x, j) => {
        steps++;
        const hit = set.includes(x);
        if (hit) { count++; got[j] = "answer"; }
        T.add({ at: "scan", state: st(null, j, got), vars: { steps, count }, say: hit ? `${x} is in the set: count = ${count}.` : `${x} is not in the set.` });
      });
      T.add({ at: "ret", state: st(null, null, got), vars: { steps, "a + b": a.length + b.length, count }, say: `${steps} steps = ${a.length} + ${b.length}. One loop **after** the other adds: \`O(a + b)\`. Nesting them would multiply: \`O(a × b)\`.` });
      return T.done(count);
    },
  };

  /* ---------------- 4.2 halving ---------------- */
  const halvSt = (n, size, mk, extra) => Object.assign({ cells: Array.from({ length: n }, (_, i) => ({ id: i, v: "" })), cellW: n > 32 ? 9 : n > 16 ? 14 : 22, cellH: n > 32 ? 22 : 28, gap: n > 32 ? 2 : 3, indices: false, marks: mk || Object.fromEntries(Array.from({ length: n }, (_, i) => [i, i < size ? "focus" : "done"])) }, extra);
  const parseN = (s) => { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 1 || n > 64) throw new Error("Pick a whole number from 1 to 64."); return n; };
  A.countHalvings = {
    title: "Loops that halve",
    short: "Halving: about log₂ n passes",
    viz: "array",
    legend: ["focus:work still left", "done:thrown away"],
    varRoles: { steps: "answer" },
    inputLabel: "n (up to 64)",
    hint: "16",
    presets: [{ label: "n = 16", input: "16" }, { label: "n = 64", input: "64" }, { label: "n = 20", input: "20" }],
    parse: parseN,
    lines: {
      loop: { ts: "function countHalvings>>while (n > 1)", go: "func countHalvings>>for n > 1" },
      half: { ts: "n = Math.floor(n / 2);", go: "n /= 2" },
      ret: { ts: "function countHalvings>>return steps;", go: "func countHalvings>>return steps" },
    },
    trace(n0) {
      const T = new G.Trace();
      let n = n0, steps = 0;
      T.add({ at: "loop", state: halvSt(n0, n), vars: { n, steps }, say: `Start with ${n0} items of work.` });
      while (n > 1) {
        n = Math.floor(n / 2); steps++;
        T.add({ at: "half", state: halvSt(n0, n), vars: { n, steps }, say: `Halve: ${n} left after ${steps} step${steps > 1 ? "s" : ""}.` });
      }
      T.add({ at: "ret", state: halvSt(n0, n), vars: { steps, "log2(n)": +Math.log2(n0).toFixed(2) }, say: `${steps} halvings for ${n0} items. Doubling n adds just one more step: \`O(log n)\`.` });
      return T.done(steps);
    },
  };
  A.halvingWithWork = {
    title: "Loops that halve",
    short: "Halving with work: n + n/2 + … ≈ 2n",
    viz: "array",
    legend: ["focus:work done in this pass", "done:not touched this pass"],
    varRoles: { work: "answer" },
    inputLabel: "n (up to 64)",
    hint: "16",
    presets: [{ label: "n = 16", input: "16" }, { label: "n = 64", input: "64" }],
    parse: parseN,
    lines: {
      outer: { ts: "for (let size = n; size >= 1; size = Math.floor(size / 2))", go: "for size := n; size >= 1; size /= 2" },
      inner: { ts: "for (let i = 0; i < size; i++) work++;", go: "func halvingWithWork>>work++" },
      ret: { ts: "function halvingWithWork>>return work;", go: "func halvingWithWork>>return work" },
    },
    trace(n) {
      const T = new G.Trace();
      let work = 0, passes = 0;
      for (let size = n; size >= 1; size = Math.floor(size / 2)) {
        passes++;
        T.add({ at: "outer", state: halvSt(n, size), vars: { size, passes, work }, say: `Pass ${passes}: size = ${size}.` });
        work += size;
        T.add({ at: "inner", state: halvSt(n, size), vars: { size, passes, work }, say: `The inner loop does ${size} unit${size > 1 ? "s" : ""} of work. Total: ${work}.` });
      }
      T.add({ at: "ret", state: halvSt(n, 0, {}), vars: { work, passes, "2n": 2 * n }, say: `Only ${passes} passes, yet the work is ${work}, about 2n = ${2 * n}. The inner loop shrinks, so this is \`O(n)\`, not \`O(n log n)\`.` });
      return T.done(work);
    },
  };

  /* ---------------- 4.4 fib call trees ---------------- */
  function fibTrace(n, memoOn) {
    const T = new G.Trace();
    const nodes = [];
    const stack = [];
    const memo = new Map();
    let calls = 0, id = 0;
    const snap = () => nodes.map((x) => Object.assign({}, x));
    const st = () => ({ nodes: snap(), stack: stack.slice(), panels: undefined, note: null });
    const add = (f) => { const s = st(); if (memoOn) s.memo = [...memo.entries()]; f.state = s; T.add(f); };
    const vars = () => ({ calls, depth: stack.length });
    function call(k, parent) {
      calls++;
      const me = { id: id++, label: `fib(${k})`, parent, m: "focus" };
      nodes.push(me);
      stack.push(`fib(${k})`);
      if (k < 2) {
        add({ at: memoOn ? "mbase" : "base", vars: vars(), say: `fib(${k}) is a base case: return ${k}.` });
        me.m = null; me.sub = `= ${k}`; stack.pop();
        return k;
      }
      if (memoOn && memo.has(k)) {
        me.m = "anchor"; me.sub = `= ${memo.get(k)} (memo)`;
        add({ at: "hit", vars: vars(), say: `fib(${k}) is already in the memo: return ${memo.get(k)} without making any calls.` });
        stack.pop();
        return memo.get(k);
      }
      add({ at: memoOn ? "mcall" : "call", vars: vars(), say: `fib(${k}) calls fib(${k - 1}) and then fib(${k - 2}).` });
      me.m = "anchor";
      const r = call(k - 1, me.id) + call(k - 2, me.id);
      me.m = null; me.sub = `= ${r}`;
      if (memoOn) memo.set(k, r);
      add({ at: memoOn ? "mset" : "call", vars: vars(), say: `fib(${k}) = ${r}.${memoOn ? ` Save it in the memo.` : ""}` });
      stack.pop();
      return r;
    }
    const res = call(n, null);
    const fin = { state: st(), vars: { calls, result: res }, say: memoOn ? `Only ${calls} calls: each value is computed once, so \`O(n)\` time. The stack is at most ${n} deep: \`O(n)\` space.` : `${calls} calls for fib(${n}). The tree roughly doubles at every level: \`O(2ⁿ)\` time, but it is only ${n} levels deep: \`O(n)\` stack space.` };
    if (memoOn) fin.state.memo = [...memo.entries()];
    T.add(fin);
    T.frames.forEach((f) => { if (f.state.memo) f.state.panels = [{ title: "memo", entries: f.state.memo, empty: "(empty)" }]; });
    return T.done({ value: res, calls });
  }
  const parseFib = (s) => { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 0 || n > 7) throw new Error("Pick n from 0 to 7 so the tree fits."); return n; };
  A.fibNaive = {
    title: "Recursion: draw the call tree",
    short: "Naive fib: the tree doubles",
    viz: "tree",
    legend: ["focus:running now", "anchor:waiting for its children"],
    varRoles: { calls: "focus" },
    inputLabel: "n (0 to 7)", hint: "5",
    presets: [{ label: "fib(4)", input: "4" }, { label: "fib(5)", input: "5" }, { label: "fib(6)", input: "6" }],
    parse: parseFib,
    lines: {
      base: { ts: "function fibNaive>>if (n < 2) return n;", go: "func fibNaive>>return n" },
      call: { ts: "return fibNaive(n - 1) + fibNaive(n - 2);", go: "return fibNaive(n-1) + fibNaive(n-2)" },
    },
    trace: (n) => fibTrace(n, false),
  };
  A.fibMemo = {
    title: "Recursion: draw the call tree",
    short: "With a memo: each n once",
    viz: "tree",
    legend: ["focus:running now", "anchor:waiting, or answered from the memo"],
    varRoles: { calls: "focus" },
    inputLabel: "n (0 to 7)", hint: "5",
    presets: [{ label: "fib(5)", input: "5" }, { label: "fib(7)", input: "7" }],
    parse: parseFib,
    lines: {
      mbase: { ts: "function fibMemo>>if (n < 2) return n;", go: "func fibMemo>>return n" },
      hit: { ts: "if (saved !== undefined) return saved;", go: "return v" },
      mcall: { ts: "const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);", go: "memo[n] = fibMemo(n-1, memo) + fibMemo(n-2, memo)" },
      mset: { ts: "memo.set(n, result);", go: "return memo[n]" },
    },
    trace: (n) => fibTrace(n, true),
  };

  /* ---------------- 6. amortized doubling ---------------- */
  A.doubling = {
    title: "Amortized cost: a dynamic array that doubles",
    viz: "array", noCodeBlock: true,
    noCode: "This is what `push` and `append` do for you inside the runtime. Watch the total copies stay below 2 per push.",
    legend: ["focus:just written", "anchor:copied during a resize", "done:empty slot"],
    varRoles: { copies: "focus", pushes: "answer" },
    inputLabel: "How many pushes (1 to 17)", hint: "9",
    presets: [{ label: "9 pushes", input: "9" }, { label: "17 pushes", input: "17" }],
    parse(s) { const n = P.num(s, "pushes"); if (!Number.isInteger(n) || n < 1 || n > 17) throw new Error("Pick 1 to 17 pushes."); return n; },
    trace(N) {
      const T = new G.Trace();
      let cap = 1, len = 0, copies = 0;
      let data = [null];
      const st = (mk, old) => {
        const row = { label: `cap ${cap}`, cells: data.map((v, i) => ({ id: "n" + i, v: v == null ? "" : v })), marks: Object.assign({}, ...data.map((v, i) => (v == null ? { [i]: "done" } : {})), mk) };
        return { labelW: 60, cellW: 34, cellH: 34, gap: 4, rows: old ? [{ label: `old ${old.length}`, cells: old.map((v, i) => ({ id: "o" + i, v })), marks: Object.fromEntries(old.map((_, i) => [i, "ghost"])) }, row] : [row] };
      };
      for (let k = 1; k <= N; k++) {
        if (len === cap) {
          const old = data.slice();
          cap *= 2; copies += len;
          data = old.concat(new Array(cap - len).fill(null));
          T.add({ state: st(Object.fromEntries(old.map((_, i) => [i, "anchor"])), old), vars: { pushes: k - 1, copies, "copies per push": +(copies / Math.max(1, k - 1)).toFixed(2) }, say: `Full. Allocate ${cap} slots and copy all ${len} items: this one push costs \`O(n)\`.` });
        }
        data[len++] = k;
        T.add({ state: st({ [len - 1]: "focus" }), vars: { pushes: k, copies, "copies per push": +(copies / k).toFixed(2) }, say: `push(${k}): one write.` });
      }
      T.add({ state: st({}), vars: { pushes: N, copies, "copies per push": +(copies / N).toFixed(2) }, say: `${N} pushes cost ${copies} copies in total, less than 2 per push. Rare expensive moments, spread out: amortized \`O(1)\`.` });
      return T.done(copies);
    },
  };

  /* ---------------- Problem A ---------------- */
  const parseQ = (s) => P.nums(s, { minLen: 1, maxLen: 9, min: -99, max: 99 });
  A.queueShift = {
    title: "Problem A: the innocent shift",
    short: "TypeScript: shift() moves everything",
    viz: "array", codeLang: "ts",
    legend: ["focus:taken from the front", "anchor:moved one slot left"],
    varRoles: { moves: "focus", total: "answer" },
    inputLabel: "items", hint: "1 2 3 4",
    presets: [{ label: "[1,2,3,4]", input: "1 2 3 4" }, { label: "8 items", input: "1 2 3 4 5 6 7 8" }],
    parse: parseQ,
    lines: { loop: { ts: "while (items.length > 0)" }, shift: { ts: "const first = items.shift()!;" }, add: { ts: "total += first;" }, ret: { ts: "function processQueue>>return total;" } },
    trace(a0) {
      const T = new G.Trace();
      let items = a0.map((v, i) => ({ id: i, v }));
      let total = 0, moves = 0;
      const st = (mk) => ({ cells: items.slice(), marks: mk || {}, minW: a0.length * 58 + 20 });
      while (items.length) {
        T.add({ at: "loop", state: st({ 0: "focus" }), vars: { total, moves }, say: `${items.length} items left. \`shift()\` takes the front…` });
        const first = items.shift();
        moves += items.length;
        T.add({ at: "shift", state: st(Object.fromEntries(items.map((_, i) => [i, "anchor"]))), vars: { first: first.v, total, moves }, say: `…and then moves the other ${items.length} item${items.length === 1 ? "" : "s"} one slot left. Moves so far: ${moves}.` });
        total += first.v;
        T.add({ at: "add", state: st(), vars: { total, moves }, say: `total = ${total}.` });
      }
      const n = a0.length;
      T.add({ at: "ret", state: st(), vars: { total, moves, "n(n-1)/2": (n * (n - 1)) / 2 }, say: `${moves} hidden moves for ${n} items: n(n−1)/2, so \`O(n²)\` in TypeScript. Fix: walk with an index or a \`head\` pointer.` });
      return T.done(total);
    },
  };
  A.queueSlice = {
    title: "Problem A: the innocent shift",
    short: "Go: items[1:] only moves the start",
    viz: "array", codeLang: "go",
    legend: ["focus:taken from the front", "done:outside the slice now"],
    varRoles: { moves: "focus", total: "answer" },
    inputLabel: "items", hint: "1 2 3 4",
    presets: [{ label: "[1,2,3,4]", input: "1 2 3 4" }, { label: "8 items", input: "1 2 3 4 5 6 7 8" }],
    parse: parseQ,
    lines: { loop: { go: "for len(items) > 0" }, take: { go: "first := items[0]" }, slice: { go: "items = items[1:]" }, add: { go: "total += first" }, ret: { go: "func processQueue>>return total" } },
    trace(a0) {
      const T = new G.Trace();
      let start = 0, total = 0;
      const st = (mk) => ({ rows: [{ cells: G.cells(a0), marks: Object.assign(Object.fromEntries(a0.map((_, i) => [i, i < start ? "done" : null]).filter((e) => e[1])), mk), ptrs: start < a0.length ? [{ name: "items[0]", at: start, role: "p1" }] : [], zones: [{ key: "s", from: start, to: a0.length - 1, label: "the slice", cls: "soft" }] }] });
      while (start < a0.length) {
        T.add({ at: "take", state: st({ [start]: "focus" }), vars: { total, moves: 0 }, say: `\`first := items[0]\` reads ${a0[start]}.` });
        start++;
        T.add({ at: "slice", state: st(), vars: { total, moves: 0 }, say: "`items = items[1:]` just moves the start of the slice. Nothing is copied." });
        total += a0[start - 1];
        T.add({ at: "add", state: st(), vars: { total, moves: 0 }, say: `total = ${total}.` });
      }
      T.add({ at: "ret", state: st(), vars: { total, moves: 0 }, say: "Zero moves: `O(n)` in Go. Same-looking code, different cost in each language." });
      return T.done(total);
    },
  };

  /* ---------------- Problem B ---------------- */
  A.triangle = {
    title: "Problem B: triangle loops",
    viz: "grid",
    legend: ["focus:count++ right now", "answer:counted"],
    varRoles: { count: "answer" },
    inputLabel: "n (1 to 8)", hint: "5",
    presets: [{ label: "n = 5", input: "5" }, { label: "n = 8", input: "8" }],
    parse(s) { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 1 || n > 8) throw new Error("Pick n from 1 to 8."); return n; },
    lines: {
      outer: { ts: "function triangle>>for (let i = 0; i < n; i++)", go: "func triangle>>for i := 0; i < n; i++" },
      inner: { ts: "for (let j = 0; j < i; j++) count++;", go: "func triangle>>count++" },
      ret: { ts: "function triangle>>return count;", go: "func triangle>>return count" },
    },
    trace(n) {
      const T = new G.Trace();
      const cells = Array.from({ length: n }, () => Array.from({ length: n }, () => ({ v: "", m: null })));
      let count = 0;
      const st = () => ({ cells: G.copy(cells), rowLabels: cells.map((_, i) => `i=${i}`), colLabels: cells.map((_, j) => `j${j}`), cell: 32 });
      for (let i = 0; i < n; i++) {
        T.add({ at: "outer", state: st(), vars: { i, count }, say: `\`i\` = ${i}: the inner loop runs ${i} time${i === 1 ? "" : "s"}.` });
        for (let j = 0; j < i; j++) {
          count++;
          cells[i][j] = { v: count, m: "focus" };
          T.add({ at: "inner", state: st(), vars: { i, j, count }, say: `count = ${count}.` });
          cells[i][j].m = "answer";
        }
      }
      T.add({ at: "ret", state: st(), vars: { count, "n(n-1)/2": (n * (n - 1)) / 2 }, say: `The counted cells form a triangle: 0 + 1 + … + ${n - 1} = ${count}. Drop the ½: \`O(n²)\`.` });
      return T.done(count);
    },
  };

  /* ---------------- Problem C ---------------- */
  A.countPairsMap = {
    title: "Problem C: a hash map, then its keys",
    viz: "array",
    legend: ["focus:being counted", "anchor:key being turned into pairs"],
    varRoles: { pairs: "answer" },
    inputLabel: "nums", hint: "1 1 1 2 2",
    presets: [{ label: "[1,1,1,2,2]", input: "1 1 1 2 2" }, { label: "all different", input: "4 5 6" }, { label: "five 7s", input: "7 7 7 7 7" }],
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 10, min: -99, max: 99 }),
    lines: {
      count: { ts: "for (const x of nums) seen.set(x, (seen.get(x) ?? 0) + 1); // line 1", go: "seen[x]++" },
      pairs: { ts: "for (const count of seen.values()) pairs += (count * (count - 1)) / 2; // line 2", go: "pairs += count * (count - 1) / 2" },
      ret: { ts: "function countDigitsPairs>>return pairs;", go: "func countDigitsPairs>>return pairs" },
    },
    trace(nums) {
      const T = new G.Trace();
      const seen = new Map();
      let pairs = 0;
      const st = (i, hi) => ({ cells: G.cells(nums), marks: i != null ? { [i]: "focus" } : {}, panels: [{ title: "seen: value → count", entries: [...seen.entries()], hi: hi != null ? [hi] : [] }] });
      nums.forEach((x, i) => { seen.set(x, (seen.get(x) || 0) + 1); T.add({ at: "count", state: st(i, x), vars: { steps: i + 1 }, say: `Line 1: count ${x}, now ${seen.get(x)}.` }); });
      for (const [k, c] of seen) {
        pairs += (c * (c - 1)) / 2;
        T.add({ at: "pairs", state: st(null, k), vars: { key: k, count: c, pairs }, say: `Line 2: ${c} copies of ${k} make ${c}·${c - 1}/2 = ${(c * (c - 1)) / 2} pair${c * (c - 1) / 2 === 1 ? "" : "s"}.` });
      }
      T.add({ at: "ret", state: st(null), vars: { pairs, "line 1 steps": nums.length, "line 2 steps": seen.size }, say: `${nums.length} steps, then ${seen.size}: one after the other, so \`O(n)\` time and \`O(n)\` space for the map.` });
      return T.done(pairs);
    },
  };

  /* ---------------- Problem D ---------------- */
  A.countSubsets = {
    title: "Problem D: take it or skip it",
    viz: "tree",
    legend: ["focus:running now", "anchor:waiting for its children"],
    varRoles: { calls: "focus" },
    inputLabel: "items (up to 4)", hint: "1 2 3",
    presets: [{ label: "[1,2,3]", input: "1 2 3" }, { label: "[1,2]", input: "1 2" }, { label: "four items", input: "1 2 3 4" }],
    parse: (s) => P.nums(s, { allowEmpty: true, maxLen: 4, min: -9, max: 9 }),
    lines: {
      base: { ts: "if (index === items.length) return 1;", go: "if index == len(items)" },
      skip: { ts: "const without = countSubsets(items, index + 1);", go: "without := countSubsets(items, index+1)" },
      take: { ts: "const withIt = countSubsets(items, index + 1);", go: "withIt := countSubsets(items, index+1)" },
      ret: { ts: "return without + withIt;", go: "return without + withIt" },
    },
    trace(items) {
      const T = new G.Trace();
      const nodes = [], stack = [];
      let id = 0, calls = 0;
      const add = (at, say) => T.add({ at, state: { nodes: nodes.map((x) => Object.assign({}, x)), stack: stack.slice(), colW: 60 }, vars: { calls, depth: stack.length }, say });
      const lab = (set) => "{" + set.join(",") + "}";
      function go(index, set, parent) {
        calls++;
        const me = { id: id++, label: lab(set), parent, m: "focus" };
        nodes.push(me); stack.push(`index ${index}`);
        if (index === items.length) { add("base", `index = ${index} = length: one finished subset, ${lab(set)}. Return 1.`); me.m = null; me.sub = "1"; stack.pop(); return 1; }
        add("skip", `Skip ${items[index]}.`);
        me.m = "anchor";
        const w = go(index + 1, set, me.id);
        me.m = "focus"; add("take", `Now take ${items[index]}.`); me.m = "anchor";
        const t = go(index + 1, set.concat(items[index]), me.id);
        me.m = null; me.sub = String(w + t);
        add("ret", `${w} + ${t} = ${w + t}.`);
        stack.pop();
        return w + t;
      }
      const r = go(0, [], null);
      T.add({ state: { nodes: nodes.map((x) => Object.assign({}, x)), stack: [], colW: 60 }, vars: { calls, result: r }, say: `${calls} calls, ${r} leaves (2ⁿ): \`O(2ⁿ)\` time. The tree is only ${items.length} levels deep: \`O(n)\` stack space.` });
      return T.done(r);
    },
  };

  /* ---------------- Problem E ---------------- */
  A.atMostKZeros = {
    title: "Problem E: a nested loop that is not quadratic",
    viz: "array",
    legend: ["p1:left", "p2:right", "focus:inside the window", "answer:best window"],
    varRoles: { left: "p1", right: "p2", best: "answer", "pointer moves": "focus" },
    inputLabel: "bits (0 and 1) ; limit", hint: "1 0 1 1 0 1 ; 1",
    presets: [{ label: "[1,0,1,1,0,1], limit 1", input: "1 0 1 1 0 1 ; 1" }, { label: "many zeros, limit 2", input: "0 0 1 0 1 0 0 1 1 ; 2" }],
    parse(s) { const [a, k] = P.parts(s, 2, 'Bits, then ";" and the limit'); const lim = P.num(k, "The limit"); if (lim < 0) throw new Error("The limit must be 0 or more."); return { bits: P.nums(a, { only: [0, 1], minLen: 1, maxLen: 12 }), limit: lim }; },
    lines: {
      grow: { ts: "if (bits[right] === 0) zeros++;", go: "zeros++" },
      shrink: { ts: "if (bits[left] === 0) zeros--;", go: "zeros--" },
      left: { ts: "while (zeros > limit) {>>left++;", go: "for zeros > limit {>>left++" },
      best: { ts: "best = Math.max(best, right - left + 1);", go: "if right-left+1 > best" },
    },
    trace({ bits, limit }) {
      const T = new G.Trace();
      let left = 0, zeros = 0, best = 0, moves = 0, bestBox = null;
      const st = (right) => ({
        cells: G.cells(bits), marks: Object.assign(Object.fromEntries(bits.map((_, i) => [i, i >= left && i <= right ? "focus" : null]).filter((e) => e[1]))),
        ptrs: [{ name: "left", at: left, role: "p1" }, { name: "right", at: right, role: "p2" }],
        zones: [{ key: "w", from: left, to: right, label: `window, ${zeros} zero${zeros === 1 ? "" : "s"}`, cls: zeros > limit ? "0" : "soft" }].concat(bestBox ? [{ key: "b", from: bestBox[0], to: bestBox[1], label: `best ${best}`, cls: "done" }] : []),
      });
      for (let right = 0; right < bits.length; right++) {
        moves++;
        if (bits[right] === 0) zeros++;
        T.add({ at: "grow", state: st(right), vars: { left, right, zeros, best, "pointer moves": moves }, say: `\`right\` moves to ${right}${bits[right] === 0 ? `: a zero, so zeros = ${zeros}` : ""}.` });
        while (zeros > limit) {
          if (bits[left] === 0) zeros--;
          T.add({ at: "shrink", state: st(right), vars: { left, right, zeros, best, "pointer moves": moves }, say: `Too many zeros. Drop \`bits[left]\` = ${bits[left]}.` });
          left++; moves++;
          T.add({ at: "left", state: st(right), vars: { left, right, zeros, best, "pointer moves": moves }, say: `\`left\` moves to ${left}. It never moves back.` });
        }
        if (right - left + 1 > best) { best = right - left + 1; bestBox = [left, right]; }
        T.add({ at: "best", state: st(right), vars: { left, right, zeros, best, "pointer moves": moves }, say: `Window length ${right - left + 1}; best = ${best}.` });
      }
      T.add({ state: st(bits.length - 1), vars: { best, "pointer moves": moves, "2n": 2 * bits.length }, say: `${moves} pointer moves in total, never more than 2n = ${2 * bits.length}. Count how far each pointer travels, not how deep the loops are nested: \`O(n)\`.` });
      return T.done(best);
    },
  };

  /* ---------------- quizzes ---------------- */
  G.quizzes.bigo02 = {
    title: "Name that complexity",
    intro: "Say the time cost and the reason before you pick.",
    items: [
      { q: "A loop over `nums`, then a second, separate loop over `nums`.", options: ["`O(n)`", "`O(n²)`", "`O(2n)` and that is the final answer", "`O(log n)`"], answer: 0, why: "One after the other adds: 2n, and constants drop, so `O(n)`." },
      { q: "A loop over a grid of `rows` × `cols` cells.", options: ["`O(rows × cols)`", "`O(n²)`", "`O(rows + cols)`", "`O(n)`"], answer: 0, why: "Different inputs get different letters. Writing `O(n²)` hides what n means." },
      { q: "`while (n > 1) n = Math.floor(n / 3);`", options: ["`O(log n)`", "`O(n)`", "`O(n / 3)`", "`O(1)`"], answer: 0, why: "Dividing by any constant each step gives a logarithm; the base does not matter in Big O." },
      { q: "`for (const x of nums) if (otherArray.includes(x)) count++;`", options: ["`O(n × m)`: `includes` is a hidden loop", "`O(n)`", "`O(n + m)`", "`O(log n)`"], answer: 0, why: "`includes` scans the whole array each time. Put `otherArray` in a `Set` to get `O(n + m)`." },
      { q: "Sort the array, then one pass over it.", options: ["`O(n log n)`", "`O(n)`", "`O(n² log n)`", "`O(log n)`"], answer: 0, why: "`n log n + n`: keep the biggest term." },
      { q: "A recursive function that calls itself twice on `n − 1`.", options: ["`O(2ⁿ)` time, `O(n)` stack space", "`O(n)` time", "`O(n²)` time", "`O(log n)` time"], answer: 0, why: "The call tree doubles at each level; its depth is only n." },
      { q: "A `for` over `right` with a `while` inside that only moves `left` forward.", options: ["`O(n)`: each pointer moves at most n times", "`O(n²)`: the loops are nested", "`O(n log n)`", "`O(1)`"], answer: 0, why: "Amortized: count total pointer moves, at most 2n." },
    ],
  };
})();

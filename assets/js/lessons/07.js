/* Lesson 07 · Prefix sums — animators and quizzes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  const parseNums = (s, o) => P.nums(s, Object.assign({ minLen: 1, maxLen: 10, min: -99, max: 99 }, o));
  const pairs = (s, n) => String(s).split(",").map((x) => x.trim()).filter(Boolean).map((x) => {
    const [l, r] = x.split(/\s+/).map(Number);
    if (!Number.isInteger(l) || !Number.isInteger(r) || l < 0 || r < l || r >= n) throw new Error(`Each query is "l r" with 0 ≤ l ≤ r < ${n}.`);
    return [l, r];
  });
  const twoRows = (nums, prefix, mkN, mkP, extra) => Object.assign({ labelW: 70, rows: [
    { label: "nums", cells: G.cells(nums), marks: mkN || {} },
    { label: "prefix", cells: prefix.map((v, i) => ({ id: i, v: v == null ? "" : v })), marks: mkP || {} },
  ] }, extra);

  /* ---------------- template: build, then query ---------------- */
  A.prefixBasics = {
    title: "The odometer: build once, answer any range",
    viz: "array", legend: ["focus:being added", "p1:prefix[l]", "p2:prefix[r + 1]", "answer:the range"],
    varRoles: { "range sum": "answer" },
    inputLabel: "nums ; l r", hint: "2 4 1 3 5 ; 1 3",
    presets: [{ label: "sum of nums[1..3]", input: "2 4 1 3 5 ; 1 3" }, { label: "a range starting at 0", input: "2 4 1 3 5 ; 0 2" }],
    parse(s) { const [a, q] = P.parts(s, 2, 'Numbers, then ";" and "l r"'); const nums = parseNums(a); const [[l, r]] = pairs(q, nums.length); return { nums, l, r }; },
    lines: {
      build: { ts: "for (let i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];", go: "prefix[i+1] = prefix[i] + x" },
      query: { ts: "return prefix[r + 1] - prefix[l]; // inclusive on both ends", go: "return prefix[r+1] - prefix[l] // inclusive on both ends" },
    },
    trace({ nums, l, r }) {
      const T = new G.Trace();
      const prefix = [0].concat(nums.map(() => null));
      T.add({ at: "build", state: twoRows(nums, prefix, {}, { 0: "anchor" }), vars: { "prefix[0]": 0 }, say: "`prefix[0] = 0`: the odometer before the first mile. This leading zero removes a special case later." });
      for (let i = 0; i < nums.length; i++) {
        prefix[i + 1] = prefix[i] + nums[i];
        T.add({ at: "build", state: twoRows(nums, prefix, { [i]: "focus" }, { [i + 1]: "focus", [i]: "anchor" }), vars: { i, [`prefix[${i + 1}]`]: prefix[i + 1] }, say: `prefix[${i + 1}] = prefix[${i}] + nums[${i}] = ${prefix[i]} + ${nums[i]} = ${prefix[i + 1]}.` });
      }
      const mkN = {}; for (let i = l; i <= r; i++) mkN[i] = "answer";
      const s = prefix[r + 1] - prefix[l];
      T.add({ at: "query", state: twoRows(nums, prefix, mkN, { [l]: "p1", [r + 1]: "p2" }), vars: { l, r, "range sum": s }, say: `Sum of nums[${l}..${r}] = prefix[${r + 1}] − prefix[${l}] = ${prefix[r + 1]} − ${prefix[l]} = ${s}. One subtraction, \`O(1)\`.` });
      return T.done(s);
    },
  };

  /* ---------------- Problem 1 ---------------- */
  A.numArray = {
    title: "Range Sum Query: many queries, each O(1)",
    viz: "array", legend: ["p1:prefix[left]", "p2:prefix[right + 1]", "answer:the range"],
    varRoles: { "steps with prefix sums": "answer", "steps looping": "bug" },
    inputLabel: "nums ; queries \"l r, l r, …\"", hint: "-2 0 3 -5 2 -1 ; 0 2, 2 5, 0 5",
    presets: [{ label: "the lesson's three queries", input: "-2 0 3 -5 2 -1 ; 0 2, 2 5, 0 5" }],
    parse(s) { const [a, q] = P.parts(s, 2, 'Numbers, then ";" and queries like "0 2, 2 5"'); const nums = parseNums(a); const qs = pairs(q, nums.length); if (qs.length > 6) throw new Error("Up to 6 queries."); return { nums, qs }; },
    lines: { build: { ts: "for (let i = 0; i < nums.length; i++) this.prefix[i + 1] = this.prefix[i] + nums[i];", go: "func NewNumArray>>prefix[i+1] = prefix[i] + x" }, query: { ts: "return this.prefix[right + 1] - this.prefix[left];", go: "return a.prefix[right+1] - a.prefix[left]" } },
    trace({ nums, qs }) {
      const T = new G.Trace();
      const prefix = [0];
      nums.forEach((x, i) => prefix.push(prefix[i] + x));
      let fast = nums.length, slow = 0;
      T.add({ at: "build", state: twoRows(nums, prefix), vars: { "steps with prefix sums": fast, "steps looping": 0 }, say: `The constructor builds the prefix array once: ${nums.length} steps.` });
      const out = [];
      qs.forEach(([l, r]) => {
        const mk = {}; for (let i = l; i <= r; i++) mk[i] = "answer";
        fast += 1; slow += r - l + 1;
        out.push(prefix[r + 1] - prefix[l]);
        T.add({ at: "query", state: twoRows(nums, prefix, mk, { [l]: "p1", [r + 1]: "p2" }), vars: { query: `${l} ${r}`, answer: out[out.length - 1], "steps with prefix sums": fast, "steps looping": slow }, say: `sumRange(${l}, ${r}) = ${prefix[r + 1]} − ${prefix[l]} = ${out[out.length - 1]}: one step. Looping would take ${r - l + 1}.` });
      });
      return T.done(out);
    },
  };

  /* ---------------- Problem 2 ---------------- */
  A.productExceptSelf = {
    title: "Product of Array Except Self",
    viz: "array", legend: ["focus:position i", "anchor:already multiplied in"],
    varRoles: { left: "p1", right: "p2" },
    inputLabel: "nums", hint: "1 2 3 4",
    presets: [{ label: "[1,2,3,4] (the trace table)", input: "1 2 3 4" }, { label: "with a zero", input: "-1 1 0 -3 3" }],
    table: { id: "tbl-2", preset: 0, rows: ["L", "i3", "i2", "i1", "i0"] },
    parse: (s) => parseNums(s, { min: -9, max: 9, minLen: 2, maxLen: 8 }),
    lines: {
      lset: { ts: "answer[i] = left; // product of everything left of i", go: "answer[i] = left // product of everything left of i" },
      lmul: { ts: "left *= nums[i];", go: "left *= nums[i]" },
      rmul: { ts: "answer[i] *= right; // multiply in", go: "answer[i] *= right // multiply in" },
      rup: { ts: "right *= nums[i];", go: "right *= nums[i]" },
    },
    trace(nums) {
      const T = new G.Trace();
      const n = nums.length;
      const ans = new Array(n).fill(null);
      const st = (i, mk) => ({ labelW: 70, rows: [{ label: "nums", cells: G.cells(nums), marks: i != null ? { [i]: "focus" } : {} }, { label: "answer", cells: ans.map((v, k) => ({ id: k, v: v == null ? "" : Object.is(v, -0) ? 0 : v })), marks: Object.assign(i != null ? { [i]: "focus" } : {}, mk) }] });
      let left = 1;
      for (let i = 0; i < n; i++) {
        ans[i] = left;
        T.add({ at: "lset", key: i === n - 1 ? "L" : null, state: st(i), vars: { i, left }, say: `answer[${i}] = product of everything to its left = ${left}.` });
        left *= nums[i];
        T.add({ at: "lmul", key: i === n - 1 ? "L" : null, state: st(i), vars: { i, left }, say: `left *= ${nums[i]} → ${left}.` });
      }
      let right = 1;
      const done = {};
      for (let i = n - 1; i >= 0; i--) {
        ans[i] *= right;
        done[i] = "anchor";
        T.add({ at: "rmul", key: `i${i}`, state: st(i, done), vars: { i, right, [`answer[${i}]`]: ans[i] }, say: `Sweep from the right: answer[${i}] *= right (${right}) → ${ans[i]}.` });
        right *= nums[i];
        T.add({ at: "rup", key: `i${i}`, state: st(i, done), vars: { i, right }, say: `right *= ${nums[i]} → ${right}.` });
      }
      T.add({ state: st(null, done), vars: { answer: ans.map((v) => (Object.is(v, -0) ? 0 : v)) }, say: "Every position got (product on its left) × (product on its right), with no division and one variable instead of a second array." });
      return T.done(ans.map((v) => (Object.is(v, -0) ? 0 : v)));
    },
  };

  /* ---------------- Problem 3 ---------------- */
  function subarraySumTrace({ nums, k }, bug) {
    const T = new G.Trace();
    const seen = new Map(bug === "noSeed" ? [] : [[0, 1]]);
    let prefix = 0, count = 0;
    const st = (i, hi) => ({ cells: G.cells(nums), marks: i != null ? { [i]: "focus" } : {}, ptrs: i != null ? [{ name: "x", at: i, role: "focus" }] : [], panels: [{ title: "seen: prefix → count", entries: [...seen.entries()], hi: hi != null ? [hi] : [], empty: "(empty)" }] });
    T.add({ at: "init", key: "start", state: st(null, bug === "noSeed" ? null : 0), vars: { prefix, count }, say: bug === "noSeed" ? "The bug: the map starts empty, without the empty prefix `{0: 1}`." : "Seed the map with `{0: 1}`: the empty prefix before the array has been seen once." });
    nums.forEach((x, i) => {
      prefix += x;
      const key = `x${i}`;
      const want = prefix - k;
      if (bug === "storeFirst") { seen.set(prefix, (seen.get(prefix) || 0) + 1); }
      const found = seen.get(want) || 0;
      T.add({ at: "add", key, state: st(i, seen.has(want) ? want : null), flow: ["A"], vars: { x, prefix, "prefix − k": want, count }, say: `prefix += ${x} → ${prefix}. Look up prefix − k = ${want}.`, ask: bug ? null : { q: `Is ${want} in the map?`, options: ["Yes: add its count to the answer", "No: no subarray ending here sums to k"], answer: found ? 0 : 1, why: found ? `It was seen ${found} time${found === 1 ? "" : "s"}; each one marks a start whose subarray ends here with sum ${k}.` : `${want} has not been seen.` } });
      count += found;
      T.add({ at: "look", key, state: st(i, want), flow: ["A", "B"], vars: { x, prefix, found, count }, say: found ? `Found ${want} ${found} time${found === 1 ? "" : "s"}: ${found} subarray${found === 1 ? "" : "s"} ending here sum${found === 1 ? "s" : ""} to ${k}. count = ${count}.` : `${want} not seen: no subarray ending here sums to ${k}.` });
      if (bug !== "storeFirst") seen.set(prefix, (seen.get(prefix) || 0) + 1);
      T.add({ at: "store", key, state: st(i, prefix), flow: ["B", "C"], vars: { prefix, count }, say: bug === "storeFirst" ? `(The bug stored ${prefix} before looking it up.)` : `Now store prefix ${prefix}. Look up first, then store.` });
    });
    T.add({ at: "ret", state: st(null), vars: { count }, say: `Return ${count}. This works with negative numbers, where a sliding window would not.` });
    return T.done(count);
  }
  const parseSS = (s) => { const [a, k] = P.parts(s, 2, 'Numbers, then ";" and k'); return { nums: parseNums(a), k: P.num(k, "k") }; };
  A.subarraySum = {
    title: "Subarray Sum Equals K: prefix sums plus a map",
    viz: "array", legend: ["focus:current x", "answer:the matching earlier prefix"],
    varRoles: { count: "answer", prefix: "focus" },
    inputLabel: "nums ; k", hint: "1 2 3 ; 3",
    presets: [{ label: "[1,2,3], k = 3 (the trace table)", input: "1 2 3 ; 3" }, { label: "[1,1,1], k = 2", input: "1 1 1 ; 2" }, { label: "negatives: [3,4,-7,3,1,3,1,-4], k = 7", input: "3 4 -7 3 1 3 1 -4 ; 7" }],
    table: { id: "tbl-3", preset: 0, rows: ["start", "x0", "x1", "x2"] },
    parse: parseSS,
    lines: {
      init: { ts: "const seen = new Map<number, number>([[0, 1]]);", go: "seen := map[int]int{0: 1}" },
      add: { ts: "function subarraySum>>prefix += x;", go: "func subarraySum>>prefix += x" },
      look: { ts: "count += seen.get(prefix - k) ?? 0;", go: "count += seen[prefix-k]" },
      store: { ts: "seen.set(prefix, (seen.get(prefix) ?? 0) + 1);", go: "seen[prefix]++" },
      ret: { ts: "function subarraySum>>return count;", go: "func subarraySum>>return count" },
    },
    trace: (x) => subarraySumTrace(x, null),
    bugs: [
      { label: "Replay a bug: no {0: 1} seed", input: "1 2 3 ; 3", banner: "<b>Replaying a bug.</b> The map starts empty, so subarrays that begin at index 0 are missed.", trace: (x) => subarraySumTrace(x, "noSeed") },
      { label: "Replay a bug: store before looking up", input: "1 -1 1 ; 0", banner: "<b>Replaying a bug.</b> The current prefix is stored before the lookup, so with k = 0 each position pairs with itself.", trace: (x) => subarraySumTrace(x, "storeFirst") },
    ],
  };

  /* ---------------- Problem 4 ---------------- */
  A.contiguousArray = {
    title: "Contiguous Array: 0 becomes −1, look for equal running sums",
    viz: "array", legend: ["focus:current index", "anchor:where this running sum first appeared", "answer:best span"],
    varRoles: { sum: "focus", best: "answer" },
    inputLabel: "0s and 1s", hint: "0 0 1 0 0 0 1 1",
    presets: [{ label: "[0,1,0] (the trace table)", input: "0 1 0" }, { label: "[0,0,1,0,0,0,1,1] → 6", input: "0 0 1 0 0 0 1 1" }],
    table: { id: "tbl-4", preset: 0, rows: ["start", "i0", "i1", "i2"] },
    parse: (s) => P.nums(s, { only: [0, 1], minLen: 1, maxLen: 12 }),
    lines: {
      add: { ts: "sum += nums[i] === 1 ? 1 : -1;", go: "func findMaxLength>>if x == 1 {" },
      hit: { ts: "if (earlier !== undefined) best = Math.max(best, i - earlier);", go: "best = max(best, i-earlier)" },
      first: { ts: "else firstIndex.set(sum, i); // remember only the FIRST time", go: "firstIndex[sum] = i // remember only the FIRST time" },
    },
    trace(nums) {
      const T = new G.Trace();
      const first = new Map([[0, -1]]);
      let sum = 0, best = 0, bestBox = null;
      const st = (i, mk) => ({ labelW: 80, rows: [{ label: "nums", cells: G.cells(nums), marks: Object.assign(i != null ? { [i]: "focus" } : {}, mk), zones: bestBox ? [{ key: "b", from: bestBox[0], to: bestBox[1], label: `equal 0s and 1s, length ${best}`, cls: "done" }] : [] }, { label: "as ±1", cells: nums.map((v, k) => ({ id: k, v: v ? "+1" : "−1" })) }], panels: [{ title: "first index of each sum", entries: [...first.entries()] }] });
      T.add({ key: "start", state: st(null), vars: { sum }, say: "Running sum 0 is seen \"before\" the array, at index −1." });
      for (let i = 0; i < nums.length; i++) {
        sum += nums[i] === 1 ? 1 : -1;
        const e = first.get(sum);
        T.add({ at: "add", key: `i${i}`, state: st(i, e !== undefined && e >= 0 ? { [e]: "anchor" } : {}), vars: { i, sum, best }, say: `Add ${nums[i] === 1 ? "+1" : "−1"}: running sum ${sum}.`, ask: { q: `Running sum ${sum}. Has it appeared before?`, options: ["Yes: measure the span", "No: remember this first index"], answer: e !== undefined ? 0 : 1, why: e !== undefined ? `It first appeared at ${e}: everything after ${e} up to ${i} sums to 0.` : "It is new." } });
        if (e !== undefined) {
          if (i - e > best) { best = i - e; bestBox = [e + 1, i]; }
          T.add({ at: "hit", key: `i${i}`, state: st(i, e >= 0 ? { [e]: "anchor" } : {}), vars: { i, sum, span: i - e, best }, say: `Same sum as at index ${e}: positions ${e + 1}..${i} have equal 0s and 1s (length ${i - e}). best = ${best}. Do not overwrite the first index.` });
        } else {
          first.set(sum, i);
          T.add({ at: "first", key: `i${i}`, state: st(i), vars: { i, sum, best }, say: `First time sum ${sum} appears: remember index ${i}.` });
        }
      }
      T.add({ state: st(null), vars: { best }, say: `Return ${best}.` });
      return T.done(best);
    },
  };

  /* ---------------- Problem 5 · 2D ---------------- */
  G.viz.twoGrids = function (scene, st) {
    const C = 34, gap = 3;
    const draw = (tag, grid, x0, y0, title, marks) => {
      G.drawText(scene, `${tag}t`, x0, y0 - 12, title, "lbl panel-title");
      grid.forEach((row, r) => row.forEach((v, c) => G.drawCell(scene, `${tag}${r}:${c}`, x0 + c * (C + gap), y0 + r * (C + gap), C, C, v == null ? "" : v, marks[`${r},${c}`], v == null ? "ghost-cell" : null)));
      return x0 + (grid[0] ? grid[0].length : 0) * (C + gap);
    };
    const x1 = draw("m", st.matrix, 10, 26, "matrix", st.mm || {});
    const x2 = draw("p", st.P, x1 + 40, 26, "P (one extra row and column of zeros)", st.pm || {});
    let h = 26 + st.P.length * (C + gap) + 6;
    if (st.note) { G.drawText(scene, "note", 10, h + 10, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 24; }
    return { x: 0, y: 0, w: x2 + 10, h };
  };
  const DEFAULT_M = "3 0 1 4 2 / 5 6 3 2 1 / 1 2 0 1 5 / 4 1 0 1 7 / 1 0 3 0 5";
  A.numMatrix = {
    title: "Range Sum Query 2D: inclusion and exclusion",
    viz: "twoGrids", legend: ["focus:the new cell", "p1:added (block above and block to the left)", "bug:subtracted (counted twice)", "answer:the rectangle asked for"],
    inputLabel: "matrix rows separated by / ; query r1 c1 r2 c2", hint: DEFAULT_M + " ; 2 1 4 3",
    presets: [{ label: "the lesson's matrix, query (2,1)-(4,3)", input: DEFAULT_M + " ; 2 1 4 3" }, { label: "small 3×3", input: "1 2 3 / 4 5 6 / 7 8 9 ; 0 0 1 1" }],
    parse(s) {
      const [m, q] = P.parts(s, 2, 'Matrix rows separated by "/", then ";" and "r1 c1 r2 c2"');
      const rows = m.split("/").map((r) => P.nums(r, { minLen: 1, maxLen: 5, min: -9, max: 99 }));
      if (rows.length > 5 || rows.some((r) => r.length !== rows[0].length)) throw new Error("Up to 5 rows, all the same length.");
      const [r1, c1, r2, c2] = P.nums(q, { minLen: 4, maxLen: 4, min: 0 });
      if (r2 < r1 || c2 < c1 || r2 >= rows.length || c2 >= rows[0].length) throw new Error("The query must be inside the matrix, with r1 ≤ r2 and c1 ≤ c2.");
      return { M: rows, q: [r1, c1, r2, c2] };
    },
    lines: {
      build: { ts: "this.P[r + 1][c + 1] = this.P[r][c + 1] + this.P[r + 1][c] - this.P[r][c] + matrix[r][c];", go: "P[r+1][c+1] = P[r][c+1] + P[r+1][c] - P[r][c] + matrix[r][c]" },
      query: { ts: "return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1];", go: "return P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]" },
    },
    trace({ M, q }) {
      const T = new G.Trace();
      const R = M.length, Cc = M[0].length;
      const Pm = Array.from({ length: R + 1 }, (_, r) => Array.from({ length: Cc + 1 }, (_, c) => (r === 0 || c === 0 ? 0 : null)));
      const snap = () => Pm.map((row) => row.slice());
      for (let r = 0; r < R; r++) for (let c = 0; c < Cc; c++) {
        Pm[r + 1][c + 1] = Pm[r][c + 1] + Pm[r + 1][c] - Pm[r][c] + M[r][c];
        if (R * Cc <= 9 || (r === 0 && c < 2) || (r === 1 && c === 1) || (r === R - 1 && c === Cc - 1) || (r === 2 && c === 2)) {
          T.add({ at: "build", state: { matrix: M, P: snap(), mm: { [`${r},${c}`]: "focus" }, pm: { [`${r + 1},${c + 1}`]: "focus", [`${r},${c + 1}`]: "p1", [`${r + 1},${c}`]: "p1", [`${r},${c}`]: "bug" } }, vars: { r, c, [`P[${r + 1}][${c + 1}]`]: Pm[r + 1][c + 1] }, say: `P[${r + 1}][${c + 1}] = above ${Pm[r][c + 1]} + left ${Pm[r + 1][c]} − overlap ${Pm[r][c]} + cell ${M[r][c]} = ${Pm[r + 1][c + 1]}.` });
        }
      }
      T.add({ at: "build", state: { matrix: M, P: snap() }, vars: {}, say: "P is complete: `O(rows × cols)` once. (Some cells were filled without a pause; each uses the same rule.)" });
      const [r1, c1, r2, c2] = q;
      const mm = {}; for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) mm[`${r},${c}`] = "answer";
      const ans = Pm[r2 + 1][c2 + 1] - Pm[r1][c2 + 1] - Pm[r2 + 1][c1] + Pm[r1][c1];
      T.add({ at: "query", state: { matrix: M, P: snap(), mm, pm: { [`${r2 + 1},${c2 + 1}`]: "p1", [`${r1},${c2 + 1}`]: "bug", [`${r2 + 1},${c1}`]: "bug", [`${r1},${c1}`]: "p2" }, note: { text: `sum = ${ans}`, cls: "ok" } }, vars: { sum: ans }, say: `sum(${r1},${c1})-(${r2},${c2}) = ${Pm[r2 + 1][c2 + 1]} − ${Pm[r1][c2 + 1]} − ${Pm[r2 + 1][c1]} + ${Pm[r1][c1]} = ${ans}: the big block, minus the block above and the block to the left, plus the overlap that was subtracted twice.` });
      return T.done(ans);
    },
  };

  /* ---------------- Problem 6 ---------------- */
  A.flightBookings = {
    title: "Difference array: range updates in O(1)",
    viz: "array", legend: ["p1:+seats where the range starts", "bug:−seats just after it ends", "answer:final seats"],
    inputLabel: "n ; bookings \"first last seats, …\"", hint: "5 ; 1 2 10, 2 3 20, 2 5 25",
    presets: [{ label: "the lesson's bookings (the trace table)", input: "5 ; 1 2 10, 2 3 20, 2 5 25" }],
    table: { id: "tbl-5", preset: 0, rows: ["start", "b0", "b1", "b2", "sum"] },
    parse(s) {
      const [nn, b] = P.parts(s, 2, 'n, then ";" and bookings like "1 2 10, 2 3 20"');
      const n = P.num(nn, "n"); if (!Number.isInteger(n) || n < 1 || n > 10) throw new Error("n from 1 to 10.");
      const bk = b.split(",").map((x) => P.nums(x, { minLen: 3, maxLen: 3 }));
      bk.forEach(([f, l]) => { if (f < 1 || l > n || f > l) throw new Error(`Each booking needs 1 ≤ first ≤ last ≤ ${n}.`); });
      if (bk.length > 6) throw new Error("Up to 6 bookings.");
      return { n, bk };
    },
    lines: {
      up: { ts: "diff[first] += seats; // the amount rises here", go: "diff[first] += seats  // the amount rises here" },
      down: { ts: "diff[last + 1] -= seats; // and falls just after the range", go: "diff[last+1] -= seats // and falls just after the range" },
      sum: { ts: "running += diff[flight]; // prefix sum turns edges into values", go: "running += diff[flight] // prefix sum turns edges into values" },
    },
    trace({ n, bk }) {
      const T = new G.Trace();
      const diff = new Array(n + 2).fill(0);
      const res = [];
      const st = (mk, rm) => ({ labelW: 74, rows: [{ label: "diff", cells: diff.map((v, i) => ({ id: i, v: i === 0 ? "" : v })), marks: Object.assign({ 0: "ghost", [n + 1]: "ghost" }, mk) }, { label: "seats", cells: Array.from({ length: n + 2 }, (_, i) => ({ id: i, v: i >= 1 && i <= res.length ? res[i - 1] : "" })), marks: Object.assign({ 0: "ghost", [n + 1]: "ghost" }, rm) }] });
      T.add({ key: "start", state: st(), vars: {}, say: `diff has n + 2 = ${n + 2} slots (1-based, plus a spare), all 0. Slot 0 is unused.` });
      bk.forEach(([f, l, s], k) => {
        diff[f] += s;
        T.add({ at: "up", key: `b${k}`, state: st({ [f]: "p1" }), vars: { booking: `${f}–${l}, +${s}` }, say: `Booking ${f}–${l}: from flight ${f} on, the count rises by ${s}. diff[${f}] += ${s}.` });
        diff[l + 1] -= s;
        T.add({ at: "down", key: `b${k}`, state: st({ [f]: "p1", [l + 1]: "bug" }), vars: { booking: `${f}–${l}, +${s}` }, say: `It falls back right after flight ${l}: diff[${l + 1}] −= ${s}.${l + 1 === n + 1 ? " That is the spare slot past the end, so it is ignored later." : ""} Two steps, whatever the range length.` });
      });
      let running = 0;
      for (let f = 1; f <= n; f++) {
        running += diff[f];
        res.push(running);
        T.add({ at: "sum", key: "sum", state: st({ [f]: "focus" }, Object.fromEntries(res.map((_, i) => [i + 1, "answer"]))), vars: { flight: f, running }, say: `One prefix-sum pass: flight ${f} has ${running} seats.` });
      }
      return T.done(res);
    },
  };

  /* ---------------- exercises ---------------- */
  A.pivotIndex = {
    title: "Find Pivot Index", viz: "array",
    legend: ["focus:candidate pivot", "p1:left side", "p2:right side", "answer:the pivot"],
    inputLabel: "nums", hint: "1 7 3 6 5 6",
    presets: [{ label: "[1,7,3,6,5,6]", input: "1 7 3 6 5 6" }, { label: "[1,2,3]", input: "1 2 3" }, { label: "[2,1,-1]", input: "2 1 -1" }],
    parse: (s) => parseNums(s),
    lines: { check: { ts: "if (leftSum === total - leftSum - nums[i]) return i;", go: "if leftSum == total-leftSum-x {" }, add: { ts: "leftSum += nums[i];", go: "leftSum += x" }, none: { ts: "function pivotIndex>>return -1;", go: "func pivotIndex>>return -1" } },
    trace(nums) {
      const T = new G.Trace();
      const total = nums.reduce((a, b) => a + b, 0);
      let leftSum = 0;
      for (let i = 0; i < nums.length; i++) {
        const right = total - leftSum - nums[i];
        const mk = {}; for (let j = 0; j < nums.length; j++) mk[j] = j < i ? "p1" : j > i ? "p2" : leftSum === right ? "answer" : "focus";
        T.add({ at: "check", state: { cells: G.cells(nums), marks: mk }, vars: { i, leftSum, rightSum: right, total }, say: `At ${i}: left ${leftSum}, right = total − left − nums[i] = ${total} − ${leftSum} − ${nums[i]} = ${right}.${leftSum === right ? " Equal: this is the pivot." : ""}` });
        if (leftSum === right) return T.done(i);
        leftSum += nums[i];
        T.add({ at: "add", state: { cells: G.cells(nums), marks: Object.fromEntries(nums.map((_, j) => [j, j <= i ? "p1" : null]).filter((e) => e[1])) }, vars: { leftSum }, say: `Move on: leftSum = ${leftSum}.` });
      }
      T.add({ at: "none", state: { cells: G.cells(nums) }, vars: {}, say: "No pivot: return −1." });
      return T.done(-1);
    },
  };

  G.quizzes.prefix07 = {
    title: "Prefix sums, window, or difference array?",
    items: [
      { q: "Answer 100,000 \"sum of a[l..r]\" queries on an array that never changes.", options: ["Prefix sums", "Sliding window", "Difference array", "Sort, then binary search"], answer: 0, why: "Build once in `O(n)`, then each query is one subtraction." },
      { q: "Count subarrays with sum exactly k; numbers can be negative.", options: ["Prefix sums plus a hash map", "Sliding window", "Two pointers", "Difference array"], answer: 0, why: "Count earlier prefixes equal to prefix − k. Negatives break windows, not this." },
      { q: "Apply 50,000 updates \"add v to every a[l..r]\", then print the array.", options: ["Difference array", "Prefix sums of the original array", "A heap", "Sliding window"], answer: 0, why: "Two `O(1)` edge marks per update, then one prefix-sum pass." },
      { q: "Shortest subarray with sum ≥ S, positive numbers only.", options: ["Sliding window", "Prefix sums plus a hash map", "Difference array", "2D prefix sums"], answer: 0, why: "With positives the window's rule is one-directional; that is simpler and `O(1)` space." },
      { q: "Many \"sum of this rectangle\" queries on a fixed grid.", options: ["2D prefix sums", "Run a loop per query", "A difference array", "Binary search"], answer: 0, why: "Inclusion–exclusion gives each rectangle in `O(1)`." },
    ],
  };
})();

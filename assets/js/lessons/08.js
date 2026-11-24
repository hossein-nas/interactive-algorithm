/* Lesson 08 · Binary search — animators and quizzes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  /* a number line: the live range [lo, hi) stands out, the rest is thrown away.
     st = { min, max, lo, hi, mid?, label?, ticks?, note?, rows? } (hi exclusive) */
  G.viz.range = function (scene, st) {
    const x0 = 30, W = 620, y = 40;
    const X = (v) => x0 + ((v - st.min) / Math.max(1, st.max + 1 - st.min)) * W;
    const bg = scene.el("rbg", "rect", "back"); G.attr(bg, { class: "rgone", x: x0, y, width: W, height: 26, rx: 6 });
    const live = scene.el("rlive", "rect", "mid");
    live.setAttribute("class", "rlive");
    Object.assign(live.style, { x: X(st.lo) + "px", width: Math.max(2, X(st.hi) - X(st.lo)) + "px", y: y + "px", height: "26px" });
    G.drawText(scene, "rmin", x0, y + 42, st.min, "idx", "middle");
    G.drawText(scene, "rmax", x0 + W, y + 42, st.max, "idx", "middle");
    const mark = (key, v, label, cls, up) => {
      const g = scene.el(key, "g", "front");
      if (g.__fresh) { G.svgEl("line", { y1: -8, y2: 34 }, g); G.svgEl("text", { "text-anchor": "middle" }, g); }
      g.setAttribute("class", "rmark " + cls);
      G.attr(g.children[1], { y: up ? -14 : 50 });
      G.setText(g.children[1], label);
      g.style.transition = "transform .45s ease";
      G.place(g, (X(v) + X(v + 1)) / 2, y);
    };
    mark("rlo", st.lo, `lo ${st.lo}`, "p1", false);
    mark("rhi", Math.max(st.lo, st.hi - 1), st.hiLabel || `hi ${st.hi}`, "p2", true);
    mark("rmid", st.mid != null ? st.mid : st.lo, st.mid != null ? `${st.midName || "mid"} ${st.mid}` : "", "focus", true);
    scene.map.get("rmid").style.opacity = st.mid != null ? "1" : "0";
    let h = y + 70;
    if (st.note) { G.drawText(scene, "note", x0, h + 4, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 24; }
    return { x: 0, y: 0, w: x0 + W + 30, h };
  };

  /* ---------------- the guessing game ---------------- */
  A.guessing = {
    title: "The guessing game: halve what is left",
    viz: "range", noCodeBlock: true,
    noCode: "The same idea as the code below: every guess throws away half of what is left.",
    legend: ["p1:lo", "p2:hi", "focus:the guess"],
    varRoles: { guesses: "focus", left: "answer" },
    inputLabel: "secret ; largest number", hint: "37 ; 100",
    presets: [{ label: "37 in 1–100", input: "37 ; 100" }, { label: "1 in 1–100", input: "1 ; 100" }, { label: "a million", input: "777777 ; 1000000" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'The secret, then ";" and the largest number'); const t = P.num(a), n = P.num(b); if (!Number.isInteger(n) || n < 1 || n > 1e9 || t < 1 || t > n || !Number.isInteger(t)) throw new Error("Pick a whole secret between 1 and the largest number (up to a billion)."); return { t, n }; },
    trace({ t, n }) {
      const T = new G.Trace();
      let lo = 1, hi = n + 1, guesses = 0;
      T.add({ state: { min: 1, max: n, lo, hi }, vars: { left: n, guesses }, say: `The secret is somewhere in 1–${n.toLocaleString("en-US")}.` });
      while (lo < hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        guesses++;
        const say = mid === t ? "correct" : mid > t ? "too high" : "too low";
        T.add({ state: { min: 1, max: n, lo, hi, mid }, vars: { guess: mid, left: hi - lo, guesses }, say: `Guess ${mid.toLocaleString("en-US")}: "${say}".`, ask: mid === t ? null : { q: `"${say}". Which half survives?`, options: ["The numbers below the guess", "The numbers above the guess"], answer: mid > t ? 0 : 1, why: `Every number ${mid > t ? "above" : "below"} ${mid} is now impossible.` } });
        if (mid === t) { T.add({ state: { min: 1, max: n, lo: mid, hi: mid + 1, mid, note: { text: `found in ${guesses} guesses`, cls: "ok" } }, vars: { guesses, "log2(n)": +Math.log2(n).toFixed(1) }, say: `Found in ${guesses} guesses. For ${n.toLocaleString("en-US")} numbers you never need more than ${Math.ceil(Math.log2(n + 1))}: \`O(log n)\`.` }); break; }
        if (mid > t) hi = mid; else lo = mid + 1;
        T.add({ state: { min: 1, max: n, lo, hi }, vars: { left: hi - lo, guesses }, say: `${(hi - lo).toLocaleString("en-US")} possibilities left.` });
      }
      return T.done(guesses);
    },
  };

  /* ---------------- master template ---------------- */
  // cells with lo/mid/hi pointers (hi may sit one past the end) and the yes/no answers seen so far
  function bs(nums, lo, hi, mid, tested, o) {
    o = o || {};
    const marks = {};
    nums.forEach((_, i) => { if (i < lo || i >= hi) marks[i] = "done"; });
    Object.entries(tested).forEach(([i, ok]) => { marks[i] = ok ? "answer" : "bug"; });
    if (mid != null) marks[mid] = "focus";
    Object.assign(marks, o.marks || {});
    const ptrs = [{ name: "lo", at: lo, role: "p1" }, { name: o.hiName || "hi", at: Math.min(hi, nums.length), role: "p2" }];
    if (mid != null) ptrs.push({ name: o.midName || "mid", at: mid, role: "focus", side: "above" });
    return { cells: G.cells(nums), marks, ptrs, minW: (nums.length + 1) * 58 + 20, note: o.note, panels: o.panels };
  }
  const parseSortedT = (s, o) => { const [a, t] = P.parts(s, 2, 'Sorted numbers, then ";" and the target'); return { nums: P.nums(a, Object.assign({ sorted: true, minLen: 1, maxLen: 12, min: -99, max: 99 }, o)), target: P.num(t) }; };
  function lowerTrace(T, nums, t, at, keyOf) {
    let lo = 0, hi = nums.length;
    const tested = {};
    T.add({ at: at.init, key: keyOf && keyOf(lo, hi), state: bs(nums, lo, hi, null, tested), flow: ["A", "B"], vars: { lo, hi, target: t }, say: `Half-open range: \`lo\` = ${lo} is included, \`hi\` = ${hi} is not. The answer might be ${hi} ("past the end").` });
    while (lo < hi) {
      const mid = lo + Math.floor((hi - lo) / 2);
      const good = nums[mid] >= t;
      T.add({ at: at.test, key: keyOf && keyOf(lo, hi), state: bs(nums, lo, hi, mid, tested), flow: ["B", "C", "D"], vars: { lo, hi, mid, [`nums[mid]`]: nums[mid] }, say: `mid = ${lo} + (${hi} − ${lo}) / 2 = ${mid}. Is nums[${mid}] = ${nums[mid]} ≥ ${t}?`, ask: { q: `isGood(${mid}): is ${nums[mid]} ≥ ${t}?`, options: ["Yes: hi = mid (mid could be the answer)", "No: lo = mid + 1 (mid is too small)"], answer: good ? 0 : 1, why: good ? `${nums[mid]} ≥ ${t}, so the first true is at ${mid} or to its left.` : `${nums[mid]} < ${t}, so the first true is to the right of ${mid}.` } });
      tested[mid] = good;
      if (good) hi = mid; else lo = mid + 1;
      T.add({ at: good ? at.yes : at.no, key: keyOf && keyOf(lo, hi), state: bs(nums, lo, hi, null, tested), flow: good ? ["D", "E"] : ["D", "F"], vars: { lo, hi }, say: good ? `Yes: \`hi = ${hi}\`.` : `No: \`lo = ${lo}\`.` });
    }
    return lo;
  }
  A.lowerBound = {
    title: "Find the first true: lower bound",
    viz: "array", legend: ["p1:lo", "p2:hi (not included)", "focus:mid", "answer:tested yes", "bug:tested no", "done:outside the range"],
    varRoles: { lo: "p1", hi: "p2", mid: "focus" },
    inputLabel: "sorted numbers ; target", hint: "1 3 3 5 8 ; 4",
    presets: [{ label: "[1,3,3,5,8], first ≥ 4", input: "1 3 3 5 8 ; 4" }, { label: "first ≥ 3 (duplicates)", input: "1 3 3 5 8 ; 3" }, { label: "first ≥ 99 (none)", input: "1 3 3 5 8 ; 99" }],
    parse: (s) => parseSortedT(s),
    lines: {
      init: { ts: "function firstTrue>>while (lo < hi)", go: "func firstTrue>>for lo < hi" },
      test: { ts: "function firstTrue>>if (isGood(mid)) hi = mid;", go: "func firstTrue>>if isGood(mid) {" },
      yes: { ts: "function firstTrue>>if (isGood(mid)) hi = mid;", go: "hi = mid // mid could be the answer" },
      no: { ts: "else lo = mid + 1; // mid is definitely too small", go: "lo = mid + 1 // mid is definitely too small" },
      ret: { ts: "function firstTrue>>return lo;", go: "func firstTrue>>return lo" },
    },
    trace({ nums, target }) {
      const T = new G.Trace();
      const lo = lowerTrace(T, nums, target, { init: "init", test: "test", yes: "yes", no: "no" });
      T.add({ at: "ret", state: bs(nums, lo, lo, null, {}, { marks: lo < nums.length ? { [lo]: "answer" } : {} }), flow: ["B", "Z"], vars: { answer: lo }, say: lo < nums.length ? `\`lo == hi\` = ${lo}: the first index with a value ≥ ${target}. It is also where ${target} would be inserted.` : `\`lo\` = ${lo} = n: no value is ≥ ${target}; insert at the end.` });
      return T.done(lo);
    },
  };

  /* ---------------- Problem 1 ---------------- */
  A.classicSearch = {
    title: "Classic Binary Search",
    viz: "array", legend: ["p1:lo", "p2:hi", "focus:mid", "answer:≥ target", "bug:< target"],
    varRoles: { lo: "p1", hi: "p2", mid: "focus" },
    inputLabel: "sorted numbers ; target", hint: "-1 0 3 5 9 12 ; 9",
    presets: [{ label: "[-1,0,3,5,9,12], 9 (the trace table)", input: "-1 0 3 5 9 12 ; 9" }, { label: "target 2 (missing)", input: "-1 0 3 5 9 12 ; 2" }],
    table: { id: "tbl-1", preset: 0, rows: ["0 6", "4 6", "4 5", "4 4"] },
    parse: (s) => parseSortedT(s),
    lines: {
      init: { ts: "function binarySearchIndex>>let lo = 0, hi = nums.length;", go: "func binarySearchIndex>>lo, hi := 0, len(nums)" },
      test: { ts: "function binarySearchIndex>>if (nums[mid] >= target) hi = mid;", go: "func binarySearchIndex>>if nums[mid] >= target {" },
      yes: { ts: "function binarySearchIndex>>if (nums[mid] >= target) hi = mid;", go: "func binarySearchIndex>>hi = mid" },
      no: { ts: "function binarySearchIndex>>else lo = mid + 1;", go: "func binarySearchIndex>>lo = mid + 1" },
      ret: { ts: "return lo < nums.length && nums[lo] === target ? lo : -1;", go: "if lo < len(nums) && nums[lo] == target {" },
    },
    trace({ nums, target }) {
      const T = new G.Trace();
      const lo = lowerTrace(T, nums, target, { init: "init", test: "test", yes: "yes", no: "no" }, (l, h) => `${l} ${h}`);
      const hit = lo < nums.length && nums[lo] === target;
      T.add({ at: "ret", key: `${lo} ${lo}`, state: bs(nums, lo, lo, null, {}, { marks: lo < nums.length ? { [lo]: hit ? "answer" : "bug" } : {} }), vars: { lo, answer: hit ? lo : -1 }, say: hit ? `The final check: nums[${lo}] is ${target}. Return ${lo}.` : `The final check fails (${lo < nums.length ? `nums[${lo}] = ${nums[lo]}` : "lo is past the end"}): return −1. Forgetting this check is a classic bug.` });
      return T.done(hit ? lo : -1);
    },
  };

  /* ---------------- Problem 2 ---------------- */
  A.searchRange = {
    title: "First and Last Position: two lower bounds",
    viz: "array", legend: ["p1:lo", "p2:hi", "focus:mid", "answer:the range of the target"],
    varRoles: { lo: "p1", hi: "p2", mid: "focus" },
    inputLabel: "sorted numbers ; target", hint: "5 7 7 8 8 10 ; 8",
    presets: [{ label: "[5,7,7,8,8,10], 8", input: "5 7 7 8 8 10 ; 8" }, { label: "target 6 (missing)", input: "5 7 7 8 8 10 ; 6" }, { label: "all equal", input: "8 8 8 8 8 ; 8" }],
    parse: (s) => parseSortedT(s, { ints: true }),
    lines: {
      test: { ts: "if (nums[mid] >= t) hi = mid;", go: "if nums[mid] >= t {" },
      first: { ts: "const first = lower(target);", go: "first := lower(target)" },
      miss: { ts: "if (first === nums.length || nums[first] !== target) return [-1, -1];", go: "if first == len(nums) || nums[first] != target {" },
      last: { ts: "return [first, lower(target + 1) - 1];", go: "return [2]int{first, lower(target+1) - 1}" },
    },
    trace({ nums, target }) {
      const T = new G.Trace();
      T.add({ at: "first", state: bs(nums, 0, nums.length, null, {}), vars: {}, say: `Search 1: lowerBound(${target}), the first value ≥ ${target}.` });
      const first = lowerTrace(T, nums, target, { test: "test", yes: "test", no: "test" });
      if (first === nums.length || nums[first] !== target) { T.add({ at: "miss", state: bs(nums, first, first, null, {}), vars: { first }, say: `${target} is not in the array: return [−1, −1].` }); return T.done([-1, -1]); }
      T.add({ at: "first", state: bs(nums, first, first, null, {}, { marks: { [first]: "answer" } }), vars: { first }, say: `first = ${first}. Search 2: lowerBound(${target + 1}), the first value ≥ ${target + 1}.` });
      const after = lowerTrace(T, nums, target + 1, { test: "test", yes: "test", no: "test" });
      const mk = {}; for (let i = first; i < after; i++) mk[i] = "answer";
      T.add({ at: "last", state: bs(nums, after, after, null, {}, { marks: mk }), vars: { first, last: after - 1 }, say: `last = ${after} − 1 = ${after - 1}. Return [${first}, ${after - 1}]: two \`O(log n)\` searches, even when every item equals the target.` });
      return T.done([first, after - 1]);
    },
  };

  /* ---------------- Problem 3 ---------------- */
  A.rotated = {
    title: "Search in a Rotated Sorted Array",
    viz: "array", legend: ["p1:lo", "p2:hi", "focus:mid", "anchor:the sorted half"],
    varRoles: { lo: "p1", hi: "p2", mid: "focus" },
    inputLabel: "rotated sorted numbers (distinct) ; target", hint: "4 5 6 7 0 1 2 ; 0",
    presets: [{ label: "[4,5,6,7,0,1,2], 0 (the trace table)", input: "4 5 6 7 0 1 2 ; 0" }, { label: "target 3 (missing)", input: "4 5 6 7 0 1 2 ; 3" }, { label: "[6,7,1,2,3,4,5], 7", input: "6 7 1 2 3 4 5 ; 7" }],
    table: { id: "tbl-2", preset: 0, rows: ["0 6", "4 6", "4 4"] },
    parse(s) {
      const [a, t] = P.parts(s, 2, 'Numbers, then ";" and the target');
      const nums = P.nums(a, { minLen: 1, maxLen: 12, min: -99, max: 99 });
      if (new Set(nums).size !== nums.length) throw new Error("Values must be distinct.");
      const drops = nums.filter((x, i) => i && nums[i - 1] > x).length;
      if (drops > 1 || (drops === 1 && nums[nums.length - 1] > nums[0])) throw new Error("That is not a rotated sorted array.");
      return { nums, target: P.num(t) };
    },
    lines: {
      hit: { ts: "if (nums[mid] === target) return mid;", go: "if nums[mid] == target {" },
      leftSorted: { ts: "if (nums[lo] <= nums[mid]) {", go: "if nums[lo] <= nums[mid] {" },
      goLeftL: { ts: "if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;", go: "if nums[lo] <= target && target < nums[mid] {" },
      goRightR: { ts: "if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;", go: "if nums[mid] < target && target <= nums[hi] {" },
      none: { ts: "function searchRotated>>return -1;", go: "func searchRotated>>return -1" },
    },
    trace({ nums, target }) {
      const T = new G.Trace();
      let lo = 0, hi = nums.length - 1;
      const st = (mid, sorted) => {
        const marks = {};
        nums.forEach((_, i) => { if (i < lo || i > hi) marks[i] = "done"; else if (sorted && i >= sorted[0] && i <= sorted[1]) marks[i] = "anchor"; });
        if (mid != null) marks[mid] = "focus";
        return { cells: G.cells(nums), marks, ptrs: [{ name: "lo", at: lo, role: "p1" }, { name: "hi", at: Math.max(0, Math.min(hi, nums.length - 1)), role: "p2", hidden: hi < 0 }].concat(mid != null ? [{ name: "mid", at: mid, role: "focus", side: "above" }] : []), zones: sorted ? [{ key: "s", from: sorted[0], to: sorted[1], label: "sorted half", cls: "done" }] : [] };
      };
      while (lo <= hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        const key = `${lo} ${hi}`;
        if (nums[mid] === target) { T.add({ at: "hit", key, state: st(mid), vars: { lo, hi, mid }, say: `nums[${mid}] = ${target}: found it. Return ${mid}.` }); return T.done(mid); }
        const leftSorted = nums[lo] <= nums[mid];
        const sorted = leftSorted ? [lo, mid] : [mid, hi];
        const inside = leftSorted ? nums[lo] <= target && target < nums[mid] : nums[mid] < target && target <= nums[hi];
        const goLeft = leftSorted ? inside : !inside;
        T.add({ at: leftSorted ? "goLeftL" : "goRightR", key, state: st(mid, sorted), vars: { lo, hi, mid, "nums[mid]": nums[mid] }, say: `nums[lo] = ${nums[lo]} ${leftSorted ? "≤" : ">"} nums[mid] = ${nums[mid]}, so the ${leftSorted ? "left" : "right"} half [${sorted[0]}..${sorted[1]}] is sorted. Is ${target} inside its value range ${leftSorted ? `[${nums[lo]}, ${nums[mid]})` : `(${nums[mid]}, ${nums[hi]}]`}? ${inside ? "Yes" : "No"}.`, ask: { q: "Which way?", options: ["Go left: hi = mid − 1", "Go right: lo = mid + 1"], answer: goLeft ? 0 : 1, why: inside ? `The target lies inside the sorted half, so search there.` : `It is not inside the sorted half, so it can only be in the other half.` } });
        if (goLeft) hi = mid - 1; else lo = mid + 1;
      }
      T.add({ at: "none", key: `${lo} ${hi}`, state: st(null), vars: {}, say: "The range is empty: return −1." });
      return T.done(-1);
    },
  };

  /* ---------------- Problem 4 · Koko ---------------- */
  A.koko = {
    title: "Koko Eating Bananas: binary search on the speed",
    viz: "array", legend: ["p1:lo", "p2:hi", "focus:speed being tested", "answer:fast enough", "bug:too slow"],
    varRoles: { k: "focus", hours: "focus" },
    inputLabel: "piles ; h hours", hint: "3 6 7 11 ; 8",
    presets: [{ label: "[3,6,7,11], h = 8 (the trace table)", input: "3 6 7 11 ; 8" }, { label: "[30,11,23,4,20], h = 6", input: "30 11 23 4 20 ; 6" }],
    table: { id: "tbl-3", preset: 0, rows: ["1 12", "1 6", "4 6", "4 5", "4 4"] },
    parse(s) { const [a, h] = P.parts(s, 2, 'Piles, then ";" and h'); const piles = P.nums(a, { minLen: 1, maxLen: 6, min: 1, max: 40 }); const hh = P.num(h, "h"); if (hh < piles.length) throw new Error("h must be at least the number of piles."); return { piles, h: hh }; },
    lines: {
      test: { ts: "if (hoursNeeded(mid) <= h) hi = mid; // fast enough: try slower", go: "if hoursNeeded(mid) <= h {" },
      yes: { ts: "if (hoursNeeded(mid) <= h) hi = mid; // fast enough: try slower", go: "hi = mid // fast enough: try slower" },
      no: { ts: "else lo = mid + 1; // too slow: need faster", go: "lo = mid + 1 // too slow: need faster" },
      ret: { ts: "function minEatingSpeed>>return lo;", go: "func minEatingSpeed>>return lo" },
    },
    trace({ piles, h }) {
      const T = new G.Trace();
      const M = Math.max(...piles);
      const speeds = Array.from({ length: M }, (_, i) => i + 1);
      const hours = (k) => piles.reduce((t, p) => t + Math.ceil(p / k), 0);
      let lo = 1, hi = M + 1;
      const tested = {};
      const st = (mid) => {
        const marks = {};
        speeds.forEach((_, i) => { const k = i + 1; if (k < lo || k >= hi) marks[i] = "done"; });
        Object.entries(tested).forEach(([k, ok]) => { marks[k - 1] = ok ? "answer" : "bug"; });
        if (mid != null) marks[mid - 1] = "focus";
        const pileRow = { label: "piles", cells: piles.map((p, i) => ({ id: "p" + i, v: mid ? `${p}→${Math.ceil(p / mid)}h` : p })) };
        return { cellW: M > 20 ? 26 : 36, labelW: 64, rows: [{ label: "speeds", cells: speeds.map((k) => ({ id: k, v: k })), marks, ptrs: [{ name: "lo", at: lo - 1, role: "p1" }, { name: "hi", at: Math.min(hi - 1, M), role: "p2" }].concat(mid ? [{ name: "k", at: mid - 1, role: "focus", side: "above" }] : []) }, Object.assign(pileRow, { cells: pileRow.cells })] };
      };
      while (lo < hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        const hrs = hours(mid);
        const key = `${lo} ${hi}`;
        T.add({ at: "test", key, state: st(mid), vars: { lo, hi, k: mid, hours: hrs, h }, say: `Speed ${mid}: hours = ${piles.map((p) => Math.ceil(p / mid)).join(" + ")} = ${hrs}.`, ask: { q: `${hrs} hours with h = ${h}. Fast enough?`, options: ["Yes: try slower (hi = k)", "No: need faster (lo = k + 1)"], answer: hrs <= h ? 0 : 1, why: hrs <= h ? `${hrs} ≤ ${h}. Every faster speed also works, so the answer is ${mid} or slower.` : `${hrs} > ${h}. Every slower speed also fails.` } });
        tested[mid] = hrs <= h;
        if (hrs <= h) hi = mid; else lo = mid + 1;
        T.add({ at: tested[mid] ? "yes" : "no", key, state: st(null), vars: { lo, hi }, say: tested[mid] ? `hi = ${hi}.` : `lo = ${lo}.` });
      }
      T.add({ at: "ret", key: `${lo} ${lo}`, state: st(null), vars: { answer: lo }, say: `The slowest speed that still finishes in ${h} hours: ${lo}. \`O(n log M)\`: about log ${M} tests, each \`O(n)\`.` });
      return T.done(lo);
    },
  };

  /* ---------------- Problem 5 · ship ---------------- */
  A.ship = {
    title: "Capacity to Ship Packages: search on the answer",
    viz: "range", legend: ["p1:lo", "p2:hi", "focus:capacity being tested"],
    varRoles: { capacity: "focus", "days needed": "focus" },
    inputLabel: "weights ; days", hint: "1 2 3 4 5 6 7 8 9 10 ; 5",
    presets: [{ label: "[1..10], 5 days (the trace table)", input: "1 2 3 4 5 6 7 8 9 10 ; 5" }, { label: "[3,2,2,4,1,4], 3 days", input: "3 2 2 4 1 4 ; 3" }],
    table: { id: "tbl-4", preset: 0, rows: ["10 56", "10 33", "10 21", "10 15", "13 15", "15 15"] },
    parse(s) { const [a, d] = P.parts(s, 2, 'Weights, then ";" and days'); const w = P.nums(a, { minLen: 1, maxLen: 10, min: 1, max: 99 }); const dd = P.num(d, "days"); if (!Number.isInteger(dd) || dd < 1) throw new Error("days must be a whole number ≥ 1."); return { w, days: dd }; },
    lines: {
      test: { ts: "if (daysNeeded(mid) <= days) hi = mid;", go: "if daysNeeded(mid) <= days {" },
      no: { ts: "function shipWithinDays>>else lo = mid + 1;", go: "func shipWithinDays>>lo = mid + 1" },
      ret: { ts: "function shipWithinDays>>return lo;", go: "func shipWithinDays>>return lo" },
    },
    trace({ w, days }) {
      const T = new G.Trace();
      const total = w.reduce((a, b) => a + b, 0);
      const plan = (c) => { const out = []; let d = 0, load = 0; w.forEach((x) => { if (load + x > c) { d++; load = 0; } load += x; out.push(d); }); return out; };
      let lo = Math.max(...w), hi = total + 1;
      const st = (mid) => {
        const s = { min: Math.max(...w), max: total, lo, hi, mid, midName: "c" };
        return s;
      };
      while (lo < hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        const p = plan(mid), need = p[p.length - 1] + 1;
        const key = `${lo} ${hi}`;
        T.add({ at: "test", key, state: Object.assign(st(mid), { note: { text: `c = ${mid}: ` + [...Array(need).keys()].map((d) => "[" + w.filter((_, i) => p[i] === d).join(" ") + "]").join(" "), cls: need <= days ? "ok" : "bad" } }), flow: ["A", "B", "C", "D"], vars: { lo, hi, capacity: mid, "days needed": need }, say: `Capacity ${mid}: load greedily in order, start a new day when the next package would overflow. ${need} day${need === 1 ? "" : "s"}.`, ask: { q: `${need} days needed, ${days} allowed. Does capacity ${mid} work?`, options: ["Yes: try smaller (hi = c)", "No: need bigger (lo = c + 1)"], answer: need <= days ? 0 : 1, why: need <= days ? "A bigger ship never needs more days, so the answer is this or smaller." : "A smaller ship would need even more days." } });
        if (need <= days) hi = mid; else lo = mid + 1;
        T.add({ at: need <= days ? "test" : "no", key, state: st(null), flow: ["D", "H"], vars: { lo, hi }, say: need <= days ? `hi = ${hi}.` : `lo = ${lo}.` });
      }
      T.add({ at: "ret", key: `${lo} ${lo}`, state: Object.assign(st(null), { lo, hi: lo + 1 }), vars: { answer: lo }, say: `The least capacity that ships everything within ${days} days: ${lo}. The range started at the heaviest package (${Math.max(...w)}) and ended at the total (${total}).` });
      return T.done(lo);
    },
  };

  /* ---------------- Problem 6 · median ---------------- */
  A.median = {
    title: "Median of Two Sorted Arrays: choose the cut",
    viz: "array", legend: ["p1:left half", "p2:right half", "focus:the crossing pairs being checked"],
    inputLabel: "a ; b (both sorted)", hint: "1 3 ; 2",
    presets: [{ label: "[1,3] and [2] (the trace table)", input: "1 3 ; 2" }, { label: "[1,2] and [3,4]", input: "1 2 ; 3 4" }, { label: "[1,3,8,9,15] and [7,11,18,19,21,25]", input: "1 3 8 9 15 ; 7 11 18 19 21 25" }],
    table: { id: "tbl-5", preset: 0, rows: ["i0", "i1"] },
    parse(s) { const [x, y] = P.parts(s, 2, 'Array a, then ";" and array b'); const a = P.nums(x, { sorted: true, allowEmpty: true, maxLen: 7, min: -99, max: 99 }), b = P.nums(y, { sorted: true, allowEmpty: true, maxLen: 7, min: -99, max: 99 }); if (!a.length && !b.length) throw new Error("Give at least one number."); return { a, b }; },
    lines: {
      swap: { ts: "if (a.length > b.length) return findMedianSortedArrays(b, a);", go: "return findMedianSortedArrays(b, a) // search the smaller one" },
      cut: { ts: "const j = half - i; // items taken from b", go: "j := half - i       // items taken from b" },
      ok: { ts: "if (aLeft <= bRight && bLeft <= aRight) {", go: "if aLeft <= bRight && bLeft <= aRight {" },
      tooMany: { ts: "if (aLeft > bRight) hi = i - 1; // took too many from a", go: "hi = i - 1 // took too many from a" },
      tooFew: { ts: "else lo = i + 1; // took too few from a", go: "lo = i + 1 // took too few from a" },
    },
    trace({ a: a0, b: b0 }) {
      const T = new G.Trace();
      let a = a0, b = b0;
      if (a.length > b.length) { [a, b] = [b, a]; T.add({ at: "swap", state: { labelW: 30, rows: [{ label: "a", cells: G.cells(a) }, { label: "b", cells: G.cells(b) }] }, vars: {}, say: "Swap so that `a` is the smaller array: we binary-search over its cut." }); }
      const m = a.length, n = b.length, half = Math.floor((m + n + 1) / 2);
      let lo = 0, hi = m;
      const fmt = (v) => (v === -Infinity ? "−∞" : v === Infinity ? "+∞" : v);
      const st = (i, j, chk) => ({ labelW: 30, rows: [
        { label: "a", cells: G.cells(a), marks: Object.assign(Object.fromEntries(a.map((_, k) => [k, k < i ? "p1" : "p2"])), chk ? Object.fromEntries([[i - 1, "focus"], [i, "focus"]].filter((e) => e[0] >= 0 && e[0] < m)) : {}), boundary: i, boundaryLabel: `i = ${i}` },
        { label: "b", cells: G.cells(b), marks: Object.assign(Object.fromEntries(b.map((_, k) => [k, k < j ? "p1" : "p2"])), chk ? Object.fromEntries([[j - 1, "focus"], [j, "focus"]].filter((e) => e[0] >= 0 && e[0] < n)) : {}), boundary: j, boundaryLabel: `j = ${j}` },
      ], minW: 40 + Math.max(m, n, 1) * 58 + 40 });
      while (lo <= hi) {
        const i = lo + Math.floor((hi - lo) / 2), j = half - i;
        const aL = i === 0 ? -Infinity : a[i - 1], aR = i === m ? Infinity : a[i], bL = j === 0 ? -Infinity : b[j - 1], bR = j === n ? Infinity : b[j];
        const key = `i${i}`;
        T.add({ at: "cut", key, state: st(i, j, false), vars: { lo, hi, i, j, half }, say: `Take i = ${i} item${i === 1 ? "" : "s"} from a; then j = ${half} − ${i} = ${j} come from b, so the left half has ${half} items.` });
        const ok = aL <= bR && bL <= aR;
        T.add({ at: ok ? "ok" : aL > bR ? "tooMany" : "tooFew", key, state: st(i, j, true), vars: { aLeft: fmt(aL), aRight: fmt(aR), bLeft: fmt(bL), bRight: fmt(bR) }, say: `Check the crossing pairs: aLeft ${fmt(aL)} ≤ bRight ${fmt(bR)}? ${aL <= bR ? "yes" : "no"}. bLeft ${fmt(bL)} ≤ aRight ${fmt(aR)}? ${bL <= aR ? "yes" : "no"}.`, ask: { q: "Is this cut correct?", options: ["Yes: compute the median", "No: too many from a, move the cut left", "No: too few from a, move the cut right"], answer: ok ? 0 : aL > bR ? 1 : 2, why: ok ? "Everything on the left is ≤ everything on the right." : aL > bR ? `${fmt(aL)} > ${fmt(bR)}: a's left side has an item that belongs on the right.` : `${fmt(bL)} > ${fmt(aR)}: b's left side is too big, so take more from a.` } });
        if (ok) {
          const leftMax = Math.max(aL, bL);
          const med = (m + n) % 2 === 1 ? leftMax : (leftMax + Math.min(aR, bR)) / 2;
          T.add({ at: "ok", key, state: st(i, j, false), vars: { median: med }, say: (m + n) % 2 === 1 ? `Odd total (${m + n}): the median is the largest item on the left, max(${fmt(aL)}, ${fmt(bL)}) = ${med}.` : `Even total (${m + n}): the median is (max of the left + min of the right) / 2 = (${leftMax} + ${Math.min(aR, bR)}) / 2 = ${med}.` });
          return T.done(med);
        }
        if (aL > bR) hi = i - 1; else lo = i + 1;
      }
      return T.done(null);
    },
  };

  /* ---------------- exercises ---------------- */
  A.peak = {
    title: "Find a Peak: the yes/no test is \"going down here?\"",
    viz: "bars", legend: ["p1:lo", "p2:hi", "focus:mid", "answer:the peak"],
    inputLabel: "nums (neighbors differ)", hint: "1 2 1 3 5 6 4",
    presets: [{ label: "[1,2,1,3,5,6,4]", input: "1 2 1 3 5 6 4" }, { label: "a mountain", input: "0 1 2 5 3 1" }],
    parse(s) { const a = P.nums(s, { minLen: 1, maxLen: 12, min: 0, max: 12 }); if (a.some((x, i) => i && a[i - 1] === x)) throw new Error("Neighbors must differ."); return a; },
    lines: { test: { ts: "if (nums[mid] > nums[mid + 1]) hi = mid;", go: "if nums[mid] > nums[mid+1] {" }, no: { ts: "else lo = mid + 1; // going up", go: "lo = mid + 1 // going up" }, ret: { ts: "function findPeakElement>>return lo;", go: "func findPeakElement>>return lo" } },
    trace(nums) {
      const T = new G.Trace();
      let lo = 0, hi = nums.length - 1;
      const st = (mid, done) => ({ h: nums, marks: Object.assign(Object.fromEntries(nums.map((_, i) => [i, i < lo || i > hi ? "done" : null]).filter((e) => e[1])), mid != null ? { [mid]: "focus" } : {}, done != null ? { [done]: "answer" } : {}), ptrs: [{ name: "lo", at: lo, role: "p1" }, { name: "hi", at: hi, role: "p2" }].concat(mid != null ? [{ name: "mid", at: mid, role: "focus" }] : []) });
      while (lo < hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        const down = nums[mid] > nums[mid + 1];
        T.add({ at: "test", state: st(mid), vars: { lo, hi, mid }, say: `Is nums[${mid}] = ${nums[mid]} > nums[${mid + 1}] = ${nums[mid + 1]}?`, ask: { q: down ? "Going down here. Where is a peak?" : "Going up here. Where is a peak?", options: ["At mid or to its left", "To the right of mid"], answer: down ? 0 : 1, why: down ? "Walking left from a downhill step must reach a peak (the array edge counts as −∞)." : "Walking right from an uphill step must reach a peak." } });
        if (down) hi = mid; else lo = mid + 1;
        T.add({ at: down ? "test" : "no", state: st(null), vars: { lo, hi }, say: down ? `hi = ${hi}.` : `lo = ${lo}.` });
      }
      T.add({ at: "ret", state: st(null, lo), vars: { peak: lo }, say: `Index ${lo} is a peak. The test \"going down?\" flips once from no to yes, so it is a first-true search even though the array is not sorted.` });
      return T.done(lo);
    },
  };

  G.quizzes.bsearch08 = {
    title: "What is the yes/no question?",
    intro: "Every binary search finds where a test flips from no to yes.",
    items: [
      { q: "Smallest x with x² ≥ n.", options: ["isGood(x) = x * x >= n", "isGood(x) = x * x == n", "isGood(x) = x >= n", "Not binary search"], answer: 0, why: "As x grows, the test goes no…no, yes…yes." },
      { q: "Minimum days to make m bouquets (bloom days given).", options: ["isGood(d) = we can make m bouquets by day d", "isGood(d) = flower d blooms", "Sort the bloom days and pick the m-th", "Not binary search"], answer: 0, why: "Waiting longer never makes it harder, so the test is monotonic: search on the answer." },
      { q: "The first bad version among versions 1..n.", options: ["isGood(v) = isBadVersion(v)", "isGood(v) = v is good", "Check every version", "Two pointers"], answer: 0, why: "Once a version is bad, all later ones are: exactly first true." },
      { q: "The minimum of a rotated sorted array.", options: ["isGood(i) = nums[i] <= nums[last]", "isGood(i) = nums[i] < nums[0] only", "isGood(i) = nums[i] is even", "Not binary search"], answer: 0, why: "Items of the right piece are ≤ the last item; items of the left piece are larger." },
      { q: "The longest increasing subsequence's length.", options: ["Not a plain binary search on the answer (it is DP, with a binary-search speed-up)", "isGood(L) = some increasing run has length L", "Binary search on the array directly", "Two pointers"], answer: 0, why: "Lesson 25 covers it: the clever O(n log n) version uses binary search inside, not around the answer." },
    ],
  };
})();

/* Lesson 09 · Sorting and divide & conquer — animators and quizzes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;
  const parseArr = (s) => P.nums(s, { minLen: 1, maxLen: 8, min: -99, max: 99 });
  // a small repeatable "random" generator, seeded from the input, so the animation is the same each time
  const rng = (seed) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

  /* ---------------- selection and insertion ---------------- */
  A.selection = {
    title: "The two simple sorts", short: "Selection sort",
    viz: "array", legend: ["anchor:sorted part", "focus:scanning", "p1:smallest so far"],
    inputLabel: "numbers", hint: "5 3 6 2 10",
    presets: [{ label: "[5,3,6,2,10]", input: "5 3 6 2 10" }, { label: "reverse order", input: "6 5 4 3 2 1" }],
    parse: parseArr,
    lines: { outer: { ts: "function selectionSort>>for (let i = 0; i < a.length - 1; i++)", go: "func selectionSort>>for i := 0; i < len(a)-1; i++" }, scan: { ts: "for (let j = i + 1; j < a.length; j++) if (a[j] < a[smallest]) smallest = j;", go: "if a[j] < a[smallest] {" }, swap: { ts: "[a[i], a[smallest]] = [a[smallest], a[i]];", go: "a[i], a[smallest] = a[smallest], a[i]" } },
    trace(items) {
      const T = new G.Trace();
      const a = items.slice(), ids = a.map((_, i) => i);
      let looks = 0;
      const st = (i, j, sm) => { const mk = {}; for (let k = 0; k < i; k++) mk[k] = "anchor"; if (j != null) mk[j] = "focus"; if (sm != null) mk[sm] = "p1"; return { cells: a.map((v, k) => ({ id: ids[k], v })), marks: mk, zones: i ? [{ key: "s", from: 0, to: i - 1, label: "sorted", cls: "done" }] : [] }; };
      for (let i = 0; i < a.length - 1; i++) {
        let sm = i;
        T.add({ at: "outer", state: st(i, null, sm), vars: { i, looks }, say: `Find the smallest of positions ${i}..${a.length - 1}.` });
        for (let j = i + 1; j < a.length; j++) { looks++; if (a[j] < a[sm]) sm = j; T.add({ at: "scan", state: st(i, j, sm), vars: { i, j, smallest: a[sm], looks }, say: `Look at ${a[j]}. Smallest so far: ${a[sm]}.` }); }
        [a[i], a[sm]] = [a[sm], a[i]]; [ids[i], ids[sm]] = [ids[sm], ids[i]];
        T.add({ at: "swap", state: st(i + 1), vars: { i, looks }, say: `Swap ${a[i]} into position ${i}.` });
      }
      T.add({ state: st(a.length), vars: { looks }, say: `${looks} looks for ${a.length} items: about n²/2, so \`O(n²)\` whatever the input.` });
      return T.done(a);
    },
  };
  A.insertion = {
    title: "The two simple sorts", short: "Insertion sort",
    viz: "array", legend: ["anchor:sorted part", "focus:the item being inserted", "p2:shifted right"],
    inputLabel: "numbers", hint: "5 3 6 2 10",
    presets: [{ label: "[5,3,6,2,10]", input: "5 3 6 2 10" }, { label: "nearly sorted", input: "1 2 4 3 5 6" }],
    parse: parseArr,
    lines: { take: { ts: "const x = a[i];", go: "x := a[i]" }, shift: { ts: "a[j + 1] = a[j]; // shift bigger items right", go: "a[j+1] = a[j] // shift bigger items right" }, place: { ts: "function insertionSort>>a[j + 1] = x;", go: "func insertionSort>>a[j+1] = x" } },
    trace(items) {
      const T = new G.Trace();
      const a = items.slice();
      let moves = 0;
      const st = (sortedTo, mk, held) => { const m = {}; for (let k = 0; k < sortedTo; k++) m[k] = "anchor"; return { rows: [{ cells: a.map((v, k) => ({ id: k, v: v == null ? "" : v })), marks: Object.assign(m, mk) }], note: held != null ? { text: `holding x = ${held}` } : null }; };
      for (let i = 1; i < a.length; i++) {
        const x = a[i];
        T.add({ at: "take", state: st(i, { [i]: "focus" }, x), vars: { i, x, moves }, say: `Take x = ${x}. Everything before it is sorted.` });
        let j = i - 1;
        while (j >= 0 && a[j] > x) { a[j + 1] = a[j]; moves++; T.add({ at: "shift", state: st(i, { [j + 1]: "p2" }, x), vars: { j, moves }, say: `${a[j]} > ${x}: shift it right.` }); j--; }
        a[j + 1] = x;
        T.add({ at: "place", state: st(i + 1, { [j + 1]: "focus" }), vars: { moves }, say: `Place ${x} at ${j + 1}.` });
      }
      T.add({ state: st(a.length), vars: { moves }, say: `${moves} shifts. On nearly sorted input insertion sort is close to \`O(n)\`.` });
      return T.done(a);
    },
  };

  /* ---------------- gcd: the farm field ---------------- */
  G.viz.farm = function (scene, st) {
    const W = 560, H = Math.max(40, Math.min(320, (W * st.b) / st.a));
    const k = W / st.a;
    const bg = scene.el("fbg", "rect", "back"); G.attr(bg, { x: 20, y: 30, width: W, height: H, class: "farm" });
    const n = st.b ? Math.floor(st.a / st.b) : 0;
    for (let i = 0; i < 40; i++) {
      const r = scene.el(`sq${i}`, "rect", "mid");
      if (i < n) { r.setAttribute("class", "farmsq"); Object.assign(r.style, { x: 20 + i * st.b * k + "px", y: "30px", width: st.b * k + "px", height: H + "px", opacity: "1" }); }
      else r.style.opacity = "0";
    }
    G.drawText(scene, "ft", 20, 14, st.b ? `${st.a} × ${st.b}: cut ${n} square${n === 1 ? "" : "s"} of ${st.b} × ${st.b}, leaving ${st.a % st.b} × ${st.b}` : `${st.a} × ${st.a}: one perfect square`, "lbl panel-title");
    return { x: 0, y: 0, w: W + 40, h: H + 40 };
  };
  A.gcd = {
    title: "Euclid: the farm field",
    viz: "farm", legend: ["anchor:square plots cut off", "focus:the leftover strip"],
    inputLabel: "a ; b", hint: "1680 ; 640",
    presets: [{ label: "1680 × 640 (the trace table)", input: "1680 ; 640" }, { label: "35 × 14", input: "35 ; 14" }],
    table: { id: "tbl-3", preset: 0, rows: ["1680 640", "640 400", "400 240", "240 160", "160 80", "80 0"] },
    parse(s) { const [a, b] = P.parts(s, 2, 'Write a, then ";" and b').map((x) => P.num(x)); if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < 0 || b > a || a > 1e6) throw new Error("Whole numbers with a ≥ b ≥ 0."); return { a, b }; },
    lines: { base: { ts: "if (b === 0) return a; // base case", go: "func gcd>>return a // base case" }, rec: { ts: "return gcd(b, a % b);", go: "return gcd(b, a%b)" } },
    trace({ a, b }) {
      const T = new G.Trace();
      while (true) {
        if (b === 0) { T.add({ at: "base", key: `${a} 0`, state: { a, b: a }, vars: { a, b }, say: `b = 0: the base case. The biggest square is ${a} × ${a}, so gcd = ${a}.` }); return T.done(a); }
        T.add({ at: "rec", key: `${a} ${b}`, state: { a, b }, vars: { a, b, "a mod b": a % b }, say: `The biggest square that fits the field also fits the leftover strip: gcd(${a}, ${b}) = gcd(${b}, ${a % b}).` });
        [a, b] = [b, a % b];
      }
    },
  };

  /* ---------------- merge sort (and inversion counting) ---------------- */
  function mergeTrace(items, counting) {
    const T = new G.Trace();
    const n = items.length;
    const depthMax = Math.max(0, Math.ceil(Math.log2(n)));
    const levels = Array.from({ length: depthMax + 2 }, () => new Array(n).fill(null));
    let count = 0;
    const st = (mk, note) => ({ cellW: 40, cellH: 36, labelW: 70, rows: levels.slice(0, depthMax + 1).map((row, d) => ({ label: `level ${d}`, cells: row.map((v, i) => ({ id: i, v: v == null ? "" : v })), marks: Object.assign(Object.fromEntries(row.map((v, i) => [i, v == null ? "ghost" : null]).filter((e) => e[1])), (mk && mk[d]) || {}) })), note });
    function go(lo, hi, d) {
      for (let i = lo; i <= hi; i++) levels[d][i] = items[i];
      if (hi - lo < 1) { T.add({ at: counting ? "base" : "base", state: st({ [d]: { [lo]: "anchor" } }), vars: counting ? { count } : {}, say: `[${items[lo]}] has one item: already sorted (base case).` }); return [items[lo]]; }
      const mid = counting ? lo + ((hi - lo) >> 1) : lo + ((hi - lo + 1) >> 1) - 1;
      T.add({ at: "split", state: st({ [d]: Object.fromEntries(Array.from({ length: hi - lo + 1 }, (_, k) => [lo + k, k + lo <= mid ? "p1" : "p2"])) }), vars: counting ? { count } : {}, say: `Split [${items.slice(lo, hi + 1).join(", ")}] into [${items.slice(lo, mid + 1).join(", ")}] and [${items.slice(mid + 1, hi + 1).join(", ")}].` });
      const L = go(lo, mid, d + 1), R = go(mid + 1, hi, d + 1);
      for (let i = lo; i <= hi; i++) levels[d][i] = null;
      const out = [];
      let i = 0, j = 0;
      while (i < L.length && j < R.length) {
        const fromLeft = L[i] <= R[j];
        T.add({ at: "cmp", state: st({ [d + 1]: { [lo + i]: "focus", [mid + 1 + j]: "focus" } }), vars: counting ? { count } : { output: out.slice() }, say: `Compare the fronts: ${L[i]} (left) and ${R[j]} (right).`,
          ask: { q: `Left front ${L[i]}, right front ${R[j]}. Which goes next?`, options: ["The left front", "The right front"], answer: fromLeft ? 0 : 1, why: "Take the smaller front; on a tie take the left one." } });
        const add = fromLeft ? 0 : L.length - i;
        out.push(fromLeft ? L[i++] : R[j++]);
        count += counting ? add : 0;
        levels[d][lo + out.length - 1] = out[out.length - 1];
        T.add({ at: fromLeft ? "take" : "takeR", state: st({ [d]: { [lo + out.length - 1]: "focus" }, [d + 1]: Object.fromEntries([[lo + i - (fromLeft ? 1 : 0), fromLeft ? "focus" : null], [mid + 1 + j - (fromLeft ? 0 : 1), fromLeft ? null : "focus"]].filter((e) => e[1])) }), vars: counting ? { count, added: add } : { output: out.slice() },
          say: fromLeft ? `${out[out.length - 1]} (left) ≤ ${R[j]} (right): take from the left. Ties go left, so equal items keep their order.` : counting ? `${out[out.length - 1]} (right) < ${L[i]} (left): take from the right. The ${add} item${add === 1 ? "" : "s"} still waiting in the left half ${add === 1 ? "is" : "are"} bigger and came earlier: +${add} inversion${add === 1 ? "" : "s"}, count = ${count}.` : `${out[out.length - 1]} (right) < ${L[i]} (left): take from the right.` });
      }
      while (i < L.length) out.push(L[i++]);
      while (j < R.length) out.push(R[j++]);
      out.forEach((v, k) => (levels[d][lo + k] = v));
      for (let k = lo; k <= hi; k++) levels[d + 1][k] = null;
      T.add({ at: "rest", state: st({ [d]: Object.fromEntries(out.map((_, k) => [lo + k, "answer"])) }), vars: counting ? { count } : { output: out.slice() }, say: `One side is empty: copy the rest. Merged: [${out.join(", ")}].` });
      return out;
    }
    const res = n ? go(0, n - 1, 0) : [];
    T.add({ state: st(null, counting ? { text: `${count} inversions`, cls: "ok" } : null), vars: counting ? { count } : {}, say: counting ? `Total: ${count} inversions, in \`O(n log n)\` instead of checking every pair.` : `Sorted: [${res.join(", ")}]. log n levels, n work per level: \`O(n log n)\` always.` });
    return T.done(counting ? count : res);
  }
  A.mergeSort = {
    title: "Merge Sort: split, sort the halves, merge",
    viz: "array", legend: ["p1:left half", "p2:right half", "focus:just taken", "answer:merged"],
    inputLabel: "numbers (up to 8)", hint: "5 2 4 1",
    presets: [{ label: "[5,2,4,1]", input: "5 2 4 1" }, { label: "8 numbers", input: "38 27 43 3 9 82 10 3" }],
    parse: parseArr,
    lines: {
      base: { ts: "if (a.length <= 1) return a; // base case", go: "return a // base case" },
      cmp: { ts: "while (i < left.length && j < right.length)", go: "for i < len(left) && j < len(right)" },
      split: { ts: "const mid = a.length >> 1;", go: "mid := len(a) / 2" },
      take: { ts: "if (left[i] <= right[j]) out.push(left[i++]);", go: "out = append(out, left[i])" },
      takeR: { ts: "else out.push(right[j++]);", go: "out = append(out, right[j])" },
      rest: { ts: "while (i < left.length) out.push(left[i++]);", go: "out = append(out, left[i:]...)" },
    },
    trace: (a) => mergeTrace(a, false),
  };
  A.inversions = {
    title: "Count Inversions while merging",
    viz: "array", legend: ["p1:left half", "p2:right half", "focus:just taken", "answer:merged"],
    varRoles: { count: "answer" },
    inputLabel: "numbers (up to 8)", hint: "2 4 1 3 5",
    presets: [{ label: "[2,4,1,3,5] → 3", input: "2 4 1 3 5" }, { label: "reverse: [5,4,3,2,1]", input: "5 4 3 2 1" }],
    parse: parseArr,
    lines: {
      base: { ts: "if (lo >= hi) return 0;", go: "func sortAndCount>>return 0" },
      cmp: { ts: "while (i <= mid && j <= hi)", go: "for i <= mid && j <= hi" },
      split: { ts: "const mid = lo + ((hi - lo) >> 1);", go: "func sortAndCount>>mid := lo + (hi-lo)/2" },
      take: { ts: "if (a[i] <= a[j]) temp[k++] = a[i++];", go: "temp[k] = a[i]" },
      takeR: { ts: "count += mid - i + 1; // every remaining left item is bigger than a[j]", go: "count += mid - i + 1 // every remaining left item is bigger than a[j]" },
      rest: { ts: "for (let t = lo; t <= hi; t++) a[t] = temp[t];", go: "copy(a[lo:hi+1], temp[lo:hi+1])" },
    },
    trace: (a) => mergeTrace(a, true),
  };

  /* ---------------- quicksort, quickselect ---------------- */
  function partitionFrames(T, a, ids, lo, hi, pick, extra, at) {
    const st = (mk, store, i) => Object.assign({ cells: a.map((v, k) => ({ id: ids[k], v })), marks: Object.assign(Object.fromEntries(a.map((_, k) => [k, k < lo || k > hi ? "done" : null]).filter((e) => e[1])), mk), ptrs: [{ name: "store", at: store != null ? store : lo, role: "p1", hidden: store == null }, { name: "i", at: i != null ? i : lo, role: "p2", hidden: i == null }], zones: [{ key: "r", from: lo, to: hi, label: `range ${lo}..${hi}`, cls: "u" }] }, extra());
    const r = pick(lo, hi);
    T.add({ at: at.pick, state: st({ [r]: "focus" }), vars: { lo, hi, pivotIndex: r }, say: `Pivot: index ${r} (value ${a[r]}). Move it to the end.` });
    [a[r], a[hi]] = [a[hi], a[r]]; [ids[r], ids[hi]] = [ids[hi], ids[r]];
    const pivot = a[hi];
    let store = lo;
    for (let i = lo; i < hi; i++) {
      const lt = a[i] < pivot;
      T.add({ at: at.cmp, state: st({ [hi]: "anchor", [i]: "focus" }, store, i), vars: { pivot, i, store }, say: `${a[i]} < ${pivot}? ${lt ? "Yes" : "No"}.`, ask: { q: `${a[i]} vs pivot ${pivot}: what happens?`, options: ["Swap it to store, store++", "Leave it"], answer: lt ? 0 : 1, why: lt ? "Smaller items gather before store." : "Bigger or equal items stay to the right of store." } });
      if (lt) { [a[i], a[store]] = [a[store], a[i]]; [ids[i], ids[store]] = [ids[store], ids[i]]; store++; T.add({ at: at.swap, state: st({ [hi]: "anchor", [store - 1]: "p1" }, store, i), vars: { pivot, store }, say: `Swapped. Everything before store (${store}) is smaller than ${pivot}.` }); }
    }
    [a[store], a[hi]] = [a[hi], a[store]]; [ids[store], ids[hi]] = [ids[hi], ids[store]];
    T.add({ at: at.place, state: st({ [store]: "answer" }, store), vars: { pivot, p: store }, say: `Swap the pivot into position ${store}: smaller items on its left, the rest on its right. It is in its final place.` });
    return store;
  }
  function quickTrace(items, fixed) {
    const T = new G.Trace();
    const a = items.slice(), ids = a.map((_, i) => i);
    const R = rng(items.reduce((s, x) => s * 31 + x + 7, 17) >>> 0);
    const pick = fixed ? (lo, hi) => hi : (lo, hi) => lo + Math.floor(R() * (hi - lo + 1));
    const final = new Set();
    let depth = 0, maxDepth = 0;
    const extra = () => ({ marks: undefined });
    function sort(lo, hi) {
      depth++; maxDepth = Math.max(maxDepth, depth);
      if (lo >= hi) { if (lo === hi) final.add(lo); depth--; return; }
      const p = partitionFrames(T, a, ids, lo, hi, pick, () => ({}), { pick: "pick", cmp: "cmp", swap: "swap", place: "place" });
      final.add(p);
      T.frames[T.frames.length - 1].vars.depth = depth;
      sort(lo, p - 1); sort(p + 1, hi);
      depth--;
    }
    sort(0, a.length - 1);
    T.add({ at: fixed ? null : "recurse", state: { cells: a.map((v, k) => ({ id: ids[k], v })), marks: Object.fromEntries(a.map((_, k) => [k, "answer"])), note: fixed ? { text: `recursion depth ${maxDepth} for ${a.length} items`, cls: maxDepth >= a.length - 1 ? "bad" : "ok" } : null }, vars: { "max depth": maxDepth }, say: fixed ? `With the last item as the pivot on sorted input, every partition peels off one item: depth ${maxDepth}, \`O(n²)\` comparisons. A random pivot avoids this.` : `Sorted. Maximum recursion depth ${maxDepth}: about log n on average with a random pivot.` });
    return T.done(a);
  }
  A.quickSort = {
    title: "Quicksort: partition around a pivot",
    viz: "array", legend: ["focus:being compared", "anchor:the pivot", "p1:store boundary", "answer:in its final place"],
    varRoles: { pivot: "anchor", store: "p1", i: "p2" },
    inputLabel: "numbers (up to 8)", hint: "3 7 2 5",
    presets: [{ label: "[3,7,2,5]", input: "3 7 2 5" }, { label: "8 numbers", input: "9 4 7 1 8 2 6 3" }],
    parse: parseArr,
    lines: {
      pick: { ts: "const r = lo + Math.floor(Math.random() * (hi - lo + 1)); // random pivot", go: "r := lo + rand.Intn(hi-lo+1) // random pivot" },
      cmp: { ts: "if (a[i] < pivot) {", go: "if a[i] < pivot {" },
      swap: { ts: "[a[i], a[store]] = [a[store], a[i]];", go: "a[i], a[store] = a[store], a[i]" },
      place: { ts: "[a[store], a[hi]] = [a[hi], a[store]];", go: "a[store], a[hi] = a[hi], a[store]" },
      recurse: { ts: "sortRange(a, lo, p - 1);", go: "sortRange(a, lo, p-1)" },
    },
    trace: (a) => quickTrace(a, false),
    bugs: [{ label: "Replay the weakness: fixed pivot, sorted input", input: "1 2 3 4 5 6 7 8", banner: "<b>Replaying a weakness.</b> This version always takes the last item as the pivot. On sorted input that is the worst choice.", trace: (a) => quickTrace(a, true) }],
  };
  A.quickSelect = {
    title: "Quickselect: partition, then keep one side",
    viz: "array", legend: ["focus:being compared", "anchor:the pivot", "p1:store boundary", "answer:pivot's final place", "done:thrown away"],
    inputLabel: "numbers ; k", hint: "3 2 1 5 6 4 ; 2",
    presets: [{ label: "[3,2,1,5,6,4], k = 2", input: "3 2 1 5 6 4 ; 2" }, { label: "k = 1 (the maximum)", input: "7 1 9 3 5 ; 1" }],
    parse(s) { const [a, k] = P.parts(s, 2, 'Numbers, then ";" and k'); const nums = parseArr(a), kk = P.num(k, "k"); if (!Number.isInteger(kk) || kk < 1 || kk > nums.length) throw new Error(`k from 1 to ${nums.length}.`); return { nums, k: kk }; },
    lines: {
      part: { ts: "const p = partition(a, lo, hi);", go: "p := partition(a, lo, hi)" },
      found: { ts: "if (p === target) return a[p];", go: "func findKthLargest>>return a[p]" },
      right: { ts: "if (p < target) lo = p + 1;", go: "func findKthLargest>>lo = p + 1" },
      left: { ts: "function findKthLargest>>else hi = p - 1;", go: "func findKthLargest>>hi = p - 1" },
    },
    trace({ nums, k }) {
      const T = new G.Trace();
      const a = nums.slice(), ids = a.map((_, i) => i);
      const R = rng(nums.reduce((s, x) => s * 31 + x + 7, 17) >>> 0);
      const target = a.length - k;
      let lo = 0, hi = a.length - 1, work = 0;
      T.add({ state: { cells: G.cells(a) }, vars: { target }, say: `The ${k}-th largest sits at sorted index n − k = ${target}.` });
      while (lo <= hi) {
        work += hi - lo + 1;
        const p = partitionFrames(T, a, ids, lo, hi, (l, h) => l + Math.floor(R() * (h - l + 1)), () => ({}), { pick: "part", cmp: "part", swap: "part", place: "part" });
        const st = { cells: a.map((v, j) => ({ id: ids[j], v })), marks: { [p]: p === target ? "answer" : "anchor" }, zones: [{ key: "t", from: target, to: target, label: "target index", cls: "done" }] };
        if (p === target) { T.add({ at: "found", state: st, vars: { p, target, work }, say: `The pivot landed on the target index: the answer is ${a[p]}. Total work ${work}, about 2n on average: \`O(n)\`.` }); return T.done(a[p]); }
        if (p < target) lo = p + 1; else hi = p - 1;
        T.add({ at: p < target ? "right" : "left", state: Object.assign(st, { marks: Object.assign(Object.fromEntries(a.map((_, j) => [j, j < lo || j > hi ? "done" : null]).filter((e) => e[1])), { [p]: "anchor" }) }), vars: { p, target, lo, hi, work }, say: `The pivot is at ${p}, ${p < target ? "left of" : "right of"} the target ${target}: keep only ${p < target ? "the right" : "the left"} side. Unlike quicksort, never both.` });
      }
      return T.done(null);
    },
  };

  /* ---------------- largest number ---------------- */
  A.largestNumber = {
    title: "Largest Number: compare a + b with b + a",
    viz: "array", legend: ["focus:the pair being compared", "anchor:placed"],
    inputLabel: "non-negative numbers", hint: "3 30 34 5 9",
    presets: [{ label: "[3,30,34,5,9]", input: "3 30 34 5 9" }, { label: "[10,2]", input: "10 2" }, { label: "[0,0]", input: "0 0" }],
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 7, min: 0, max: 999 }),
    lines: { sort: { ts: "words.sort((a, b) => (b + a).localeCompare(a + b));", go: "return words[i]+words[j] > words[j]+words[i]" }, ret: { ts: 'return words[0] === "0" ? "0" : words.join("");', go: 'return strings.Join(words, "")' } },
    trace(nums) {
      const T = new G.Trace();
      const w = nums.map(String), ids = w.map((_, i) => i);
      const st = (mk) => ({ cellW: 52, cells: w.map((v, i) => ({ id: ids[i], v })), marks: mk || {} });
      T.add({ at: "sort", state: st(), vars: {}, say: "The sort only needs one rule: does `a` go before `b`? Here an insertion pass shows each comparison." });
      for (let i = 1; i < w.length; i++) {
        let j = i;
        while (j > 0) {
          const a = w[j - 1], b = w[j];
          const swap = b + a > a + b;
          T.add({ at: "sort", state: st({ [j - 1]: "focus", [j]: "focus" }), vars: { [`${a}+${b}`]: a + b, [`${b}+${a}`]: b + a }, say: `"${a}" + "${b}" = ${a + b} vs "${b}" + "${a}" = ${b + a}. ${swap ? `${b} should go first.` : `${a} stays first.`}`, ask: { q: `Which order makes the bigger number?`, options: [`${a} then ${b}`, `${b} then ${a}`], answer: swap ? 1 : 0, why: `${swap ? b + a : a + b} is bigger.` } });
          if (!swap) break;
          [w[j - 1], w[j]] = [w[j], w[j - 1]]; [ids[j - 1], ids[j]] = [ids[j], ids[j - 1]];
          j--;
        }
      }
      const ans = w[0] === "0" ? "0" : w.join("");
      T.add({ at: "ret", state: Object.assign(st(Object.fromEntries(w.map((_, i) => [i, "anchor"]))), { note: { text: `"${ans}"`, cls: "ok" } }), vars: { answer: ans }, say: w[0] === "0" ? "The biggest piece is \"0\", so every piece is 0: return \"0\", not \"00\"." : `Join: "${ans}".` });
      return T.done(ans);
    },
  };

  G.quizzes.sort09 = {
    title: "Which sort, and why?",
    items: [
      { q: "Sort a linked list in O(n log n).", options: ["Merge sort", "Quicksort with random pivots", "Insertion sort", "Counting sort"], answer: 0, why: "Merging needs only sequential access and relinking; no random access needed." },
      { q: "Sort a billion numbers stored on disk.", options: ["External merge sort", "In-memory quicksort", "Selection sort", "Heap sort in memory"], answer: 0, why: "Sort chunks that fit in memory, then merge the sorted runs sequentially." },
      { q: "Ten numbers that are almost sorted.", options: ["Insertion sort", "Merge sort", "Quicksort with the first item as pivot", "Radix sort"], answer: 0, why: "Close to O(n) when few items are out of place, with tiny overhead." },
      { q: "The ages of a million people (0 to 120).", options: ["Counting sort", "Quicksort", "Merge sort", "Selection sort"], answer: 0, why: "A tiny value range: count each age, O(n + 121)." },
      { q: "Records already sorted by name; now sort by age, keeping name order inside each age.", options: ["A stable sort (merge sort, JS sort, Go's SliceStable)", "Go's sort.Slice", "Quicksort", "Any sort works"], answer: 0, why: "Only a stable sort keeps the previous order among equal keys." },
    ],
  };
})();

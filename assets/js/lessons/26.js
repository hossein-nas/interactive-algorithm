/* Lesson 26 · Dynamic programming in two dimensions: tables filled cell by cell. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  const sh = (v) => (v === null || v === undefined ? "" : v === true ? "T" : v === false ? "F" : v === Infinity ? "∞" : String(v));
  // a DP table picture: T is a 2D array (null = not filled yet); marks by "r,c"
  const tview = (T, rowLabels, colLabels, mk, note, extra) => Object.assign({ cell: Math.max(T[0] && T[0].length > 8 ? 30 : 36, 12 + 9 * Math.max(0, ...T.flat().map((v) => sh(v).length))), labelW: Math.max(44, 10 + 8 * Math.max(...rowLabels.map((l) => String(l).length))), rowLabels, colLabels, cells: T.map((row, r) => row.map((v, c) => ({ v: sh(v), m: (mk && mk[r + "," + c]) || null }))), note: note ? { text: note } : undefined }, extra || {});
  const word = (s, max, name, allowEmpty) => { const t = String(s).trim().replace(/^"|"$/g, ""); if (!allowEmpty && !t) throw new Error(`Type ${name}.`); if (t.length > max) throw new Error(`${name}: up to ${max} characters.`); if (!/^[a-z.*]*$/.test(t)) throw new Error(`${name}: lowercase letters only.`); return t; };
  const strs = (s, max, opts) => { const [a, b] = P.parts(s, 2, 'Two strings separated by ";"'); return [word(a, max, "the first string", opts && opts.empty), word(b, max, "the second string", opts && opts.empty)]; };

  /* ---------- Problem 1: grid paths ---------- */
  A.uniquePaths = {
    title: "Grid paths: each cell comes from above or from the left", short: "Unique Paths",
    viz: "grid", legend: ["focus:cell being filled", "anchor:above and left", "answer:the answer"],
    inputLabel: "m rows ; n columns", hint: "3 ; 4",
    presets: [{ label: "3 × 4", input: "3 ; 4" }, { label: "3 × 7", input: "3 ; 7" }],
    parse(s) { const [a, b] = P.parts(s, 2, "m ; n"); const m = P.num(a, "m"), n = P.num(b, "n"); if (![m, n].every((x) => Number.isInteger(x) && x >= 1 && x <= 7)) throw new Error("m and n from 1 to 7."); return { m, n }; },
    lines: { first: { ts: "const row = new Array<number>(n).fill(1);", go: "func uniquePaths>>row := make([]int, n)" }, fill: { ts: "for (let c = 1; c < n; c++) row[c] += row[c - 1];", go: "row[c] += row[c-1] // above (old row[c]) + left (new row[c-1])" }, ret: { ts: "return row[n - 1];", go: "return row[n-1]" } },
    table: { id: "tbl-2", preset: 0, rows: ["r0", "r1", "r2"] },
    trace({ m, n }) {
      const Tr = new G.Trace();
      const T = Array.from({ length: m }, () => Array(n).fill(null));
      const RL = [...Array(m).keys()].map((r) => `r=${r}`), CL = [...Array(n).keys()].map((c) => `c=${c}`);
      T[0].fill(1); for (let r = 0; r < m; r++) T[r][0] = 1;
      Tr.add({ key: "r0", at: "first", state: tview(T, RL, CL, {}, "the code keeps only one row; the picture shows them all"), vars: {}, say: "Top row and left column: one way each (all right, or all down)." });
      for (let r = 1; r < m; r++) for (let c = 1; c < n; c++) {
        T[r][c] = T[r - 1][c] + T[r][c - 1];
        Tr.add({ key: "r" + r, at: "fill", state: tview(T, RL, CL, { [r + "," + c]: "focus", [r - 1 + "," + c]: "anchor", [r + "," + (c - 1)]: "anchor" }), vars: { r, c, paths: T[r][c] }, say: `The last move into (${r},${c}) is down or right: ${T[r - 1][c]} + ${T[r][c - 1]} = ${T[r][c]}.` });
      }
      Tr.add({ at: "ret", state: tview(T, RL, CL, { [m - 1 + "," + (n - 1)]: "answer" }), vars: { answer: T[m - 1][n - 1] }, say: `${T[m - 1][n - 1]} paths. O(m × n) time, O(n) memory with one rolling row.` });
      return Tr.done(T[m - 1][n - 1]);
    },
  };
  A.minPath = {
    title: "Grid paths: each cell comes from above or from the left", short: "Minimum Path Sum",
    viz: "grid", legend: ["focus:cell being filled", "anchor:the cheaper of above and left", "answer:the answer"],
    inputLabel: "rows of digits", hint: "131 151 421",
    presets: [{ label: "[[1,3,1],[1,5,1],[4,2,1]]", input: "131 151 421" }, { label: "[[1,2,3],[4,5,6]]", input: "123 456" }],
    parse(s) { const rows = String(s).trim().split(/[\s|]+/).filter(Boolean); if (!rows.length || rows.length > 5 || rows.some((r) => !/^\d+$/.test(r) || r.length !== rows[0].length || r.length > 6)) throw new Error("Rows of digits, all the same length (up to 5 × 6)."); return rows.map((r) => r.split("").map(Number)); },
    lines: { col: { ts: "cost[0] += grid[r][0];", go: "cost[0] += grid[r][0] // the first column can only come from above" }, fill: { ts: "for (let c = 1; c < n; c++) cost[c] = grid[r][c] + Math.min(cost[c], cost[c - 1]);", go: "cost[c] = grid[r][c] + min(cost[c], cost[c-1]) // above vs left" }, ret: { ts: "return cost[n - 1];", go: "return cost[n-1]" } },
    trace(g) {
      const Tr = new G.Trace();
      const m = g.length, n = g[0].length;
      const T = g.map((r) => r.map(() => null));
      const RL = g.map((r) => r.join(" ")), CL = [...Array(n).keys()].map((c) => `c=${c}`);
      for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) {
        const up = r ? T[r - 1][c] : Infinity, left = c ? T[r][c - 1] : Infinity;
        T[r][c] = g[r][c] + (r === 0 && c === 0 ? 0 : Math.min(up, left));
        const from = r === 0 && c === 0 ? {} : up <= left ? { [r - 1 + "," + c]: "anchor" } : { [r + "," + (c - 1)]: "anchor" };
        Tr.add({ at: c === 0 ? "col" : "fill", state: tview(T, RL, CL, Object.assign({ [r + "," + c]: "focus" }, from), "row labels show the grid; cells show the best cost"), vars: { r, c, cost: T[r][c] }, say: r === 0 && c === 0 ? `Start: cost ${g[0][0]}.` : `(${r},${c}) costs ${g[r][c]} plus the cheaper way in (${up === Infinity ? "only left" : left === Infinity ? "only above" : `above ${up}, left ${left}`}): ${T[r][c]}.` });
      }
      Tr.add({ at: "ret", state: tview(T, RL, CL, { [m - 1 + "," + (n - 1)]: "answer" }), vars: { answer: T[m - 1][n - 1] }, say: `Minimum path sum ${T[m - 1][n - 1]}.` });
      return Tr.done(T[m - 1][n - 1]);
    },
  };

  /* ---------- Problem 2: knapsack and partition ---------- */
  A.knap = {
    title: "0/1 knapsack: best[i][w] uses the first i items with capacity w", short: "The book's grid",
    viz: "grid", legend: ["focus:cell being filled", "anchor:skip (above) and take (above-left)", "answer:read back: taken"],
    inputLabel: "items name:weight:value ; capacity", hint: "guitar:1:1500 stereo:4:3000 laptop:3:2000 ; 4",
    presets: [{ label: "the book's thief", input: "guitar:1:1500 stereo:4:3000 laptop:3:2000 ; 4" }, { label: "four items, capacity 6", input: "a:2:3 b:3:4 c:4:5 d:5:6 ; 6" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'items, then ";" and capacity'); const items = a.trim().split(/\s+/).map((x) => { const m = x.match(/^(\w+):(\d+):(\d+)$/); if (!m) throw new Error(`"${x}" should look like name:weight:value.`); return { name: m[1], weight: +m[2], value: +m[3] }; }); if (items.length > 5) throw new Error("Up to 5 items."); const cap = P.num(b, "capacity"); if (!Number.isInteger(cap) || cap < 0 || cap > 8) throw new Error("capacity 0..8."); return { items, cap }; },
    lines: { skip: { ts: "best[i][w] = best[i - 1][w]; // skip the item", go: "best[i][w] = best[i-1][w] // skip the item" }, take: { ts: "if (weight <= w) best[i][w] = Math.max(best[i][w], best[i - 1][w - weight] + value);", go: "best[i][w] = max(best[i][w], best[i-1][w-weight]+value) // or take it" }, back: { ts: "if (best[i][w] !== best[i - 1][w]) {", go: "chosen = append(chosen, items[i-1].name)" } },
    table: { id: "tbl-3", preset: 0, rows: ["k0", "k1", "k2", "k3"] },
    trace({ items, cap }) {
      const Tr = new G.Trace();
      const n = items.length;
      const B = Array.from({ length: n + 1 }, (_, i) => Array(cap + 1).fill(i ? null : 0));
      const RL = ["no items", ...items.map((it) => `${it.name} (${it.weight})`)], CL = [...Array(cap + 1).keys()].map((w) => `w${w}`);
      Tr.add({ key: "k0", at: "skip", state: tview(B, RL, CL, {}), vars: {}, say: "Row 0: with no items, every capacity is worth 0." });
      for (let i = 1; i <= n; i++) {
        const { weight, value, name } = items[i - 1];
        for (let w = 0; w <= cap; w++) {
          B[i][w] = B[i - 1][w];
          const can = weight <= w, take = can ? B[i - 1][w - weight] + value : null;
          if (can && take > B[i][w]) B[i][w] = take;
          Tr.add({ key: "k" + i, at: can ? "take" : "skip", state: tview(B, RL, CL, Object.assign({ [i + "," + w]: "focus", [i - 1 + "," + w]: "anchor" }, can ? { [i - 1 + "," + (w - weight)]: "anchor" } : {})), vars: { item: name, w, best: B[i][w] }, say: can ? `${name}, capacity ${w}: skip it (${B[i - 1][w]}) or take it (${value} + best with ${w - weight} left = ${take}). Keep ${B[i][w]}.` : `${name} (${weight} lb) does not fit in ${w}: copy the cell above, ${B[i][w]}.` });
        }
      }
      const chosen = [], mk = {};
      let w = cap;
      for (let i = n; i >= 1; i--) if (B[i][w] !== B[i - 1][w]) { chosen.push(items[i - 1].name); mk[i + "," + w] = "answer"; w -= items[i - 1].weight; }
      chosen.reverse();
      Tr.add({ at: "back", state: tview(B, RL, CL, mk, `taken: ${chosen.join(", ") || "nothing"}`), vars: { best: B[n][cap] }, say: `Best ${B[n][cap]}. Read back from the corner: wherever a cell differs from the one above, that item was taken; jump left by its weight. Taken: ${chosen.join(", ") || "nothing"}.` });
      return Tr.done({ best: B[n][cap], chosen });
    },
  };
  function partitionTrace(nums, upward) {
    const Tr = new G.Trace();
    const total = nums.reduce((a, b) => a + b, 0);
    if (total % 2) { Tr.add({ at: "odd", state: { cells: [nums.map((v) => ({ v }))], note: { text: `total ${total} is odd` } }, vars: { total }, say: `The total ${total} is odd: it can never split into two equal halves.` }); return Tr.done(false); }
    const target = total / 2;
    const can = Array(target + 1).fill(false); can[0] = true;
    const CL = [...Array(target + 1).keys()].map(String);
    const st = (s, x, from) => ({ cell: 32, rowLabels: ["can"], colLabels: CL, cells: [can.map((b, k) => ({ v: b ? "T" : "F", m: k === s ? "focus" : k === from ? "anchor" : b ? "answer" : null }))], note: { text: x != null ? `adding ${x} · target ${target}` : `target ${target}` } });
    Tr.add({ at: "base", state: st(0), vars: { target }, say: `Find a subset summing to half the total, ${target}. can[s] = some subset of the numbers so far sums to s; can[0] = true.${upward ? " This version loops sums UPWARD." : ""}` });
    for (const x of nums) {
      const order = upward ? [...Array(target + 1).keys()].filter((s) => s >= x) : [...Array(target + 1).keys()].reverse().filter((s) => s >= x);
      for (const s of order) { const was = can[s]; can[s] = can[s] || can[s - x]; if (!was && can[s]) Tr.add({ at: "fill", state: st(s, x, s - x), vars: { x, s }, say: upward && can[s - x] && s - x >= x && order.indexOf(s - x) >= 0 && order.indexOf(s - x) < order.indexOf(s) ? `can[${s}] becomes true from can[${s - x}], which was itself set in this same pass: ${x} is being used twice.` : `With ${x}: can[${s}] = can[${s - x}] = true.` }); }
    }
    Tr.add({ at: "ret", state: st(target), vars: { answer: can[target] }, say: can[target] ? `can[${target}] is true: split possible.` : `can[${target}] is false: no subset reaches ${target}.` });
    return Tr.done(can[target]);
  }
  A.partition = {
    title: "0/1 knapsack: best[i][w] uses the first i items with capacity w", short: "Partition Equal Subset Sum",
    viz: "grid", legend: ["focus:sum just made reachable", "anchor:s − x it came from", "answer:reachable"],
    inputLabel: "numbers", hint: "1 5 11 5",
    presets: [{ label: "[1,5,11,5]", input: "1 5 11 5" }, { label: "[1,2,3,5]", input: "1 2 3 5" }, { label: "[2,2,3,5]", input: "2 2 3 5" }],
    parse: (s) => { const a = P.nums(s, { minLen: 1, maxLen: 8, min: 1, max: 20 }); if (a.reduce((x, y) => x + y, 0) > 40) throw new Error("Keep the total ≤ 40 so the row fits."); return a; },
    lines: { odd: { ts: "if (total % 2 !== 0) return false;", go: "return false // an odd total can never split evenly" }, base: { ts: "can[0] = true; // the empty subset sums to 0", go: "can[0] = true // the empty subset sums to 0" }, fill: { ts: "for (let s = target; s >= x; s--) can[s] = can[s] || can[s - x];", go: "can[s] = can[s] || can[s-x]" }, ret: { ts: "return can[target];", go: "return can[target]" } },
    trace: (x) => partitionTrace(x, false),
    bugs: [{ label: "Replay the bug: loop sums upward", input: "1 3", banner: "<b>Replaying a bug.</b> Going from low to high sums lets one number be used again within the same pass (that is unbounded knapsack). [1, 3] has half-sum 2, which needs the 1 twice, yet this version says true.", trace: (x) => partitionTrace(x, true) }],
  };

  /* ---------- Problem 3: LCS and longest common substring ---------- */
  A.lcs = {
    title: "Longest Common Subsequence and Substring", short: "Subsequence",
    viz: "grid", legend: ["focus:cell", "anchor:diagonal (match) or the larger of up and left", "answer:the answer"],
    inputLabel: "string a ; string b", hint: "abcde ; ace",
    presets: [{ label: "abcde ; ace", input: "abcde ; ace" }, { label: "AGGTAB ; GXTXAYB (lowercase)", input: "aggtab ; gxtxayb" }, { label: "abc ; def", input: "abc ; def" }],
    parse: (s) => strs(s, 8, { empty: true }),
    lines: { match: { ts: "? lcs[i - 1][j - 1] + 1 // matching characters extend the diagonal", go: "lcs[i][j] = lcs[i-1][j-1] + 1 // matching characters extend the diagonal" }, drop: { ts: ": Math.max(lcs[i - 1][j], lcs[i][j - 1]); // otherwise drop one character from either string", go: "lcs[i][j] = max(lcs[i-1][j], lcs[i][j-1]) // otherwise drop one character" }, ret: { ts: "return lcs[m][n];", go: "return lcs[m][n]" } },
    table: { id: "tbl-5", preset: 0, rows: ["i0", "i1", "i2", "i3", "i4", "i5"] },
    trace([a, b]) {
      const Tr = new G.Trace();
      const m = a.length, n = b.length;
      const L = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(i === 0 ? 0 : null));
      for (let i = 0; i <= m; i++) L[i][0] = 0;
      const RL = ['""', ...a.split("")], CL = ['""', ...b.split("")];
      Tr.add({ key: "i0", at: "drop", state: tview(L, RL, CL, {}), vars: {}, say: "Row and column 0 stand for an empty prefix: LCS 0. Padding them in avoids index −1." });
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
        const same = a[i - 1] === b[j - 1];
        L[i][j] = same ? L[i - 1][j - 1] + 1 : Math.max(L[i - 1][j], L[i][j - 1]);
        const from = same ? { [i - 1 + "," + (j - 1)]: "anchor" } : L[i - 1][j] >= L[i][j - 1] ? { [i - 1 + "," + j]: "anchor" } : { [i + "," + (j - 1)]: "anchor" };
        Tr.add({ key: "i" + i, at: same ? "match" : "drop", state: tview(L, RL, CL, Object.assign({ [i + "," + j]: "focus" }, from)), vars: { i, j, [`${a[i - 1]} vs ${b[j - 1]}`]: same ? "match" : "differ", lcs: L[i][j] }, say: same ? `${a[i - 1]} = ${b[j - 1]}: extend the diagonal, ${L[i - 1][j - 1]} + 1 = ${L[i][j]}.` : `${a[i - 1]} ≠ ${b[j - 1]}: drop a letter from one string, the larger of up (${L[i - 1][j]}) and left (${L[i][j - 1]}): ${L[i][j]}.` });
      }
      // read one LCS back
      let i = m, j = n; const out = [], mk = {};
      while (i > 0 && j > 0) { if (a[i - 1] === b[j - 1]) { out.push(a[i - 1]); mk[i + "," + j] = "answer"; i--; j--; } else if (L[i - 1][j] >= L[i][j - 1]) i--; else j--; }
      Tr.add({ at: "ret", state: tview(L, RL, CL, Object.assign(mk, { [m + "," + n]: "answer" }), `one LCS: "${out.reverse().join("")}"`), vars: { answer: L[m][n] }, say: `LCS length ${L[m][n]}. Walking back along the matches spells "${out.join("")}". O(m × n).` });
      return Tr.done(L[m][n]);
    },
  };
  A.substr = {
    title: "Longest Common Subsequence and Substring", short: "Substring (the book's fish)",
    viz: "grid", legend: ["focus:cell", "anchor:the diagonal it extends", "answer:the longest run"],
    inputLabel: "string a ; string b", hint: "hish ; fish",
    presets: [{ label: "hish ; fish", input: "hish ; fish" }, { label: "hish ; vista", input: "hish ; vista" }],
    parse: (s) => strs(s, 8),
    lines: { ext: { ts: "run[i][j] = run[i - 1][j - 1] + 1; // extend the current matching run", go: "run[i][j] = run[i-1][j-1] + 1 // extend the current matching run" }, zero: { ts: "} // else the run is broken, and the cell stays 0", go: "run[i][j] = run[i-1][j-1] + 1 // extend the current matching run" }, ret: { ts: "longestCommonSubstring>>return best;", go: "func longestCommonSubstring>>return best" } },
    table: { id: "tbl-6", preset: 0, rows: ["i1", "i2", "i3", "i4"] },
    trace([a, b]) {
      const Tr = new G.Trace();
      const m = a.length, n = b.length;
      const R = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null));
      for (let i = 0; i <= m; i++) R[i][0] = 0;
      R[0].fill(0);
      let best = 0, bi = 0, bj = 0;
      const RL = ['""', ...a.split("")], CL = ['""', ...b.split("")];
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
        const same = a[i - 1] === b[j - 1];
        R[i][j] = same ? R[i - 1][j - 1] + 1 : 0;
        if (R[i][j] > best) { best = R[i][j]; bi = i; bj = j; }
        Tr.add({ key: "i" + i, at: same ? "ext" : "zero", state: tview(R, RL, CL, Object.assign({ [i + "," + j]: "focus" }, same ? { [i - 1 + "," + (j - 1)]: "anchor" } : {})), vars: { i, j, run: R[i][j], best }, say: same ? `${a[i - 1]} = ${b[j - 1]}: the run continues, ${R[i][j]}.` : `${a[i - 1]} ≠ ${b[j - 1]}: a substring must be contiguous, so the run breaks: 0.` });
      }
      const mk = {}; for (let k = 0; k < best; k++) mk[bi - k + "," + (bj - k)] = "answer";
      Tr.add({ at: "ret", state: tview(R, RL, CL, mk, best ? `"${a.slice(bi - best, bi)}"` : "no common letter"), vars: { answer: best }, say: `The answer is the largest cell anywhere in the table, ${best}, not the last cell.` });
      return Tr.done(best);
    },
  };

  /* ---------- Problem 4: edit distance ---------- */
  A.edit = {
    title: "Edit Distance: replace, delete or insert",
    viz: "grid", legend: ["focus:cell", "anchor:where the cheapest choice came from", "answer:the answer"],
    inputLabel: "word1 ; word2", hint: "horse ; ros",
    presets: [{ label: "horse → ros", input: "horse ; ros" }, { label: "kitten → sitting", input: "kitten ; sitting" }, { label: "intention → execution", input: "intention ; execution" }],
    parse: (s) => strs(s, 9, { empty: true }),
    lines: { col: { ts: "for (let i = 0; i <= m; i++) edit[i][0] = i; // delete everything", go: "edit[i][0] = i // delete everything" }, row: { ts: "for (let j = 0; j <= n; j++) edit[0][j] = j; // insert everything", go: "edit[0][j] = j // insert everything" }, same: { ts: "edit[i][j] = edit[i - 1][j - 1]; // matching: no cost", go: "edit[i][j] = edit[i-1][j-1] // matching: no cost" }, op: { ts: "edit[i][j] = 1 + Math.min(edit[i - 1][j - 1], edit[i - 1][j], edit[i][j - 1]);", go: "edit[i][j] = 1 + min(edit[i-1][j-1], edit[i-1][j], edit[i][j-1]) // replace, delete, insert" }, ret: { ts: "return edit[m][n];", go: "return edit[m][n]" } },
    table: { id: "tbl-7", preset: 0, rows: ["i0", "i1", "i2", "i3", "i4", "i5"] },
    trace([a, b]) {
      const Tr = new G.Trace();
      const m = a.length, n = b.length;
      const E = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null));
      for (let i = 0; i <= m; i++) E[i][0] = i;
      for (let j = 0; j <= n; j++) E[0][j] = j;
      const RL = ['""', ...a.split("")], CL = ['""', ...b.split("")];
      Tr.add({ key: "i0", at: "row", state: tview(E, RL, CL, {}), vars: {}, say: `Turning a prefix into "" takes that many deletes (column 0); building a prefix from "" takes that many inserts (row 0).` });
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) { E[i][j] = E[i - 1][j - 1]; Tr.add({ key: "i" + i, at: "same", state: tview(E, RL, CL, { [i + "," + j]: "focus", [i - 1 + "," + (j - 1)]: "anchor" }), vars: { i, j, cost: E[i][j] }, say: `${a[i - 1]} = ${b[j - 1]}: free, copy the diagonal (${E[i][j]}).` }); }
        else {
          const rep = E[i - 1][j - 1], del = E[i - 1][j], ins = E[i][j - 1];
          E[i][j] = 1 + Math.min(rep, del, ins);
          const k = Math.min(rep, del, ins) === rep ? i - 1 + "," + (j - 1) : Math.min(del, ins) === del ? i - 1 + "," + j : i + "," + (j - 1);
          const what = k === i - 1 + "," + (j - 1) ? `replace ${a[i - 1]} with ${b[j - 1]}` : k === i - 1 + "," + j ? `delete ${a[i - 1]}` : `insert ${b[j - 1]}`;
          Tr.add({ key: "i" + i, at: "op", state: tview(E, RL, CL, { [i + "," + j]: "focus", [k]: "anchor" }), vars: { i, j, replace: rep, delete: del, insert: ins, cost: E[i][j] }, say: `${a[i - 1]} ≠ ${b[j - 1]}: 1 + min(replace ${rep}, delete ${del}, insert ${ins}) = ${E[i][j]}. Cheapest: ${what}.` });
        }
      }
      Tr.add({ at: "ret", state: tview(E, RL, CL, { [m + "," + n]: "answer" }), vars: { answer: E[m][n] }, say: `Edit distance ${E[m][n]}. O(m × n).` });
      return Tr.done(E[m][n]);
    },
  };

  /* ---------- Problem 5: longest palindromic subsequence ---------- */
  A.palin = {
    title: "Longest Palindromic Subsequence: an interval table, filled from short to long",
    viz: "grid", legend: ["focus:pal[i][j]", "anchor:what it reads", "answer:the whole string"],
    inputLabel: "a lowercase string", hint: "bbbab",
    presets: [{ label: "bbbab", input: "bbbab" }, { label: "cbbd", input: "cbbd" }, { label: "character", input: "character" }],
    parse: (s) => word(s, 9, "the string"),
    lines: { one: { ts: "pal[i][i] = 1; // a single character is a palindrome of length 1", go: "pal[i][i] = 1 // a single character is a palindrome of length 1" }, wrap: { ts: "pal[i][j] = (j - 1 >= i + 1 ? pal[i + 1][j - 1] : 0) + 2;", go: "pal[i][j] = inside + 2 // wrap the best palindrome inside" }, drop: { ts: "pal[i][j] = Math.max(pal[i + 1][j], pal[i][j - 1]); // drop one end", go: "pal[i][j] = max(pal[i+1][j], pal[i][j-1]) // drop one end" }, ret: { ts: "return pal[0][n - 1];", go: "return pal[0][n-1]" } },
    trace(s) {
      const Tr = new G.Trace();
      const n = s.length;
      const T = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (j < i ? "" : null)));
      const RL = s.split("").map((c, i) => `${i} ${c}`), CL = s.split("").map((c, j) => `${j}${c}`);
      for (let i = n - 1; i >= 0; i--) {
        T[i][i] = 1;
        Tr.add({ at: "one", state: tview(T, RL, CL, { [i + "," + i]: "focus" }, "row i = start, column j = end"), vars: { i }, say: `pal[${i}][${i}] = 1: "${s[i]}" alone. Rows go bottom-up so that the shorter ranges inside are ready.` });
        for (let j = i + 1; j < n; j++) {
          if (s[i] === s[j]) { const inside = j - 1 >= i + 1 ? T[i + 1][j - 1] : 0; T[i][j] = inside + 2; Tr.add({ at: "wrap", state: tview(T, RL, CL, Object.assign({ [i + "," + j]: "focus" }, j - 1 >= i + 1 ? { [i + 1 + "," + (j - 1)]: "anchor" } : {})), vars: { i, j, pal: T[i][j] }, say: `s[${i}] = s[${j}] = "${s[i]}": wrap them around the best palindrome inside (${inside}): ${T[i][j]}.` }); }
          else { T[i][j] = Math.max(T[i + 1][j], T[i][j - 1]); Tr.add({ at: "drop", state: tview(T, RL, CL, { [i + "," + j]: "focus", [i + 1 + "," + j]: "anchor", [i + "," + (j - 1)]: "anchor" }), vars: { i, j, pal: T[i][j] }, say: `"${s[i]}" ≠ "${s[j]}": one end must go. max(pal[${i + 1}][${j}], pal[${i}][${j - 1}]) = ${T[i][j]}.` }); }
        }
      }
      Tr.add({ at: "ret", state: tview(T, RL, CL, { [0 + "," + (n - 1)]: "answer" }), vars: { answer: T[0][n - 1] }, say: `The whole string is pal[0][${n - 1}] = ${T[0][n - 1]}. O(n²).` });
      return Tr.done(T[0][n - 1]);
    },
  };

  /* ---------- Problem 6: regular expression matching ---------- */
  A.regex = {
    title: "Regular Expression Matching: dp[i][j] = s's first i match p's first j",
    viz: "grid", legend: ["focus:cell", "anchor:cells it reads", "answer:true"],
    inputLabel: "s ; p (letters, . and *)", hint: "aab ; c*a*b",
    presets: [{ label: "aab ; c*a*b", input: "aab ; c*a*b" }, { label: "aa ; a*", input: "aa ; a*" }, { label: "mississippi ; mis*is*p*.", input: "mississippi ; mis*is*p*." }],
    parse(s) { const [a, b] = P.parts(s, 2, "s ; p"); const str = word(a, 11, "s", true), pat = word(b, 10, "p", true); if (/[.*]/.test(str)) throw new Error("s has letters only."); if (/^\*|\*\*/.test(pat)) throw new Error("Each * must follow a letter or a dot."); return [str, pat]; },
    lines: { base: { ts: 'if (p[j - 1] === "*") dp[0][j] = dp[0][j - 2];', go: 'dp[0][j] = dp[0][j-2] // "x*" can match nothing' }, star: { ts: "dp[i][j] = zeroCopies || moreCopies;", go: "dp[i][j] = zeroCopies || moreCopies" }, one: { ts: "dp[i][j] = charMatches(i, j) && dp[i - 1][j - 1];", go: "dp[i][j] = charMatches(i, j) && dp[i-1][j-1]" }, ret: { ts: "isMatch(s: string, p: string)>>return dp[m][n];", go: "func isMatch>>return dp[m][n]" } },
    table: { id: "tbl-8", preset: 0, rows: ["i0", "i1", "i2", "i3"] },
    trace([s, p]) {
      const Tr = new G.Trace();
      const m = s.length, n = p.length;
      const D = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null));
      D[0].fill(false); D[0][0] = true;
      for (let i = 1; i <= m; i++) D[i][0] = false; // a non-empty s never matches an empty pattern
      for (let j = 2; j <= n; j++) if (p[j - 1] === "*") D[0][j] = D[0][j - 2];
      const RL = ['""', ...s.split("").map((_, i) => s.slice(0, i + 1))], CL = ['""', ...p.split("").map((_, j) => p.slice(0, j + 1))];
      const mkT = (extra) => { const mk = {}; D.forEach((r, i) => r.forEach((v, j) => { if (v === true) mk[i + "," + j] = "answer"; })); return Object.assign(mk, extra); };
      Tr.add({ key: "i0", at: "base", state: Object.assign(tview(D, RL.map((x) => x.slice(-6)), CL, mkT({})), { cell: 40 }), vars: {}, say: `Row 0: the empty s matches the empty p, and any pattern made only of "x*" pairs (each can match nothing).` });
      const cm = (i, j) => p[j - 1] === "." || p[j - 1] === s[i - 1];
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
        if (p[j - 1] === "*") {
          const zero = j >= 2 && D[i][j - 2], more = j >= 2 && cm(i, j - 1) && D[i - 1][j];
          D[i][j] = zero || more;
          Tr.add({ key: "i" + i, at: "star", state: Object.assign(tview(D, RL.map((x) => x.slice(-6)), CL, mkT({ [i + "," + j]: "focus", [i + "," + (j - 2)]: "anchor", [i - 1 + "," + j]: "anchor" })), { cell: 40 }), vars: { i, j, zero, more }, say: `"${p[j - 2]}*": zero copies (drop it: dp[${i}][${j - 2}] = ${sh(D[i][j - 2])}) or one more copy (${cm(i, j - 1) ? `"${s[i - 1]}" matches "${p[j - 2]}", so ask dp[${i - 1}][${j}] = ${sh(D[i - 1][j])}` : `"${s[i - 1]}" does not match "${p[j - 2]}"`}). ${sh(D[i][j])}.` });
        } else {
          D[i][j] = cm(i, j) && D[i - 1][j - 1];
          Tr.add({ key: "i" + i, at: "one", state: Object.assign(tview(D, RL.map((x) => x.slice(-6)), CL, mkT({ [i + "," + j]: "focus", [i - 1 + "," + (j - 1)]: "anchor" })), { cell: 40 }), vars: { i, j }, say: cm(i, j) ? `"${s[i - 1]}" matches "${p[j - 1]}": copy the diagonal, ${sh(D[i][j])}.` : `"${s[i - 1]}" vs "${p[j - 1]}": no match, F.` });
        }
      }
      Tr.add({ at: "ret", state: Object.assign(tview(D, RL.map((x) => x.slice(-6)), CL, mkT({})), { cell: 40 }), vars: { answer: D[m][n] }, say: `dp[${m}][${n}] = ${D[m][n]}: the whole string ${D[m][n] ? "matches" : "does not match"}.` });
      return Tr.done(D[m][n]);
    },
  };

  G.quizzes.dp26 = {
    title: "Two-dimensional DP",
    items: [
      { q: "Why pad the table with an extra row and column for the empty prefix?", options: ["So the recurrence never reads index −1, and the base cases live in the table", "To save memory", "To sort the strings", "Tables must be square"], answer: 0, why: "Row 0 and column 0 hold the answers for \"\"." },
      { q: "0/1 knapsack with one array: why loop capacities from high to low?", options: ["So each item is used at most once in a pass", "It is faster", "To read back the items", "Low to high is also correct"], answer: 0, why: "Upward, best[w − weight] may already include this item." },
      { q: "Longest common substring: where is the answer?", options: ["The largest cell anywhere", "The bottom-right cell", "The first row", "The diagonal sum"], answer: 0, why: "A run can end anywhere; mismatches reset to 0." },
      { q: "Edit distance, letters differ: the three neighbors mean…", options: ["diagonal = replace, above = delete, left = insert", "all three are replaces", "above = insert, left = delete, diagonal = keep", "only the diagonal matters"], answer: 0, why: "Each removes the last letter of one or both words." },
      { q: "Interval DP (palindromes): the fill order must make sure…", options: ["every shorter range inside is computed first", "rows go top to bottom", "the diagonal is filled last", "j < i always"], answer: 0, why: "pal[i][j] reads pal[i+1][j−1], pal[i+1][j] and pal[i][j−1]." },
    ],
  };
})();

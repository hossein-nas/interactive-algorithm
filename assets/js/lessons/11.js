/* Lesson 11 · Backtracking — decision trees that grow and shrink, and a queens board. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  // decision-tree recorder: the node of the current path is "focus", saved answers "answer", pruned "bug"
  function tree() {
    const nodes = [];
    let id = 0;
    return {
      nodes,
      add(label, parent, m) { const n = { id: id++, label, parent, m: m || "focus" }; nodes.push(n); return n; },
      state(extra) { return Object.assign({ nodes: nodes.map((x) => Object.assign({}, x)) }, extra); },
    };
  }
  const lab = (p) => "[" + p.join(",") + "]";
  const res = (title, list, extra) => Object.assign({ title, entries: list.map((r, i) => [`#${i + 1}`, typeof r === "string" ? r : lab(r)]), empty: "(none yet)", keyW: 40, valW: 96 }, extra);

  /* ---------------- the copy bug ---------------- */
  A.buggySubsets = {
    title: "Save a copy, not the live path",
    viz: "tree", legend: ["focus:current path", "bug:every saved entry is the same array"],
    inputLabel: "distinct numbers (up to 3)", hint: "1 2 3",
    presets: [{ label: "[1,2,3]", input: "1 2 3" }],
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 3, min: 0, max: 9 }),
    lines: { rec: { ts: "res.push(path); // <-- bug", go: "res = append(res, path) // <-- bug" }, choose: { ts: "function buggySubsets>>path.push(nums[i]);", go: "func buggySubsets>>path = append(path, nums[i])" }, pop: { ts: "function buggySubsets>>path.pop();", go: "func buggySubsets>>path = path[:len(path)-1]" } },
    codeLang: "ts",
    trace(nums) {
      const T = new G.Trace();
      const t = tree();
      const path = [];
      let saved = 0;
      const st = () => t.state({ colW: 70, panels: undefined, stack: undefined, note: { text: `res = [${Array.from({ length: saved }, () => lab(path)).join(", ")}]`, cls: "bad" } });
      function dfs(start, parent) {
        const me = t.add(lab(path), parent);
        saved++;
        T.add({ at: "rec", state: st(), vars: { path: path.slice(), saved }, say: `Save \`path\`, which is ${lab(path)} right now. But it is the same array object every time.` });
        for (let i = start; i < nums.length; i++) {
          path.push(nums[i]);
          T.add({ at: "choose", state: st(), vars: { path: path.slice() }, say: `Choose ${nums[i]}. Every saved entry shows ${lab(path)} too: they are all this one array.` });
          dfs(i + 1, me.id);
          path.pop();
          T.add({ at: "pop", state: st(), vars: { path: path.slice() }, say: `Un-choose: path is ${lab(path)} again, and so is every saved entry.` });
        }
        me.m = null;
      }
      dfs(0, null);
      T.add({ state: st(), vars: { saved }, say: `${saved} entries, all the same empty array. The fix: save \`[...path]\` (TypeScript) or \`append([]int(nil), path...)\` (Go).` });
      return T.done(saved);
    },
  };

  /* ---------------- subsets ---------------- */
  A.subsets = {
    title: "Subsets: every node is an answer",
    viz: "tree", legend: ["focus:current path", "answer:saved"],
    inputLabel: "distinct numbers (up to 4)", hint: "1 2 3",
    presets: [{ label: "[1,2,3]", input: "1 2 3" }, { label: "[1,2]", input: "1 2" }],
    parse(s) { const a = P.nums(s, { allowEmpty: true, maxLen: 4, min: -9, max: 9 }); if (new Set(a).size !== a.length) throw new Error("Distinct numbers, please."); return a; },
    lines: { rec: { ts: "result.push([...path]); // record a COPY", go: "result = append(result, append([]int(nil), path...)) // record a COPY" }, choose: { ts: "function subsets>>path.push(nums[i]); // choose", go: "path = append(path, nums[i]) // choose" }, pop: { ts: "function subsets>>path.pop(); // un-choose", go: "func subsets>>path = path[:len(path)-1]" } },
    trace(nums) {
      const T = new G.Trace();
      const t = tree(), path = [], result = [];
      const st = () => t.state({ colW: 72, panels: undefined, note: { text: `saved: ${result.map(lab).join(" ")}` } });
      function dfs(start, parent) {
        const me = t.add(lab(path), parent);
        result.push(path.slice());
        me.m = "answer";
        T.add({ at: "rec", state: st(), vars: { path: path.slice(), saved: result.length }, say: `Save a copy of ${lab(path)}. In subsets every node is an answer.` });
        me.m = "focus";
        for (let i = start; i < nums.length; i++) {
          path.push(nums[i]);
          T.add({ at: "choose", state: st(), vars: { path: path.slice(), start: i + 1 }, say: `Choose ${nums[i]}; only items after it may follow, so ${lab(path.slice(0, -1).concat([nums[i]]))} never repeats as a reordering.` });
          dfs(i + 1, me.id);
          path.pop();
          T.add({ at: "pop", state: st(), vars: { path: path.slice() }, say: `Un-choose ${nums[i]}: back to ${lab(path)}.` });
        }
        me.m = "answer";
      }
      dfs(0, null);
      T.add({ state: st(), vars: { subsets: result.length }, say: `${result.length} = 2^${nums.length} subsets. Copying each costs up to n: \`O(n · 2ⁿ)\`.` });
      return T.done(result);
    },
  };

  /* ---------------- permutations ---------------- */
  A.permutations = {
    title: "Permutations: any unused item, at every level",
    viz: "tree", legend: ["focus:current path", "answer:a full permutation"],
    inputLabel: "distinct numbers (up to 3)", hint: "1 2 3",
    presets: [{ label: "[1,2,3]", input: "1 2 3" }, { label: "[1,2]", input: "1 2" }],
    parse(s) { const a = P.nums(s, { minLen: 1, maxLen: 3, min: -9, max: 9 }); if (new Set(a).size !== a.length) throw new Error("Distinct numbers, please."); return a; },
    lines: { done: { ts: "result.push([...path]); // complete: save a copy", go: "result = append(result, append([]int(nil), path...)) // complete: save a copy" }, choose: { ts: "used[i] = true; // choose", go: "used[i] = true // choose" }, pop: { ts: "function permutations>>path.pop(); // un-choose", go: "func permutations>>path = path[:len(path)-1]" } },
    trace(nums) {
      const T = new G.Trace();
      const t = tree(), path = [], used = nums.map(() => false), result = [];
      const st = () => t.state({ colW: 68, note: { text: `used: ${nums.map((v, i) => (used[i] ? `${v}✓` : v)).join(" ")}` } });
      function dfs(parent) {
        const me = t.add(lab(path), parent);
        if (path.length === nums.length) { result.push(path.slice()); me.m = "answer"; T.add({ at: "done", state: st(), vars: { path: path.slice(), found: result.length }, say: `Full length: save ${lab(path)}.` }); return; }
        for (let i = 0; i < nums.length; i++) {
          if (used[i]) continue;
          used[i] = true; path.push(nums[i]);
          T.add({ at: "choose", state: st(), vars: { path: path.slice() }, say: `Choose ${nums[i]} and mark it used.` });
          dfs(me.id);
          path.pop(); used[i] = false;
          T.add({ at: "pop", state: st(), vars: { path: path.slice() }, say: `Un-choose ${nums[i]} and unmark it.` });
        }
        me.m = null;
      }
      dfs(null);
      T.add({ state: st(), vars: { permutations: result.length }, say: `${result.length} = ${nums.length}! permutations.` });
      return T.done(result);
    },
  };

  /* ---------------- combination sum ---------------- */
  A.combinationSum = {
    title: "Combination Sum: reuse allowed, prune early",
    viz: "tree", legend: ["focus:current path", "answer:sums to the target", "bug:pruned: too big"],
    inputLabel: "candidates ; target", hint: "2 3 6 7 ; 7",
    presets: [{ label: "[2,3,6,7] → 7", input: "2 3 6 7 ; 7" }, { label: "[2,3,5] → 8", input: "2 3 5 ; 8" }],
    parse(s) { const [a, t] = P.parts(s, 2, 'Candidates, then ";" and the target'); const c = P.nums(a, { minLen: 1, maxLen: 4, min: 1, max: 20 }); const tt = P.num(t); if (tt < 1 || tt > 10) throw new Error("Target from 1 to 10 keeps the tree readable."); if (new Set(c).size !== c.length) throw new Error("Distinct candidates."); return { c, t: tt }; },
    lines: { done: { ts: "function combinationSum>>result.push([...path]);", go: "func combinationSum>>result = append(result, append([]int(nil), path...))" }, prune: { ts: "if (sorted[i] > remaining) break;", go: "break // prune: this and all later ones are too big" }, choose: { ts: "function combinationSum>>path.push(sorted[i]); // choose", go: "path = append(path, sorted[i]) // choose" }, pop: { ts: "function combinationSum>>path.pop(); // un-choose", go: "func combinationSum>>path = path[:len(path)-1]" } },
    trace({ c, t: target }) {
      const T = new G.Trace();
      const sorted = c.slice().sort((a, b) => a - b);
      const t = tree(), path = [], result = [];
      const st = () => t.state({ colW: 76, note: { text: `found: ${result.map(lab).join(" ") || "none yet"}` } });
      function dfs(start, rem, parent) {
        const me = t.add(`${lab(path)} r${rem}`, parent);
        if (rem === 0) { result.push(path.slice()); me.m = "answer"; T.add({ at: "done", state: st(), vars: { path: path.slice(), remaining: 0 }, say: `Remaining 0: save ${lab(path)}.` }); return; }
        for (let i = start; i < sorted.length; i++) {
          if (sorted[i] > rem) { const x = t.add(`+${sorted[i]}?`, me.id, "bug"); T.add({ at: "prune", state: st(), vars: { remaining: rem, candidate: sorted[i] }, say: `${sorted[i]} > ${rem}: too big, and every later candidate is bigger (sorted). Stop this loop.` }); x.m = "ghost"; break; }
          path.push(sorted[i]);
          T.add({ at: "choose", state: st(), vars: { path: path.slice(), remaining: rem - sorted[i] }, say: `Choose ${sorted[i]}: remaining ${rem - sorted[i]}. Recurse with the same index, so ${sorted[i]} may be used again.` });
          dfs(i, rem - sorted[i], me.id);
          path.pop();
          T.add({ at: "pop", state: st(), vars: { path: path.slice() }, say: `Un-choose ${sorted[i]}.` });
        }
        if (me.m === "focus") me.m = null;
      }
      dfs(0, target, null);
      return T.done(result);
    },
  };

  /* ---------------- parentheses ---------------- */
  A.parens = {
    title: "Generate Parentheses: the two rules are the pruning",
    viz: "tree", legend: ["focus:current string", "answer:complete and valid"],
    inputLabel: "n pairs (1 to 3)", hint: "3",
    presets: [{ label: "n = 2", input: "2" }, { label: "n = 3", input: "3" }],
    parse(s) { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 1 || n > 3) throw new Error("n from 1 to 3 keeps the tree readable."); return n; },
    lines: { done: { ts: "result.push(current);", go: "result = append(result, string(buf))" }, open: { ts: 'if (open < n) dfs(current + "(", open + 1, close);', go: "buf = append(buf, '(') // choose" }, close: { ts: 'if (close < open) dfs(current + ")", open, close + 1);', go: "buf = append(buf, ')')" } },
    trace(n) {
      const T = new G.Trace();
      const t = tree(), result = [];
      const st = () => t.state({ colW: 72, note: { text: `found: ${result.join(" ") || "none yet"}` } });
      function dfs(cur, open, close, parent) {
        const me = t.add(cur || "''", parent);
        if (cur.length === 2 * n) { result.push(cur); me.m = "answer"; T.add({ at: "done", state: st(), vars: { current: cur }, say: `Length ${2 * n}: "${cur}" is complete, and valid by construction.` }); return; }
        if (open < n) { T.add({ at: "open", state: st(), vars: { open, close }, say: `open ${open} < ${n}: we may add "(".` }); dfs(cur + "(", open + 1, close, me.id); }
        if (close < open) { T.add({ at: "close", state: st(), vars: { open, close }, say: `close ${close} < open ${open}: we may add ")".` }); dfs(cur + ")", open, close + 1, me.id); }
        else T.add({ at: "close", state: st(), vars: { open, close }, say: `close ${close} is not < open ${open}: ")" would close nothing. That branch is never created.` });
        if (me.m === "focus") me.m = null;
      }
      dfs("", 0, 0, null);
      T.add({ state: st(), vars: { results: result.length }, say: `${result.length} strings (a Catalan number), with no filtering step.` });
      return T.done(result);
    },
  };

  /* ---------------- N-Queens ---------------- */
  A.nQueens = {
    title: "N-Queens: one queen per row, three O(1) checks",
    viz: "grid", legend: ["answer:a queen", "focus:the square being tried", "bug:attacked", "anchor:a full solution"],
    inputLabel: "n (4 to 6)", hint: "4",
    presets: [{ label: "4 × 4", input: "4" }, { label: "5 × 5 (first solution)", input: "5" }],
    parse(s) { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 4 || n > 6) throw new Error("n from 4 to 6."); return n; },
    lines: { done: { ts: "results.push(queenCol.map(", go: "results = append(results, board)" }, skip: { ts: "if (colUsed[col] || diagUsed[d] || antiUsed[a]) continue; // attacked: prune", go: "continue // attacked: prune" }, place: { ts: "colUsed[col] = diagUsed[d] = antiUsed[a] = true; // choose", go: "colUsed[col], diagUsed[d], antiUsed[a] = true, true, true // choose" }, undo: { ts: "function solveNQueens>>colUsed[col] = diagUsed[d] = antiUsed[a] = false;", go: "func solveNQueens>>colUsed[col], diagUsed[d], antiUsed[a] = false, false, false" } },
    trace(n) {
      const T = new G.Trace();
      const cols = [], results = [];
      const colU = new Array(n).fill(false), dU = new Array(2 * n).fill(false), aU = new Array(2 * n).fill(false);
      const limit = n === 4 ? 2 : 1;
      const st = (row, col, bad, solved) => ({ cell: 40, rowLabels: Array.from({ length: n }, (_, r) => `row ${r}`), cells: Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => {
        if (cols[r] === c) return { v: "♛", m: solved ? "anchor" : "answer" };
        if (r === row && c === col) return { v: "?", m: bad ? "bug" : "focus" };
        const att = cols.some((qc, qr) => qc === c || qr + qc === r + c || qr - qc === r - c);
        return { v: "", m: att && r >= cols.length ? "ghost" : null };
      })), note: { text: `solutions found: ${results.length}` } });
      function dfs(row) {
        if (results.length >= limit) return;
        if (row === n) { results.push(cols.slice()); T.add({ at: "done", state: st(-1, -1, false, true), vars: { solution: results.length }, say: `All ${n} rows have a queen: save this board.` }); return; }
        for (let col = 0; col < n && results.length < limit; col++) {
          const d = row + col, a = row - col + n - 1;
          if (colU[col] || dU[d] || aU[a]) { T.add({ at: "skip", state: st(row, col, true), vars: { row, col, "row+col": d, "row−col+n−1": a }, say: `(${row}, ${col}) is attacked (${colU[col] ? "column" : dU[d] ? `"/" diagonal ${d}` : `"\\" diagonal ${a}`}): skip it.` }); continue; }
          colU[col] = dU[d] = aU[a] = true; cols.push(col);
          T.add({ at: "place", state: st(row, col), vars: { row, col }, say: `Place a queen at (${row}, ${col}) and mark its column and both diagonals.` });
          dfs(row + 1);
          if (results.length >= limit) return;
          cols.pop(); colU[col] = dU[d] = aU[a] = false;
          T.add({ at: "undo", state: st(row, -1), vars: { row, col }, say: `Row ${row + 1} had no safe square: take the queen off (${row}, ${col}) and try the next column.` });
        }
      }
      dfs(0);
      T.add({ state: st(-1, -1, false, true), vars: { shown: results.length }, say: `Shown ${results.length} solution${results.length === 1 ? "" : "s"}. The full search continues the same way through every column of row 0.` });
      return T.done(results.map((r) => r.slice()));
    },
  };

  G.quizzes.back11 = {
    title: "Backtracking details",
    items: [
      { q: "Combination Sum lets a number be reused. What does the recursive call pass as the start index?", options: ["i (the same index)", "i + 1", "0", "start"], answer: 0, why: "Passing i allows the same candidate again; moving forward only prevents reorderings." },
      { q: "Subsets of [1, 2, 3]. Why pass i + 1, not 0?", options: ["So [2, 1] is never produced after [1, 2]", "To make it faster only", "Because 0 would crash", "It does not matter"], answer: 0, why: "Each subset is built in increasing index order exactly once." },
      { q: "All saved answers come out as empty arrays. The likely cause?", options: ["The live path was saved instead of a copy", "The base case is missing", "The tree is too deep", "Sorting was skipped"], answer: 0, why: "The path is undone back to empty at the end, and every saved entry is that same array." },
      { q: "In N-Queens, why place exactly one queen per row?", options: ["Two queens in one row would attack each other, so each row needs exactly one", "It is faster to draw", "Columns are harder to check", "It is a rule of the puzzle"], answer: 0, why: "That fact turns the search into one decision per row: which column." },
      { q: "Why does generateParenthesis need no filter at the end?", options: ["The two rules allow only valid prefixes, so every finished string is valid", "It filters inside the base case", "It only works for n ≤ 3", "Strings are immutable"], answer: 0, why: "Open only while open < n; close only while close < open. Invalid strings are never built." },
    ],
  };
})();

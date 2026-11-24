/* Lesson 29 · Pattern chooser, mock interviews and the v2 map. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  /* ---------- the clickable pattern chooser (mirrors the master decision flow, fig-1) ---------- */
  const FLOW = {
    B: { q: "Is the input a tree?", opts: [["Yes", "T"], ["No", "C"]] },
    C: { q: "Is the input a linked list?", opts: [["Yes", "L"], ["No", "D"]] },
    D: { q: "Is it a graph, a grid, or a space of states and moves?", opts: [["Yes", "G"], ["No", "E"]] },
    G: { q: "What is asked?", opts: [["Fewest steps, all moves equal", "G1"], ["Cheapest path with weights", "G2"], ["An order with prerequisites", "G3"], ["Groups, merging, cycles", "G4"], ["Regions, reachability", "G5"]] },
    E: { q: "Does it ask you to generate ALL answers (every subset, permutation, placement)?", opts: [["Yes", "BT"], ["No", "F"]] },
    F: { q: "Is it about a contiguous subarray or substring?", opts: [["Yes", "F1"], ["No", "H"]] },
    F1: { q: "What kind of rule?", opts: [["Positives, or a grow/shrink rule", "W"], ["Sum equals K, negatives allowed", "PS"]] },
    H: { q: "Is the input sorted, or is the answer a threshold you could test?", opts: [["Yes", "BS"], ["No", "I"]] },
    I: { q: "Min / max / count over choices that overlap?", opts: [["Yes", "DP"], ["No", "J"]] },
    J: { q: "Do you need the top K, the min or max again and again, or a running median?", opts: [["Yes", "HP"], ["No", "K"]] },
    K: { q: "Next greater element, matching brackets, or undo?", opts: [["Yes", "ST"], ["No", "HM"]] },
  };
  const LEAF = {
    T: ["Tree recursion; for a BST use the ordering", ["15"]], L: ["Linked list tools: dummy head, slow/fast, reversal", ["12"]],
    G1: ["BFS", ["19"]], G2: ["Dijkstra or Bellman-Ford", ["22"]], G3: ["Topological sort", ["20"]], G4: ["Union-find, or DFS", ["21", "19"]], G5: ["DFS or BFS flood fill", ["19"]],
    BT: ["Backtracking", ["11"]], W: ["Sliding window", ["06"]], PS: ["Prefix sums + a hash map", ["07"]], BS: ["Binary search, or two pointers", ["08", "05"]],
    DP: ["Dynamic programming (or greedy, if you can prove it)", ["25", "26", "23"]], HP: ["A heap", ["17"]], ST: ["A stack (monotonic if \"next greater\")", ["13"]], HM: ["A hash map, sorting, or intervals", ["04", "09", "24"]],
  };
  function mountChooser(el) {
    let path = ["A", "B"];
    const fig = document.getElementById("fig-1");
    const paint = () => {
      const cur = path[path.length - 1];
      try { if (fig && G.diagrams) G.diagrams.light(fig, path); } catch (e) { /* the map may not be rendered yet */ }
      const crumbs = path.slice(1, -1).map((k, i) => { const nx = path[i + 2]; const o = FLOW[k].opts.find((x) => x[1] === nx); return `<li>${G.esc(FLOW[k].q)} <b>${G.esc(o ? o[0] : "")}</b></li>`; }).join("");
      let body;
      if (FLOW[cur]) body = `<p class="ch-q">${G.esc(FLOW[cur].q)}</p><div class="ch-opts">${FLOW[cur].opts.map(([t, to]) => `<button class="btn ghost" data-to="${to}">${G.esc(t)}</button>`).join("")}</div>`;
      else { const [name, ids] = LEAF[cur]; body = `<p class="ch-q">Reach for: <strong>${G.esc(name)}</strong></p><p class="ch-links">${ids.map((id) => `<a href="${G.lessonHref(id)}">${id} · ${G.esc(G.lessonById(id).title)}</a>`).join(" ")}</p>`; }
      el.innerHTML = `<div class="ch-head"><b>Pattern chooser</b><span>Answer a few questions about the problem in front of you. The map below lights up the path.</span></div>${crumbs ? `<ol class="ch-path">${crumbs}</ol>` : ""}${body}<div class="ch-foot">${path.length > 2 ? '<button class="btn ghost" data-back>Back</button>' : ""}<button class="btn ghost" data-reset>Start over</button></div>`;
    };
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.to) path.push(b.dataset.to);
      else if (b.hasAttribute("data-back")) path.pop();
      else if (b.hasAttribute("data-reset")) path = ["A", "B"];
      paint();
    });
    paint();
    // the map renders lazily; light it again once it exists
    setTimeout(paint, 1500);
  }

  /* ---------- searchable v2 map ---------- */
  function mountSearch(el) {
    el.innerHTML = `<label class="v2-label" for="v2q">Find a topic, a LeetCode number or a v2 file</label><input id="v2q" class="v2-input" type="search" placeholder="for example: 239, sliding, Q7, heap" autocomplete="off"><p class="v2-count" aria-live="polite"></p>`;
    const input = el.querySelector("input"), count = el.querySelector(".v2-count");
    const tables = ["tbl-12", "tbl-13", "tbl-14", "tbl-15"].map((id) => document.getElementById(id)).filter(Boolean);
    const run = () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0, total = 0;
      tables.forEach((t) => t.querySelectorAll("tbody tr").forEach((tr) => {
        total++;
        const hit = !q || tr.textContent.toLowerCase().includes(q);
        tr.hidden = !hit;
        tr.classList.toggle("is-lit", !!q && hit);
        if (hit) shown++;
      }));
      count.textContent = q ? `${shown} of ${total} rows match "${input.value.trim()}".` : `${total} rows in the four tables below.`;
    };
    input.addEventListener("input", run);
    run();
  }
  const boot = () => {
    document.querySelectorAll("[data-chooser]").forEach(mountChooser);
    document.querySelectorAll("[data-v2search]").forEach(mountSearch);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  /* ---------- Mock 1: find all anagrams ---------- */
  A.anagrams = {
    title: "Mock 1 · Find All Anagrams: a fixed window with a missing counter",
    viz: "array", legend: ["p1:the window", "focus:letter entering", "done:letter leaving", "answer:an anagram starts here"],
    inputLabel: "s ; p", hint: "cbaebabacd ; abc",
    presets: [{ label: "cbaebabacd ; abc", input: "cbaebabacd ; abc" }, { label: "abab ; ab", input: "abab ; ab" }, { label: "aaaaa ; aa", input: "aaaaa ; aa" }],
    parse(s) { const [a, b] = P.parts(s, 2, "s ; p"); const x = a.trim(), y = b.trim(); if (!/^[a-z]{1,16}$/.test(x) || !/^[a-z]{1,6}$/.test(y)) throw new Error("Lowercase letters: s up to 16, p up to 6."); return { s: x, p: y }; },
    lines: { add: { ts: "if (need[add] > 0) missing--; // this letter fills a real gap", go: "missing-- // this letter fills a real gap" }, drop: { ts: "if (need[drop] > 0) missing++; // we just lost a needed letter", go: "missing++ // we just lost a needed letter" }, hit: { ts: "if (r >= m - 1 && missing === 0) result.push(r - m + 1);", go: "result = append(result, r-m+1) // a full window with nothing missing" } },
    table: { id: "tbl-7", preset: 0, rows: ["r0", "r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9"] },
    trace({ s, p }) {
      const Tr = new G.Trace();
      const m = p.length, result = [];
      if (m > s.length) { Tr.add({ at: "hit", state: { cells: s.split("").map((c, i) => ({ id: i, v: c })) }, vars: {}, say: "p is longer than s: no window fits. []." }); return Tr.done(result); }
      const need = Array(26).fill(0);
      for (const c of p) need[c.charCodeAt(0) - 97]++;
      let missing = m;
      const letters = [...new Set(p.split(""))];
      const st = (r, drop) => ({ cellW: 36, gap: 4, cells: s.split("").map((c, i) => ({ id: i, v: c, m: i === r ? "focus" : i === drop ? "done" : result.includes(i) && i <= r - m + 1 ? "answer" : i > r - m && i <= r ? "p1" : null })), zones: r >= m - 1 ? [{ from: r - m + 1, to: r, label: `missing ${missing}`, cls: "1" }] : [], panels: [{ title: "need (p's letters)", keyW: 30, valW: 40, entries: letters.map((c) => [c, need[c.charCodeAt(0) - 97]]) }] });
      for (let r = 0; r < s.length; r++) {
        const add = s.charCodeAt(r) - 97;
        const filled = need[add] > 0;
        if (filled) missing--;
        need[add]--;
        let drop = null, lost = false;
        if (r >= m) { drop = r - m; const d = s.charCodeAt(drop) - 97; need[d]++; if (need[d] > 0) { missing++; lost = true; } }
        const hit = r >= m - 1 && missing === 0;
        if (hit) result.push(r - m + 1);
        Tr.add({ key: "r" + r, at: hit ? "hit" : drop != null ? "drop" : "add", state: st(r, drop), vars: { r, missing }, say: `Add "${s[r]}" (${filled ? "fills a gap" : "not needed, a surplus"}).${drop != null ? ` Drop "${s[drop]}" (${lost ? "a needed letter is lost" : "a surplus leaves"}).` : ""} missing = ${missing}.${hit ? ` Nothing missing in a full window: an anagram starts at ${r - m + 1}.` : ""}` });
      }
      Tr.add({ state: st(-1, null), vars: { result: `[${result.join(", ")}]` }, say: `Result [${result.join(", ")}]. O(n) with O(1) work per step.` });
      return Tr.done(result);
    },
  };

  /* ---------- Mock 2: evaluate division ---------- */
  A.division = {
    title: "Mock 2 · Evaluate Division: a graph of ratios, multiply along a path",
    viz: "graph", legend: ["focus:popped from the stack", "p1:visited", "answer:reached the target", "hot:edge being followed"],
    inputLabel: "equations a/b=v … ; queries a/c …", hint: "a/b=2 b/c=3 ; a/c b/a a/e a/a x/x",
    presets: [{ label: "the LeetCode example", input: "a/b=2 b/c=3 ; a/c b/a a/e a/a x/x" }, { label: "two separate groups", input: "a/b=1.5 c/d=2.5 ; a/c c/d" }],
    parse(s) {
      const [a, b] = P.parts(s, 2, 'equations, then ";" and queries');
      const eqs = a.trim().split(/\s+/).map((x) => { const m = x.match(/^([a-z]+)\/([a-z]+)=(\d+(?:\.\d+)?)$/); if (!m || +m[3] === 0) throw new Error(`"${x}" should look like a/b=2 (non-zero).`); return [m[1], m[2], +m[3]]; });
      const qs = b.trim().split(/\s+/).map((x) => { const m = x.match(/^([a-z]+)\/([a-z]+)$/); if (!m) throw new Error(`"${x}" should look like a/c.`); return [m[1], m[2]]; });
      if (eqs.length > 6 || qs.length > 6) throw new Error("Up to 6 equations and 6 queries.");
      return { eqs, qs };
    },
    lines: { build: { ts: "link(b, a, 1 / values[i]); // b / a = 1 / value", go: "return -1 // an unknown variable" }, unknown: { ts: "if (!graph.has(src) || !graph.has(dst)) return -1;", go: "return -1 // an unknown variable" }, same: { ts: "if (src === dst) return 1;", go: "return -1 // an unknown variable" }, pop: { ts: "const [node, product] = stack.pop()!;", go: "cur := stack[len(stack)-1]" }, found: { ts: "if (next === dst) return product * ratio;", go: "return cur.product * ratio // found a path: multiply the last step" }, push: { ts: "stack.push([next, product * ratio]);", go: "stack = append(stack, entry{next, cur.product * ratio})" }, none: { ts: "return -1; // no path: not determinable", go: "return -1 // no path: not determinable" } },
    trace({ eqs, qs }) {
      const Tr = new G.Trace();
      const graph = new Map();
      const link = (x, y, r) => { if (!graph.has(x)) graph.set(x, new Map()); graph.get(x).set(y, r); };
      eqs.forEach(([x, y, v]) => { link(x, y, v); link(y, x, 1 / v); });
      const ids = [...graph.keys()];
      const edges = eqs.map(([x, y, v]) => ({ a: x, b: y, w: `×${+v.toFixed(3)}` }));
      const fmt = (v) => +v.toFixed(4);
      const st = (cur, hot, visited, hit, note) => ({ directed: true, root: ids[0], nodes: ids.map((n) => ({ id: n, label: n, m: n === hit ? "answer" : n === cur ? "focus" : visited && visited.has(n) ? "p1" : null })), edges: edges.map((e) => ({ ...e, m: hot && ((hot[0] === e.a && hot[1] === e.b) || (hot[0] === e.b && hot[1] === e.a)) ? "hot" : null })), note: note ? { text: note } : undefined });
      Tr.add({ at: "build", state: st(), vars: { variables: ids.length }, say: "Each equation a / b = v is an edge a → b worth ×v, and b → a worth ×1/v. A query a / c is a path from a to c: multiply the ratios along it." });
      const out = [];
      qs.forEach(([src, dst]) => {
        const q = `${src}/${dst}`;
        if (!graph.has(src) || !graph.has(dst)) { out.push(-1); Tr.add({ at: "unknown", state: st(null, null, null, null, `${q} = −1`), vars: { query: q }, say: `${q}: a variable never appears in any equation: −1.` }); return; }
        if (src === dst) { out.push(1); Tr.add({ at: "same", state: st(src, null, null, src, `${q} = 1`), vars: { query: q }, say: `${q}: the same known variable: 1.` }); return; }
        const visited = new Set([src]);
        const stack = [[src, 1]];
        let ans = -1;
        outer: while (stack.length) {
          const [node, prod] = stack.pop();
          Tr.add({ at: "pop", state: st(node, null, visited, null, `${q}: product so far ${fmt(prod)}`), vars: { query: q, node, product: fmt(prod) }, say: `Pop ${node} with product ${fmt(prod)} (= ${src} / ${node}).` });
          for (const [next, r] of graph.get(node)) {
            if (next === dst) { ans = prod * r; Tr.add({ at: "found", state: st(node, [node, next], visited, next, `${q} = ${fmt(ans)}`), vars: { query: q, answer: fmt(ans) }, say: `${node} → ${dst} ×${fmt(r)}: reached the target. ${q} = ${fmt(prod)} × ${fmt(r)} = ${fmt(ans)}.` }); break outer; }
            if (!visited.has(next)) { visited.add(next); stack.push([next, prod * r]); Tr.add({ at: "push", state: st(node, [node, next], visited, null, `${q}`), vars: { next, product: fmt(prod * r) }, say: `Follow ${node} → ${next} (×${fmt(r)}): push it with product ${fmt(prod * r)}.` }); }
          }
        }
        if (ans === -1) Tr.add({ at: "none", state: st(null, null, visited, null, `${q} = −1`), vars: { query: q }, say: `No path from ${src} to ${dst}: they are in different groups. −1.` });
        out.push(ans);
      });
      return Tr.done(out);
    },
  };

  /* ---------- Mock 3: longest valid parentheses ---------- */
  A.parens = {
    title: "Mock 3 · Longest Valid Parentheses: a stack of indexes", short: "Stack of indexes",
    viz: "array", legend: ["focus:i", "anchor:the base (index just before the valid stretch)", "answer:the longest valid stretch"],
    inputLabel: "a string of ( and )", hint: ")()())",
    presets: [{ label: ")()())", input: ")()())" }, { label: "()(())", input: "()(())" }, { label: "()(()", input: "()(()" }],
    parse(s) { const t = String(s).trim().replace(/^"|"$/g, ""); if (!/^[()]{0,16}$/.test(t)) throw new Error("Up to 16 characters, only ( and )."); return t; },
    lines: { push: { ts: "longestValidParentheses(s: string)>>stack.push(i);", go: "func longestValidParentheses>>stack = append(stack, i)" }, base: { ts: "if (stack.length === 0) stack.push(i); // an unmatched ')' becomes the new base", go: "stack = append(stack, i) // an unmatched ')' becomes the new base" }, len: { ts: "else best = Math.max(best, i - stack[stack.length - 1]);", go: "best = max(best, i-stack[len(stack)-1]) // length of the valid stretch ending here" } },
    table: { id: "tbl-10", preset: 0, rows: ["start", "i0", "i1", "i2", "i3", "i4", "i5"] },
    trace(s) {
      const Tr = new G.Trace();
      const stack = [-1];
      let best = 0, bs = -1, be = -1;
      const st = (i) => ({ cellW: 36, gap: 4, rows: [{ label: "s", cells: s.split("").map((c, k) => ({ id: "c" + k, v: c, m: k === i ? "focus" : k === stack[stack.length - 1] ? "anchor" : k > bs && k <= be ? "answer" : null })), zones: be >= 0 ? [{ from: bs + 1, to: be, label: `best ${best}`, cls: "1" }] : [] }, { label: "stack", cells: stack.map((v, k) => ({ id: "s" + k + ":" + v, v, m: k === stack.length - 1 ? "anchor" : null })) }] });
      Tr.add({ key: "start", at: "push", state: st(null), vars: { best }, say: "The stack holds indexes. Its bottom is the index just before the current valid stretch; start with −1." });
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "(") { stack.push(i); Tr.add({ key: "i" + i, at: "push", state: st(i), vars: { i, best }, say: `"(" at ${i}: push its index.` }); }
        else {
          const popped = stack.pop();
          if (!stack.length) { stack.push(i); Tr.add({ key: "i" + i, at: "base", state: st(i), vars: { i, best }, say: `")" at ${i}: pop ${popped}; the stack is empty, so this ")" is unmatched. It becomes the new base.` }); }
          else { const len = i - stack[stack.length - 1]; if (len > best) { best = len; bs = stack[stack.length - 1]; be = i; } Tr.add({ key: "i" + i, at: "len", state: st(i), vars: { i, length: len, best }, say: `")" at ${i}: pop ${popped}. The top is ${stack[stack.length - 1]}, so the valid stretch ending here has length ${i} − ${stack[stack.length - 1]} = ${len}.` }); }
        }
      }
      Tr.add({ state: st(null), vars: { answer: best }, say: `Answer ${best}. O(n) time and O(n) stack.` });
      return Tr.done(best);
    },
  };
  A.parens2 = {
    title: "Mock 3 · Longest Valid Parentheses: a stack of indexes", short: "Two passes, O(1) memory",
    viz: "array", legend: ["focus:i", "p1:counted since the last reset"],
    inputLabel: "a string of ( and )", hint: "()(()",
    presets: [{ label: "()(()", input: "()(()" }, { label: ")()())", input: ")()())" }],
    parse: (s) => A.parens.parse(s),
    lines: { lr: { ts: "if (open === close) best = Math.max(best, 2 * close);", go: "best = max(best, 2*close)" }, lreset: { ts: "else if (close > open) open = close = 0;", go: "open, close = 0, 0 // too many ')': start over" }, rl: { ts: "if (open === close) best = Math.max(best, 2 * open);", go: "best = max(best, 2*open)" }, rreset: { ts: "else if (open > close) open = close = 0;", go: "open, close = 0, 0 // too many '(': start over" } },
    trace(s) {
      const Tr = new G.Trace();
      let best = 0, open = 0, close = 0, from = 0;
      const st = (i, a, b) => ({ cellW: 36, gap: 4, cells: s.split("").map((c, k) => ({ id: "c" + k, v: c, m: k === i ? "focus" : k >= a && k <= b ? "p1" : null })), note: { text: `open ${open} · close ${close} · best ${best}` } });
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "(") open++; else close++;
        if (open === close) { best = Math.max(best, 2 * close); Tr.add({ at: "lr", state: st(i, from, i), vars: { pass: "left to right", i, best }, say: `Balanced (${open} each): a valid stretch of ${2 * close}. best = ${best}.` }); }
        else if (close > open) { open = close = 0; from = i + 1; Tr.add({ at: "lreset", state: st(i, from, i), vars: { i }, say: `More ")" than "(": nothing valid can continue through here. Reset.` }); }
        else Tr.add({ at: "lr", state: st(i, from, i), vars: { i, open, close }, say: `Still more "(" than ")": keep going.` });
      }
      open = close = 0; from = s.length - 1;
      for (let i = s.length - 1; i >= 0; i--) {
        if (s[i] === "(") open++; else close++;
        if (open === close) { best = Math.max(best, 2 * open); Tr.add({ at: "rl", state: st(i, i, from), vars: { pass: "right to left", i, best }, say: `Right to left, balanced: ${2 * open}. best = ${best}. This pass catches strings like "(()" that the first pass never balances.` }); }
        else if (open > close) { open = close = 0; from = i - 1; Tr.add({ at: "rreset", state: st(i, i, from), vars: { i }, say: `More "(" than ")" from the right: reset.` }); }
      }
      Tr.add({ at: "rl", state: st(-1, 1, 0), vars: { answer: best }, say: `Answer ${best}, with two counters and no stack.` });
      return Tr.done(best);
    },
  };

  /* ---------- quizzes ---------- */
  G.quizzes.drill29 = {
    title: "Which pattern? A drill",
    items: [
      { q: "\"Longest substring with at most K distinct characters.\"", options: ["Sliding window", "Prefix sums", "Binary search", "DP"], answer: 0, why: "Contiguous, and the window can grow and shrink by a rule." },
      { q: "\"Number of subarrays whose sum equals K; values can be negative.\"", options: ["Prefix sums + a hash map", "Sliding window", "Two pointers", "Heap"], answer: 0, why: "Negatives break the window's shrink rule." },
      { q: "\"Minimum days to make m bouquets.\" (answer is a day; checking a day is easy)", options: ["Binary search on the answer", "Greedy", "BFS", "Union-find"], answer: 0, why: "If day d works, every later day works: a first-true boundary." },
      { q: "\"Return all ways to place N queens.\"", options: ["Backtracking", "DP", "BFS", "Greedy"], answer: 0, why: "Generate all answers, with pruning." },
      { q: "\"Course order given prerequisites.\"", options: ["Topological sort", "Dijkstra", "Union-find", "Heap"], answer: 0, why: "An order that respects every \"before\"." },
      { q: "\"Daily temperatures: days until a warmer day.\"", options: ["Monotonic stack", "Heap", "Sliding window", "Binary search"], answer: 0, why: "Next greater element." },
      { q: "\"Fewest moves for a knight to reach a square.\"", options: ["BFS", "DFS", "Dijkstra", "DP on rows"], answer: 0, why: "Every move costs the same." },
      { q: "\"Edit distance between two words.\"", options: ["2-D DP", "Greedy", "Two pointers", "Trie"], answer: 0, why: "Two strings, overlapping choices: a table over both prefixes." },
      { q: "\"k-th largest in a stream.\"", options: ["A min-heap of size k", "Sorting each time", "A max-heap of everything", "Binary search"], answer: 0, why: "Its top is the k-th largest." },
      { q: "\"Are these two accounts the same person? Emails link accounts.\"", options: ["Union-find", "Topological sort", "Sliding window", "Bit manipulation"], answer: 0, why: "Groups that only merge." },
    ],
  };
  G.quizzes.final29 = {
    title: "Mock interviews",
    items: [
      { q: "First thing to do after hearing the problem?", options: ["Restate it and ask clarifying questions", "Start coding the optimal solution", "Write tests", "State the complexity"], answer: 0, why: "It catches misunderstandings while they are cheap." },
      { q: "You have no idea for the optimal solution. Best move?", options: ["Say the brute force and its cost, then look for the repeated work", "Stay silent and think", "Guess a pattern", "Ask for the answer"], answer: 0, why: "A working baseline plus a named bottleneck often points at the pattern." },
      { q: "Find All Anagrams: why a missing counter instead of comparing two count arrays each step?", options: ["Each step changes it by at most 2 in O(1)", "It uses less memory", "Arrays cannot be compared", "It handles uppercase"], answer: 0, why: "Comparing 26 counts each step is O(26 n); fine too, but the counter is O(1)." },
      { q: "Before saying \"done\", what should you do?", options: ["Trace a small example and an edge case through the code out loud", "Rename variables", "Ask how you did", "Optimize further"], answer: 0, why: "Interviewers score testing as its own dimension." },
    ],
  };
})();

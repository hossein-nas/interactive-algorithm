/* Lesson 20 · Topological sort — Kahn's algorithm, three-color DFS, semesters, alien dictionary, minimum height trees. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  const parseN = (s, max) => { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 1 || n > (max || 8)) throw new Error(`n must be from 1 to ${max || 8}.`); return n; };
  const parsePairs = (s, lo, hi, what) => String(s).replace(/[\[\]]/g, " ").trim().split(/[\s,]+/).filter(Boolean).map((x) => {
    const m = x.match(/^(\d+)-(\d+)$/);
    if (!m) throw new Error(`"${x}" should look like 1-0 (${what}).`);
    const a = +m[1], b = +m[2];
    if (a < lo || a > hi || b < lo || b > hi) throw new Error(`${x}: nodes must be from ${lo} to ${hi}.`);
    if (a === b) throw new Error(`${x}: a node cannot depend on itself here.`);
    return [a, b];
  });
  // columns by topological level (longest path from a source); nodes stuck on a cycle go in one last column
  function dagLayout(ids, out) {
    const indeg = new Map(ids.map((i) => [i, 0]));
    ids.forEach((u) => (out.get(u) || []).forEach((v) => indeg.set(v, indeg.get(v) + 1)));
    const level = new Map(), q = ids.filter((i) => indeg.get(i) === 0);
    q.forEach((i) => level.set(i, 0));
    for (let h = 0; h < q.length; h++) { const u = q[h]; (out.get(u) || []).forEach((v) => { level.set(v, Math.max(level.get(v) || 0, level.get(u) + 1)); indeg.set(v, indeg.get(v) - 1); if (indeg.get(v) === 0) q.push(v); }); }
    const maxL = Math.max(-1, ...level.values());
    const rows = {}, lay = {};
    ids.forEach((i) => { const c = level.has(i) ? level.get(i) : maxL + 1; rows[c] = (rows[c] || 0) + 1; lay[i] = [c, rows[c] - 1]; });
    const tall = Math.max(...Object.values(rows));
    ids.forEach((i) => { const [c, r] = lay[i]; lay[i] = [c, r + (tall - rows[c]) / 2]; });
    return lay;
  }
  const coursePresets = [{ label: "diamond 0 → 1, 2 → 3", input: "4 ; 1-0 2-0 3-1 3-2" }, { label: "a 2-cycle", input: "2 ; 1-0 0-1" }, { label: "a cycle downstream", input: "5 ; 1-0 2-1 3-2 4-3 2-4" }];
  const courseParse = (s) => { const [a, b] = P.parts(s, 2, 'n, then ";" and course-prereq pairs'); const n = parseN(a); return { n, pre: parsePairs(b, 0, n - 1, "course-prerequisite") }; };

  /* ---------- Kahn's algorithm ---------- */
  function kahn({ n, pre }, mode) {
    const Tr = new G.Trace();
    const adj = Array.from({ length: n }, () => []), indeg = Array(n).fill(0);
    const ids = [...Array(n).keys()];
    const out = new Map(ids.map((i) => [i, adj[i]]));
    for (const [c, p] of pre) { adj[p].push(c); indeg[c]++; }
    const lay = dagLayout(ids, out);
    const queue = [];
    let head = 0;
    const doneSet = new Set();
    const st = (cur, hot, end) => ({
      directed: true, layout: lay,
      nodes: ids.map((i) => ({ id: i, sub: `in ${indeg[i]}`, m: end && !doneSet.has(i) ? "bug" : i === cur ? "focus" : doneSet.has(i) ? "anchor" : queue.slice(head).includes(i) ? "p1" : null })),
      edges: pre.map(([c, p]) => ({ a: p, b: c, m: hot && hot[0] === p && hot[1] === c ? "hot" : doneSet.has(p) ? "dim" : null })),
      strip: { title: mode === "order" ? "order (doubles as the queue)" : "queue", items: mode === "order" ? queue.slice() : queue.slice(head), mark: mode === "order" ? Object.fromEntries(queue.map((_, i) => [i, i < head ? "anchor" : null])) : undefined },
    });
    Tr.add({ at: "build", flow: ["A"], state: st(), vars: { nodes: n, edges: pre.length }, say: `Each pair course-prereq is an edge prereq → course. The small number under a node is its in-degree: how many prerequisites it still waits for.` });
    for (let i = 0; i < n; i++) if (indeg[i] === 0) queue.push(i);
    Tr.add({ key: "s0", at: "init", flow: ["B"], state: st(), vars: { queue: `[${queue.join(", ")}]` }, say: queue.length ? `In-degree 0 means nothing to wait for: ${queue.join(", ")} can start.` : "No node has in-degree 0: every node waits on another. A cycle, right away." });
    let step = 0;
    while (head < queue.length) {
      const node = queue[head++];
      const key = "s" + ++step;
      Tr.add({ key, at: "pop", flow: ["C", "D"], state: st(node), vars: { node, processed: head }, say: `Take ${node}: it is ready. Processed ${head} so far.`, ask: adj[node].length ? { q: `${node} is done. What happens to the courses it unlocks (${adj[node].join(", ")})?`, options: ["Each loses one from its in-degree; any that reach 0 join the queue", "They all join the queue now", "Nothing until the queue is empty"], answer: 0, why: "A course is ready only when all its prerequisites are done." } : undefined });
      for (const next of adj[node]) {
        indeg[next]--;
        if (indeg[next] === 0) queue.push(next);
        Tr.add({ key, at: "dec", flow: ["E"], state: st(node, [node, next]), vars: { next, "in-degree": indeg[next] }, say: indeg[next] === 0 ? `${next} loses its last prerequisite (in-degree 0): push it.` : `${next}'s in-degree drops to ${indeg[next]}: still waiting.` });
      }
      doneSet.add(node);
    }
    const ok = head === n;
    Tr.add({ key: "s" + (step + 1), at: "ret", flow: ["C", "F", ok ? "G" : "H"], state: st(null, null, !ok), vars: { processed: head, n }, say: ok ? `Processed ${head} of ${n}: no cycle${mode === "order" ? `; the order is [${queue.join(", ")}]` : ""}.` : `Only ${head} of ${n} processed. The red nodes wait on each other in a cycle forever${mode === "order" ? ": return []" : ""}.` });
    return Tr.done(mode === "order" ? (ok ? queue.slice() : []) : ok);
  }
  A.kahn = {
    title: "Course Schedule: Kahn's algorithm and the three-color DFS", short: "Kahn (in-degrees)",
    viz: "graph", legend: ["p1:ready, in the queue", "focus:taken now", "anchor:done", "bug:stuck on a cycle"],
    inputLabel: "n ; course-prereq pairs", hint: "4 ; 1-0 2-0 3-1 3-2",
    presets: coursePresets, parse: courseParse,
    lines: { build: { ts: "indegree[course]++;", go: "indegree[course]++" }, init: { ts: "for (let i = 0; i < numCourses; i++) if (indegree[i] === 0) queue.push(i);", go: "queue = append(queue, i) // nothing to wait for" }, pop: { ts: "processed++;", go: "processed++" }, dec: { ts: "if (--indegree[next] === 0) queue.push(next);", go: "func canFinish(>>indegree[next]--" }, ret: { ts: "return processed === numCourses;", go: "return processed == numCourses" } },
    table: { id: "tbl-2", preset: 0, rows: ["s0", "s1", "s2", "s3", "s4"] },
    trace: (x) => kahn(x, "bool"),
  };

  function dfs3({ n, pre }, bug) {
    const Tr = new G.Trace();
    const adj = Array.from({ length: n }, () => []);
    const ids = [...Array(n).keys()];
    for (const [c, p] of pre) adj[p].push(c);
    const lay = dagLayout(ids, new Map(ids.map((i) => [i, adj[i]])));
    const state = Array(n).fill(0);
    const path = [];
    let cyc = null;
    const st = (cur, hot, bad) => ({
      directed: true, layout: lay,
      nodes: ids.map((i) => ({ id: i, sub: bug ? (state[i] ? "seen" : "") : ["new", "visiting", "done"][state[i]], m: bad === i ? "bug" : i === cur ? "focus" : state[i] === 1 ? "p1" : state[i] === 2 ? "anchor" : null })),
      edges: pre.map(([c, p]) => ({ a: p, b: c, m: hot && hot[0] === p && hot[1] === c ? hot[2] || "hot" : null })),
      strip: { title: "current path (call stack)", items: path.slice() },
    });
    function has(node) {
      state[node] = 1; path.push(node);
      Tr.add({ at: "visiting", flow: ["A"], state: st(node), vars: { node }, say: bug ? `Visit ${node}: mark it seen.` : `Visit ${node}: color it "visiting" (it is on the current path).` });
      for (const next of adj[node]) {
        if (bug ? state[next] !== 0 : state[next] === 1) {
          Tr.add({ at: "back", flow: ["B", "C", "D"], state: st(node, [node, next, "bug"], next), vars: { node, next }, say: bug ? `${next} was seen before, so this version shouts "cycle". But ${next} may simply be finished: a plain seen-flag cannot tell.` : `${next} is still "visiting": we came back to a node on the current path. Cycle!` });
          cyc = next; return true;
        }
        if (state[next] === 2) { Tr.add({ at: "dive", flow: ["B", "C", "F"], state: st(node, [node, next, "dim"]), vars: { node, next }, say: `${next} is "done": already proven cycle-free. Skip.` }); continue; }
        Tr.add({ at: "dive", flow: ["B", "C", "E"], state: st(node, [node, next]), vars: { node, next }, say: `${next} is new: go deeper.` });
        if (has(next)) return true;
      }
      state[node] = 2; path.pop();
      Tr.add({ at: "done", flow: ["G"], state: st(path[path.length - 1]), vars: { finished: node }, say: bug ? `${node} finished.` : `${node} and everything below it are cycle-free: color it "done".` });
      return false;
    }
    let ok = true;
    for (let i = 0; i < n && ok; i++) if (state[i] === 0) {
      Tr.add({ at: "start", state: st(), vars: { start: i }, say: `Start a DFS from ${i}, which nothing has reached yet.` });
      if (has(i)) ok = false;
    }
    Tr.add({ at: ok ? "ok" : "start", state: st(null, null, cyc), vars: { "can finish": ok }, say: ok ? "No back edge anywhere: all courses can be finished." : bug ? "This answer is wrong when the graph is a diamond: it has no cycle." : "A back edge means a cycle: not every course can be finished." });
    return Tr.done(ok);
  }
  A.dfs3 = {
    title: "Course Schedule: Kahn's algorithm and the three-color DFS", short: "DFS (three colors)",
    viz: "graph", legend: ["p1:visiting (on the current path)", "focus:current", "anchor:done", "bug:cycle"],
    inputLabel: "n ; course-prereq pairs", hint: "4 ; 1-0 2-0 3-1 3-2",
    presets: coursePresets, parse: courseParse,
    lines: { visiting: { ts: "state[node] = 1;", go: "state[node] = 1" }, back: { ts: "if (state[next] === 1) return true; // back to a node on the current path", go: "return true // back to a node on the current path" }, dive: { ts: "if (state[next] === 0 && hasCycle(next)) return true;", go: "if state[next] == 0 && hasCycle(next) {" }, done: { ts: "state[node] = 2;", go: "state[node] = 2" }, start: { ts: "for (let i = 0; i < numCourses; i++) if (state[i] === 0 && hasCycle(i)) return false;", go: "if state[i] == 0 && hasCycle(i) {" }, ok: { ts: "hasCycle(i)) return false;>>return true;", go: "if state[i] == 0 && hasCycle(i) {>>return true" } },
    trace: (x) => dfs3(x, false),
    bugs: [{ label: "Replay the bug: one boolean instead of three colors", input: "4 ; 1-0 2-0 3-1 3-2", banner: "<b>Replaying a bug.</b> This version keeps only a <em>seen</em> flag, so reaching a finished node looks like a cycle.", trace: (x) => dfs3(x, true) }],
  };

  /* ---------- Problem 2: an actual order ---------- */
  A.findOrder = {
    title: "Course Schedule II: the order Kahn's algorithm takes",
    viz: "graph", legend: ["p1:ready", "focus:taken now", "anchor:done", "bug:stuck on a cycle"],
    inputLabel: "n ; course-prereq pairs", hint: "4 ; 1-0 2-0 3-1 3-2",
    presets: coursePresets.concat([{ label: "independent courses", input: "4 ; 3-2" }]), parse: courseParse,
    lines: { build: { ts: "findOrder>>indegree[course]++;", go: "indegree[p[0]]++" }, init: { ts: "if (indegree[i] === 0) order.push(i); // the order doubles as the queue", go: "order = append(order, i) // the order doubles as the queue" }, pop: { ts: "for (const next of adj[order[head]]) {", go: "for _, next := range adj[order[head]] {" }, dec: { ts: "if (--indegree[next] === 0) order.push(next);", go: "order = append(order, next)" }, ret: { ts: "return order.length === numCourses ? order : [];", go: "if len(order) == numCourses {" } },
    trace: (x) => kahn(x, "order"),
  };

  /* ---------- Problem 3: parallel courses ---------- */
  A.semesters = {
    title: "Parallel Courses: Kahn's algorithm one layer at a time",
    viz: "graph", legend: ["focus:taken this semester", "anchor:taken earlier", "bug:never takeable (cycle)"],
    inputLabel: "n ; prev-next pairs (1-indexed)", hint: "3 ; 1-3 2-3",
    presets: [{ label: "1, 2 → 3", input: "3 ; 1-3 2-3" }, { label: "a chain of 4", input: "4 ; 1-2 2-3 3-4" }, { label: "a cycle", input: "3 ; 1-2 2-3 3-1" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'n, then ";" and prev-next pairs'); const n = parseN(a); return { n, rel: parsePairs(b, 1, n, "prev-next") }; },
    lines: { init: { ts: "for (let i = 1; i <= n; i++) if (indegree[i] === 0) current.push(i);", go: "current = append(current, i)" }, sem: { ts: "semesters++;", go: "semesters++" }, dec: { ts: "for (const next of adj[course]) if (--indegree[next] === 0) following.push(next);", go: "following = append(following, next)" }, ret: { ts: "return taken === n ? semesters : -1;", go: "if taken == n {" } },
    trace({ n, rel }) {
      const Tr = new G.Trace();
      const ids = Array.from({ length: n }, (_, i) => i + 1);
      const adj = new Map(ids.map((i) => [i, []])), indeg = new Map(ids.map((i) => [i, 0]));
      rel.forEach(([a, b]) => { adj.get(a).push(b); indeg.set(b, indeg.get(b) + 1); });
      const lay = dagLayout(ids, adj);
      const takenIn = new Map();
      let current = ids.filter((i) => indeg.get(i) === 0), semesters = 0, taken = 0;
      const st = (end) => ({ directed: true, layout: lay, nodes: ids.map((i) => ({ id: i, sub: takenIn.has(i) ? `sem ${takenIn.get(i)}` : `in ${indeg.get(i)}`, m: end && !takenIn.has(i) ? "bug" : takenIn.get(i) === semesters && !end ? "focus" : takenIn.has(i) ? "anchor" : null })), edges: rel.map(([a, b]) => ({ a, b, m: takenIn.has(a) ? "dim" : null })), strip: { title: "ready for the next semester", items: current.slice() } });
      Tr.add({ at: "init", state: st(), vars: { ready: current.join(", ") || "—" }, say: current.length ? `Courses with no prerequisites: ${current.join(", ")}. They can all go in semester 1.` : "Every course has a prerequisite: there is a cycle." });
      while (current.length) {
        semesters++;
        const following = [];
        for (const c of current) { taken++; takenIn.set(c, semesters); for (const x of adj.get(c)) { indeg.set(x, indeg.get(x) - 1); if (indeg.get(x) === 0) following.push(x); } }
        const was = current;
        current = following;
        Tr.add({ at: "sem", state: st(), vars: { semester: semesters, taken }, say: `Semester ${semesters}: take ${was.join(", ")} together. ${following.length ? `That unlocks ${following.join(", ")}.` : "Nothing new unlocks."}` });
      }
      const res = taken === n ? semesters : -1;
      Tr.add({ at: "ret", state: st(res === -1), vars: { answer: res }, say: res === -1 ? `Only ${taken} of ${n} could ever be taken: −1.` : `${semesters} semesters: the length of the longest prerequisite chain.` });
      return Tr.done(res);
    },
  };

  /* ---------- Problem 4: alien dictionary ---------- */
  A.alien = {
    title: "Alien Dictionary: compare neighbors, then Kahn on letters",
    viz: "graph", legend: ["hot:the edge just learned", "p1:ready", "focus:placed now", "anchor:placed", "bug:stuck on a cycle"],
    inputLabel: "words in the alien sorted order", hint: "wrt wrf er ett rftt",
    presets: [{ label: "wrt wrf er ett rftt", input: "wrt wrf er ett rftt" }, { label: "z x z (a cycle)", input: "z x z" }, { label: "abc ab (prefix trap)", input: "abc ab" }],
    parse(s) { const w = String(s).replace(/[\[\],"']/g, " ").trim().split(/\s+/).filter(Boolean); if (!w.length) throw new Error("Type some words."); if (w.length > 7) throw new Error("Up to 7 words."); w.forEach((x) => { if (!/^[a-z]+$/.test(x) || x.length > 6) throw new Error(`"${x}": lowercase letters, up to 6.`); }); return w; },
    lines: { letters: { ts: "if (!indegree.has(ch)) indegree.set(ch, 0);", go: "indegree[word[i]] = 0" }, prefix: { ts: 'if (a.length > b.length && a.startsWith(b)) return "";', go: 'return "" // "abc" before "ab" is impossible' }, cmp: { ts: "for (let j = 0; j < Math.min(a.length, b.length); j++) {", go: "for j := 0; j < min(len(a), len(b)); j++ {" }, edge: { ts: "adj.get(a[j])!.add(b[j]); // a[j] comes before b[j]", go: "adj[a[j]] = append(adj[a[j]], b[j]) // a[j] comes before b[j]" }, init: { ts: "for (const [ch, d] of indegree) if (d === 0) order.push(ch);", go: "for _, ch := range letters {" }, pop: { ts: "for (const next of adj.get(order[head])!) {", go: "for _, next := range adj[order[head]] {" }, ret: { ts: 'return order.length === indegree.size ? order.join("") : "";', go: "if len(order) == len(letters) {" } },
    table: { id: "tbl-3", preset: 0, rows: ["p0", "p1", "p2", "p3"] },
    trace(words) {
      const Tr = new G.Trace();
      const letters = [];
      words.forEach((w) => { for (const ch of w) if (!letters.includes(ch)) letters.push(ch); });
      const adj = new Map(letters.map((c) => [c, []])), indeg = new Map(letters.map((c) => [c, 0]));
      const edges = [];
      let lay = dagLayout(letters, adj);
      const order = [];
      let head = 0;
      const placed = new Set();
      const st = (hot, cur, end) => ({ directed: true, layout: lay, nodes: letters.map((c) => ({ id: c, label: c, sub: `in ${indeg.get(c)}`, m: end && !placed.has(c) ? "bug" : c === cur ? "focus" : placed.has(c) ? "anchor" : order.includes(c) ? "p1" : null })), edges: edges.map(([a, b]) => ({ a, b, m: hot && hot[0] === a && hot[1] === b ? "hot" : placed.has(a) ? "dim" : null })), note: { text: `order: ${order.join("") || "—"}` } });
      Tr.add({ at: "letters", state: st(), vars: { letters: letters.length }, say: `Every letter that appears is a node, even with no rules: ${letters.join(", ")}.` });
      for (let i = 0; i + 1 < words.length; i++) {
        const a = words[i], b = words[i + 1];
        if (a.length > b.length && a.startsWith(b)) { Tr.add({ key: "p" + i, at: "prefix", state: st(), vars: { a, b }, say: `"${a}" comes before its own prefix "${b}": no alphabet can do that. Return "".` }); return Tr.done(""); }
        let found = false;
        for (let j = 0; j < Math.min(a.length, b.length); j++) if (a[j] !== b[j]) {
          found = true;
          const isNew = !adj.get(a[j]).includes(b[j]);
          if (isNew) { adj.get(a[j]).push(b[j]); indeg.set(b[j], indeg.get(b[j]) + 1); edges.push([a[j], b[j]]); lay = dagLayout(letters, adj); }
          Tr.add({ key: "p" + i, at: "edge", state: st([a[j], b[j]]), vars: { a, b, "first difference": `${a[j]} vs ${b[j]}` }, say: `"${a}" before "${b}": the first difference is ${a[j]} vs ${b[j]}, so ${a[j]} comes before ${b[j]}${isNew ? "" : " (already known)"}. Later letters tell us nothing.` });
          break;
        }
        if (!found) Tr.add({ key: "p" + i, at: "cmp", state: st(), vars: { a, b }, say: `"${a}" and "${b}" agree on every shared position: no rule.` });
      }
      for (const c of letters) if (indeg.get(c) === 0) order.push(c);
      Tr.add({ at: "init", state: st(), vars: { ready: order.join(", ") || "—" }, say: `Letters with in-degree 0 can come first: ${order.join(", ") || "none"}.` });
      while (head < order.length) {
        const c = order[head++];
        const add = [];
        for (const x of adj.get(c)) { indeg.set(x, indeg.get(x) - 1); if (indeg.get(x) === 0) { order.push(x); add.push(x); } }
        placed.add(c);
        Tr.add({ at: "pop", state: st(null, c), vars: { letter: c, order: order.slice(0, head).join("") }, say: `Place ${c}.${add.length ? ` ${add.join(", ")} now ha${add.length > 1 ? "ve" : "s"} no earlier letter left: ready.` : ""}` });
      }
      const ok = order.length === letters.length;
      Tr.add({ at: "ret", state: st(null, null, !ok), vars: { answer: ok ? order.join("") : '""' }, say: ok ? `Alphabet: "${order.join("")}".` : "Some letters wait on each other: the rules contradict. Return \"\"." });
      return Tr.done(ok ? order.join("") : "");
    },
  };

  /* ---------- Problem 5: minimum height trees ---------- */
  A.mht = {
    title: "Minimum Height Trees: peel the leaves layer by layer",
    viz: "graph", legend: ["focus:leaves peeled this round", "done:removed", "answer:the center"],
    inputLabel: "n ; edges of a tree", hint: "6 ; 3-0 3-1 3-2 3-4 5-4",
    presets: [{ label: "the lesson's 6-node tree", input: "6 ; 3-0 3-1 3-2 3-4 5-4" }, { label: "a star", input: "4 ; 1-0 1-2 1-3" }, { label: "a path of 7", input: "7 ; 0-1 1-2 2-3 3-4 4-5 5-6" }],
    parse(s) {
      const [a, b] = P.parts(s, 2, 'n, then ";" and the edges'); const n = parseN(a, 9);
      const e = b.trim() ? parsePairs(b, 0, n - 1, "a-b") : [];
      if (e.length !== n - 1) throw new Error(`A tree on ${n} nodes has exactly ${n - 1} edges.`);
      const p = [...Array(n).keys()]; const f = (x) => (p[x] === x ? x : (p[x] = f(p[x])));
      e.forEach(([x, y]) => { if (f(x) === f(y)) throw new Error("Those edges make a cycle: give a tree."); p[f(x)] = f(y); });
      return { n, e };
    },
    lines: { one: { ts: "if (n === 1) return [0];", go: "return []int{0}" }, leaves: { ts: "for (let i = 0; i < n; i++) if (degree[i] === 1) leaves.push(i);", go: "leaves = append(leaves, i)" }, peel: { ts: "remaining -= leaves.length; // peel off this whole layer", go: "remaining -= len(leaves) // peel off this whole layer" }, ret: { ts: "return leaves.sort((x, y) => x - y);", go: "sort.Ints(leaves)" } },
    table: { id: "tbl-4", preset: 0, rows: ["r0", "r1", "r2"] },
    trace({ n, e }) {
      const Tr = new G.Trace();
      if (n === 1) { Tr.add({ at: "one", state: { nodes: [{ id: 0, m: "answer" }], edges: [] }, vars: {}, say: "One node: it is the center." }); return Tr.done([0]); }
      const adj = Array.from({ length: n }, () => []), deg = Array(n).fill(0);
      e.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); deg[a]++; deg[b]++; });
      const gone = new Set();
      let leaves = [];
      for (let i = 0; i < n; i++) if (deg[i] === 1) leaves.push(i);
      const st = (hot, final) => ({ root: e.length ? e[0][0] : 0, nodes: [...Array(n).keys()].map((i) => ({ id: i, sub: gone.has(i) ? null : `deg ${deg[i]}`, m: final && final.includes(i) ? "answer" : hot.includes(i) ? "focus" : gone.has(i) ? "done" : null })), edges: e.map(([a, b]) => ({ a, b, m: gone.has(a) || gone.has(b) ? "dim" : null })) });
      Tr.add({ key: "r0", at: "leaves", state: st(leaves), vars: { leaves: leaves.join(", ") }, say: `Leaves (degree 1): ${leaves.join(", ")}. A center is as far as possible from every leaf, so peel leaves from the outside in.` });
      let remaining = n, round = 0;
      while (remaining > 2) {
        remaining -= leaves.length;
        round++;
        const next = [];
        for (const l of leaves) { gone.add(l); for (const nb of adj[l]) { if (--deg[nb] === 1) next.push(nb); } }
        const peeled = leaves;
        leaves = next;
        Tr.add({ key: "r" + round, at: "peel", state: st(leaves), vars: { round, peeled: peeled.join(", "), remaining }, say: `Round ${round}: remove ${peeled.join(", ")}. ${remaining} node${remaining === 1 ? "" : "s"} left; the new leaves are ${leaves.join(", ")}.` });
      }
      const res = leaves.slice().sort((x, y) => x - y);
      Tr.add({ key: "r" + (round + 1), at: "ret", state: st([], res), vars: { answer: `[${res.join(", ")}]` }, say: `At most 2 nodes remain: [${res.join(", ")}]. Rooting the tree there gives the minimum height. O(n).` });
      return Tr.done(res);
    },
  };

  G.quizzes.topo20 = {
    title: "Topological sort",
    items: [
      { q: "In LeetCode 207, the pair [a, b] means…", options: ["b must come before a: edge b → a", "a must come before b", "a and b are in the same semester", "an undirected edge"], answer: 0, why: "Draw one example before coding; reversing it is the classic slip." },
      { q: "Kahn's algorithm processed 5 of 7 nodes. What does it mean?", options: ["There is a cycle among the other 2+ nodes", "Two nodes are isolated", "The order is not unique", "It needs a second pass"], answer: 0, why: "Nodes on a cycle never reach in-degree 0." },
      { q: "Why does cycle detection in a directed graph need three colors, not a boolean?", options: ["To tell \"on the current path\" from \"already finished\"", "To save memory", "To find the shortest cycle", "Booleans are slower"], answer: 0, why: "A diamond reaches a finished node twice without any cycle." },
      { q: "How can you tell from Kahn's queue that the order is unique?", options: ["The queue never holds more than one node", "The queue is empty at the end", "All in-degrees start at 1", "The graph is a tree"], answer: 0, why: "Two ready nodes at once could go in either order." },
      { q: "Alien Dictionary: which word pairs give rules?", options: ["Adjacent words, first differing letter only", "Every pair of words", "Adjacent words, every differing letter", "Only the first and last word"], answer: 0, why: "After the first difference, later letters say nothing about order." },
    ],
  };
})();

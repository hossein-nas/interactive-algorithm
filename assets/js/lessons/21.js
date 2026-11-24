/* Lesson 21 · Union-find — a forest of leaders, path halving, union by size, and five problems. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  /* The lesson's UnionFind, step for step. emit(at, info, say) is called inside find/union when given. */
  function UF(n, opts) {
    opts = opts || {};
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = Array(n).fill(1);
    this.count = n;
    this.naive = !!opts.naive;
  }
  UF.prototype.find = function (x, emit) {
    const start = x;
    while (this.parent[x] !== x) {
      if (!this.naive) {
        const before = this.parent[x];
        this.parent[x] = this.parent[this.parent[x]];
        if (emit && before !== this.parent[x]) emit("halve", { focus: [x] }, `find(${start}): ${x}'s parent was ${before}; point it at its grandparent ${this.parent[x]} instead. The path gets shorter for next time.`);
        else if (emit) emit("loop", { focus: [x] }, `find(${start}): climb from ${x} to ${this.parent[x]}.`);
      } else if (emit) emit("loop", { focus: [x] }, `find(${start}): climb from ${x} to ${this.parent[x]}.`);
      x = this.parent[x];
    }
    if (emit) emit("root", { answer: [x] }, `find(${start}) = ${x}: it is its own parent, the leader.`);
    return x;
  };
  UF.prototype.root = function (x) { while (this.parent[x] !== x) x = this.parent[x]; return x; }; // for the picture only: no halving
  UF.prototype.union = function (a, b, emit) {
    let ra = this.find(a, emit), rb = this.find(b, emit);
    if (ra === rb) { if (emit) emit("same", { bug: [ra] }, `Both leaders are ${ra}: ${a} and ${b} are already together. Return false.`); return false; }
    if (this.naive) { this.parent[ra] = rb; this.count--; if (emit) emit("hang", { focus: [ra] }, `Hang ${ra} under ${rb}, with no thought for size.`); return true; }
    if (this.size[ra] < this.size[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra; this.size[ra] += this.size[rb]; this.count--;
    if (emit) emit("hang", { focus: [rb], answer: [ra] }, `Hang the smaller tree (leader ${rb}) under the bigger one (leader ${ra}). Size ${this.size[ra]}; ${this.count} group${this.count === 1 ? "" : "s"} now.`);
    return true;
  };

  /* forest above, parent[] row below */
  function ufViz(scene, st) {
    const t = G.viz.tree(scene, st.tree);
    let h = t.h + 8, w = t.w;
    if (st.row) {
      const C = 36, x0 = 12, y = h + 22;
      G.drawText(scene, "pa-t", x0, h + 8, st.rowTitle || "parent[]", "lbl panel-title");
      st.row.forEach((v, i) => {
        G.drawCell(scene, `pa${i}`, x0 + i * (C + 4), y, C, 30, v, st.rowMarks && st.rowMarks[i]);
        G.drawText(scene, `pi${i}`, x0 + i * (C + 4) + C / 2, y + 40, st.rowLabels ? st.rowLabels[i] : i, "idx", "middle");
      });
      w = Math.max(w, x0 + st.row.length * (C + 4) + 10);
      h = y + 52;
    }
    if (st.note2) { G.drawText(scene, "note2", 12, h + 6, st.note2, "result-t"); h += 26; }
    return { x: 0, y: 0, w, h };
  }
  const view = (uf, marks, opts) => {
    opts = opts || {};
    const n = uf.parent.length;
    const mk = {};
    Object.entries(marks || {}).forEach(([m, ids]) => ids.forEach((i) => (mk[i] = m)));
    const labels = opts.labels;
    const ids = opts.ids || [...Array(n).keys()];
    return {
      tree: { colW: opts.colW || 46, rowH: 64, nodes: ids.map((i) => ({ id: i, label: labels ? labels[i] : i, parent: uf.parent[i] === i ? null : uf.parent[i], m: mk[i] || null, sub: uf.parent[i] === i && !opts.noSize ? `size ${uf.size[i]}` : null })) },
      row: opts.noRow ? null : uf.parent.slice(), rowMarks: mk,
      note2: opts.note,
    };
  };

  const parseN = (s, max) => { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 1 || n > (max || 9)) throw new Error(`n must be from 1 to ${max || 9}.`); return n; };
  const parsePairs = (s, lo, hi) => String(s).replace(/[\[\]]/g, " ").trim().split(/[\s,]+/).filter(Boolean).map((x) => {
    const m = x.match(/^(\d+)-(\d+)$/);
    if (!m) throw new Error(`"${x}" should look like 0-1.`);
    const a = +m[1], b = +m[2];
    if (a < lo || a > hi || b < lo || b > hi) throw new Error(`${x}: nodes must be from ${lo} to ${hi}.`);
    return [a, b];
  });

  /* ---------- the structure itself ---------- */
  const ufLines = {
    init: { ts: "this.parent = Array.from({ length: n }, (_, i) => i);", go: "uf.parent[i] = i // everyone is their own leader" },
    call: { ts: "let rootA = this.find(a), rootB = this.find(b);", go: "rootA, rootB := u.Find(a), u.Find(b)" },
    loop: { ts: "while (this.parent[x] !== x) {", go: "for u.parent[x] != x {" },
    halve: { ts: "this.parent[x] = this.parent[this.parent[x]];", go: "u.parent[x] = u.parent[u.parent[x]]" },
    root: { ts: "find(x: number): number {>>return x;", go: "func (u *UnionFind) Find>>return x" },
    same: { ts: "if (rootA === rootB) return false;", go: "return false // already in the same group" },
    hang: { ts: "this.parent[rootB] = rootA;", go: "u.parent[rootB] = rootA" },
    conn: { ts: "return this.find(a) === this.find(b);", go: "func (u *UnionFind) Connected" },
  };
  function opsTrace({ n, ops }, naive) {
    const Tr = new G.Trace();
    const uf = new UF(n, { naive });
    const out = [];
    const st = (marks) => view(uf, marks, { note: `groups: ${uf.count}${out.length ? ` · results: ${out.join(", ")}` : ""}`, noSize: naive });
    const emit = (at, marks, say) => Tr.add({ at, state: st(marks), vars: { groups: uf.count }, say });
    Tr.add({ at: "init", state: st({}), vars: { n }, say: `${n} items, each its own leader: parent[i] = i. ${n} groups.` });
    ops.forEach((op) => {
      if (op.kind === "u") {
        Tr.add({ at: "call", state: st({ p1: [op.a, op.b] }), vars: { op: `union(${op.a}, ${op.b})` }, say: `union(${op.a}, ${op.b}): first find both leaders.` });
        out.push(uf.union(op.a, op.b, emit));
      } else {
        const r = uf.find(op.a, emit) === uf.find(op.b, emit);
        out.push(r);
        Tr.add({ at: "conn", state: st({ [r ? "answer" : "bug"]: [op.a, op.b] }), vars: { op: `connected(${op.a}, ${op.b})`, result: r }, say: `connected(${op.a}, ${op.b}) = ${r}: ${r ? "same leader" : "different leaders"}.` });
      }
    });
    let tall = 0; for (let i = 0; i < n; i++) { let d = 0, x = i; while (uf.parent[x] !== x) { x = uf.parent[x]; d++; } tall = Math.max(tall, d); }
    Tr.add({ state: st({}), vars: { groups: uf.count, "tallest path": tall }, say: naive ? `The tallest path is ${tall} steps: every find on it costs that much. Union by size keeps it about log n; path halving flattens it further.` : `${uf.count} group${uf.count === 1 ? "" : "s"}. With union by size and path halving, each operation is nearly O(1) (inverse Ackermann).` });
    return Tr.done(out);
  }
  A.ufOps = {
    title: "Union-find: leaders, find and union", short: "Union by size + path halving",
    viz: ufViz, legend: ["p1:the two items", "focus:moving", "answer:a leader", "bug:already together"],
    inputLabel: "n ; operations: a-b = union, a?b = connected", hint: "6 ; 0-1 1-2 3-4 0?2 0?3 0-2",
    presets: [{ label: "the lesson's example", input: "6 ; 0-1 1-2 3-4 0?2 0?3 0-2" }, { label: "path halving at work", input: "8 ; 0-1 2-3 0-2 4-5 6-7 4-6 0-4 7?1" }, { label: "exercise 2", input: "5 ; 1-2 3-4 2-4 1-3" }],
    parse(s) {
      const [a, b] = P.parts(s, 2, 'n, then ";" and the operations'); const n = parseN(a);
      const ops = b.trim().split(/[\s,]+/).filter(Boolean).map((x) => { const m = x.match(/^(\d+)([-?])(\d+)$/); if (!m) throw new Error(`"${x}": use a-b for union or a?b for connected.`); const p = +m[1], q = +m[3]; if (p >= n || q >= n) throw new Error(`${x}: items are 0..${n - 1}.`); return { kind: m[2] === "-" ? "u" : "c", a: p, b: q }; });
      if (!ops.length || ops.length > 10) throw new Error("1 to 10 operations.");
      return { n, ops };
    },
    lines: ufLines,
    trace: (x) => opsTrace(x, false),
    bugs: [{ label: "Replay the bug: no union by size, no halving", input: "6 ; 0-1 0-2 0-3 0-4 0-5", banner: "<b>Replaying a bug.</b> This version always hangs the first leader under the second and never shortens paths, so the forest becomes a chain.", trace: (x) => opsTrace(x, true) }],
  };

  /* ---------- Problem 1: components ---------- */
  A.components = {
    title: "Number of Connected Components: count successful merges",
    viz: ufViz, legend: ["p1:the edge's endpoints", "answer:merged", "bug:already together"],
    inputLabel: "n ; edges", hint: "5 ; 0-1 1-2 3-4",
    presets: [{ label: "two components", input: "5 ; 0-1 1-2 3-4" }, { label: "one chain", input: "5 ; 0-1 1-2 2-3 3-4" }, { label: "no edges", input: "3 ; " }],
    parse(s) { const [a, b] = P.parts(s, 2, 'n, then ";" and the edges'); const n = parseN(a); return { n, edges: b.trim() ? parsePairs(b, 0, n - 1) : [] }; },
    lines: { start: { ts: "const uf = new UnionFind(n);", go: "uf := NewUnionFind(n)" }, edge: { ts: "for (const [a, b] of edges) uf.union(a, b);", go: "uf.Union(e[0], e[1])" }, ret: { ts: "return uf.count;", go: "return uf.Count" } },
    table: { id: "tbl-3", preset: 0, rows: ["s", "e0", "e1", "e2"] },
    trace({ n, edges }) {
      const Tr = new G.Trace();
      const uf = new UF(n);
      Tr.add({ key: "s", at: "start", state: view(uf, {}, { note: `count: ${uf.count}` }), vars: { count: n }, say: `Start with ${n} groups of one.` });
      edges.forEach(([a, b], i) => {
        const ok = uf.union(a, b);
        Tr.add({ key: "e" + i, at: "edge", state: view(uf, { [ok ? "answer" : "bug"]: [a, b] }, { note: `count: ${uf.count}` }), vars: { edge: `${a}–${b}`, merged: ok, count: uf.count }, say: ok ? `Edge ${a}–${b}: different leaders, merge. Count drops to ${uf.count}.` : `Edge ${a}–${b}: same leader already. Count stays ${uf.count}.` });
      });
      Tr.add({ at: "ret", state: view(uf, {}, { note: `answer: ${uf.count}` }), vars: { answer: uf.count }, say: `${uf.count} component${uf.count === 1 ? "" : "s"}: every successful union removed one.` });
      return Tr.done(uf.count);
    },
  };

  /* ---------- Problem 2: redundant connection ---------- */
  A.redundant = {
    title: "Redundant Connection: the first edge inside one group",
    viz: ufViz, legend: ["answer:merged", "bug:the redundant edge"],
    inputLabel: "edges between nodes 1..n (n edges)", hint: "1-2 1-3 2-3",
    presets: [{ label: "[[1,2],[1,3],[2,3]]", input: "1-2 1-3 2-3" }, { label: "the 5-edge example", input: "1-2 2-3 3-4 1-4 1-5" }],
    parse(s) { const e = parsePairs(s, 1, 9); if (e.length < 2 || e.length > 8) throw new Error("2 to 8 edges."); const n = e.length; if (e.some(([a, b]) => a > n || b > n)) throw new Error(`With ${n} edges the nodes are 1..${n}.`); return e; },
    lines: { start: { ts: "const uf = new UnionFind(edges.length + 1);", go: "uf := NewUnionFind(len(edges) + 1)" }, check: { ts: "if (!uf.union(a, b)) return [a, b];", go: "if !uf.Union(e[0], e[1]) {" }, found: { ts: "if (!uf.union(a, b)) return [a, b];", go: "return e // already connected: this edge closes a cycle" }, none: { ts: "findRedundantConnection>>return [];", go: "return nil" } },
    table: { id: "tbl-4", preset: 0, rows: ["e0", "e1", "e2"] },
    trace(edges) {
      const Tr = new G.Trace();
      const uf = new UF(edges.length + 1);
      const ids = [...Array(edges.length).keys()].map((i) => i + 1);
      Tr.add({ at: "start", state: view(uf, {}, { ids, noRow: true }), vars: {}, say: "Nodes 1..n (index 0 is unused). Add edges one at a time." });
      for (let i = 0; i < edges.length; i++) {
        const [a, b] = edges[i];
        if (!uf.union(a, b)) { Tr.add({ key: "e" + i, at: "found", state: view(uf, { bug: [a, b] }, { ids, noRow: true, note: `redundant: [${a}, ${b}]` }), vars: { edge: `${a}–${b}` }, say: `${a} and ${b} already share a leader: this edge closes a cycle. Return [${a}, ${b}].` }); return Tr.done([a, b]); }
        Tr.add({ key: "e" + i, at: "check", state: view(uf, { answer: [a, b] }, { ids, noRow: true }), vars: { edge: `${a}–${b}` }, say: `Edge ${a}–${b}: different groups, merge.` });
      }
      Tr.add({ at: "none", state: view(uf, {}, { ids, noRow: true }), vars: {}, say: "No edge closed a cycle." });
      return Tr.done([]);
    },
  };

  /* ---------- Problem 3: graph valid tree ---------- */
  A.validTree = {
    title: "Graph Valid Tree: n − 1 edges and no cycle",
    viz: ufViz, legend: ["answer:merged", "bug:closes a cycle"],
    inputLabel: "n ; edges", hint: "5 ; 0-1 0-2 0-3 1-4",
    presets: [{ label: "a tree", input: "5 ; 0-1 0-2 0-3 1-4" }, { label: "a cycle", input: "5 ; 0-1 1-2 2-3 1-3 1-4" }, { label: "a duplicate edge", input: "4 ; 0-1 2-3 2-3" }, { label: "too few edges", input: "4 ; 0-1 2-3" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'n, then ";" and the edges'); const n = parseN(a); return { n, edges: b.trim() ? parsePairs(b, 0, n - 1) : [] }; },
    lines: { count: { ts: "if (edges.length !== n - 1) return false;", go: "return false // a tree has exactly n - 1 edges" }, edge: { ts: "validTree>>if (!uf.union(a, b)) return false;", go: "func validTree>>if !uf.Union(e[0], e[1]) {" }, cyc: { ts: "validTree>>if (!uf.union(a, b)) return false;", go: "return false // a cycle" }, ok: { ts: "return true; // n - 1 edges and no cycle", go: "return true // n - 1 edges and no cycle" } },
    trace({ n, edges }) {
      const Tr = new G.Trace();
      const uf = new UF(n);
      if (edges.length !== n - 1) { Tr.add({ at: "count", state: view(uf, {}, { note: `${edges.length} edges, need ${n - 1}` }), vars: { edges: edges.length, need: n - 1 }, say: `A tree on ${n} nodes has exactly ${n - 1} edges; this has ${edges.length}. False, without looking further.` }); return Tr.done(false); }
      Tr.add({ at: "count", state: view(uf, {}), vars: { edges: edges.length }, say: `${edges.length} = n − 1 edges: the right number. Now check for a cycle.` });
      for (const [a, b] of edges) {
        if (!uf.union(a, b)) { Tr.add({ at: "cyc", state: view(uf, { bug: [a, b] }), vars: { edge: `${a}–${b}` }, say: `${a} and ${b} are already connected: a cycle. False.` }); return Tr.done(false); }
        Tr.add({ at: "edge", state: view(uf, { answer: [a, b] }), vars: { edge: `${a}–${b}`, groups: uf.count }, say: `Edge ${a}–${b} merges two groups.` });
      }
      Tr.add({ at: "ok", state: view(uf, {}, { note: "a valid tree" }), vars: { groups: uf.count }, say: "n − 1 edges and no cycle, so it is also connected: a tree." });
      return Tr.done(true);
    },
  };

  /* ---------- Problem 4: accounts merge ---------- */
  A.accounts = {
    title: "Accounts Merge: emails are the items, an account unions its emails",
    viz: ufViz, legend: ["p1:this account's emails", "answer:a person (leader)"],
    inputLabel: "accounts as Name: email email ; …", hint: "John: js jn ; John: js j0 ; Mary: m ; John: jb",
    presets: [{ label: "the lesson's example (short emails)", input: "John: js jn ; John: js j0 ; Mary: m ; John: jb" }, { label: "a chain across accounts", input: "Ann: a b ; Ann: c d ; Ann: b c ; Bo: e" }],
    parse(s) {
      const acc = String(s).split(";").map((x) => x.trim()).filter(Boolean).map((x) => {
        const m = x.match(/^([A-Za-z]+)\s*:\s*(.+)$/);
        if (!m) throw new Error(`"${x}" should look like John: a b.`);
        const emails = m[2].trim().split(/[\s,]+/);
        emails.forEach((e) => { if (!/^[a-z0-9_.@]{1,8}$/.test(e)) throw new Error(`"${e}": short emails please (up to 8 of a–z, 0–9, _ . @).`); });
        return [m[1], ...emails];
      });
      if (!acc.length || acc.length > 5) throw new Error("1 to 5 accounts.");
      if (new Set(acc.flatMap((a) => a.slice(1))).size > 8) throw new Error("Up to 8 different emails.");
      return acc;
    },
    lines: { ids: { ts: "if (!emailId.has(email)) emailId.set(email, emailId.size);", go: "emailID[email] = len(emailID)" }, union: { ts: "for (const email of rest) uf.union(emailId.get(first)!, emailId.get(email)!);", go: "uf.Union(emailID[account[1]], emailID[email])" }, group: { ts: "groups.get(leader)!.push(email);", go: "groups[leader] = append(groups[leader], email)" }, out: { ts: "return merged.sort((a, b) => a[1].localeCompare(b[1]));", go: "sort.Slice(merged" } },
    trace(accounts) {
      const Tr = new G.Trace();
      const id = new Map(), name = new Map();
      for (const [nm, ...emails] of accounts) for (const e of emails) { if (!id.has(e)) id.set(e, id.size); name.set(e, nm); }
      const uf = new UF(id.size);
      const labels = [...id.keys()];
      const v = (marks, note) => view(uf, marks, { labels, noRow: true, colW: Math.max(50, 12 + 8 * Math.max(...labels.map((l) => l.length))), note });
      Tr.add({ at: "ids", state: v({}), vars: { emails: id.size }, say: `Give every distinct email a number: ${labels.map((e, i) => `${e}=${i}`).join(", ")}.` });
      accounts.forEach(([nm, first, ...rest], k) => {
        rest.forEach((e) => uf.union(id.get(first), id.get(e)));
        Tr.add({ at: "union", state: v({ p1: [first, ...rest].map((e) => id.get(e)) }), vars: { account: k, name: nm }, say: rest.length ? `Account ${k} (${nm}): its emails belong to one person, so union ${first} with ${rest.join(", ")}.` : `Account ${k} (${nm}) has one email: nothing to union.` });
      });
      const groups = new Map();
      for (const [e, i] of id) { const l = uf.find(i); if (!groups.has(l)) groups.set(l, []); groups.get(l).push(e); }
      const merged = [...groups.values()].map((es) => { es.sort(); return [name.get(es[0]), ...es]; });
      merged.sort((a, b) => a[1].localeCompare(b[1]));
      Tr.add({ at: "group", state: v({ answer: [...groups.keys()] }), vars: { people: groups.size }, say: `Group emails by leader: ${groups.size} people.` });
      Tr.add({ at: "out", state: v({ answer: [...groups.keys()] }, merged.map((m) => `${m[0]}: ${m.slice(1).join(" ")}`).join(" | ")), vars: {}, say: `Sort each person's emails and attach the name: ${merged.map((m) => `[${m.join(", ")}]`).join(" ")}.` });
      return Tr.done(merged);
    },
  };

  /* ---------- Problem 5: islands II ---------- */
  A.islands2 = {
    title: "Number of Islands II: +1 for new land, −1 for each real merge",
    viz: "grid", legend: ["focus:just added", "answer:merged into it", "p1:land (number = its leader)"],
    inputLabel: "rows cols ; positions r,c", hint: "3 3 ; 0,0 0,1 1,2 2,1",
    presets: [{ label: "the lesson's example", input: "3 3 ; 0,0 0,1 1,2 2,1" }, { label: "a bridge", input: "3 3 ; 0,0 1,1 0,1" }, { label: "a repeated cell", input: "3 3 ; 0,0 0,1 1,2 1,2" }],
    parse(s) {
      const [a, b] = P.parts(s, 2, 'rows cols, then ";" and positions');
      const [m, n] = P.nums(a, { minLen: 2, maxLen: 2, min: 1, max: 5 });
      const pos = b.trim().split(/\s+/).filter(Boolean).map((x) => { const q = x.match(/^(\d+),(\d+)$/); if (!q || +q[1] >= m || +q[2] >= n) throw new Error(`"${x}" should be r,c inside the grid.`); return [+q[1], +q[2]]; });
      if (!pos.length || pos.length > 10) throw new Error("1 to 10 positions.");
      return { m, n, pos };
    },
    lines: { dup: { ts: "if (!land[id]) {", go: "if !land[id] {" }, add: { ts: "islands++; // assume a new island...", go: "islands++ // assume a new island..." }, merge: { ts: "if (uf.union(id, nr * n + nc)) islands--;", go: "islands-- // ...each real merge removes one island" }, push: { ts: "answer.push(islands);", go: "answer = append(answer, islands)" } },
    table: { id: "tbl-5", preset: 0, rows: ["a0", "a1", "a2", "a3"] },
    trace({ m, n, pos }) {
      const Tr = new G.Trace();
      const uf = new UF(m * n), land = Array(m * n).fill(false);
      let islands = 0;
      const answer = [];
      const st = (mk) => ({ cells: Array.from({ length: m }, (_, r) => Array.from({ length: n }, (_, c) => { const id = r * n + c; return { v: land[id] ? uf.root(id) : "", m: (mk && mk[id]) || (land[id] ? "p1" : null) }; })), note: { text: `islands: ${islands} · answer so far [${answer.join(", ")}]` } });
      pos.forEach(([r, c], k) => {
        const id = r * n + c;
        const key = "a" + k;
        if (!land[id]) {
          land[id] = true; islands++;
          Tr.add({ key, at: "add", state: st({ [id]: "focus" }), vars: { cell: `(${r},${c})`, islands }, say: `Add land at (${r},${c}) (item ${id}). Assume it is a new island: ${islands}.` });
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= m || nc < 0 || nc >= n || !land[nr * n + nc]) continue;
            if (uf.union(id, nr * n + nc)) { islands--; Tr.add({ key, at: "merge", state: st({ [id]: "focus", [nr * n + nc]: "answer" }), vars: { neighbor: `(${nr},${nc})`, islands }, say: `Neighbor (${nr},${nc}) is land in a different island: union them, islands −1 = ${islands}.` }); }
            else Tr.add({ key, at: "merge", state: st({ [id]: "focus" }), vars: { neighbor: `(${nr},${nc})` }, say: `Neighbor (${nr},${nc}) is already in the same island: no change.` });
          }
        } else Tr.add({ key, at: "dup", state: st({ [id]: "focus" }), vars: { cell: `(${r},${c})` }, say: `(${r},${c}) is already land: ignore the repeat.` });
        answer.push(islands);
        Tr.add({ key, at: "push", state: st({}), vars: { answer: `[${answer.join(", ")}]` }, say: `Record ${islands}.` });
      });
      return Tr.done(answer);
    },
  };

  G.quizzes.uf21 = {
    title: "Union-find",
    items: [
      { q: "To check whether a and b are in the same group, compare…", options: ["find(a) and find(b)", "parent[a] and parent[b]", "size[a] and size[b]", "a and b"], answer: 0, why: "A parent is not necessarily the leader." },
      { q: "When does count go down?", options: ["Only when union actually merges two different groups", "On every union call", "On every find", "When two items are connected"], answer: 0, why: "A union of two items already together changes nothing." },
      { q: "Which problem is a poor fit for union-find?", options: ["Detecting a cycle in a directed graph", "Counting components as edges arrive", "Kruskal's minimum spanning tree", "Merging accounts"], answer: 0, why: "Union-find only understands undirected connectivity; use topological sort." },
      { q: "With union by size and path compression, a sequence of m operations costs about…", options: ["O(m · α(n)), nearly linear", "O(m log² n)", "O(m · n)", "O(m²)"], answer: 0, why: "α, the inverse Ackermann function, is at most 4 for any realistic n." },
      { q: "Equality equations: why process all == before any !=?", options: ["The groups must be complete before you can say two variables differ", "!= is cheaper", "To sort them", "Order does not matter"], answer: 0, why: "A later == could join two groups you already compared." },
    ],
  };
})();

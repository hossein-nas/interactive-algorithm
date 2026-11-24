/* Lesson 22 · Shortest paths — Dijkstra, network delay, minimum effort, K stops, Bellman-Ford, visiting all nodes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  // the lesson's binary heap, exactly (ties come out the same way)
  function Heap(less) { this.data = []; this.less = less; }
  Heap.prototype.push = function (x) { const D = this.data; D.push(x); let i = D.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (!this.less(D[i], D[p])) break; [D[i], D[p]] = [D[p], D[i]]; i = p; } };
  Heap.prototype.pop = function () {
    const D = this.data; if (!D.length) return undefined;
    const top = D[0], last = D.pop();
    if (D.length) { D[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = 2 * i + 2; let b = i; if (l < D.length && this.less(D[l], D[b])) b = l; if (r < D.length && this.less(D[r], D[b])) b = r; if (b === i) break; [D[i], D[b]] = [D[b], D[i]]; i = b; } }
    return top;
  };
  Object.defineProperty(Heap.prototype, "size", { get() { return this.data.length; } });

  const INF = Infinity;
  const show = (d) => (d === INF ? "∞" : String(d));
  const parseN = (s, max) => { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 1 || n > (max || 8)) throw new Error(`n must be from 1 to ${max || 8}.`); return n; };
  // weighted directed edges written u>v:w
  const parseW = (s, lo, hi, neg) => String(s).trim().split(/[\s,]+/).filter(Boolean).map((x) => {
    const m = x.match(/^(\d+)>(\d+):(-?\d+)$/);
    if (!m) throw new Error(`"${x}" should look like 0>1:6 (from > to : weight).`);
    const u = +m[1], v = +m[2], w = +m[3];
    if (u < lo || u > hi || v < lo || v > hi) throw new Error(`${x}: nodes must be from ${lo} to ${hi}.`);
    if (!neg && w < 0) throw new Error(`${x}: Dijkstra needs weights ≥ 0.`);
    if (Math.abs(w) > 999) throw new Error(`${x}: keep weights within ±999.`);
    return [u, v, w];
  });
  const wview = (ids, edges, dist, nm, em, extra) => Object.assign({
    directed: true,
    nodes: ids.map((i) => ({ id: i, label: extra && extra.labels ? extra.labels[i] : i, sub: dist ? `d ${show(dist[i])}` : null, m: (nm && nm[i]) || null })),
    edges: edges.map(([u, v, w], k) => ({ a: u, b: v, w, m: (em && em[k]) || null })),
  }, extra || {});

  /* ---------- Dijkstra ---------- */
  function dijkstraTrace({ n, edges, start, labels }, bug) {
    const Tr = new G.Trace();
    const adj = Array.from({ length: n }, () => []);
    edges.forEach(([u, v, w], k) => adj[u].push([v, w, k]));
    const ids = [...Array(n).keys()];
    const dist = Array(n).fill(INF);
    dist[start] = 0;
    const heap = new Heap((a, b) => a[0] < b[0]);
    heap.push([0, start]);
    const final = new Set(), locked = new Set([start]);
    const L = (i) => (labels ? labels[i] : i);
    const st = (cur, em, nm) => wview(ids, edges, dist, Object.assign(Object.fromEntries(ids.map((i) => [i, final.has(i) ? "anchor" : null])), cur != null ? { [cur]: "focus" } : {}, nm || {}), em, { labels, root: start, strip: { title: "heap array (d, node)", items: heap.data.map(([d, u]) => `${d},${L(u)}`), mark: Object.fromEntries(heap.data.map(([d, u], i) => [i, d > dist[u] ? "done" : null])) } });
    Tr.add({ at: "init", flow: ["A"], state: st(), vars: { start: L(start) }, say: `dist[${L(start)}] = 0, everything else ∞. Push (0, ${L(start)}).${bug ? " This version also locks a node's distance the first time it is pushed." : ""}` });
    let pops = 0;
    while (heap.size) {
      const [d, u] = heap.pop();
      const key = "p" + pops++;
      if (d > dist[u]) { Tr.add({ key, at: "stale", flow: ["B", "C", "D"], state: st(u, null, { [u]: "bug" }), vars: { d, [`dist[${L(u)}]`]: dist[u] }, say: `Pop (${d}, ${L(u)}): stale, since a shorter route (${dist[u]}) was found after it was pushed. Skip.` }); continue; }
      final.add(u);
      Tr.add({ key, at: "pop", flow: ["B", "C", "D"], state: st(u), vars: { d, u: L(u) }, say: `Pop (${d}, ${L(u)}), the smallest d in the heap. No later route can beat it (weights are ≥ 0), so ${d} is final for ${L(u)}.` });
      for (const [v, w, k] of adj[u]) {
        const better = d + w < dist[v] && !(bug && locked.has(v));
        if (better) {
          dist[v] = d + w; heap.push([dist[v], v]); locked.add(v);
          Tr.add({ key, at: "relax", flow: ["E"], state: st(u, { [k]: "hot" }), vars: { edge: `${L(u)}→${L(v)} (${w})`, [`dist[${L(v)}]`]: dist[v] }, say: `${d} + ${w} = ${d + w} beats the old distance to ${L(v)}: relax it and push (${dist[v]}, ${L(v)}).` });
        } else Tr.add({ key, at: "relax", flow: ["E"], state: st(u, { [k]: "dim" }), vars: { edge: `${L(u)}→${L(v)} (${w})` }, say: bug && d + w < dist[v] ? `${d} + ${w} = ${d + w} would beat ${dist[v]}, but this version already locked ${L(v)}: the better route is lost.` : `${d} + ${w} = ${d + w} is not better than ${show(dist[v])}.` });
      }
    }
    Tr.add({ at: "ret", flow: ["B", "Z"], state: st(), vars: { dist: `[${dist.map(show).join(", ")}]` }, say: bug ? `Result [${dist.map(show).join(", ")}]: wrong where a cheaper route arrived later.` : `Heap empty: dist = [${dist.map(show).join(", ")}]. O((V + E) log V).` });
    return Tr.done(dist);
  }
  const introLabels = ["S", "A", "B", "F"];
  A.dijkstra = {
    title: "Dijkstra: always settle the closest node next",
    viz: "graph", legend: ["focus:just popped", "anchor:final distance", "hot:edge being relaxed", "done:stale heap entry"],
    inputLabel: "n ; edges from>to:weight ; start", hint: "4 ; 0>1:6 0>2:2 2>1:3 1>3:1 2>3:5 ; 0",
    presets: [{ label: "S, A, B, F from the lesson", input: "4 ; 0>1:6 0>2:2 2>1:3 1>3:1 2>3:5 ; 0" }, { label: "a longer detour wins", input: "5 ; 0>1:1 1>2:1 2>3:1 0>3:10 3>4:1 0>4:20 ; 0" }],
    parse(s) { const [a, b, c] = P.parts(s, 3, "n ; edges ; start"); const n = parseN(a); const edges = parseW(b, 0, n - 1, false); const start = P.num(c, "start"); if (!Number.isInteger(start) || start < 0 || start >= n) throw new Error(`start must be 0..${n - 1}.`); return { n, edges, start, labels: s.trim() === A.dijkstra.presets[0].input ? introLabels : null }; },
    lines: { init: { ts: "dist[start] = 0;", go: "dist[start] = 0" }, pop: { ts: "const [d, u] = heap.pop()!;", go: "cur := pq.Pop()" }, stale: { ts: "if (d > dist[u]) continue;", go: "continue // stale entry: a shorter route was found after this was pushed" }, relax: { ts: "dist[v] = d + w; // relax the edge", go: "dist[e.to] = cur.d + e.weight // relax the edge" }, ret: { ts: "dijkstra(adj: [number, number][][], start: number)>>return dist;", go: "func dijkstra>>return dist" } },
    table: { id: "tbl-1", preset: 0, rows: ["p0", "p1", "p2", "p3", "p4"] },
    trace: (x) => dijkstraTrace(x, false),
    bugs: [{ label: "Replay the bug: lock a node when it is pushed", input: "4 ; 0>1:6 0>2:2 2>1:3 1>3:1 2>3:5 ; 0", banner: "<b>Replaying a bug.</b> This version treats a node as done the first time it gets a distance, like BFS, so the cheaper route to A through B is ignored.", trace: (x) => dijkstraTrace(x, true) }],
  };

  /* ---------- Problem 1: network delay ---------- */
  A.network = {
    title: "Network Delay Time: Dijkstra, then the farthest node",
    viz: "graph", legend: ["focus:just popped", "anchor:signal arrival time known", "bug:never reached", "answer:the last to hear it"],
    inputLabel: "n ; times u>v:w (nodes 1..n) ; k", hint: "4 ; 2>1:1 2>3:1 3>4:1 ; 2",
    presets: [{ label: "the lesson's example", input: "4 ; 2>1:1 2>3:1 3>4:1 ; 2" }, { label: "unreachable", input: "2 ; 1>2:1 ; 2" }, { label: "a slow direct link", input: "4 ; 1>2:1 2>3:2 1>3:4 3>4:1 ; 1" }],
    parse(s) { const [a, b, c] = P.parts(s, 3, "n ; times ; k"); const n = parseN(a); const edges = parseW(b, 1, n, false); const k = P.num(c, "k"); if (!Number.isInteger(k) || k < 1 || k > n) throw new Error(`k must be 1..${n}.`); return { n, edges, k }; },
    lines: { dij: { ts: "const dist = dijkstra(adj, k);", go: "dist := dijkstra(adj, k)" }, inf: { ts: "if (dist[node] === Infinity) return -1;", go: "return -1 // someone never gets the signal" }, worst: { ts: "worst = Math.max(worst, dist[node]);", go: "worst = max(worst, dist[node])" }, ret: { ts: "return worst;", go: "return worst" } },
    trace({ n, edges, k }) {
      const Tr = new G.Trace();
      const ids = Array.from({ length: n }, (_, i) => i + 1);
      const adj = Array.from({ length: n + 1 }, () => []);
      edges.forEach(([u, v, w], e) => adj[u].push([v, w, e]));
      const dist = Array(n + 1).fill(INF); dist[k] = 0;
      const heap = new Heap((a, b) => a[0] < b[0]); heap.push([0, k]);
      const fin = new Set();
      const st = (cur, nm, em) => wview(ids, edges, dist, Object.assign(Object.fromEntries(ids.map((i) => [i, fin.has(i) ? "anchor" : null])), cur != null ? { [cur]: "focus" } : {}, nm || {}), em, { root: k });
      Tr.add({ at: "dij", state: st(), vars: { source: k }, say: `The signal starts at ${k}. Run Dijkstra from it: arrival time = shortest distance.` });
      while (heap.size) {
        const [d, u] = heap.pop();
        if (d > dist[u]) continue;
        fin.add(u);
        const changed = [];
        for (const [v, w, e] of adj[u]) if (d + w < dist[v]) { dist[v] = d + w; heap.push([dist[v], v]); changed.push(e); }
        Tr.add({ at: "dij", state: st(u, null, Object.fromEntries(changed.map((e) => [e, "hot"]))), vars: { node: u, time: d }, say: `${u} hears the signal at time ${d}.${changed.length ? ` Relax ${changed.map((e) => `${edges[e][0]}→${edges[e][1]}`).join(", ")}.` : ""}` });
      }
      let worst = 0, far = null;
      for (let node = 1; node <= n; node++) {
        if (dist[node] === INF) { Tr.add({ at: "inf", state: st(null, { [node]: "bug" }), vars: { node }, say: `${node} never gets the signal: return −1 (not ∞).` }); return Tr.done(-1); }
        if (dist[node] > worst) { worst = dist[node]; far = node; }
      }
      Tr.add({ at: "worst", state: st(null, far != null ? { [far]: "answer" } : {}), vars: { worst }, say: `Everyone has it once the slowest node does: the largest distance, ${worst}${far != null ? ` (node ${far})` : ""}.` });
      Tr.add({ at: "ret", state: st(null, far != null ? { [far]: "answer" } : {}), vars: { answer: worst }, say: `Answer ${worst}.` });
      return Tr.done(worst);
    },
  };

  /* ---------- Problem 2: minimum effort ---------- */
  A.effort = {
    title: "Path With Minimum Effort: Dijkstra where a path costs its largest step",
    viz: "grid", legend: ["focus:just popped", "anchor:effort final", "p1:in the heap", "answer:the target"],
    inputLabel: "rows of heights (digits)", hint: "122 382 535",
    presets: [{ label: "[[1,2,2],[3,8,2],[5,3,5]]", input: "122 382 535" }, { label: "[[1,2,3],[3,8,4],[5,3,5]]", input: "123 384 535" }, { label: "a wall in the middle", input: "1119 9919 1111" }],
    parse(s) { const rows = String(s).replace(/[\[\],]/g, " ").trim().split(/\s+/).filter(Boolean); if (!rows.length || rows.length > 4) throw new Error("1 to 4 rows."); rows.forEach((r) => { if (!/^\d+$/.test(r) || r.length !== rows[0].length || r.length > 4) throw new Error("Rows of digits, all the same length (up to 4)."); }); return rows.map((r) => r.split("").map(Number)); },
    lines: { pop: { ts: "const [e, r, c] = heap.pop()!;", go: "cur := pq.Pop()" }, target: { ts: "if (r === rows - 1 && c === cols - 1) return e;", go: "return cur.e // the first time we pop the target, e is optimal" }, stale: { ts: "if (e > effort[r][c]) continue;", go: "continue // stale" }, relax: { ts: "effort[nr][nc] = next;", go: "effort[nr][nc] = next" } },
    trace(h) {
      const Tr = new G.Trace();
      const rows = h.length, cols = h[0].length;
      const eff = h.map((r) => r.map(() => INF));
      eff[0][0] = 0;
      const heap = new Heap((a, b) => a[0] < b[0]);
      heap.push([0, 0, 0]);
      const fin = new Set();
      const st = (cur, note) => ({ cells: h.map((row, r) => row.map((v, c) => ({ v: `${v}`, m: cur && cur[0] === r && cur[1] === c ? "focus" : fin.has(r + "," + c) ? "anchor" : r === rows - 1 && c === cols - 1 ? "answer" : heap.data.some((x) => x[1] === r && x[2] === c) ? "p1" : null }))), panels: [{ title: "best effort so far", keyW: 30, valW: 30 * cols, entries: eff.map((row, r) => [r, row.map(show).join(" ")]) }], note: { text: note || "a path's cost = its biggest height difference" } });
      Tr.add({ at: "pop", state: st(null), vars: {}, say: "Start at the top-left with effort 0. The heap orders cells by the effort of the best path found to them." });
      while (heap.size) {
        const [e, r, c] = heap.pop();
        if (r === rows - 1 && c === cols - 1) { Tr.add({ at: "target", state: st([r, c], `answer: ${e}`), vars: { effort: e }, say: `Popped the bottom-right with effort ${e}. Nothing left in the heap is smaller, so ${e} is optimal.` }); return Tr.done(e); }
        if (e > eff[r][c]) { Tr.add({ at: "stale", state: st([r, c]), vars: { e, best: eff[r][c] }, say: `(${r},${c}) popped with ${e}, but ${eff[r][c]} is already known: stale, skip.` }); continue; }
        fin.add(r + "," + c);
        const imp = [];
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          const nx = Math.max(e, Math.abs(h[nr][nc] - h[r][c]));
          if (nx < eff[nr][nc]) { eff[nr][nc] = nx; heap.push([nx, nr, nc]); imp.push(`(${nr},${nc})→${nx}`); }
        }
        Tr.add({ at: imp.length ? "relax" : "pop", state: st([r, c]), vars: { cell: `(${r},${c})`, effort: e }, say: `Pop (${r},${c}) with effort ${e}.${imp.length ? ` Through it: ${imp.join(", ")} (max of ${e} and the step).` : " No neighbor improves."}` });
      }
      return Tr.done(0);
    },
  };

  /* ---------- Problem 3: cheapest flights within K stops ---------- */
  function flightsTrace({ n, edges, src, dst, k }, bug) {
    const Tr = new G.Trace();
    const ids = [...Array(n).keys()];
    let dist = Array(n).fill(INF);
    dist[src] = 0;
    const st = (em, nm, d) => wview(ids, edges, d || dist, Object.assign({ [src]: "p1", [dst]: "answer" }, nm || {}), em, { root: src });
    Tr.add({ key: "r0", at: "round", state: st(), vars: { k, rounds: k + 1 }, say: `k = ${k} stops means at most ${k + 1} flights. Run ${k + 1} rounds; each round may add one flight.` });
    for (let round = 0; round <= k; round++) {
      const next = bug ? dist : dist.slice();
      const used = {};
      edges.forEach(([u, v, w], e) => { if (dist[u] !== INF && dist[u] + w < next[v]) { next[v] = dist[u] + w; used[e] = "hot"; } });
      dist = next;
      Tr.add({ key: "r" + (round + 1), at: "relax", state: st(used), vars: { round: round + 1, dist: `[${dist.map(show).join(", ")}]` }, say: bug ? `Round ${round + 1} (in place): an edge can use a value written earlier in this same round, so one round may chain several flights.` : `Round ${round + 1}: read last round's dist, write into a copy. Every route now uses at most ${round + 1} flight${round ? "s" : ""}.` });
    }
    const res = dist[dst] === INF ? -1 : dist[dst];
    Tr.add({ at: "ret", state: st({}), vars: { answer: res }, say: res === -1 ? `${dst} cannot be reached within ${k + 1} flights: −1.` : `Cheapest with at most ${k} stop${k === 1 ? "" : "s"}: ${res}.` });
    return Tr.done(res);
  }
  A.flights = {
    title: "Cheapest Flights Within K Stops: Bellman-Ford for k + 1 rounds",
    viz: "graph", legend: ["p1:source", "answer:destination", "hot:improved this round"],
    inputLabel: "n ; flights u>v:price ; src ; dst ; k", hint: "4 ; 0>1:100 1>2:100 2>0:100 1>3:600 2>3:200 ; 0 ; 3 ; 1",
    presets: [{ label: "k = 1 → 700", input: "4 ; 0>1:100 1>2:100 2>0:100 1>3:600 2>3:200 ; 0 ; 3 ; 1" }, { label: "k = 2 → 400", input: "4 ; 0>1:100 1>2:100 2>0:100 1>3:600 2>3:200 ; 0 ; 3 ; 2" }, { label: "k = 0", input: "3 ; 0>1:100 1>2:100 0>2:500 ; 0 ; 2 ; 0" }],
    parse(s) { const [a, b, c, d, e] = P.parts(s, 5, "n ; flights ; src ; dst ; k"); const n = parseN(a); const edges = parseW(b, 0, n - 1, false); const src = P.num(c, "src"), dst = P.num(d, "dst"), k = P.num(e, "k"); [src, dst].forEach((x) => { if (!Number.isInteger(x) || x < 0 || x >= n) throw new Error(`Nodes are 0..${n - 1}.`); }); if (!Number.isInteger(k) || k < 0 || k > 6) throw new Error("k must be 0..6."); return { n, edges, src, dst, k }; },
    lines: { round: { ts: "const next = [...dist];", go: "next := append([]int(nil), dist...)" }, relax: { ts: "if (dist[from] !== Infinity && dist[from] + price < next[to]) next[to] = dist[from] + price;", go: "next[to] = dist[from] + price" }, ret: { ts: "return dist[dst] === Infinity ? -1 : dist[dst];", go: "if dist[dst] == math.MaxInt {" } },
    table: { id: "tbl-4", preset: 0, rows: ["r0", "r1", "r2"] },
    trace: (x) => flightsTrace(x, false),
    bugs: [{ label: "Replay the bug: no copy", input: "3 ; 0>1:100 1>2:100 0>2:500 ; 0 ; 2 ; 0", banner: "<b>Replaying a bug.</b> This version updates <code>dist</code> in place, so with k = 0 it still finds the two-flight route 0 → 1 → 2.", trace: (x) => flightsTrace(x, true) }],
  };

  /* ---------- Problem 4: Bellman-Ford ---------- */
  A.bellman = {
    title: "Bellman-Ford: relax every edge, V − 1 times, then check once more",
    viz: "graph", legend: ["p1:start", "hot:just improved", "bug:still improving after V − 1 passes: a negative cycle"],
    inputLabel: "n ; edges u>v:w (negatives allowed) ; start", hint: "3 ; 0>1:4 1>2:-2 ; 0",
    presets: [{ label: "a negative edge", input: "3 ; 0>1:4 1>2:-2 ; 0" }, { label: "a negative cycle", input: "3 ; 0>1:1 1>2:-1 2>0:-1 ; 0" }, { label: "the lesson's 5-node graph", input: "5 ; 0>1:6 0>2:7 1>2:8 1>3:5 1>4:-4 2>3:-3 2>4:9 3>1:-2 4>0:2 4>3:7 ; 0" }],
    parse(s) { const [a, b, c] = P.parts(s, 3, "n ; edges ; start"); const n = parseN(a); const edges = parseW(b, 0, n - 1, true); if (edges.length > 10) throw new Error("Up to 10 edges."); const start = P.num(c, "start"); if (!Number.isInteger(start) || start < 0 || start >= n) throw new Error(`start must be 0..${n - 1}.`); return { n, edges, start }; },
    lines: { pass: { ts: "let changed = false;", go: "changed := false" }, relax: { ts: "dist[v] = dist[u] + w;", go: "dist[v] = dist[u] + w" }, stop: { ts: "if (!changed) break;", go: "if !changed {" }, neg: { ts: "if (dist[u] !== Infinity && dist[u] + w < dist[v]) return null;", go: "return nil, false // still improving: negative cycle" }, ret: { ts: "bellmanFord(n: number>>return dist;", go: "return dist, true" } },
    table: { id: "tbl-5", preset: 1, rows: ["pass", "extra"] },
    trace({ n, edges, start }) {
      const Tr = new G.Trace();
      const ids = [...Array(n).keys()];
      const dist = Array(n).fill(INF);
      dist[start] = 0;
      const st = (em, nm) => wview(ids, edges, dist, Object.assign({ [start]: "p1" }, nm || {}), em, { root: start });
      for (let pass = 0; pass < n - 1; pass++) {
        let changed = false;
        Tr.add({ key: "pass", at: "pass", state: st(), vars: { pass: pass + 1, of: n - 1 }, say: `Pass ${pass + 1} of ${n - 1}: try every edge.` });
        edges.forEach(([u, v, w], e) => {
          if (dist[u] !== INF && dist[u] + w < dist[v]) { dist[v] = dist[u] + w; changed = true; Tr.add({ key: "pass", at: "relax", state: st({ [e]: "hot" }), vars: { edge: `${u}→${v} (${w})`, [`dist[${v}]`]: dist[v] }, say: `${u}→${v}: ${dist[u]} + ${w} = ${dist[v]} is better. Update.` }); }
        });
        if (!changed) { Tr.add({ key: "pass", at: "stop", state: st(), vars: { pass: pass + 1 }, say: "Nothing changed in a whole pass: stable already. Stop early." }); break; }
      }
      for (let e = 0; e < edges.length; e++) {
        const [u, v, w] = edges[e];
        if (dist[u] !== INF && dist[u] + w < dist[v]) { Tr.add({ key: "extra", at: "neg", state: st({ [e]: "bug" }, { [v]: "bug" }), vars: { edge: `${u}→${v}` }, say: `One more check: ${u}→${v} would still improve ${v}. After V − 1 passes that only happens around a negative cycle. Return null.` }); return Tr.done(null); }
      }
      Tr.add({ key: "extra", at: "ret", state: st(), vars: { dist: `[${dist.map(show).join(", ")}]` }, say: `The extra pass changes nothing: no negative cycle. dist = [${dist.map(show).join(", ")}]. O(V · E).` });
      return Tr.done(dist);
    },
  };

  /* ---------- Problem 5: shortest path visiting all nodes ---------- */
  A.visitAll = {
    title: "Shortest Path Visiting All Nodes: BFS over (node, visited set)",
    viz: "graph", legend: ["focus:where we stand", "p1:visited so far", "answer:the path found"],
    inputLabel: "n ; undirected edges", hint: "4 ; 0-1 0-2 0-3",
    presets: [{ label: "a star", input: "4 ; 0-1 0-2 0-3" }, { label: "[[1],[0,2,4],[1,3,4],[2],[1,2]]", input: "5 ; 0-1 1-2 1-4 2-3 2-4" }, { label: "a path of 4", input: "4 ; 0-1 1-2 2-3" }],
    parse(s) {
      const [a, b] = P.parts(s, 2, 'n, then ";" and the edges'); const n = parseN(a, 6);
      const e = b.trim() ? b.trim().split(/[\s,]+/).map((x) => { const m = x.match(/^(\d+)-(\d+)$/); if (!m || +m[1] >= n || +m[2] >= n || m[1] === m[2]) throw new Error(`"${x}" should be a-b with nodes 0..${n - 1}.`); return [+m[1], +m[2]]; }) : [];
      const g = Array.from({ length: n }, () => []); e.forEach(([x, y]) => { if (!g[x].includes(y)) { g[x].push(y); g[y].push(x); } });
      const seen = new Set([0]), q = [0]; for (let h = 0; h < q.length; h++) g[q[h]].forEach((y) => { if (!seen.has(y)) { seen.add(y); q.push(y); } });
      if (seen.size !== n) throw new Error("The graph must be connected.");
      return { n, graph: g };
    },
    lines: { one: { ts: "if (n === 1) return 0;", go: "return 0" }, start: { ts: "queue.push([i, 1 << i]); // start anywhere", go: "queue = append(queue, state{i, 1 << i}) // start anywhere" }, level: { ts: "steps++;", go: "steps++" }, full: { ts: "if (newMask === full) return steps;", go: "return steps // everything visited after this move" } },
    table: { id: "tbl-6", preset: 0, rows: ["t0", "t1", "t2", "t3", "t4"] },
    trace({ n, graph }) {
      const Tr = new G.Trace();
      const edges = []; graph.forEach((ns, a) => ns.forEach((b) => { if (a < b) edges.push([a, b]); }));
      const maskStr = (m) => `{${[...Array(n).keys()].filter((i) => m & (1 << i)).join(",")}}`;
      const st = (node, mask, em, path) => ({ nodes: [...Array(n).keys()].map((i) => ({ id: i, m: i === node ? "focus" : path && path.includes(i) ? "answer" : mask & (1 << i) ? "p1" : null })), edges: edges.map(([a, b]) => ({ a, b, m: em && em[a + "-" + b] ? em[a + "-" + b] : null })), root: 0, note: { text: node != null ? `state (${node}, ${maskStr(mask)})` : "" } });
      if (n === 1) { Tr.add({ at: "one", state: st(0, 1), vars: {}, say: "One node: 0 steps." }); return Tr.done(0); }
      const full = (1 << n) - 1;
      const seen = Array.from({ length: n }, () => Array(1 << n).fill(false));
      const parent = new Map();
      let queue = [];
      for (let i = 0; i < n; i++) { queue.push([i, 1 << i]); seen[i][1 << i] = true; }
      Tr.add({ at: "start", state: st(null, 0), vars: { states: queue.length }, say: `A state is (where I am, which nodes I have visited). Start from every node at once: ${n} states at distance 0. Revisiting nodes is allowed; revisiting a state is not.` });
      let steps = 0, shown = 0;
      while (queue.length) {
        steps++;
        const next = [];
        for (const [node, mask] of queue) {
          for (const nb of graph[node]) {
            const nm = mask | (1 << nb);
            if (nm === full) {
              const path = [nb, node]; let k = node + ":" + mask;
              while (parent.has(k)) { const [pn, pm] = parent.get(k); path.push(pn); k = pn + ":" + pm; }
              path.reverse();
              Tr.add({ at: "full", state: st(nb, nm, { [Math.min(node, nb) + "-" + Math.max(node, nb)]: "hot" }), vars: { steps }, say: `Moving ${node} → ${nb} completes the set ${maskStr(nm)}: every node visited after ${steps} moves.` });
              for (let i = 0; i < path.length; i++) {
                const em = {}; for (let j = 0; j < i; j++) em[Math.min(path[j], path[j + 1]) + "-" + Math.max(path[j], path[j + 1])] = "answer";
                let m = 0; for (let j = 0; j <= i; j++) m |= 1 << path[j];
                Tr.add({ key: "t" + i, at: "full", state: st(path[i], m, em), vars: { step: i, at: path[i] }, say: i === 0 ? `Replay the route: start at ${path[0]}.` : `${path[i - 1]} → ${path[i]}${i === path.length - 1 ? `: all ${n} visited in ${steps} moves.` : "."}` });
              }
              return Tr.done(steps);
            }
            if (!seen[nb][nm]) { seen[nb][nm] = true; next.push([nb, nm]); parent.set(nb + ":" + nm, [node, mask]); }
          }
        }
        queue = next;
        if (shown++ < 6) Tr.add({ at: "level", state: st(queue.length ? queue[0][0] : null, queue.length ? queue[0][1] : 0), vars: { steps, "new states": queue.length }, say: `After ${steps} move${steps > 1 ? "s" : ""}: ${queue.length} new states, for example (${queue[0] ? `${queue[0][0]}, ${maskStr(queue[0][1])}` : "none"}).` });
      }
      return Tr.done(-1);
    },
  };

  G.quizzes.sp22 = {
    title: "Shortest paths",
    items: [
      { q: "All edges have the same weight. Which algorithm?", options: ["BFS", "Dijkstra", "Bellman-Ford", "Floyd–Warshall"], answer: 0, why: "BFS is simpler and O(V + E)." },
      { q: "Non-negative weights, one source. Which algorithm?", options: ["Dijkstra", "BFS", "Bellman-Ford", "DFS"], answer: 0, why: "O((V + E) log V) with a binary heap." },
      { q: "Some weights are negative. Which algorithm?", options: ["Bellman-Ford", "Dijkstra", "BFS", "Prim"], answer: 0, why: "Dijkstra's \"popped means final\" breaks with negative edges." },
      { q: "What does `if (d > dist[u]) continue` skip?", options: ["A stale heap entry, pushed before a shorter route was found", "The source", "Unreachable nodes", "Negative edges"], answer: 0, why: "The heap may hold several entries per node; only the smallest matters." },
      { q: "Cheapest flights with at most k stops: why copy dist each round?", options: ["So one round adds at most one flight", "To save memory", "To detect negative cycles", "To sort the flights"], answer: 0, why: "In place, an edge can build on a value written in the same round." },
      { q: "Minimum spanning tree versus shortest paths:", options: ["MST minimizes the total weight of a tree joining all nodes; shortest paths minimize the route from a source", "They are the same thing", "MST works only on directed graphs", "Shortest paths need no weights"], answer: 0, why: "Prim looks like Dijkstra but compares single edge weights, not distances from the source." },
    ],
  };
})();

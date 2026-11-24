/* Lesson 19 · Graphs: BFS, DFS and grids. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  /* ---------- shared input helpers ---------- */
  const parseEdges = (s, n) => {
    const t = String(s).replace(/[\[\]]/g, " ").trim().split(/[\s,]+/).filter(Boolean);
    return t.map((x) => {
      const m = x.match(/^(\d+)-(\d+)$/);
      if (!m) throw new Error(`"${x}" should look like 0-1.`);
      const a = +m[1], b = +m[2];
      if (a >= n || b >= n) throw new Error(`Edge ${x} uses a node outside 0..${n - 1}.`);
      if (a === b) throw new Error(`Edge ${x} is a self-loop; leave those out.`);
      return [a, b];
    });
  };
  const parseN = (s) => { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 1 || n > 9) throw new Error("n must be from 1 to 9."); return n; };
  const parseNode = (s, n, name) => { const v = P.num(s, name); if (!Number.isInteger(v) || v < 0 || v >= n) throw new Error(`${name} must be a node from 0 to ${n - 1}.`); return v; };
  const buildAdj = (n, edges, directed) => { const adj = Array.from({ length: n }, () => []); edges.forEach(([a, b]) => { adj[a].push(b); if (!directed) adj[b].push(a); }); return adj; };
  const ek = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  // a picture of an undirected graph: marks by node, edge marks by "a-b"
  const gview = (n, edges, nm, em, extra) => Object.assign({ nodes: Array.from({ length: n }, (_, i) => ({ id: i, m: (nm && nm[i]) || null })), edges: edges.map(([a, b]) => ({ a, b, m: (em && em[ek(a, b)]) || null })) }, extra);
  const parseGrid = (s, allowed, max) => {
    const rows = String(s).replace(/[\[\],"']/g, " ").replace(/\|/g, " ").trim().split(/\s+/).filter(Boolean);
    if (!rows.length) throw new Error("Type the grid as rows, for example 110 011.");
    if (rows.length > (max || 6)) throw new Error(`Up to ${max || 6} rows.`);
    const re = new RegExp(`^[${allowed}]+$`);
    rows.forEach((r) => { if (!re.test(r)) throw new Error(`Row "${r}": use only ${allowed.split("").join(", ")}.`); if (r.length !== rows[0].length) throw new Error("All rows must have the same length."); if (r.length > (max || 6)) throw new Error(`Up to ${max || 6} columns.`); });
    return rows.map((r) => r.split(""));
  };
  const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  /* ---------- building the adjacency list ---------- */
  A.buildGraph = {
    title: "From an edge list to an adjacency list",
    viz: "graph", legend: ["focus:the edge being added"],
    inputLabel: "n ; edges", hint: "4 ; 0-1 0-2 1-3 2-3",
    presets: [{ label: "the square", input: "4 ; 0-1 0-2 1-3 2-3" }, { label: "the sample graph", input: "6 ; 0-1 0-2 1-3 2-3 3-4" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'n, then ";" and the edges'); const n = parseN(a); return { n, edges: parseEdges(b, n) }; },
    lines: { init: { ts: "const adj: number[][] = Array.from({ length: n }, () => []);", go: "adj := make([][]int, n)" }, ab: { ts: "adj[a].push(b);", go: "adj[a] = append(adj[a], b)" }, ba: { ts: "if (!directed) adj[b].push(a); // an undirected edge goes both ways", go: "adj[b] = append(adj[b], a) // an undirected edge goes both ways" } },
    trace({ n, edges }) {
      const Tr = new G.Trace();
      const adj = Array.from({ length: n }, () => []);
      const shown = [];
      const panel = (hi) => [{ title: "adj", keyW: 30, valW: 110, entries: adj.map((l, i) => [i, `[${l.join(", ")}]`]), hi: hi || [] }];
      const st = (em, hi) => gview(n, shown, {}, em, { panels: panel(hi) });
      Tr.add({ at: "init", state: st(), vars: { n }, say: `One empty list per node: ${n} lists. (Each needs its own array; sharing one would alias them.)` });
      edges.forEach(([a, b]) => {
        shown.push([a, b]); adj[a].push(b);
        Tr.add({ at: "ab", state: st({ [ek(a, b)]: "hot" }, [a]), vars: { a, b }, say: `Edge ${a}–${b}: add ${b} to ${a}'s list.` });
        adj[b].push(a);
        Tr.add({ at: "ba", state: st({ [ek(a, b)]: "hot" }, [b]), vars: { a, b }, say: `Undirected, so also add ${a} to ${b}'s list.` });
      });
      Tr.add({ state: st(), vars: {}, say: `Done. Space O(V + E); listing a node's neighbors costs its degree.` });
      return Tr.done(adj);
    },
  };

  /* ---------- BFS and DFS ---------- */
  const gInput = { inputLabel: "n ; edges ; start", hint: "6 ; 0-1 0-2 1-3 2-3 3-4 ; 0" };
  const gPresets = [{ label: "the sample graph", input: "6 ; 0-1 0-2 1-3 2-3 3-4 ; 0" }, { label: "a cycle with a tail", input: "6 ; 0-1 1-2 2-3 3-0 2-4 4-5 ; 0" }, { label: "start in the middle", input: "7 ; 0-1 1-2 2-3 3-4 1-5 5-6 ; 3" }];
  const gParse = (s) => { const [a, b, c] = P.parts(s, 3, 'n ; edges ; start'); const n = parseN(a); return { n, edges: parseEdges(b, n), start: parseNode(c, n, "start") }; };
  const travLegend = ["focus:current node", "p1:waiting (visited, not yet handled)", "anchor:handled", "hot:the edge being checked"];

  function bfsTrace({ n, edges, start }, bug) {
    const Tr = new G.Trace();
    const adj = buildAdj(n, edges);
    const visited = Array(n).fill(false), done = Array(n).fill(false);
    const queue = [start];
    let head = 0;
    const order = [], tree = {};
    const st = (cur, edge) => {
      const nm = {}; for (let i = 0; i < n; i++) if (done[i]) nm[i] = "anchor"; else if (queue.slice(head).includes(i)) nm[i] = "p1";
      if (cur != null) nm[cur] = "focus";
      const em = Object.assign({}, tree); if (edge) em[ek(edge[0], edge[1])] = edge[2] || "hot";
      return gview(n, edges, nm, em, { root: start, strip: { title: "queue (front on the left)", items: queue.slice(head) }, note: { text: `order: ${order.join(", ") || "—"}` } });
    };
    if (!bug) visited[start] = true;
    Tr.add({ at: "init", flow: ["A"], state: st(), vars: { start }, say: bug ? `Start: enqueue ${start}. This version marks a node visited only when it is dequeued.` : `Mark ${start} visited and enqueue it. Mark on enqueue, so no node can enter the queue twice.` });
    let step = 0;
    while (head < queue.length) {
      const node = queue[head++];
      const key = "d" + step++;
      if (bug) visited[node] = true;
      order.push(node);
      Tr.add({ key, at: "deq", flow: ["B", "C"], state: st(node), vars: { node, queue: `[${queue.slice(head).join(", ")}]` }, say: `Dequeue ${node} (distance order: the closest waiting node).` });
      for (const next of adj[node]) {
        if (!visited[next]) {
          if (!bug) visited[next] = true;
          queue.push(next);
          if (!bug) tree[ek(node, next)] = "tree";
          Tr.add({ key, at: "push", flow: ["D"], state: st(node, [node, next]), vars: { node, next }, say: bug && queue.slice(head, -1).includes(next) ? `${next} is not marked yet, so it is enqueued again: now it is in the queue twice.` : `${next} is new: ${bug ? "" : "mark it and "}enqueue it.` });
        } else Tr.add({ key, at: "seen", flow: ["D"], state: st(node, [node, next, "dim"]), vars: { node, next }, say: `${next} was already seen: skip it.` });
      }
      done[node] = true;
      if (bug && step > 3 * n) break;
    }
    Tr.add({ flow: ["B", "Z"], state: st(), vars: { order: `[${order.join(", ")}]` }, say: bug ? `Order [${order.join(", ")}]: some nodes were handled more than once. On big graphs this blows up.` : `BFS order [${order.join(", ")}]. Each node and edge is handled once: O(V + E).` });
    return Tr.done(order);
  }
  const bfsLines = { init: { ts: "visited[start] = true; // mark when ENQUEUED, not when dequeued", go: "visited[start] = true // mark when ENQUEUED, not when dequeued" }, deq: { ts: "const node = queue[head++];", go: "func bfsOrder>>node := queue[head]" }, push: { ts: "bfsOrder>>queue.push(next);", go: "func bfsOrder>>queue = append(queue, next)" }, seen: { ts: "bfsOrder>>if (!visited[next]) {", go: "func bfsOrder>>if !visited[next] {" } };
  A.bfs = Object.assign({
    title: "BFS and DFS on the same graph", short: "BFS (queue)",
    viz: "graph", legend: travLegend, presets: gPresets, parse: gParse, lines: bfsLines,
    table: { id: "tbl-4", preset: 0, rows: ["d0", "d1", "d2", "d3", "d4"] },
    trace: (x) => bfsTrace(x, false),
    bugs: [{ label: "Replay the bug: mark when dequeued", input: "4 ; 0-1 0-2 1-3 2-3 ; 0", banner: "<b>Replaying a bug.</b> This version marks a node visited when it is <em>dequeued</em>, so node 3 gets into the queue twice.", trace: (x) => bfsTrace(x, true) }],
  }, gInput);

  A.dfsRec = Object.assign({
    title: "BFS and DFS on the same graph", short: "DFS (recursion)",
    viz: "graph", legend: travLegend, presets: gPresets, parse: gParse,
    lines: { visit: { ts: "function visit(node: number): void {>>visited[node] = true;", go: "visit = func(node int) {>>visited[node] = true" }, try: { ts: "for (const next of adj[node]) if (!visited[next]) visit(next);", go: "visit(next)" }, back: { ts: "for (const next of adj[node]) if (!visited[next]) visit(next);", go: "visit(start)" } },
    trace({ n, edges, start }) {
      const Tr = new G.Trace();
      const adj = buildAdj(n, edges);
      const visited = Array(n).fill(false), done = Array(n).fill(false);
      const order = [], stack = [], tree = {};
      const st = (cur, edge) => {
        const nm = {}; for (let i = 0; i < n; i++) if (done[i]) nm[i] = "anchor"; else if (stack.includes(i)) nm[i] = "p1";
        if (cur != null) nm[cur] = "focus";
        const em = Object.assign({}, tree); if (edge) em[ek(edge[0], edge[1])] = edge[2] || "hot";
        return gview(n, edges, nm, em, { root: start, strip: { title: "call stack (bottom on the left)", items: stack.map((x) => `v(${x})`) }, note: { text: `order: ${order.join(", ") || "—"}` } });
      };
      function visit(node) {
        visited[node] = true; order.push(node); stack.push(node);
        Tr.add({ at: "visit", state: st(node), vars: { node, depth: stack.length }, say: `visit(${node}): mark it and record it. Go as deep as possible before trying siblings.` });
        for (const next of adj[node]) {
          if (!visited[next]) { tree[ek(node, next)] = "tree"; Tr.add({ at: "try", state: st(node, [node, next]), vars: { node, next }, say: `${next} is unvisited: dive into it now.` }); visit(next); }
          else Tr.add({ at: "try", state: st(node, [node, next, "dim"]), vars: { node, next }, say: `${next} is already visited: skip.` });
        }
        stack.pop(); done[node] = true;
        Tr.add({ at: "back", state: st(stack[stack.length - 1]), vars: { finished: node }, say: `${node} has no unvisited neighbors left: return${stack.length ? ` to ${stack[stack.length - 1]}` : ""}.` });
      }
      visit(start);
      Tr.add({ state: st(), vars: { order: `[${order.join(", ")}]` }, say: `DFS order [${order.join(", ")}]. Also O(V + E); the stack depth can reach V.` });
      return Tr.done(order);
    },
  }, gInput);

  A.dfsIter = Object.assign({
    title: "BFS and DFS on the same graph", short: "DFS (explicit stack)",
    viz: "graph", legend: travLegend, presets: gPresets, parse: gParse,
    lines: { pop: { ts: "const node = stack.pop()!;", go: "node := stack[len(stack)-1]" }, skip: { ts: "if (visited[node]) continue; // may be pushed more than once; skip repeats", go: "continue // may be pushed more than once; skip repeats" }, visit: { ts: "dfsIterative>>visited[node] = true;", go: "func dfsIterative>>visited[node] = true" }, push: { ts: "for (let i = adj[node].length - 1; i >= 0; i--) stack.push(adj[node][i]);", go: "stack = append(stack, adj[node][i]) // reversed: same order as recursion" } },
    trace({ n, edges, start }) {
      const Tr = new G.Trace();
      const adj = buildAdj(n, edges);
      const visited = Array(n).fill(false);
      const order = [], stack = [start];
      const st = (cur, bad) => {
        const nm = {}; for (let i = 0; i < n; i++) if (visited[i]) nm[i] = "anchor"; else if (stack.includes(i)) nm[i] = "p1";
        if (cur != null) nm[cur] = bad ? "bug" : "focus";
        return gview(n, edges, nm, {}, { root: start, strip: { title: "stack (top on the right)", items: stack.slice() }, note: { text: `order: ${order.join(", ") || "—"}` } });
      };
      Tr.add({ at: "pop", state: st(), vars: { start }, say: `Push ${start}.` });
      while (stack.length) {
        const node = stack.pop();
        if (visited[node]) { Tr.add({ at: "skip", state: st(node, true), vars: { node }, say: `Pop ${node}: already visited (it was pushed twice). Skip.` }); continue; }
        visited[node] = true; order.push(node);
        Tr.add({ at: "visit", state: st(node), vars: { node }, say: `Pop ${node}: visit it.` });
        const add = [];
        for (let i = adj[node].length - 1; i >= 0; i--) { stack.push(adj[node][i]); add.push(adj[node][i]); }
        if (add.length) Tr.add({ at: "push", state: st(node), vars: { pushed: `[${add.join(", ")}]` }, say: `Push its neighbors in reverse (${add.join(", ")}), so the first neighbor is on top: same order as the recursion.` });
      }
      Tr.add({ state: st(), vars: { order: `[${order.join(", ")}]` }, say: `DFS order [${order.join(", ")}], with no recursion depth limit.` });
      return Tr.done(order);
    },
  }, gInput);

  /* ---------- Problem 1: shortest path with parents ---------- */
  A.shortestPath = {
    title: "Shortest path: BFS plus a parent for each node",
    viz: "graph", legend: ["focus:dequeued", "p1:in the queue", "anchor:handled", "answer:the path"],
    inputLabel: "n ; edges ; source ; target", hint: "5 ; 0-1 0-2 1-3 2-3 3-4 ; 0 ; 4",
    presets: [{ label: "0 → 4", input: "5 ; 0-1 0-2 1-3 2-3 3-4 ; 0 ; 4" }, { label: "unreachable", input: "6 ; 0-1 0-2 1-3 2-3 3-4 ; 0 ; 5" }, { label: "two routes", input: "7 ; 0-1 1-2 2-6 0-3 3-4 4-5 5-6 ; 0 ; 6" }],
    parse(s) { const [a, b, c, d] = P.parts(s, 4, "n ; edges ; source ; target"); const n = parseN(a); return { n, edges: parseEdges(b, n), s: parseNode(c, n, "source"), t: parseNode(d, n, "target") }; },
    lines: { init: { ts: "parent[source] = -1;", go: "parent[source] = -1" }, deq: { ts: "shortestPath>>const node = queue[head];", go: "func shortestPath>>node := queue[head]" }, stop: { ts: "if (node === target) break;", go: "break // BFS reaches the target by a shortest route" }, disc: { ts: "parent[next] = node; // remember who found it", go: "parent[next] = node // remember who found it" }, none: { ts: "if (parent[target] === -2) return [];", go: "return []int{} // unreachable" }, walk: { ts: "for (let at = target; at !== -1; at = parent[at]) path.push(at);", go: "for at := target; at != -1; at = parent[at] {" }, rev: { ts: "return path.reverse();", go: "slices.Reverse(path)" } },
    table: { id: "tbl-5", preset: 0, rows: ["q0", "q1", "q2", "q3"] },
    trace({ n, edges, s, t }) {
      const Tr = new G.Trace();
      const adj = buildAdj(n, edges);
      const parent = Array(n).fill(-2);
      parent[s] = -1;
      const queue = [s];
      let head = 0;
      const handled = new Set(), tree = {};
      const sub = () => Object.fromEntries(parent.map((p, i) => [i, p >= 0 ? `p ${p}` : p === -1 ? "src" : null]));
      const st = (cur, extraN, extraE) => {
        const nm = {}; for (let i = 0; i < n; i++) if (handled.has(i)) nm[i] = "anchor"; else if (queue.slice(head).includes(i)) nm[i] = "p1";
        if (cur != null) nm[cur] = "focus";
        Object.assign(nm, extraN || {});
        const v = gview(n, edges, nm, Object.assign({}, tree, extraE || {}), { root: s, strip: { title: "queue", items: queue.slice(head) } });
        const sb = sub(); v.nodes.forEach((x) => (x.sub = sb[x.id]));
        return v;
      };
      Tr.add({ at: "init", state: st(), vars: { source: s, target: t }, say: `parent[${s}] = −1 marks the source. Everyone else starts at −2: not discovered.` });
      let q = 0;
      while (head < queue.length) {
        const node = queue[head++];
        const key = "q" + q++;
        if (node === t) { Tr.add({ key, at: "stop", state: st(node), vars: { node }, say: `Dequeued the target ${t}. BFS reaches it first by a shortest route: stop.` }); break; }
        const found = [];
        for (const next of adj[node]) if (parent[next] === -2) { parent[next] = node; queue.push(next); tree[ek(node, next)] = "tree"; found.push(next); }
        Tr.add({ key, at: found.length ? "disc" : "deq", state: st(node), vars: { node, discovers: found.length ? found.join(", ") : "—" }, say: found.length ? `Dequeue ${node}: it discovers ${found.join(", ")}. Record parent = ${node} for each.` : `Dequeue ${node}: nothing new.` });
        handled.add(node);
      }
      if (parent[t] === -2) { Tr.add({ at: "none", state: st(null, { [t]: "bug" }), vars: { target: t }, say: `The queue ran dry and ${t} was never discovered: unreachable, return [].` }); return Tr.done([]); }
      const path = [];
      for (let at = t; at !== -1; at = parent[at]) path.push(at);
      const pn = Object.fromEntries(path.map((x) => [x, "answer"])), pe = {};
      for (let i = 0; i + 1 < path.length; i++) pe[ek(path[i], path[i + 1])] = "answer";
      Tr.add({ at: "walk", state: st(null, pn, pe), vars: { backwards: `[${path.join(", ")}]` }, say: `Follow the parents back from ${t}: ${path.join(" → ")}.` });
      path.reverse();
      Tr.add({ at: "rev", state: st(null, pn, pe), vars: { path: `[${path.join(", ")}]` }, say: `Reverse it: [${path.join(", ")}], ${path.length - 1} edge${path.length === 2 ? "" : "s"}.` });
      return Tr.done(path);
    },
  };

  /* ---------- Problem 2: number of islands ---------- */
  const islandsParse = (s) => parseGrid(s, "01", 6);
  const islandsPresets = [{ label: "the lesson's 4×5", input: "11000 11000 00100 00011" }, { label: "diagonals do not connect", input: "101 010 101" }, { label: "a ring", input: "1111 1001 1111" }];
  const gridView = (g, orig, mk, note) => ({ cells: g.map((row, r) => row.map((v, c) => ({ v: orig[r][c], m: (mk && mk[r + "," + c]) || (orig[r][c] === "1" ? (v === "0" ? "done" : "p1") : null) }))), note: { text: note } });
  A.islandsDFS = {
    title: "Number of Islands: flood fill each new piece of land", short: "DFS (sink)",
    viz: "grid", legend: ["p1:land not yet seen", "focus:being sunk", "done:already counted"],
    inputLabel: "rows of 0 and 1", hint: "11000 11000 00100 00011",
    presets: islandsPresets, parse: islandsParse,
    lines: { hit: { ts: "numIslandsDFS>>islands++;", go: "func numIslandsDFS>>islands++" }, sink: { ts: 'g[r][c] = "0"; // mark visited by turning it into water', go: "g[r][c] = '0' // mark visited by turning it into water" } },
    table: { id: "tbl-6", preset: 0, rows: ["i1", "i2", "i3"] },
    trace(grid) {
      const Tr = new G.Trace();
      const g = grid.map((r) => r.slice());
      const rows = g.length, cols = g[0].length;
      let islands = 0;
      const sink = (r, c, key) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols || g[r][c] !== "1") return;
        g[r][c] = "0";
        Tr.add({ key, at: "sink", state: gridView(g, grid, { [r + "," + c]: "focus" }, `islands: ${islands}`), vars: { r, c }, say: `Sink (${r},${c}): turn it to water so it is never counted again, then try its 4 neighbors.` });
        for (const [dr, dc] of DIRS4) sink(r + dr, c + dc, key);
      };
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (g[r][c] === "1") {
        islands++;
        const key = "i" + islands;
        Tr.add({ key, at: "hit", state: gridView(g, grid, { [r + "," + c]: "answer" }, `islands: ${islands}`), vars: { r, c, islands }, say: `The scan finds unseen land at (${r},${c}): a new island. Count it (${islands}) and flood-fill the whole piece.` });
        sink(r, c, key);
      }
      Tr.add({ state: gridView(g, grid, {}, `islands: ${islands}`), vars: { islands }, say: `${islands} island${islands === 1 ? "" : "s"}. Every cell is visited a constant number of times: O(rows × cols).` });
      return Tr.done(islands);
    },
  };
  A.islandsBFS = {
    title: "Number of Islands: flood fill each new piece of land", short: "BFS (queue)",
    viz: "grid", legend: ["p1:land not yet seen", "focus:dequeued", "done:already counted"],
    inputLabel: "rows of 0 and 1", hint: "11000 11000 00100 00011",
    presets: islandsPresets, parse: islandsParse,
    lines: { hit: { ts: "numIslandsBFS>>islands++;", go: "func numIslandsBFS>>islands++" }, deq: { ts: "const [cr, cc] = queue[head];", go: "cur := queue[head]" }, enq: { ts: 'g[nr][nc] = "0"; // mark when enqueued', go: "g[nr][nc] = '0' // mark when enqueued" } },
    trace(grid) {
      const Tr = new G.Trace();
      const g = grid.map((r) => r.slice());
      const rows = g.length, cols = g[0].length;
      let islands = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (g[r][c] !== "1") continue;
        islands++;
        g[r][c] = "0";
        Tr.add({ at: "hit", state: gridView(g, grid, { [r + "," + c]: "answer" }, `islands: ${islands}`), vars: { r, c, islands }, say: `New land at (${r},${c}): island ${islands}. Mark it and start a queue there.` });
        const queue = [[r, c]];
        for (let head = 0; head < queue.length; head++) {
          const [cr, cc] = queue[head];
          const add = [];
          for (const [dr, dc] of DIRS4) { const nr = cr + dr, nc = cc + dc; if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr][nc] === "1") { g[nr][nc] = "0"; queue.push([nr, nc]); add.push(`(${nr},${nc})`); } }
          Tr.add({ at: add.length ? "enq" : "deq", state: gridView(g, grid, { [cr + "," + cc]: "focus" }, `islands: ${islands}`), vars: { cell: `(${cr},${cc})`, enqueued: add.join(" ") || "—" }, say: add.length ? `Dequeue (${cr},${cc}); mark and enqueue its land neighbors ${add.join(", ")}.` : `Dequeue (${cr},${cc}); no new land around it.` });
        }
      }
      Tr.add({ state: gridView(g, grid, {}, `islands: ${islands}`), vars: { islands }, say: `${islands} island${islands === 1 ? "" : "s"}, same answer as DFS, with no recursion depth.` });
      return Tr.done(islands);
    },
  };

  /* ---------- Problem 3: clone graph ---------- */
  A.clone = {
    title: "Clone Graph: register the copy before visiting neighbors",
    viz: "graph", legend: ["focus:being cloned", "p1:copy registered, still in progress", "answer:copy finished", "hot:the edge being followed"],
    inputLabel: "undirected edges between nodes 1..n", hint: "1-2 2-3 3-4 4-1",
    presets: [{ label: "the square 1-2-3-4-1", input: "1-2 2-3 3-4 4-1" }, { label: "a triangle with a tail", input: "1-2 2-3 3-1 3-4" }],
    parse(s) { const e = parseEdges(s, 10).map(([a, b]) => { if (!a || !b) throw new Error("Nodes are numbered from 1."); return [a, b]; }); if (!e.length) throw new Error("Type at least one edge."); const n = Math.max(...e.flat()); if (n > 7) throw new Error("Use nodes 1..7."); return { n, edges: e }; },
    lines: { hit: { ts: "if (existing !== undefined) return existing;", go: "return existing // already cloned (also stops cycles)" }, make: { ts: "const copy = new GraphNode(original.val);", go: "copy := &GraphNode{Val: original.Val}" }, reg: { ts: "copies.set(original, copy); // register BEFORE visiting neighbors", go: "copies[original] = copy // register BEFORE visiting neighbors" }, nb: { ts: "for (const neighbor of original.neighbors) copy.neighbors.push(clone(neighbor));", go: "copy.Neighbors = append(copy.Neighbors, clone(neighbor))" }, ret: { ts: "function clone(original: GraphNode): GraphNode {>>return copy;", go: "clone = func(original *GraphNode) *GraphNode {>>return copy" } },
    trace({ n, edges }) {
      const Tr = new G.Trace();
      const nb = Array.from({ length: n + 1 }, () => []);
      edges.forEach(([a, b]) => { nb[a].push(b); nb[b].push(a); });
      const copies = new Map(), finished = new Set(), stack = [];
      const ids = []; for (let i = 1; i <= n; i++) if (nb[i].length || i === 1) ids.push(i);
      const st = (cur, edge) => ({
        nodes: ids.map((i) => ({ id: i, m: cur === i ? "focus" : finished.has(i) ? "answer" : copies.has(i) ? "p1" : null, sub: copies.has(i) ? `copy ${i}′` : null })),
        edges: edges.map(([a, b]) => ({ a, b, m: edge && ek(edge[0], edge[1]) === ek(a, b) ? "hot" : null })), root: 1,
        strip: { title: "call stack", items: stack.map((x) => `c(${x})`) },
        panels: [{ title: "copies: original → copy's neighbors", keyW: 34, valW: 110, entries: [...copies].map(([k, v]) => [k, `${k}′ → [${v.map((x) => x + "′").join(", ")}]`]) }],
      });
      function clone(o, from) {
        if (copies.has(o)) { Tr.add({ at: "hit", state: st(stack[stack.length - 1], from != null ? [from, o] : null), vars: { original: o }, say: `${o} already has a copy: return ${o}′. This is what stops the cycle.` }); return; }
        stack.push(o);
        Tr.add({ at: "make", state: st(o, from != null ? [from, o] : null), vars: { original: o }, say: `Make ${o}′, a new node with value ${o}.` });
        copies.set(o, []);
        Tr.add({ at: "reg", state: st(o), vars: { original: o }, say: `Register ${o} → ${o}′ in the map before visiting any neighbor, so a cycle back to ${o} finds it.` });
        for (const x of nb[o]) {
          Tr.add({ at: "nb", state: st(o, [o, x]), vars: { original: o, neighbor: x }, say: `Clone neighbor ${x} and link ${o}′ to it.` });
          clone(x, o);
          copies.get(o).push(x);
        }
        stack.pop(); finished.add(o);
        Tr.add({ at: "ret", state: st(stack[stack.length - 1]), vars: { returns: `${o}′` }, say: `${o}′ has all its neighbors: return it.` });
      }
      clone(1, null);
      Tr.add({ state: st(null), vars: {}, say: "Every node and edge copied once: O(V + E). The copies point only at copies." });
      return Tr.done([...copies].sort((a, b) => a[0] - b[0]).map(([k, v]) => [k, v]));
    },
  };

  /* ---------- Problem 4: rotting oranges ---------- */
  A.oranges = {
    title: "Rotting Oranges: every rotten orange starts the BFS at once",
    viz: "grid", legend: ["bug:rotten", "focus:rotted this minute", "p1:fresh"],
    inputLabel: "rows of 0 (empty), 1 (fresh), 2 (rotten)", hint: "211 110 011",
    presets: [{ label: "[[2,1,1],[1,1,0],[0,1,1]]", input: "211 110 011" }, { label: "one stays fresh", input: "211 011 101" }, { label: "two sources", input: "2110 0110 0112" }],
    parse: (s) => parseGrid(s, "012", 5),
    lines: { init: { ts: "if (g[r][c] === 2) queue.push([r, c]); // every rotten orange starts the BFS", go: "queue = append(queue, [2]int{r, c}) // every rotten orange starts the BFS" }, minute: { ts: "minutes++;", go: "minutes++" }, rot: { ts: "g[nr][nc] = 2; // becomes rotten (also marks it visited)", go: "g[nr][nc] = 2 // becomes rotten (also marks it visited)" }, ret: { ts: "return fresh === 0 ? minutes : -1;", go: "if fresh == 0 {" } },
    table: { id: "tbl-7", preset: 0, rows: ["m0", "m1", "m2", "m3", "m4"] },
    trace(grid) {
      const Tr = new G.Trace();
      const g = grid.map((r) => r.map(Number));
      const rows = g.length, cols = g[0].length;
      let fresh = 0, queue = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (g[r][c] === 2) queue.push([r, c]); else if (g[r][c] === 1) fresh++; }
      const view = (hot, note) => ({ cells: g.map((row, r) => row.map((v, c) => ({ v: v === 0 ? "" : v === 1 ? "●" : "✕", m: hot.has(r + "," + c) ? "focus" : v === 2 ? "bug" : v === 1 ? "p1" : null }))), note: { text: note } });
      Tr.add({ key: "m0", at: "init", state: view(new Set(), `minute 0 · fresh ${fresh}`), vars: { rotten: queue.length, fresh }, say: `${queue.length} rotten orange${queue.length === 1 ? "" : "s"} go into the queue together: multi-source BFS. ${fresh} fresh.` });
      let minutes = 0;
      while (queue.length && fresh > 0) {
        minutes++;
        const next = [];
        for (const [r, c] of queue) for (const [dr, dc] of DIRS4) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr][nc] === 1) { g[nr][nc] = 2; fresh--; next.push([nr, nc]); } }
        queue = next;
        Tr.add({ key: "m" + minutes, at: next.length ? "rot" : "minute", state: view(new Set(next.map(([r, c]) => r + "," + c)), `minute ${minutes} · fresh ${fresh}`), vars: { minute: minutes, "newly rotten": next.length, fresh }, say: next.length ? `Minute ${minutes}: ${next.map(([r, c]) => `(${r},${c})`).join(", ")} rot. ${fresh} fresh left.` : `Minute ${minutes}: nothing new rots.` });
      }
      const res = fresh === 0 ? minutes : -1;
      Tr.add({ at: "ret", state: view(new Set(), res === -1 ? `${fresh} fresh can never be reached` : `answer: ${minutes}`), vars: { answer: res }, say: res === -1 ? `${fresh} fresh orange${fresh === 1 ? "" : "s"} can never rot: −1.` : `All rotten after ${minutes} minute${minutes === 1 ? "" : "s"}.` });
      return Tr.done(res);
    },
  };

  /* ---------- Problem 5: Pacific Atlantic ---------- */
  A.pacific = {
    title: "Pacific Atlantic: flood uphill from each ocean, then intersect",
    viz: "grid", legend: ["p1:reaches the Pacific (top, left)", "p2:reaches the Atlantic (bottom, right)", "answer:both", "focus:dequeued"],
    inputLabel: "rows of heights (digits)", hint: "12235 32344 24531 67145 51124",
    presets: [{ label: "the lesson's 5×5", input: "12235 32344 24531 67145 51124" }, { label: "a ridge", input: "121 232 121" }],
    parse: (s) => parseGrid(s, "0123456789", 5).map((r) => r.map(Number)),
    lines: { start: { ts: "for (const [r, c] of starts) {>>seen[r][c] = true;", go: "seen[s[0]][s[1]] = true" }, deq: { ts: "pacificAtlantic>>const [r, c] = queue[head];", go: "func pacificAtlantic>>cur := queue[head]" }, add: { ts: "if (heights[nr][nc] < heights[r][c]) continue;>>seen[nr][nc] = true;", go: "continue // water could not flow from the neighbor down to us>>seen[nr][nc] = true" }, both: { ts: "if (pacific[r][c] && atlantic[r][c]) result.push([r, c]);", go: "if pacific[r][c] && atlantic[r][c] {" } },
    trace(h) {
      const Tr = new G.Trace();
      const rows = h.length, cols = h[0].length;
      const pac = h.map((r) => r.map(() => false)), atl = h.map((r) => r.map(() => false));
      const view = (cur, final) => ({ cells: h.map((row, r) => row.map((v, c) => ({ v, m: cur && cur[0] === r && cur[1] === c ? "focus" : pac[r][c] && atl[r][c] ? (final ? "answer" : "answer") : pac[r][c] ? "p1" : atl[r][c] ? "p2" : null }))), note: { text: final || "water flows to a neighbor that is lower or equal" } });
      function reach(seen, starts, name) {
        const queue = [];
        for (const [r, c] of starts) if (!seen[r][c]) { seen[r][c] = true; queue.push([r, c]); } else queue.push([r, c]);
        Tr.add({ at: "start", state: view(null), vars: { ocean: name, starts: starts.length }, say: `${name}: every border cell touching it is reachable. Work backwards: climb from the ocean to cells at least as high.` });
        for (let head = 0; head < queue.length; head++) {
          const [r, c] = queue[head];
          const add = [];
          for (const [dr, dc] of DIRS4) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[nr][nc]) continue;
            if (h[nr][nc] < h[r][c]) continue;
            seen[nr][nc] = true; queue.push([nr, nc]); add.push(`(${nr},${nc})`);
          }
          if (add.length) Tr.add({ at: "add", state: view([r, c]), vars: { ocean: name, cell: `(${r},${c})`, height: h[r][c] }, say: `From (${r},${c}) at height ${h[r][c]}: climb to ${add.join(", ")} (each is ≥ ${h[r][c]}).` });
        }
      }
      const ps = [], as = [];
      for (let r = 0; r < rows; r++) { ps.push([r, 0]); as.push([r, cols - 1]); }
      for (let c = 0; c < cols; c++) { ps.push([0, c]); as.push([rows - 1, c]); }
      // duplicates (corners) are fine: the TS code pushes them twice too; marking twice changes nothing
      reach(pac, ps, "Pacific"); reach(atl, as, "Atlantic");
      const result = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (pac[r][c] && atl[r][c]) result.push([r, c]);
      Tr.add({ at: "both", state: view(null, `green: reaches both oceans (${result.length} cells)`), vars: { cells: result.length }, say: `Cells in both sets can drain to both oceans: ${result.length} of them. Two BFS passes: O(rows × cols).` });
      return Tr.done(result);
    },
  };

  /* ---------- Problem 6: word ladder ---------- */
  A.ladder = {
    title: "Word Ladder: BFS level by level over one-letter changes",
    viz: "graph", legend: ["p2:this level", "focus:being expanded", "p1:the next level", "anchor:visited earlier", "answer:the end word"],
    inputLabel: "begin ; end ; word list", hint: "hit ; cog ; hot dot dog lot log cog",
    presets: [{ label: "hit → cog", input: "hit ; cog ; hot dot dog lot log cog" }, { label: "cog missing", input: "hit ; cog ; hot dot dog lot log" }, { label: "a → c", input: "a ; c ; a b c" }],
    parse(s) {
      const [a, b, c] = P.parts(s, 3, "begin ; end ; word list");
      const begin = a.trim(), end = b.trim();
      const list = c.trim().split(/[\s,]+/).filter(Boolean);
      const all = [begin, end, ...list];
      if (all.some((w) => !/^[a-z]+$/.test(w))) throw new Error("Lowercase letters only.");
      if (all.some((w) => w.length !== begin.length)) throw new Error("All words must have the same length.");
      if (begin.length > 5) throw new Error("Words up to 5 letters.");
      if (list.length > 8) throw new Error("Up to 8 words in the list.");
      return { begin, end, list };
    },
    lines: { none: { ts: "if (!words.has(endWord)) return 0; // the target must be in the list", go: "return 0 // the target must be in the list" }, buckets: { ts: "else buckets.set(pattern, [word]);", go: "buckets[p] = append(buckets[p], word)" }, level: { ts: "for (const word of queue) {", go: "for _, word := range queue {" }, found: { ts: "if (word === endWord) return length;", go: "return length" }, add: { ts: "visited.add(neighbor); // mark when enqueued", go: "visited[neighbor] = true // mark when enqueued" }, next: { ts: "length++;", go: "length++" }, fail: { ts: "length++;>>return 0;", go: "length++>>return 0" } },
    table: { id: "tbl-8", preset: 0, rows: ["L1", "L2", "L3", "L4", "L5"] },
    trace({ begin, end, list }) {
      const Tr = new G.Trace();
      const words = [...new Set([begin, ...list])];
      const diff1 = (x, y) => { let d = 0; for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) d++; return d === 1; };
      const edges = [];
      for (let i = 0; i < words.length; i++) for (let j = i + 1; j < words.length; j++) if (diff1(words[i], words[j])) edges.push({ a: words[i], b: words[j] });
      const visited = new Set([begin]);
      let queue = [begin], next = [];
      const st = (cur, extra) => ({
        nodes: words.map((w) => ({ id: w, label: w, m: (extra && extra[w]) || (w === cur ? "focus" : queue.includes(w) && !extra ? "p2" : next.includes(w) ? "p1" : visited.has(w) ? "anchor" : null) })),
        edges: edges.map((e) => ({ a: e.a, b: e.b, m: cur && ((e.a === cur && next.includes(e.b)) || (e.b === cur && next.includes(e.a))) ? "tree" : null })),
        root: begin, strip: { title: "this level", items: queue.slice() },
      });
      if (!list.includes(end)) { Tr.add({ at: "none", state: st(null), vars: { end }, say: `"${end}" is not in the word list, so no ladder can end there: 0.` }); return Tr.done(0); }
      Tr.add({ at: "buckets", state: st(null), vars: { words: words.length }, say: `Group words by pattern ("*ot" holds hot, dot, lot…). Two words that share a pattern differ by one letter: those are the edges drawn here.` });
      let length = 1;
      while (queue.length) {
        next = [];
        for (const w of queue) {
          if (w === end) { Tr.add({ key: "L" + length, at: "found", state: st(null, { [w]: "answer" }), vars: { length }, say: `"${end}" is in level ${length}: the shortest ladder has ${length} words.` }); return Tr.done(length); }
          const add = [];
          words.forEach((x) => { if (!visited.has(x) && diff1(w, x)) { visited.add(x); next.push(x); add.push(x); } });
          Tr.add({ key: "L" + length, at: add.length ? "add" : "level", state: st(w), vars: { level: length, word: w }, say: add.length ? `Expand "${w}": ${add.join(", ")} are one letter away and new. Mark them and put them in the next level.` : `Expand "${w}": nothing new.` });
        }
        queue = next; length++;
        if (queue.length) Tr.add({ key: "L" + length, at: "next", state: st(null), vars: { level: length, words: queue.join(", ") }, say: `Level ${length}: ${queue.join(", ")}.` });
      }
      Tr.add({ at: "fail", state: st(null), vars: {}, say: `The levels ran out before reaching "${end}": 0.` });
      return Tr.done(0);
    },
  };

  G.quizzes.graph19 = {
    title: "Graphs",
    items: [
      { q: "Shortest path in an unweighted graph: which traversal?", options: ["BFS", "DFS", "Either, they give the same", "Dijkstra is required"], answer: 0, why: "BFS reaches nodes in order of distance." },
      { q: "When should BFS mark a node visited?", options: ["When it is enqueued", "When it is dequeued", "After all its neighbors are handled", "Never: use a counter"], answer: 0, why: "Marking on dequeue lets the same node enter the queue several times." },
      { q: "Rotting oranges starts with several rotten oranges. How?", options: ["Put them all in the queue first (multi-source BFS)", "Run one BFS per rotten orange", "DFS from the first one", "Sort the cells"], answer: 0, why: "All sources spread at the same pace, minute by minute." },
      { q: "Why does Clone Graph register the copy before visiting neighbors?", options: ["A cycle back to the node must find the copy, or it recurses forever", "To save memory", "To keep the order", "Maps require it"], answer: 0, why: "Registration is the visited mark." },
      { q: "Pacific Atlantic is solved by searching from…", options: ["the oceans, going uphill", "every cell, going downhill", "the highest cell", "the corners only"], answer: 0, why: "Two searches instead of one per cell." },
      { q: "Cost of BFS or DFS on an adjacency list?", options: ["O(V + E)", "O(V²)", "O(E log V)", "O(V · E)"], answer: 0, why: "Each node once, each edge once (twice if undirected)." },
    ],
  };
})();

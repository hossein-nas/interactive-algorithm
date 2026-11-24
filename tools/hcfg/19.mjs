export const expose = "(globalThis as any).GraphNode = GraphNode;\n";
export function specs({ A, R, rnd }) {
  const graph = (minN, maxN) => { const n = rnd(minN, maxN); const set = new Set(); const m = rnd(0, Math.min(10, (n * (n - 1)) / 2)); for (let i = 0; i < m; i++) { const a = rnd(0, n - 1), b = rnd(0, n - 1); if (a !== b && !set.has(`${b}-${a}`)) set.add(`${a}-${b}`); } return { n, e: [...set] }; };
  const g3 = () => { const { n, e } = graph(1, 8); return `${n} ; ${e.join(" ")} ; ${rnd(0, n - 1)}`; };
  const E = (s) => s.edges;
  const grid = (alpha, r, c) => Array.from({ length: r }, () => Array.from({ length: c }, () => alpha[rnd(0, alpha.length - 1)]).join("")).join(" ");
  return {
    buildGraph: { gen: () => { const { n, e } = graph(1, 8); return `${n} ; ${e.join(" ")}`; }, want: (s) => { const x = A.buildGraph.parse(s); return R.buildGraph(x.n, x.edges); } },
    bfs: { gen: g3, want: (s) => { const x = A.bfs.parse(s); return R.bfsOrder(R.buildGraph(x.n, x.edges), x.start); } },
    dfsRec: { gen: g3, want: (s) => { const x = A.dfsRec.parse(s); return R.dfsOrder(R.buildGraph(x.n, x.edges), x.start); } },
    dfsIter: { gen: g3, want: (s) => { const x = A.dfsIter.parse(s); return R.dfsIterative(R.buildGraph(x.n, x.edges), x.start); } },
    shortestPath: { gen: () => { const { n, e } = graph(1, 8); return `${n} ; ${e.join(" ")} ; ${rnd(0, n - 1)} ; ${rnd(0, n - 1)}`; }, want: (s) => { const x = A.shortestPath.parse(s); return R.shortestPath(x.n, x.edges, x.s, x.t); } },
    islandsDFS: { gen: () => grid("0011", rnd(1, 6), rnd(1, 6)), want: (s) => R.numIslandsDFS(A.islandsDFS.parse(s)) },
    islandsBFS: { gen: () => grid("0011", rnd(1, 6), rnd(1, 6)), want: (s) => R.numIslandsBFS(A.islandsBFS.parse(s)) },
    clone: {
      gen: () => { const n = rnd(1, 6); const set = new Set(); for (let i = 0; i < rnd(1, 9); i++) { const a = rnd(1, n), b = rnd(1, n); if (a !== b && !set.has(`${b}-${a}`) && !set.has(`${a}-${b}`)) set.add(`${a}-${b}`); } if (!set.size) set.add("1-2"); return [...set].join(" "); },
      want: (s) => { const { n, edges } = A.clone.parse(s); const gn = Array.from({ length: n }, (_, i) => new R.GraphNode(i + 1)); edges.forEach(([a, b]) => { gn[a - 1].neighbors.push(gn[b - 1]); gn[b - 1].neighbors.push(gn[a - 1]); }); const c = R.cloneGraph(gn[0]); const seen = new Map(), q = [c]; seen.set(c.val, c); for (let h = 0; h < q.length; h++) q[h].neighbors.forEach((x) => { if (gn.includes(x)) throw new Error("clone points at an original"); if (!seen.has(x.val)) { seen.set(x.val, x); q.push(x); } }); return [...seen.values()].sort((a, b) => a.val - b.val).map((x) => [x.val, x.neighbors.map((y) => y.val)]); },
    },
    oranges: { gen: () => grid("0112", rnd(1, 5), rnd(1, 5)), want: (s) => R.orangesRotting(A.oranges.parse(s).map((r) => r.map(Number))) },
    pacific: { gen: () => grid("0123456789", rnd(1, 5), rnd(1, 5)), want: (s) => R.pacificAtlantic(A.pacific.parse(s)) },
    ladder: { gen: () => { const w = () => Array.from({ length: 3 }, () => "abc"[rnd(0, 2)]).join(""); const list = Array.from({ length: rnd(1, 8) }, w); return `${w()} ; ${rnd(0, 2) ? list[rnd(0, list.length - 1)] : w()} ; ${list.join(" ")}`; }, want: (s) => { const x = A.ladder.parse(s); return R.ladderLength(x.begin, x.end, x.list); } },
  };
}

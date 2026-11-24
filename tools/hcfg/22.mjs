export function specs({ A, R, rnd }) {
  const wedges = (n, lo, m, wlo, whi) => Array.from({ length: m }, () => { const u = rnd(lo, n - 1 + lo); let v = rnd(lo, n - 1 + lo); return `${u}>${v}:${rnd(wlo, whi)}`; });
  const fix = (d) => d.map((x) => (x === Infinity ? "INF" : x));
  return {
    dijkstra: { gen: () => { const n = rnd(1, 7); return `${n} ; ${wedges(n, 0, rnd(0, 10), 0, 9).join(" ")} ; ${rnd(0, n - 1)}`; }, want: (s) => { const x = A.dijkstra.parse(s); const adj = Array.from({ length: x.n }, () => []); x.edges.forEach(([u, v, w]) => adj[u].push([v, w])); return fix(R.dijkstra(adj, x.start)); }, got: fix },
    network: { gen: () => { const n = rnd(1, 6); return `${n} ; ${wedges(n, 1, rnd(0, 9), 0, 9).join(" ")} ; ${rnd(1, n)}`; }, want: (s) => { const x = A.network.parse(s); return R.networkDelayTime(x.edges, x.n, x.k); } },
    effort: { gen: () => { const r = rnd(1, 4), c = rnd(1, 4); return Array.from({ length: r }, () => Array.from({ length: c }, () => rnd(0, 9)).join("")).join(" "); }, want: (s) => R.minimumEffortPath(A.effort.parse(s)) },
    flights: { gen: () => { const n = rnd(2, 6); return `${n} ; ${wedges(n, 0, rnd(0, 9), 1, 9).join(" ")} ; ${rnd(0, n - 1)} ; ${rnd(0, n - 1)} ; ${rnd(0, 4)}`; }, want: (s) => { const x = A.flights.parse(s); return R.findCheapestPrice(x.n, x.edges, x.src, x.dst, x.k); } },
    bellman: { gen: () => { const n = rnd(1, 6); return `${n} ; ${wedges(n, 0, rnd(0, 10), -3, 9).join(" ")} ; ${rnd(0, n - 1)}`; }, want: (s) => { const x = A.bellman.parse(s); const r = R.bellmanFord(x.n, x.edges, x.start); return r && fix(r); }, got: (r) => r && fix(r) },
    visitAll: { gen: () => { const n = rnd(1, 6); const e = []; for (let i = 1; i < n; i++) e.push(`${rnd(0, i - 1)}-${i}`); for (let j = 0; j < rnd(0, 3); j++) { const a = rnd(0, n - 1), b = rnd(0, n - 1); if (a !== b) e.push(`${a}-${b}`); } return `${n} ; ${e.join(" ")}`; }, want: (s) => R.shortestPathLength(A.visitAll.parse(s).graph) },
  };
}

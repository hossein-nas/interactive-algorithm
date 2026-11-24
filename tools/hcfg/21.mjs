export const expose = "(globalThis as any).UnionFind = UnionFind;\n";
export function specs({ A, R, rnd }) {
  const edges = (n, lo, m) => Array.from({ length: m }, () => `${rnd(lo, n - 1 + lo)}-${rnd(lo, n - 1 + lo)}`);
  return {
    ufOps: { gen: () => { const n = rnd(1, 9); return `${n} ; ${Array.from({ length: rnd(1, 10) }, () => `${rnd(0, n - 1)}${rnd(0, 2) ? "-" : "?"}${rnd(0, n - 1)}`).join(" ")}`; },
      want: (s) => { const { n, ops } = A.ufOps.parse(s); const u = new R.UnionFind(n); return ops.map((o) => (o.kind === "u" ? u.union(o.a, o.b) : u.connected(o.a, o.b))); } },
    components: { gen: () => { const n = rnd(1, 9); return `${n} ; ${edges(n, 0, rnd(0, 8)).join(" ")}`; }, want: (s) => { const x = A.components.parse(s); return R.countComponents(x.n, x.edges); } },
    redundant: { gen: () => { const n = rnd(3, 8); const e = []; for (let i = 2; i <= n; i++) e.push([rnd(1, i - 1), i]); let a = rnd(1, n), b = rnd(1, n); while (a === b) b = rnd(1, n); e.splice(rnd(0, e.length), 0, [a, b]); return e.map(([x, y]) => `${x}-${y}`).join(" "); }, want: (s) => R.findRedundantConnection(A.redundant.parse(s)) },
    validTree: { gen: () => { const n = rnd(1, 7); return `${n} ; ${edges(n, 0, rnd(Math.max(0, n - 2), n)).join(" ")}`; }, want: (s) => { const x = A.validTree.parse(s); return R.validTree(x.n, x.edges); } },
    accounts: { gen: () => { const names = ["Ann", "Bo"], em = "abcdefgh"; return Array.from({ length: rnd(1, 5) }, () => `${names[rnd(0, 1)]}: ${Array.from({ length: rnd(1, 3) }, () => em[rnd(0, 7)]).join(" ")}`).join(" ; "); },
      want: (s) => R.accountsMerge(A.accounts.parse(s).map((a) => a.slice())), ok: (s, r) => true },
    islands2: { gen: () => { const m = rnd(1, 4), n = rnd(1, 4); return `${m} ${n} ; ${Array.from({ length: rnd(1, 10) }, () => `${rnd(0, m - 1)},${rnd(0, n - 1)}`).join(" ")}`; }, want: (s) => { const x = A.islands2.parse(s); return R.numIslands2(x.m, x.n, x.pos); } },
  };
}

export function specs({ A, R, rnd }) {
  const pairs = (n, lo, max) => { const out = []; const m = rnd(0, max); for (let i = 0; i < m; i++) { const a = rnd(lo, n - 1 + lo), b = rnd(lo, n - 1 + lo); if (a !== b) out.push(`${a}-${b}`); } return out; };
  const course = () => { const n = rnd(1, 8); return `${n} ; ${pairs(n, 0, 9).join(" ")}`; };
  const P2 = (s) => A.kahn.parse(s);
  return {
    kahn: { gen: course, want: (s) => { const x = P2(s); return R.canFinish(x.n, x.pre); }, askNext: { 0: ["dec"] } },
    dfs3: { gen: course, want: (s) => { const x = P2(s); return R.canFinishDFS(x.n, x.pre); } },
    findOrder: { gen: course, want: (s) => { const x = P2(s); return R.findOrder(x.n, x.pre); }, askNext: { 0: ["dec"] } },
    semesters: { gen: () => { const n = rnd(1, 8); return `${n} ; ${pairs(n, 1, 9).join(" ")}`; }, want: (s) => { const x = A.semesters.parse(s); return R.minimumSemesters(x.n, x.rel); } },
    alien: { gen: () => Array.from({ length: rnd(1, 7) }, () => Array.from({ length: rnd(1, 4) }, () => "abcd"[rnd(0, 3)]).join("")).join(" "), want: (s) => R.alienOrder(A.alien.parse(s)) },
    mht: { gen: () => { const n = rnd(1, 9); const e = []; for (let i = 1; i < n; i++) e.push(rnd(0, 1) ? `${rnd(0, i - 1)}-${i}` : `${i}-${rnd(0, i - 1)}`); return `${n} ; ${e.join(" ")}`; }, want: (s) => { const x = A.mht.parse(s); return R.findMinHeightTrees(x.n, x.e); } },
  };
}

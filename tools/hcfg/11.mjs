export function specs({ A, R, rnd }) {
  const distinct = (n) => { const s = new Set(); while (s.size < n) s.add(rnd(-9, 9)); return [...s].join(" "); };
  return {
    subsets: { gen: () => distinct(rnd(0, 4)) || "[]", want: (s) => R.subsets(A.subsets.parse(s)) },
    permutations: { gen: () => distinct(rnd(1, 3)), want: (s) => R.permutations(A.permutations.parse(s)) },
    combinationSum: { gen: () => { const c = new Set(); while (c.size < rnd(1, 4)) c.add(rnd(1, 8)); return `${[...c].join(" ")} ; ${rnd(1, 10)}`; }, want: (s) => { const { c, t } = A.combinationSum.parse(s); return R.combinationSum(c, t); } },
    parens: { gen: () => String(rnd(1, 3)), want: (s) => R.generateParenthesis(+s) },
    nQueens: { gen: () => String(rnd(4, 6)), want: (s) => { const n = +s; return R.solveNQueens(n).slice(0, n === 4 ? 2 : 1); }, got: (r) => r.map((cols) => cols.map((c) => ".".repeat(c) + "Q" + ".".repeat(cols.length - c - 1))) },
    buggySubsets: { gen: () => [...new Set([rnd(0, 9), rnd(0, 9), rnd(0, 9)])].join(" "), want: (s) => R.buggySubsets(A.buggySubsets.parse(s)).length },
  };
}

export function specs({ A, R, rnd, arr }) {
  const w = (al, lo, hi) => Array.from({ length: rnd(lo, hi) }, () => al[rnd(0, al.length - 1)]).join("");
  return {
    uniquePaths: { gen: () => `${rnd(1, 7)} ; ${rnd(1, 7)}`, want: (s) => { const x = A.uniquePaths.parse(s); return R.uniquePaths(x.m, x.n); } },
    minPath: { gen: () => { const r = rnd(1, 5), c = rnd(1, 6); return Array.from({ length: r }, () => arr(c, 0, 9).join("")).join(" "); }, want: (s) => R.minPathSum(A.minPath.parse(s)) },
    knap: { gen: () => `${Array.from({ length: rnd(1, 5) }, (_, i) => `i${i}:${rnd(1, 5)}:${rnd(1, 30)}`).join(" ")} ; ${rnd(0, 8)}`, want: (s) => { const x = A.knap.parse(s); return R.knapsackWithItems(x.items, x.cap); } },
    partition: { gen: () => { for (;;) { const a = arr(rnd(1, 8), 1, 9); if (a.reduce((x, y) => x + y, 0) <= 40) return a.join(" "); } }, want: (s) => R.canPartition(A.partition.parse(s)) },
    lcs: { gen: () => `${w("abc", 0, 8)} ; ${w("abc", 0, 8)}`, want: (s) => { const [a, b] = A.lcs.parse(s); return R.longestCommonSubsequence(a, b); } },
    substr: { gen: () => `${w("abc", 1, 8)} ; ${w("abc", 1, 8)}`, want: (s) => { const [a, b] = A.substr.parse(s); return R.longestCommonSubstring(a, b); } },
    edit: { gen: () => `${w("abc", 0, 9)} ; ${w("abc", 0, 9)}`, want: (s) => { const [a, b] = A.edit.parse(s); return R.minDistance(a, b); } },
    palin: { gen: () => w("abc", 1, 9), want: (s) => R.longestPalindromeSubseq(A.palin.parse(s)) },
    regex: { gen: () => { for (;;) { const p = w("ab.*", 0, 8); try { const x = A.regex.parse(`${w("ab", 0, 8)} ; ${p}`); return `${x[0]} ; ${x[1]}`; } catch (e) {} } }, want: (s) => { const [a, b] = A.regex.parse(s); return R.isMatch(a, b); } },
  };
}

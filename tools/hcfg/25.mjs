export function specs({ A, R, rnd, arr }) {
  return {
    climbNaive: { gen: () => String(rnd(1, 6)), want: (s) => R.climbNaive(+s) },
    climbMemo: { gen: () => String(rnd(1, 9)), want: (s) => R.climbMemo(+s) },
    climbTable: { gen: () => String(rnd(1, 12)), want: (s) => R.climbTable(+s) },
    climbRoll: { gen: () => String(rnd(1, 45)), want: (s) => R.climbStairs(+s) },
    rob: { gen: () => arr(rnd(0, 10), 0, 20).join(" "), want: (s) => R.rob(A.rob.parse(s)), askNext: { 0: ["loop", "ret"], 1: ["loop", "ret"] } },
    coinChange: { gen: () => `${arr(rnd(1, 5), 1, 8).join(" ")} ; ${rnd(0, 14)}`, want: (s) => { const x = A.coinChange.parse(s); return R.coinChange(x.coins, x.amount); } },
    change: { gen: () => `${[...new Set(arr(rnd(1, 4), 1, 6))].join(" ")} ; ${rnd(0, 14)}`, want: (s) => { const x = A.change.parse(s); return R.change(x.amount, x.coins); } },
    lisQuad: { gen: () => arr(rnd(0, 10), -5, 20).join(" "), want: (s) => R.lengthOfLISQuadratic(A.lisQuad.parse(s)) },
    lisTails: { gen: () => arr(rnd(0, 10), -5, 20).join(" "), want: (s) => R.lengthOfLIS(A.lisTails.parse(s)) },
    wordBreak: { gen: () => { const al = "ab"; const w = () => Array.from({ length: rnd(1, 3) }, () => al[rnd(0, 1)]).join(""); return `${Array.from({ length: rnd(0, 14) }, () => al[rnd(0, 1)]).join("")} ; ${Array.from({ length: rnd(1, 6) }, w).join(" ")}`; }, want: (s) => { const x = A.wordBreak.parse(s); return R.wordBreak(x.s, x.words); } },
    kadane: { gen: () => arr(rnd(1, 10), -9, 9).join(" "), want: (s) => R.maxSubArray(A.kadane.parse(s)) },
    maxProd: { gen: () => arr(rnd(1, 10), -4, 4).join(" "), want: (s) => R.maxProduct(A.maxProd.parse(s)) },
  };
}

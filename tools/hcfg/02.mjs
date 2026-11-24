export const expose = "(globalThis as any).fibCalls = (n: number) => { naiveCalls = 0; fibNaive(n); return naiveCalls; };\n";
export function specs({ A, R, rnd, arr }) {
  const P = (k) => (s) => A[k].parse(s);
  return {
    countPairs: { gen: () => `${arr(rnd(1, 8), -9, 9).join(" ")} ; ${rnd(-10, 10)}`, want: (s) => { const { nums, target } = P("countPairs")(s); return R.countPairsWithSum(nums, target); } },
    countCommon: { gen: () => `${arr(rnd(1, 8), 0, 9).join(" ")} ; ${arr(rnd(1, 8), 0, 9).join(" ")}`, want: (s) => { const { a, b } = P("countCommon")(s); return R.countCommon(a, b); } },
    countHalvings: { gen: () => String(rnd(1, 64)), want: (s) => R.countHalvings(+s) },
    halvingWithWork: { gen: () => String(rnd(1, 64)), want: (s) => R.halvingWithWork(+s) },
    fibNaive: { gen: () => String(rnd(0, 7)), want: (s) => ({ value: R.fibMemo(+s), calls: R.fibCalls(+s) }) },
    fibMemo: { gen: () => String(rnd(0, 7)), got: (r) => r.value, want: (s) => R.fibMemo(+s) },
    doubling: { gen: () => String(rnd(1, 17)), ok: (s, copies) => copies < 2 * +s },
    queueShift: { gen: () => arr(rnd(1, 9), -9, 9).join(" "), want: (s) => R.processQueue(P("queueShift")(s)) },
    queueSlice: { gen: () => arr(rnd(1, 9), -9, 9).join(" "), want: (s) => R.processQueue(P("queueSlice")(s)) },
    triangle: { gen: () => String(rnd(1, 8)), want: (s) => R.triangle(+s) },
    countPairsMap: { gen: () => arr(rnd(1, 10), 0, 4).join(" "), want: (s) => R.countDigitsPairs(P("countPairsMap")(s)) },
    countSubsets: { gen: () => arr(rnd(0, 4), 0, 9).join(" ") || "[]", want: (s) => R.countSubsets(P("countSubsets")(s)) },
    atMostKZeros: { gen: () => `${arr(rnd(1, 12), 0, 1).join(" ")} ; ${rnd(0, 3)}`, want: (s) => { const { bits, limit } = P("atMostKZeros")(s); return R.longestAtMostKZeros(bits, limit); } },
  };
}

export const added = "added-07.md";
export const expose = "(globalThis as any).NumArray = NumArray; (globalThis as any).NumMatrix = NumMatrix;\n";
export function specs({ A, R, rnd, arr }) {
  const P = (k) => (s) => A[k].parse(s);
  return {
    prefixBasics: { gen: () => { const a = arr(rnd(1, 10), -9, 9); const l = rnd(0, a.length - 1), r = rnd(l, a.length - 1); return `${a.join(" ")} ; ${l} ${r}`; }, want: (s) => { const { nums, l, r } = P("prefixBasics")(s); return R.rangeSum(R.buildPrefix(nums), l, r); } },
    numArray: { gen: () => { const a = arr(rnd(1, 10), -9, 9); const qs = Array.from({ length: rnd(1, 6) }, () => { const l = rnd(0, a.length - 1); return `${l} ${rnd(l, a.length - 1)}`; }); return `${a.join(" ")} ; ${qs.join(", ")}`; }, want: (s) => { const { nums, qs } = P("numArray")(s); const na = new R.NumArray(nums); return qs.map(([l, r]) => na.sumRange(l, r)); } },
    productExceptSelf: { gen: () => arr(rnd(2, 8), -4, 4).join(" "), want: (s) => R.productExceptSelf(P("productExceptSelf")(s)).map((v) => (Object.is(v, -0) ? 0 : v)) },
    subarraySum: { gen: () => `${arr(rnd(1, 10), -5, 5).join(" ")} ; ${rnd(-5, 8)}`, want: (s) => { const { nums, k } = P("subarraySum")(s); return R.subarraySum(nums, k); }, askNext: [["look"], ["look"]] },
    contiguousArray: { gen: () => arr(rnd(1, 12), 0, 1).join(" "), want: (s) => R.findMaxLength(P("contiguousArray")(s)), askNext: [["hit"], ["first"]] },
    numMatrix: { gen: () => { const R0 = rnd(1, 5), C0 = rnd(1, 5); const m = Array.from({ length: R0 }, () => arr(C0, 0, 9).join(" ")).join(" / "); const r1 = rnd(0, R0 - 1), c1 = rnd(0, C0 - 1); return `${m} ; ${r1} ${c1} ${rnd(r1, R0 - 1)} ${rnd(c1, C0 - 1)}`; }, want: (s) => { const { M, q } = P("numMatrix")(s); return new R.NumMatrix(M).sumRegion(...q); } },
    flightBookings: { gen: () => { const n = rnd(1, 10); const b = Array.from({ length: rnd(1, 6) }, () => { const f = rnd(1, n); return `${f} ${rnd(f, n)} ${rnd(1, 50)}`; }); return `${n} ; ${b.join(", ")}`; }, want: (s) => { const { n, bk } = P("flightBookings")(s); return R.corpFlightBookings(bk, n); } },
    pivotIndex: { gen: () => arr(rnd(1, 10), -5, 9).join(" "), want: (s) => R.pivotIndex(P("pivotIndex")(s)) },
  };
}
export function extra({ A, R, check }) {
  const b = (i) => { const s = A.subarraySum, x = s.bugs[i]; return x.trace(s.parse(x.input)).result; };
  check(b(0) !== R.subarraySum([1, 2, 3], 3), "no-seed bug should give a wrong count");
  check(b(1) !== R.subarraySum([1, -1, 1], 0), "store-first bug should give a wrong count");
}

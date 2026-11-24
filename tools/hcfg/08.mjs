export const added = "added-08.md";
export function specs({ A, R, rnd, arr, sorted }) {
  const P = (k) => (s) => A[k].parse(s);
  const sortedT = () => `${sorted(arr(rnd(1, 12), -20, 20)).join(" ")} ; ${rnd(-22, 22)}`;
  return {
    guessing: { gen: () => { const n = rnd(1, 2000); return `${rnd(1, n)} ; ${n}`; }, ok: (s, g) => g <= Math.ceil(Math.log2(+s.split(";")[1] + 1)) },
    lowerBound: { gen: sortedT, want: (s) => { const { nums, target } = P("lowerBound")(s); return R.lowerBound(nums, target); }, askNext: [["yes"], ["no"]] },
    classicSearch: { gen: sortedT, want: (s) => { const { nums, target } = P("classicSearch")(s); return R.binarySearchIndex(nums, target); } },
    searchRange: { gen: () => `${sorted(arr(rnd(1, 12), 0, 6)).join(" ")} ; ${rnd(-1, 7)}`, want: (s) => { const { nums, target } = P("searchRange")(s); return R.searchRange(nums, target); } },
    rotated: { gen: () => { const a = [...new Set(arr(rnd(1, 12), -20, 20))].sort((x, y) => x - y); const k = rnd(0, a.length - 1); return `${a.slice(k).concat(a.slice(0, k)).join(" ")} ; ${rnd(0, 1) ? a[rnd(0, a.length - 1)] : rnd(-22, 22)}`; }, want: (s) => { const { nums, target } = P("rotated")(s); return R.searchRotated(nums, target); } },
    koko: { gen: () => { const p = arr(rnd(1, 6), 1, 30); return `${p.join(" ")} ; ${rnd(p.length, p.length + 10)}`; }, want: (s) => { const { piles, h } = P("koko")(s); return R.minEatingSpeed(piles, h); }, askNext: [["yes"], ["no"]] },
    ship: { gen: () => `${arr(rnd(1, 10), 1, 30).join(" ")} ; ${rnd(1, 6)}`, want: (s) => { const { w, days } = P("ship")(s); return R.shipWithinDays(w, days); } },
    median: { gen: () => `${sorted(arr(rnd(0, 7), -20, 20)).join(" ")} ; ${sorted(arr(rnd(1, 7), -20, 20)).join(" ")}`, want: (s) => { const { a, b } = P("median")(s); return R.findMedianSortedArrays(a, b); } },
    peak: { gen: () => { const a = [rnd(0, 12)]; while (a.length < rnd(1, 12)) { let v = rnd(0, 12); if (v === a[a.length - 1]) v = (v + 1) % 13; a.push(v); } return a.join(" "); }, want: (s) => R.findPeakElement(P("peak")(s)) },
  };
}

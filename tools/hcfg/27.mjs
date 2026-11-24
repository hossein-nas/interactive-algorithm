export function specs({ A, R, rnd, arr }) {
  const paired = (singles) => { const base = [...new Set(arr(rnd(1, 4), 0, 63))]; const s = []; while (s.length < singles) { const v = rnd(0, 63); if (!base.includes(v) && !s.includes(v)) s.push(v); } const a = [...base, ...base, ...s]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, 10).length === a.length ? a.join(" ") : `${s.join(" ")}`; };
  return {
    popcount: { gen: () => String(rnd(0, 4095)), want: (s) => R.hammingWeight(+s) },
    pow2: { gen: () => String(rnd(0, 1) ? 1 << rnd(0, 11) : rnd(-64, 4095)), want: (s) => R.isPowerOfTwo(+s) },
    countBits: { gen: () => String(rnd(0, 15)), want: (s) => R.countBits(+s) },
    single: { gen: () => paired(1), want: (s) => R.singleNumber(A.single.parse(s)) },
    missing: { gen: () => { const n = rnd(1, 10); const a = [...Array(n + 1).keys()]; a.splice(rnd(0, n), 1); return a.sort(() => Math.random() - 0.5).join(" "); }, want: (s) => R.missingNumber(A.missing.parse(s)) },
    single3: { gen: () => paired(2), want: (s) => R.singleNumberIII(A.single3.parse(s)) },
    getSum: { gen: () => `${rnd(-100, 100)} ; ${rnd(-100, 100)}`, want: (s) => { const x = A.getSum.parse(s); return R.getSum(x.a, x.b); } },
    masks: { gen: () => arr(rnd(1, 4), -9, 9).join(" "), want: (s) => R.subsetsByMask(A.masks.parse(s)) },
    submasks: { gen: () => String(rnd(0, 255)), want: (s) => R.submasksOf(+s) },
    maxXor: { gen: () => arr(rnd(1, 6), 0, 63).join(" "), want: (s) => R.findMaximumXOR(A.maxXor.parse(s)) },
  };
}

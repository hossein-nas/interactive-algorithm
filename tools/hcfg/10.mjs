export function specs({ A, R, rnd, arr }) {
  const nested = (d) => Array.from({ length: rnd(1, 4) }, () => (d < 3 && rnd(0, 2) === 0 ? nested(d + 1) : rnd(0, 9)));
  return {
    factorial: { gen: () => String(rnd(0, 8)), want: (s) => R.factorial(+s) },
    sumList: { gen: () => arr(rnd(0, 6), -9, 9).join(" ") || "[]", want: (s) => R.sumList(A.sumList.parse(s)) },
    myPow: { gen: () => `${rnd(-3, 3)} ; ${rnd(-8, 12)}`, ok: (s, r) => { const { x, n } = A.myPow.parse(s); const t = R.myPow(x, n); return Math.abs(r - t) <= 1e-6 * Math.max(1, Math.abs(t)) || (r === t); } },
    pascal: { gen: () => String(rnd(0, 7)), want: (s) => R.generatePascal(+s) },
    flatten: { gen: () => JSON.stringify(nested(0)), want: (s) => R.flatten(JSON.parse(s)) },
    decodeString: { gen: () => { const g = (d) => Array.from({ length: rnd(1, 3) }, () => (d < 2 && rnd(0, 1) ? `${rnd(1, 3)}[${g(d + 1)}]` : "abc"[rnd(0, 2)])).join(""); let t = g(0); while (t.length > 16) t = g(1); return t; }, want: (s) => R.decodeString(s) },
    hanoi: { gen: () => String(rnd(1, 6)), want: (s) => R.hanoi(+s, "A", "C", "B") },
  };
}

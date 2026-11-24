export function specs({ A, R, rnd }) {
  const w = (al, lo, hi) => Array.from({ length: rnd(lo, hi) }, () => al[rnd(0, al.length - 1)]).join("");
  return {
    anagrams: { gen: () => `${w("abc", 1, 16)} ; ${w("abc", 1, 4)}`, want: (s) => { const x = A.anagrams.parse(s); return R.findAnagrams(x.s, x.p); } },
    division: { gen: () => { const v = "abcde"; const eqs = Array.from({ length: rnd(1, 5) }, () => `${v[rnd(0, 4)]}/${v[rnd(0, 4)]}=${rnd(1, 9)}`); const qs = Array.from({ length: rnd(1, 5) }, () => `${"abcdex"[rnd(0, 5)]}/${"abcdex"[rnd(0, 5)]}`); return `${eqs.join(" ")} ; ${qs.join(" ")}`; },
      want: (s) => { const x = A.division.parse(s); return R.calcEquation(x.eqs.map((e) => [e[0], e[1]]), x.eqs.map((e) => e[2]), x.qs); } },
    parens: { gen: () => w("()", 0, 16), want: (s) => R.longestValidParentheses(A.parens.parse(s)) },
    parens2: { gen: () => w("()", 0, 16), want: (s) => R.longestValidParenthesesTwoPass(A.parens2.parse(s)) },
  };
}

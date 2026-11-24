export const expose = "(globalThis as any).fruits = fruits; (globalThis as any).BloomFilter = BloomFilter; (globalThis as any).InvertedIndex = InvertedIndex; (globalThis as any).bakery = bakery;\n";
export function specs({ A, R, rnd }) {
  const sq = (p) => p[0] * p[0] + p[1] * p[1];
  const srt = (l) => l.map((p) => p.slice()).sort((a, b) => sq(a) - sq(b) || a[0] - b[0] || a[1] - b[1]);
  return {
    kClosest: { gen: () => { const n = rnd(1, 9); return `${Array.from({ length: n }, () => `${rnd(-9, 9)},${rnd(-9, 9)}`).join(" ")} ; ${rnd(1, n)}`; }, want: (s) => { const x = A.kClosest.parse(s); const r = R.kClosest(x.pts, x.k); return srt(r).map((p) => sq(p)); }, got: (r) => r.map((p) => sq(p)) },
    classifyNorm: { gen: () => `${(rnd(60, 130) / 10).toFixed(1)},${(rnd(20, 80) / 100).toFixed(2)} ; ${rnd(1, 8)}`, want: (s) => { const x = A.classifyNorm.parse(s); return R.classify(R.fruits, x.q, x.k, true); } },
    classifyRaw: { gen: () => `${(rnd(60, 130) / 10).toFixed(1)},${(rnd(20, 80) / 100).toFixed(2)} ; ${rnd(1, 8)}`, want: (s) => { const x = A.classifyRaw.parse(s); return R.classify(R.fruits, x.q, x.k, false); } },
    regress: { gen: () => `${rnd(0, 5)} ${rnd(0, 1)} ${rnd(0, 1)} ; ${rnd(1, 6)}`, want: (s) => { const x = A.regress.parse(s); return R.knnRegress(R.bakery, x.q, x.k); } },
    similar: { gen: () => Array.from({ length: 5 }, () => rnd(1, 5)).join(" "), want: (s) => R.mostSimilarUser(A.similar.parse(s), new Map([["Justin", [4, 3, 5, 1, 5]], ["Morpheus", [2, 5, 1, 3, 1]]])) },
    bloom: { gen: () => { const w = () => Array.from({ length: rnd(1, 4) }, () => "abcdef"[rnd(0, 5)]).join(""); return `${rnd(4, 32)} ; ${rnd(1, 5)} ; ${Array.from({ length: rnd(1, 8) }, w).join(" ")} ; ${Array.from({ length: rnd(1, 6) }, w).join(" ")}`; }, want: (s) => { const x = A.bloom.parse(s); const b = new R.BloomFilter(x.m, x.k); x.add.forEach((w) => b.add(w)); return x.qs.map((w) => b.mightContain(w)); } },
    inverted: { gen: () => { const vocab = ["a", "b", "c", "d"]; const d = () => Array.from({ length: rnd(1, 4) }, () => vocab[rnd(0, 3)]).join(" "); return `${Array.from({ length: rnd(1, 6) }, d).join(" | ")} ; ${Array.from({ length: rnd(1, 3) }, () => vocab[rnd(0, 3)]).join(" ")}`; }, want: (s) => { const x = A.inverted.parse(s); const ix = new R.InvertedIndex(); x.docs.forEach((d, k) => ix.addDocument(k + 1, d)); return ix.search(x.q); } },
  };
}

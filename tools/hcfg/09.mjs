export function specs({ A, R, rnd, arr, sorted }) {
  const g = () => arr(rnd(1, 8), -20, 20).join(" ");
  return {
    selection: { gen: g, want: (s) => R.selectionSort(A.selection.parse(s)) },
    insertion: { gen: g, want: (s) => R.insertionSort(A.insertion.parse(s)) },
    gcd: { gen: () => { const a = rnd(1, 2000); return `${a} ; ${rnd(0, a)}`; }, want: (s) => { const { a, b } = A.gcd.parse(s); return R.gcd(a, b); } },
    mergeSort: { gen: g, want: (s) => R.mergeSort(A.mergeSort.parse(s)), askNext: [["take"], ["takeR"]] },
    inversions: { gen: g, want: (s) => R.countInversions(A.inversions.parse(s)), askNext: [["take"], ["takeR"]] },
    quickSort: { gen: g, want: (s) => sorted(A.quickSort.parse(s)), askNext: [["swap"], ["cmp", "place"]] },
    quickSelect: { gen: () => { const a = arr(rnd(1, 8), -20, 20); return `${a.join(" ")} ; ${rnd(1, a.length)}`; }, want: (s) => { const { nums, k } = A.quickSelect.parse(s); return R.findKthLargest(nums, k); } },
    largestNumber: { gen: () => arr(rnd(1, 7), 0, 120).join(" "), want: (s) => R.largestNumber(A.largestNumber.parse(s)) },
  };
}
export function extra({ A, check }) {
  const b = A.quickSort.bugs[0];
  const tr = b.trace(A.quickSort.parse(b.input));
  check(tr.frames[tr.frames.length - 1].vars["max depth"] >= 7, "fixed-pivot replay should be deep");
}

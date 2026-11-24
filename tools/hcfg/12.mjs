export const expose = "(globalThis as any).fromArray = fromArray; (globalThis as any).toArray = toArray; (globalThis as any).fromArrayWithCycle = fromArrayWithCycle;\n";
export function specs({ A, R, rnd, arr, sorted }) {
  const L = (s) => A.reverseIter.parse(s);
  return {
    reverseIter: { gen: () => arr(rnd(1, 7), -9, 9).join(" "), want: (s) => R.toArray(R.reverseList(R.fromArray(L(s)))) },
    reverseRec: { gen: () => arr(rnd(1, 7), -9, 9).join(" "), want: (s) => R.toArray(R.reverseListRec(R.fromArray(L(s)))) },
    mergeLists: { gen: () => `${sorted(arr(rnd(0, 5), 0, 9)).join(" ")} ; ${sorted(arr(rnd(0, 5), 0, 9)).join(" ")}`, want: (s) => { const { a, b } = A.mergeLists.parse(s); return R.toArray(R.mergeTwoLists(R.fromArray(a), R.fromArray(b))); } },
    detectCycle: { gen: () => { const n = rnd(1, 8); return `${arr(n, 0, 9).join(" ")} ; ${rnd(-1, n - 1)}`; }, want: (s) => { const { vals, pos } = A.detectCycle.parse(s); const h = R.fromArrayWithCycle(vals, pos); const st = R.detectCycle(h); if (!st) return null; let k = 0, n = h; while (n !== st) { n = n.next; k++; } return k; } },
    removeNth: { gen: () => { const n = rnd(1, 7); return `${arr(n, 0, 9).join(" ")} ; ${rnd(1, n)}`; }, want: (s) => { const { vals, n } = A.removeNth.parse(s); return R.toArray(R.removeNthFromEnd(R.fromArray(vals), n)); } },
    addTwo: { gen: () => `${arr(rnd(1, 5), 0, 9).join(" ")} ; ${arr(rnd(1, 5), 0, 9).join(" ")}`, want: (s) => { const { a, b } = A.addTwo.parse(s); return R.toArray(R.addTwoNumbers(R.fromArray(a), R.fromArray(b))); } },
    reorder: { gen: () => arr(rnd(1, 7), 0, 9).join(" "), want: (s) => { const h = R.fromArray(L(s)); R.reorderList(h); return R.toArray(h); } },
  };
}

export const expose = "(globalThis as any).Queue = Queue; (globalThis as any).MinHeap = MinHeap;\n";
export function specs({ A, R, rnd }) {
  const qgen = () => Array.from({ length: rnd(1, 14) }, () => (rnd(0, 1) ? `push ${"abcdefg"[rnd(0, 6)]}` : "shift")).join(", ");
  const hgen = () => Array.from({ length: rnd(1, 14) }, () => (rnd(0, 2) ? `push ${rnd(-9, 20)}` : "pop")).join(", ");
  return {
    letterCounts: { gen: () => Array.from({ length: rnd(1, 12) }, () => "abcdez"[rnd(0, 5)]).join(""), want: (s) => R.letterCounts(s) },
    queueHead: { gen: qgen, want: (s) => { const q = new R.Queue(); A.queueHead.parse(s).forEach((o) => (o.op === "push" ? q.push(o.v) : q.shift())); const rest = []; while (q.size) rest.push(q.shift()); return rest; } },
    minHeap: { gen: hgen, want: (s) => { const h = new R.MinHeap((a, b) => a < b); const popped = []; A.minHeap.parse(s).forEach((o) => { if (o.op === "push") h.push(o.v); else if (h.size) popped.push(h.pop()); }); return popped; }, got: (r) => r.popped },
  };
}
export function extra({ A, check, rnd }) {
  // the heap property must hold after every push and pop finishes
  for (let t = 0; t < 200; t++) {
    const ops = Array.from({ length: rnd(1, 14) }, () => (rnd(0, 2) ? `push ${rnd(-9, 20)}` : "pop")).join(", ");
    const r = A.minHeap.trace(A.minHeap.parse(ops)).result.heap;
    check(r.every((v, i) => i === 0 || r[(i - 1) >> 1] <= v), `heap property broken for "${ops}"`);
  }
}

export const expose = "(globalThis as any).Heap = Heap; (globalThis as any).MedianFinder = MedianFinder;\n";
export function specs({ A, R, rnd, arr, sorted }) {
  const ops = () => { const out = []; let size = 0; const n = rnd(1, 14); for (let i = 0; i < n; i++) { if (size && rnd(0, 2) === 0) { out.push("pop"); size--; } else if (size < 10) { out.push(rnd(-20, 20)); size++; } } return out.join(" ") || "1"; };
  return {
    heapOps: { gen: ops, want: (s) => { const h = new R.Heap((a, b) => a < b); const out = []; A.heapOps.parse(s).forEach((o) => (o === "pop" ? out.push(h.pop()) : h.push(o))); return out; }, askNext: { 0: ["upswap", "downswap"], 1: ["upstop", "settle"] } },
    heapify: { gen: () => arr(rnd(1, 9), -20, 20).join(" "), want: (s) => { const h = R.Heap.from(A.heapify.parse(s), (a, b) => a < b); const o = []; while (h.size) o.push(h.pop()); return o; }, askNext: { 0: ["upswap", "downswap"], 1: ["upstop", "settle"] } },
    kthLargest: { gen: () => { const a = arr(rnd(1, 12), -9, 9); return `${a.join(" ")} ; ${rnd(1, a.length)}`; }, want: (s) => { const { nums, k } = A.kthLargest.parse(s); return R.findKthLargest(nums, k); }, askNext: { 0: ["pop"] } },
    topK: { gen: () => { const a = arr(rnd(1, 16), 0, 6); return `${a.join(" ")} ; ${rnd(1, new Set(a).size)}`; }, want: (s) => { const { nums, k } = A.topK.parse(s); return R.topKFrequent(nums, k); } },
    mergeK: { gen: () => Array.from({ length: rnd(1, 4) }, () => sorted(arr(rnd(0, 5), -9, 9)).join(" ")).join(" | "), want: (s) => R.mergeKSorted(A.mergeK.parse(s)) },
    kthMatrix: { gen: () => { const n = rnd(1, 4); const m = Array.from({ length: n }, () => Array(n).fill(0)); for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) m[r][c] = Math.max(r ? m[r - 1][c] : -9, c ? m[r][c - 1] : -9) + rnd(0, 4); return `${m.map((r) => r.join(" ")).join(" | ")} ; ${rnd(1, n * n)}`; }, want: (s) => { const { m, k } = A.kthMatrix.parse(s); return R.kthSmallestInMatrix(m, k); } },
    rooms: { gen: () => Array.from({ length: rnd(1, 8) }, () => { const a = rnd(0, 30); return `${a}-${a + rnd(1, 20)}`; }).join(" "), want: (s) => R.minMeetingRooms(A.rooms.parse(s)), askNext: { 0: ["reuse"], 1: ["rooms"] } },
    median: { gen: () => arr(rnd(1, 10), -20, 20).join(" "), want: (s) => { const mf = new R.MedianFinder(); return A.median.parse(s).map((x) => (mf.addNum(x), mf.findMedian())); } },
  };
}

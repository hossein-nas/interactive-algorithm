export const expose = "(globalThis as any).RecentCounter = RecentCounter; (globalThis as any).QueueViaStacks = QueueViaStacks; (globalThis as any).CircularQueue = CircularQueue;\n";
export function specs({ A, R, rnd, arr, sorted }) {
  return {
    recentCounter: { gen: () => [...new Set(sorted(arr(rnd(1, 8), 1, 12000)))].join(" "), want: (s) => { const c = new R.RecentCounter(); return A.recentCounter.parse(s).map((t) => c.ping(t)); } },
    queueStacks: { gen: () => { let n = 0; return Array.from({ length: rnd(1, 14) }, () => { const r = n ? rnd(0, 2) : 0; if (r === 0) { n++; return `push ${rnd(0, 9)}`; } if (r === 1) { n--; return "pop"; } return "peek"; }).join(", "); }, want: (s) => { const q = new R.QueueViaStacks(); const out = []; A.queueStacks.parse(s).forEach(({ op, v }) => (op === "push" ? q.push(v) : out.push(op === "pop" ? q.pop() : q.peek()))); return out; } },
    circularQueue: { gen: () => `${rnd(1, 6)} ; ` + Array.from({ length: rnd(1, 14) }, () => ["enQueue " + rnd(0, 9), "deQueue", "Front", "Rear"][rnd(0, 3)]).join(", "), want: (s) => { const { cap, o } = A.circularQueue.parse(s); const q = new R.CircularQueue(cap); return o.map(({ op, v }) => (op === "enQueue" ? q.enQueue(v) : op === "deQueue" ? q.deQueue() : op === "Front" ? q.front() : q.rear())); } },
    windowMax: { gen: () => { const a = arr(rnd(1, 10), -9, 9); return `${a.join(" ")} ; ${rnd(1, a.length)}`; }, want: (s) => { const { nums, k } = A.windowMax.parse(s); return R.maxSlidingWindow(nums, k); } },
    shortestK: { gen: () => `${arr(rnd(1, 9), -20, 30).join(" ")} ; ${rnd(1, 60)}`, want: (s) => { const { nums, K } = A.shortestK.parse(s); return R.shortestSubarray(nums, K); } },
  };
}

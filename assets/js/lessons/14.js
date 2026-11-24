/* Lesson 14 · Queues and the monotonic deque — animators and quizzes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;
  const col = (title, items, fmt) => ({ title, entries: items.map((x, k) => [`#${k}`, fmt ? fmt(x) : x]).reverse(), empty: "(empty)", keyW: 34, valW: 54 });
  const ops = (allowed, max) => (s) => { const o = String(s).split(",").map((x) => x.trim().split(/\s+/)).filter((x) => x[0]); if (!o.length || o.length > max) throw new Error(`1 to ${max} operations.`); o.forEach((x) => { if (!allowed.includes(x[0])) throw new Error(`Unknown operation ${x[0]}. Use ${allowed.join(", ")}.`); }); return o.map((x) => ({ op: x[0], v: Number(x[1]) })); };

  A.recentCounter = {
    title: "Number of Recent Calls: drop from the front",
    viz: "array", legend: ["p1:head (oldest still counted)", "done:expired", "focus:the new ping"],
    inputLabel: "ping times (increasing)", hint: "1 100 3001 3002",
    presets: [{ label: "1, 100, 3001, 3002 (the trace table)", input: "1 100 3001 3002" }, { label: "spread out", input: "10 2000 4000 5000 9000" }],
    table: { id: "tbl-3", preset: 0, rows: ["t0", "t1", "t2", "t3"] },
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 8, min: 1, max: 99999, sorted: true }),
    lines: { push: { ts: "this.times.push(t);", go: "c.times = append(c.times, t)" }, drop: { ts: "while (this.times[this.head] < t - 3000) this.head++;", go: "c.times = c.times[1:]" }, ret: { ts: "return this.times.length - this.head;", go: "return len(c.times)" } },
    trace(ts) {
      const T = new G.Trace();
      const times = [], out = [];
      let head = 0;
      const st = (mk) => ({ cellW: 58, cells: times.map((t, i) => ({ id: i, v: t })), minW: ts.length * 66 + 20, marks: Object.assign(Object.fromEntries(times.map((_, i) => [i, i < head ? "done" : null]).filter((e) => e[1])), mk), ptrs: times.length ? [{ name: "head", at: head, role: "p1" }] : [] });
      ts.forEach((t, k) => {
        times.push(t);
        T.add({ at: "push", key: `t${k}`, state: st({ [times.length - 1]: "focus" }), vars: { t, "window starts": t - 3000 }, say: `ping(${t}): add it at the back. Anything before ${t - 3000} is too old.` });
        while (times[head] < t - 3000) { head++; T.add({ at: "drop", key: `t${k}`, state: st({ [times.length - 1]: "focus" }), vars: { head }, say: `${times[head - 1]} < ${t - 3000}: expired, drop it from the front.` }); }
        out.push(times.length - head);
        T.add({ at: "ret", key: `t${k}`, state: st(), vars: { answer: out[out.length - 1] }, say: `${out[out.length - 1]} call${out[out.length - 1] === 1 ? "" : "s"} in the last 3000 ms.` });
      });
      return T.done(out);
    },
  };

  A.queueStacks = {
    title: "A queue from two stacks",
    viz: "array", legend: [],
    inputLabel: "operations", hint: "push 1, push 2, peek, pop, push 3, push 4, pop, pop, pop",
    presets: [{ label: "the lesson's example", input: "push 1, push 2, push 3, push 4, peek, pop, push 5, pop, pop, pop, pop" }],
    parse(s) { const o = ops(["push", "pop", "peek"], 14)(s); let size = 0; o.forEach((x) => { if (x.op === "push") { if (!Number.isFinite(x.v)) throw new Error("push needs a number."); size++; } else if (!size) throw new Error(`${x.op} on an empty queue.`); else if (x.op === "pop") size--; }); return o; },
    lines: { push: { ts: "this.inbox.push(x);", go: "func (q *QueueViaStacks) Push" }, move: { ts: "while (this.inbox.length > 0) this.outbox.push(this.inbox.pop()!);", go: "q.outbox = append(q.outbox, top) // reverses the order" }, pop: { ts: "return this.outbox.pop()!;", go: "func (q *QueueViaStacks) Pop() int {>>return top" }, peek: { ts: "return this.outbox[this.outbox.length - 1];", go: "func (q *QueueViaStacks) Peek() int {>>return q.outbox[len(q.outbox)-1]" } },
    trace(o) {
      const T = new G.Trace();
      const inbox = [], outbox = [], out = [];
      let moves = 0;
      const st = () => ({ cells: [], minW: 60, panels: [col("inbox (top first)", inbox), col("outbox (top first)", outbox)], note: out.length ? { text: `returned: ${out.join(", ")}` } : null });
      o.forEach(({ op, v }) => {
        if (op === "push") { inbox.push(v); T.add({ at: "push", state: st(), vars: { moves }, say: `push(${v}): onto the inbox.` }); return; }
        if (!outbox.length) { while (inbox.length) { outbox.push(inbox.pop()); moves++; } T.add({ at: "move", state: st(), vars: { moves }, say: "The outbox is empty: pour the whole inbox into it. That reverses the order, so the oldest item is now on top." }); }
        if (op === "pop") { out.push(outbox.pop()); T.add({ at: "pop", state: st(), vars: { returned: out[out.length - 1], moves }, say: `pop() = ${out[out.length - 1]}: first in, first out.` }); }
        else { out.push(outbox[outbox.length - 1]); T.add({ at: "peek", state: st(), vars: { front: out[out.length - 1] }, say: `peek() = ${out[out.length - 1]}.` }); }
      });
      T.add({ state: st(), vars: { moves }, say: `Each item moves from inbox to outbox at most once (${moves} moves in total), so pop is amortized \`O(1)\`.` });
      return T.done(out);
    },
  };

  A.circularQueue = {
    title: "Design Circular Queue: an array bent into a ring",
    viz: "array", legend: ["p1:head (front)", "p2:rear", "focus:just written", "done:free slot"],
    inputLabel: "capacity ; operations", hint: "3 ; enQueue 1, enQueue 2, enQueue 3, enQueue 4, Rear, deQueue, enQueue 4, Rear, Front",
    presets: [{ label: "the lesson's example", input: "3 ; enQueue 1, enQueue 2, enQueue 3, enQueue 4, Rear, deQueue, enQueue 4, Rear, Front" }, { label: "wrap around twice", input: "3 ; enQueue 1, enQueue 2, deQueue, deQueue, enQueue 3, enQueue 4, enQueue 5, Front, Rear" }],
    parse(s) { const [c, rest] = P.parts(s, 2, 'Capacity, then ";" and operations'); const cap = P.num(c, "capacity"); if (!Number.isInteger(cap) || cap < 1 || cap > 6) throw new Error("Capacity 1 to 6."); return { cap, o: ops(["enQueue", "deQueue", "Front", "Rear"], 14)(rest) }; },
    lines: { full: { ts: "if (this.isFull()) return false;", go: "func (q *CircularQueue) EnQueue(value int) bool {>>return false" }, enq: { ts: "this.data[(this.head + this.size) % this.capacity] = value;", go: "q.data[(q.head+q.size)%q.capacity] = value" }, empty: { ts: "if (this.isEmpty()) return false;", go: "func (q *CircularQueue) DeQueue() bool {>>return false" }, deq: { ts: "this.head = (this.head + 1) % this.capacity;", go: "q.head = (q.head + 1) % q.capacity" }, front: { ts: "return this.isEmpty() ? -1 : this.data[this.head];", go: "return q.data[q.head]" }, rear: { ts: "return this.isEmpty() ? -1 : this.data[(this.head + this.size - 1) % this.capacity];", go: "return q.data[(q.head+q.size-1)%q.capacity]" } },
    trace({ cap, o }) {
      const T = new G.Trace();
      const data = new Array(cap).fill(null), out = [];
      let head = 0, size = 0;
      const occ = (i) => ((i - head + cap) % cap) < size;
      const st = (mk) => ({ cells: data.map((v, i) => ({ id: i, v: occ(i) ? v : "" })), marks: Object.assign(Object.fromEntries(data.map((_, i) => [i, occ(i) ? null : "done"]).filter((e) => e[1])), mk), ptrs: [{ name: "head", at: head, role: "p1" }].concat(size ? [{ name: "rear", at: (head + size - 1) % cap, role: "p2" }] : []), note: out.length ? { text: `returned: ${out.join(", ")}` } : null });
      o.forEach(({ op, v }) => {
        if (op === "enQueue") {
          if (size === cap) { out.push(false); T.add({ at: "full", state: st(), vars: { size, capacity: cap }, say: `enQueue(${v}): the ring is full. Return false.` }); return; }
          const slot = (head + size) % cap; data[slot] = v; size++; out.push(true);
          T.add({ at: "enq", state: st({ [slot]: "focus" }), vars: { head, size, slot }, say: `enQueue(${v}): write at (head + size) mod ${cap} = ${slot}.${slot < head ? " It wrapped around to the start." : ""}` });
        } else if (op === "deQueue") {
          if (!size) { out.push(false); T.add({ at: "empty", state: st(), vars: {}, say: "deQueue on an empty ring: false." }); return; }
          head = (head + 1) % cap; size--; out.push(true);
          T.add({ at: "deq", state: st(), vars: { head, size }, say: `deQueue: just move head forward (mod ${cap}). The old slot is free for reuse.` });
        } else if (op === "Front") { out.push(size ? data[head] : -1); T.add({ at: "front", state: st(), vars: { front: out[out.length - 1] }, say: `Front() = ${out[out.length - 1]}.` }); }
        else { out.push(size ? data[(head + size - 1) % cap] : -1); T.add({ at: "rear", state: st(), vars: { rear: out[out.length - 1] }, say: `Rear() = ${out[out.length - 1]}, at (head + size − 1) mod ${cap}.` }); }
      });
      return T.done(out);
    },
  };

  A.windowMax = {
    title: "Sliding Window Maximum: a monotonic deque",
    viz: "array", legend: ["p1:window start", "p2:i", "anchor:in the deque", "answer:the front: window max"],
    inputLabel: "numbers ; k", hint: "1 3 -1 -3 5 3 6 7 ; 3",
    presets: [{ label: "the lesson's array, k = 3 (the trace table)", input: "1 3 -1 -3 5 3 6 7 ; 3" }, { label: "[4,2,12,11,-5], k = 2", input: "4 2 12 11 -5 ; 2" }],
    table: { id: "tbl-4", preset: 0, rows: ["i0", "i1", "i2", "i3", "i4", "i5", "i6", "i7"] },
    parse(s) { const [a, k] = P.parts(s, 2, 'Numbers, then ";" and k'); const nums = P.nums(a, { minLen: 1, maxLen: 10, min: -99, max: 99 }); const kk = P.num(k, "k"); if (!Number.isInteger(kk) || kk < 1 || kk > nums.length) throw new Error(`k from 1 to ${nums.length}.`); return { nums, k: kk }; },
    lines: { popb: { ts: "while (deque.length > head && nums[deque[deque.length - 1]] <= nums[i]) deque.pop();", go: "deque = deque[:len(deque)-1] // dead items" }, push: { ts: "function maxSlidingWindow>>deque.push(i);", go: "func maxSlidingWindow>>deque = append(deque, i)" }, expire: { ts: "if (deque[head] <= i - k) head++;", go: "head++ // the front slid out" }, read: { ts: "if (i >= k - 1) result.push(nums[deque[head]]);", go: "result = append(result, nums[deque[head]])" } },
    trace({ nums, k }) {
      const T = new G.Trace();
      const dq = [], res = [];
      const st = (i, mk) => { const m = {}; dq.forEach((j) => (m[j] = "anchor")); if (dq.length && i >= k - 1) m[dq[0]] = "answer"; return { cells: G.cells(nums), marks: Object.assign(m, mk), ptrs: [{ name: "i", at: i, role: "p2" }], zones: [{ key: "w", from: Math.max(0, i - k + 1), to: i, label: `window (k = ${k})`, cls: "u" }], panels: [{ title: "deque front → back", entries: dq.map((j) => [j, nums[j]]), keyW: 34, valW: 44, empty: "(empty)" }], note: res.length ? { text: `maxima: ${res.join(", ")}` } : null }; };
      nums.forEach((x, i) => {
        const key = `i${i}`;
        while (dq.length && nums[dq[dq.length - 1]] <= x) { const d = dq.pop(); T.add({ at: "popb", key, state: st(i, { [d]: "done" }), vars: { x }, say: `${nums[d]} (index ${d}) ≤ ${x}: it can never be a maximum again while ${x} is in the window. Pop it from the back.` }); }
        dq.push(i);
        T.add({ at: "push", key, state: st(i), vars: { x }, say: `Push index ${i}. The deque's values decrease from front to back.` });
        if (dq[0] <= i - k) { const d = dq.shift(); T.add({ at: "expire", key, state: st(i, { [d]: "done" }), vars: {}, say: `Index ${d} slid out of the window: pop it from the front.` }); }
        if (i >= k - 1) { res.push(nums[dq[0]]); T.add({ at: "read", key, state: st(i), vars: { max: nums[dq[0]] }, say: `The front holds the window's maximum: ${nums[dq[0]]}.` }); }
      });
      return T.done(res);
    },
  };

  A.shortestK = {
    title: "Shortest Subarray with Sum at Least K (negatives allowed)",
    viz: "array", legend: ["p2:j", "anchor:in the deque", "answer:best subarray"],
    inputLabel: "numbers ; K", hint: "2 -1 2 ; 3",
    presets: [{ label: "[2,-1,2], K = 3 (the trace table)", input: "2 -1 2 ; 3" }, { label: "[1,2], K = 4 (none)", input: "1 2 ; 4" }, { label: "[84,-37,32,40,95], K = 167", input: "84 -37 32 40 95 ; 167" }],
    table: { id: "tbl-5", preset: 0, rows: ["j0", "j1", "j2", "j3"] },
    parse(s) { const [a, k] = P.parts(s, 2, 'Numbers, then ";" and K'); return { nums: P.nums(a, { minLen: 1, maxLen: 9, min: -99, max: 99 }), K: P.num(k, "K") }; },
    lines: { front: { ts: "best = Math.min(best, j - deque[head]);", go: "best = min(best, j-deque[head])" }, back: { ts: "while (deque.length > head && P[deque[deque.length - 1]] >= P[j]) deque.pop();", go: "deque = deque[:len(deque)-1] // worse than j" }, push: { ts: "function shortestSubarray>>deque.push(j);", go: "func shortestSubarray>>deque = append(deque, j)" } },
    trace({ nums, K }) {
      const T = new G.Trace();
      const Pf = [0]; nums.forEach((x, i) => Pf.push(Pf[i] + x));
      const dq = [];
      let best = Infinity, bestBox = null;
      const st = (j, mk) => { const m = {}; dq.forEach((d) => (m[d] = "anchor")); return { labelW: 50, rows: [{ label: "nums", cells: [{ id: "x", v: "" }].concat(nums.map((v, i) => ({ id: i, v }))), marks: { 0: "ghost" }, zones: bestBox ? [{ key: "b", from: bestBox[0] + 1, to: bestBox[1], label: `best ${best}`, cls: "done" }] : [] }, { label: "P", cells: Pf.map((v, i) => ({ id: i, v })), marks: Object.assign(m, mk), ptrs: j != null ? [{ name: "j", at: j, role: "p2" }] : [] }], panels: [{ title: "deque (P increasing)", entries: dq.map((d) => [d, Pf[d]]), keyW: 34, valW: 44, empty: "(empty)" }] }; };
      for (let j = 0; j < Pf.length; j++) {
        const key = `j${j}`;
        while (dq.length && Pf[j] - Pf[dq[0]] >= K) { if (j - dq[0] < best) { best = j - dq[0]; bestBox = [dq[0], j]; } const f = dq.shift(); T.add({ at: "front", key, state: st(j, { [f]: "answer" }), vars: { j, best }, say: `P[${j}] − P[${f}] = ${Pf[j] - Pf[f]} ≥ ${K}: a subarray of length ${j - f}. best = ${best}. Pop the front: a later j would only be longer.` }); }
        while (dq.length && Pf[dq[dq.length - 1]] >= Pf[j]) { const b = dq.pop(); T.add({ at: "back", key, state: st(j, { [b]: "done" }), vars: { j }, say: `P[${b}] = ${Pf[b]} ≥ P[${j}] = ${Pf[j]}: index ${j} is a better start (smaller and later). Pop ${b}.` }); }
        dq.push(j);
        T.add({ at: "push", key, state: st(j), vars: { j, "P[j]": Pf[j], best: best === Infinity ? "∞" : best }, say: `Push ${j}.` });
      }
      const ans = best === Infinity ? -1 : best;
      T.add({ state: st(null), vars: { answer: ans }, say: ans < 0 ? "No subarray reached K: return −1." : `Return ${ans}. Prefix sums handle negatives; the deque keeps it \`O(n)\`.` });
      return T.done(ans);
    },
  };

  G.quizzes.queue14 = {
    title: "Queue, deque, or something else?",
    items: [
      { q: "Shortest path in an unweighted grid.", options: ["BFS with a queue", "A stack", "A monotonic deque", "A heap"], answer: 0, why: "A queue processes nodes in order of distance, layer by layer." },
      { q: "Minimum of every window of size k.", options: ["Monotonic deque with increasing values", "Monotonic deque with decreasing values", "A plain queue", "Sorting each window"], answer: 0, why: "Flip the comparison of the maximum version." },
      { q: "A fixed-size buffer of the last 1000 log lines, without growing memory.", options: ["Circular queue", "A plain array with shift()", "A stack", "A linked list of all lines"], answer: 0, why: "Overwrite the oldest slot; head and size wrap with modulo." },
      { q: "In JavaScript, a queue of a million items using `shift()`.", options: ["O(n²) total: use a head index", "Fine: shift is O(1)", "Use unshift instead", "Use a Set"], answer: 0, why: "shift moves every remaining item." },
      { q: "Why must the deque store indexes, not values?", options: ["To know whether the front has left the window", "Indexes are smaller", "Values can repeat, so they cannot be stored", "It is faster to compare indexes"], answer: 0, why: "Only the index tells you when an item is out of range." },
    ],
  };
})();

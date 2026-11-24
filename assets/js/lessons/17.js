/* Lesson 17 · Heaps and priority queues — sift up and down, heapify, top K, merge K, rooms, two-heap median. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  /* A heap that mirrors the lesson's Heap<T> exactly (same sift rules, so ties come out the same),
     and reports each step through emit(at, marks, say) when detail is on. Items keep ids so they glide. */
  let UID = 0;
  function SimHeap(less, show, emit, detail) {
    this.data = []; this.less = less; this.show = show || String; this.emit = emit || (() => {}); this.detail = !!detail;
  }
  SimHeap.prototype.items = function () { return this.data.map((d) => ({ id: d.id, v: this.show(d.x) })); };
  SimHeap.prototype.swap = function (i, j) { const t = this.data[i]; this.data[i] = this.data[j]; this.data[j] = t; };
  SimHeap.prototype.push = function (x) {
    const D = this.data, sh = this.show;
    D.push({ id: UID++, x });
    let i = D.length - 1;
    if (this.detail) this.emit("push", { [i]: "focus" }, `Push ${sh(x)}: append it at the end (index ${i}), the next free spot in the bottom row.`);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      const go = this.less(D[i].x, D[parent].x);
      if (this.detail) this.emit("upcmp", { [i]: "focus", [parent]: "anchor" }, `Compare ${sh(D[i].x)} with its parent ${sh(D[parent].x)} at index ${parent} = (${i} − 1) / 2.`, { q: `${sh(D[i].x)} under parent ${sh(D[parent].x)}. Next?`, options: ["Swap them: the child should be on top", "Stop: the heap order already holds"], answer: go ? 0 : 1, why: go ? "In a min-heap a parent must be ≤ its children." : "The parent is already ≤ the child, so nothing above can be wrong either." });
      if (!go) { if (this.detail) this.emit("upstop", { [i]: "answer" }, `${sh(D[i].x)} ≥ its parent: it stays. Sift-up done.`); return; }
      this.swap(i, parent);
      if (this.detail) this.emit("upswap", { [parent]: "focus" }, `Swap: ${sh(D[parent].x)} moves up to index ${parent}.`);
      i = parent;
    }
    if (this.detail) this.emit("upstop", { 0: "answer" }, `${sh(D[0].x)} reached the root. Sift-up done.`);
  };
  SimHeap.prototype.pop = function () {
    const D = this.data, sh = this.show;
    if (!D.length) return undefined;
    const top = D[0];
    if (this.detail) this.emit("take", { 0: "answer" }, `Pop: the root ${sh(top.x)} is the smallest. Take it.`);
    const last = D.pop();
    if (D.length > 0) {
      D[0] = last;
      if (this.detail) this.emit("last", { 0: "focus" }, `Move the last item, ${sh(last.x)}, into the root's place. The shape stays complete; now fix the order.`);
      this.siftDown(0);
    }
    if (this.detail) this.emit("ret", {}, `Return ${sh(top.x)}.`);
    return top.x;
  };
  SimHeap.prototype.siftDown = function (i) {
    const D = this.data, n = D.length, sh = this.show;
    for (;;) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let best = i;
      if (l < n && this.less(D[l].x, D[best].x)) best = l;
      if (r < n && this.less(D[r].x, D[best].x)) best = r;
      if (this.detail) {
        const kids = [l, r].filter((c) => c < n);
        const mk = { [i]: "focus" }; kids.forEach((c) => (mk[c] = "anchor"));
        this.emit("downcmp", mk, kids.length ? `Compare ${sh(D[i].x)} with its child${kids.length > 1 ? "ren" : ""} ${kids.map((c) => sh(D[c].x)).join(" and ")}.` : `${sh(D[i].x)} has no children.`,
          kids.length ? { q: `${sh(D[i].x)} over ${kids.map((c) => sh(D[c].x)).join(" and ")}. Next?`, options: ["Swap with the smaller child", "Stop: it is ≤ both children"], answer: best === i ? 1 : 0, why: best === i ? "The parent is already the smallest of the three." : "Swapping with the smaller child keeps that child ≤ its new sibling." } : null);
      }
      if (best === i) { if (this.detail) this.emit("settle", { [i]: "answer" }, `${sh(D[i].x)} is ≤ its children: it settles at index ${i}.`); return; }
      this.swap(i, best);
      if (this.detail) this.emit("downswap", { [best]: "focus" }, `Swap with the smaller child: ${sh(D[i].x)} moves up, ${sh(D[best].x)} moves down to index ${best}.`);
      i = best;
    }
  };

  const heapLines = {
    push: { ts: "this.data.push(item);", go: "h.data = append(h.data, item)" },
    upcmp: { ts: "if (!this.less(this.data[i], this.data[parent])) break;", go: "if !h.less(h.data[i], h.data[parent]) {" },
    upstop: { ts: "if (!this.less(this.data[i], this.data[parent])) break;", go: "if !h.less(h.data[i], h.data[parent]) {" },
    upswap: { ts: "[this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];", go: "h.data[i], h.data[parent] = h.data[parent], h.data[i]" },
    take: { ts: "const top = this.data[0];", go: "top := h.data[0]" },
    last: { ts: "this.data[0] = last;", go: "h.data[0] = h.data[last]" },
    downcmp: { ts: "if (r < n && this.less(this.data[r], this.data[best])) best = r;", go: "if r < n && h.less(h.data[r], h.data[best]) {" },
    settle: { ts: "if (best === i) return;", go: "if best == i {" },
    downswap: { ts: "[this.data[i], this.data[best]] = [this.data[best], this.data[i]];", go: "h.data[i], h.data[best] = h.data[best], h.data[i]" },
    ret: { ts: "return top;", go: "return top" },
    from: { ts: "for (let i = (heap.data.length >> 1) - 1; i >= 0; i--) heap.siftDown(i);", go: "for i := len(h.data)/2 - 1; i >= 0; i-- {" },
    sortpop: { ts: "while (numHeap.size > 0) sortedOut.push(numHeap.pop()!);", go: "sorted = append(sorted, h.Pop())" },
  };
  const lt = (a, b) => a < b;

  A.heapOps = {
    title: "Min-heap: push sifts up, pop sifts down", short: "Push and pop",
    viz: "heap", legend: ["focus:moving item", "anchor:compared with", "answer:settled or taken"],
    inputLabel: "numbers to push; the word pop to pop", hint: "5 3 8 1 pop 2 pop",
    presets: [{ label: "5 3 8 1 pop 2 pop", input: "5 3 8 1 pop 2 pop" }, { label: "exercise 1: 2 5 3 9 6 4, then 1", input: "2 5 3 9 6 4 1" }, { label: "push 7 6 5 4 3", input: "7 6 5 4 3" }, { label: "pop until empty", input: "4 1 3 pop pop pop" }],
    parse(s) {
      const t = String(s).replace(/,/g, " ").trim().split(/\s+/).filter(Boolean);
      if (!t.length) throw new Error("Type some numbers to push, and pop where you want a pop.");
      if (t.length > 14) throw new Error("Keep it to 14 operations.");
      let size = 0;
      return t.map((x) => { if (/^pop$/i.test(x)) { if (!size) throw new Error("Pop on an empty heap: push something first."); size--; return "pop"; } const v = Number(x.replace(/[−–]/g, "-")); if (!Number.isInteger(v) || v < -99 || v > 99) throw new Error(`"${x}" is not a whole number from −99 to 99 or "pop".`); if (++size > 10) throw new Error("Keep at most 10 items in the heap."); return v; });
    },
    lines: heapLines,
    trace(ops) {
      const Tr = new G.Trace();
      const popped = [];
      let H;
      const st = (mk) => ({ items: H.items(), marks: mk || {}, note: { text: popped.length ? `popped so far: ${popped.join(", ")}` : "every parent ≤ its children" } });
      H = new SimHeap(lt, String, (at, mk, say, ask) => Tr.add({ at, state: st(mk), vars: {}, say, ask: ask || undefined }), true);
      ops.forEach((op) => { if (op === "pop") popped.push(H.pop()); else H.push(op); });
      Tr.add({ state: st(), vars: { size: H.data.length }, say: "Each push or pop moved one item along one path: at most the height, about log₂ n swaps." });
      return Tr.done(popped);
    },
  };

  A.heapify = {
    title: "Min-heap: push sifts up, pop sifts down", short: "Heapify, then heap sort",
    viz: "heap", legend: ["focus:moving item", "anchor:compared with", "answer:settled or taken"],
    inputLabel: "numbers", hint: "5 1 4 2 9 3",
    presets: [{ label: "the lesson's example", input: "5 1 4 2 9 3" }, { label: "descending 9..3", input: "9 8 7 6 5 4 3" }],
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 9, min: -99, max: 99 }),
    lines: heapLines,
    trace(nums) {
      const Tr = new G.Trace();
      const out = [];
      let H;
      const st = (mk) => ({ items: H.items(), marks: mk || {}, note: { text: out.length ? `sorted output: ${out.join(", ")}` : "heapify: sift down every parent, last parent first" } });
      H = new SimHeap(lt, String, (at, mk, say, ask) => Tr.add({ at, state: st(mk), vars: {}, say, ask: ask || undefined }), true);
      H.data = nums.map((x) => ({ id: UID++, x }));
      Tr.add({ at: "from", state: st(), vars: {}, say: `Copy the array as is. Leaves (the last ${nums.length - (nums.length >> 1)} items) are already heaps of one; start at the last parent, index ${(nums.length >> 1) - 1}.` });
      for (let i = (nums.length >> 1) - 1; i >= 0; i--) {
        Tr.add({ at: "from", state: st({ [i]: "focus" }), vars: { i }, say: `Sift down index ${i}.` });
        H.siftDown(i);
      }
      Tr.add({ at: "from", state: st(), vars: {}, say: "It is a heap now. Most nodes are near the bottom and sift down only a little, so heapify costs O(n), not O(n log n)." });
      H.detail = false;
      while (H.data.length) {
        const v = H.pop(); out.push(v);
        Tr.add({ at: "sortpop", state: st(), vars: { popped: v }, say: `Pop ${v}. Popping everything gives the items in sorted order: heap sort.` });
      }
      return Tr.done(out);
    },
  };

  /* ---------- Problem 1: Kth largest ---------- */
  A.kthLargest = {
    title: "Kth Largest: a min-heap of size k",
    viz: "heap", legend: ["focus:just pushed", "bug:popped: too small to be in the top k", "answer:the kth largest"],
    inputLabel: "nums ; k", hint: "3 2 1 5 6 4 ; 2",
    presets: [{ label: "[3,2,1,5,6,4], k=2", input: "3 2 1 5 6 4 ; 2" }, { label: "[3,2,3,1,2,4,5,5,6], k=4", input: "3 2 3 1 2 4 5 5 6 ; 4" }, { label: "[1], k=1", input: "1 ; 1" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'Numbers, then ";" and k'); const nums = P.nums(a, { minLen: 1, maxLen: 12, min: -99, max: 99 }); const k = P.num(b, "k"); if (!Number.isInteger(k) || k < 1 || k > nums.length) throw new Error(`k must be from 1 to ${nums.length}.`); return { nums, k }; },
    lines: { push: { ts: "heap.push(x);", go: "h.Push(x)" }, pop: { ts: "if (heap.size > k) heap.pop();", go: "h.Pop() // drop the smallest" }, ret: { ts: "return heap.peek()!;", go: "return h.Peek()" } },
    table: { id: "tbl-2", preset: 0, rows: ["x0", "x1", "x2", "x3", "x4", "x5"] },
    trace({ nums, k }) {
      const Tr = new G.Trace();
      const H = new SimHeap(lt);
      const dropped = [];
      const st = (mk, extra) => Object.assign({ items: H.items(), marks: mk || {}, note: { text: dropped.length ? `dropped: ${dropped.join(", ")}` : `keep the ${k} largest seen so far` } }, extra);
      nums.forEach((x, i) => {
        H.push(x);
        const at = H.data.findIndex((d) => d.x === x && d.id === UID - 1);
        if (H.data.length > k) {
          Tr.add({ at: "push", state: st({ [at]: "focus" }), vars: { x, size: H.data.length, k }, say: `Push ${x}. Size ${H.data.length} > k = ${k}.`, ask: { q: `The heap holds ${H.data.length} items but we keep only ${k}. Which one leaves?`, options: [`The top, ${H.data[0].x}: the smallest`, "The biggest", `The one just pushed, ${x}`], answer: 0, why: "The smallest of k + 1 values cannot be among the k largest. A min-heap keeps it on top, ready to drop." } });
          const v = H.pop(); dropped.push(v);
          Tr.add({ key: "x" + i, at: "pop", state: st({ 0: "anchor" }), vars: { popped: v }, say: `Pop ${v}: it cannot be among the ${k} largest. The top is now the kth largest so far: ${H.data[0].x}.` });
        } else Tr.add({ key: "x" + i, at: "push", state: st({ [at]: "focus" }), vars: { x, size: H.data.length, k }, say: `Push ${x}. Size ${H.data.length} ≤ k, keep everything.` });
      });
      const r = H.data[0].x;
      Tr.add({ at: "ret", state: st({ 0: "answer" }), vars: { answer: r }, say: `The top of the size-${k} min-heap is the ${k}${["th", "st", "nd", "rd"][k % 10 > 3 || [11, 12, 13].includes(k % 100) ? 0 : k % 10]} largest: ${r}. O(n log k).` });
      return Tr.done(r);
    },
  };

  /* ---------- Problem 2: Top K frequent ---------- */
  A.topK = {
    title: "Top K Frequent: count, then a min-heap by count",
    viz: "heap", legend: ["focus:just pushed", "answer:in the answer"],
    inputLabel: "nums ; k", hint: "1 1 1 2 2 3 ; 2",
    presets: [{ label: "[1,1,1,2,2,3], k=2", input: "1 1 1 2 2 3 ; 2" }, { label: "[4,4,4,4,5,5,5,6,6,7], k=3", input: "4 4 4 4 5 5 5 6 6 7 ; 3" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'Numbers, then ";" and k'); const nums = P.nums(a, { minLen: 1, maxLen: 16, min: 0, max: 99 }); const k = P.num(b, "k"); const d = new Set(nums).size; if (!Number.isInteger(k) || k < 1 || k > d) throw new Error(`k must be from 1 to ${d} (the number of distinct values).`); return { nums, k }; },
    lines: { count: { ts: "for (const x of nums) freq.set(x, (freq.get(x) ?? 0) + 1);", go: "freq[x]++" }, push: { ts: "heap.push(entry);", go: "h.Push(entry{value, count})" }, pop: { ts: "function topKFrequent>>if (heap.size > k) heap.pop();", go: "func topKFrequent>>h.Pop()" }, out: { ts: "while (heap.size > 0) result.push(heap.pop()![0]);", go: "result[i] = h.Pop().value" } },
    trace({ nums, k }) {
      const Tr = new G.Trace();
      const freq = new Map();
      nums.forEach((x) => freq.set(x, (freq.get(x) || 0) + 1));
      const H = new SimHeap((a, b) => a[1] < b[1], (e) => `${e[0]}×${e[1]}`);
      const panel = () => [{ title: "count", entries: [...freq].map(([v, c]) => [v, c]) }];
      const st = (mk) => ({ items: H.items(), marks: mk || {}, panels: panel(), note: { text: "label value×count; least frequent on top" } });
      Tr.add({ at: "count", state: st(), vars: { distinct: freq.size }, say: `Count each value: ${[...freq].map(([v, c]) => `${v}→${c}`).join(", ")}.` });
      for (const e of freq) {
        H.push(e);
        if (H.data.length > k) { const out = H.pop(); Tr.add({ at: "pop", state: st(), vars: { dropped: `${out[0]}×${out[1]}` }, say: `Push ${e[0]}×${e[1]}; size > ${k}, so pop the least frequent: ${out[0]}×${out[1]}.` }); }
        else Tr.add({ at: "push", state: st({ [H.data.findIndex((d) => d.x === e)]: "focus" }), vars: {}, say: `Push ${e[0]}×${e[1]}.` });
      }
      const result = [];
      while (H.data.length) result.push(H.pop()[0]);
      result.reverse();
      Tr.add({ at: "out", state: Object.assign(st(), { note: { text: `answer, most frequent first: [${result.join(", ")}]`, cls: "ok" } }), vars: { result: `[${result.join(", ")}]` }, say: `Pop everything (least frequent first) and reverse: [${result.join(", ")}]. O(n log k).` });
      return Tr.done(result);
    },
  };

  /* ---------- Problem 3: Merge K sorted arrays ---------- */
  A.mergeK = {
    title: "Merge K Sorted: one front item per array in the heap",
    viz: "heap", legend: ["answer:popped into the output", "focus:its successor, pushed"],
    inputLabel: "arrays separated by |", hint: "1 4 5 | 1 3 4 | 2 6",
    presets: [{ label: "[[1,4,5],[1,3,4],[2,6]]", input: "1 4 5 | 1 3 4 | 2 6" }, { label: "[[], [1]]", input: " | 1" }],
    parse(s) { const parts = String(s).split("|"); if (parts.length > 4) throw new Error("Up to 4 arrays."); const arrs = parts.map((p) => P.nums(p, { allowEmpty: true, maxLen: 5, sorted: true, min: -99, max: 99 })); return arrs; },
    lines: { init: { ts: "if (arr.length > 0) heap.push([arr[0], i, 0]);", go: "h.Push(item{arr[0], i, 0})" }, pop: { ts: "const [value, which, idx] = heap.pop()!;", go: "cur := h.Pop()" }, out: { ts: "merged.push(value);", go: "merged = append(merged, cur.value)" }, next: { ts: "if (idx + 1 < arrays[which].length) heap.push([arrays[which][idx + 1], which, idx + 1]);", go: "h.Push(item{arrays[cur.which][cur.idx+1], cur.which, cur.idx + 1})" } },
    table: { id: "tbl-3", preset: 0, rows: ["p0", "p1", "p2", "p3", "end"] },
    trace(arrays) {
      const Tr = new G.Trace();
      const H = new SimHeap((a, b) => a[0] < b[0], (t) => `${t[0]}@${t[1]}`);
      const merged = [];
      const used = arrays.map(() => 0);
      const panels = (hot) => [{ title: "arrays (taken ✓)", keyW: 30, valW: 120, entries: arrays.map((a, i) => [i, a.map((v, j) => (j < used[i] ? v + "✓" : v)).join(" ") || "(empty)"]), hi: hot != null ? [hot] : [] }, { title: "output", keyW: 140, entries: [[merged.join(", ") || "—"]] }];
      const st = (mk, hot) => ({ items: H.items(), marks: mk || {}, panels: panels(hot), note: { text: "label value@array" } });
      arrays.forEach((a, i) => { if (a.length) H.push([a[0], i, 0]); });
      Tr.add({ at: "init", state: st(), vars: { k: arrays.length }, say: "Push the front of every non-empty array. The heap holds at most k items." });
      let p = 0;
      while (H.data.length) {
        const [v, w, idx] = H.pop();
        merged.push(v); used[w] = idx + 1;
        const key = "p" + p++;
        if (idx + 1 < arrays[w].length) {
          H.push([arrays[w][idx + 1], w, idx + 1]);
          const at = H.data.findIndex((d) => d.x[1] === w && d.x[2] === idx + 1);
          Tr.add({ key, at: "next", state: st({ [at]: "focus" }, w), vars: { popped: `${v}@${w}`, output: merged.length }, say: `Pop the smallest front, ${v} from array ${w}, into the output. Push array ${w}'s next value, ${arrays[w][idx + 1]}.` });
        } else Tr.add({ key, at: "out", state: st({}, w), vars: { popped: `${v}@${w}` }, say: `Pop ${v} from array ${w}. Array ${w} is used up: nothing to push.` });
      }
      Tr.add({ key: "end", state: st(), vars: { merged: `[${merged.join(", ")}]` }, say: `Merged: [${merged.join(", ")}]. Each of N values costs one push and one pop on a heap of size k: O(N log k).` });
      return Tr.done(merged);
    },
  };

  /* ---------- Problem 4: Kth smallest in a sorted matrix ---------- */
  A.kthMatrix = {
    title: "Kth Smallest in a Sorted Matrix: walk the rows with a heap",
    viz: "heap", legend: ["answer:popped", "focus:the next in that row, pushed"],
    inputLabel: "rows separated by | ; k", hint: "1 5 9 | 10 11 13 | 12 13 15 ; 8",
    presets: [{ label: "the lesson's 3×3, k=8", input: "1 5 9 | 10 11 13 | 12 13 15 ; 8" }, { label: "[[1,2],[1,3]], k=2", input: "1 2 | 1 3 ; 2" }],
    parse(s) {
      const [a, b] = P.parts(s, 2, 'Rows separated by "|", then ";" and k');
      const m = a.split("|").map((r) => P.nums(r, { minLen: 1, maxLen: 4, sorted: true, min: -99, max: 99 }));
      const n = m.length;
      if (n > 4) throw new Error("Up to 4 × 4.");
      if (m.some((r) => r.length !== n)) throw new Error("The matrix must be square (n rows of n numbers).");
      for (let c = 0; c < n; c++) for (let r = 1; r < n; r++) if (m[r][c] < m[r - 1][c]) throw new Error("Each column must be sorted too.");
      const k = P.num(b, "k"); if (!Number.isInteger(k) || k < 1 || k > n * n) throw new Error(`k must be from 1 to ${n * n}.`);
      return { m, k };
    },
    lines: { init: { ts: "for (let r = 0; r < Math.min(n, k); r++) heap.push([matrix[r][0], r, 0]);", go: "h.Push(cell{matrix[r][0], r, 0})" }, pop: { ts: "const [v, r, c] = heap.pop()!;", go: "cur := h.Pop()" }, next: { ts: "if (c + 1 < n) heap.push([matrix[r][c + 1], r, c + 1]);", go: "h.Push(cell{matrix[cur.row][cur.col+1], cur.row, cur.col + 1})" }, ret: { ts: "function kthSmallestInMatrix>>return value;", go: "func kthSmallestInMatrix>>return value" } },
    table: { id: "tbl-4", preset: 0, rows: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"] },
    trace({ m, k }) {
      const Tr = new G.Trace();
      const n = m.length;
      const H = new SimHeap((a, b) => a[0] < b[0], (t) => `${t[0]}`);
      const taken = new Set();
      const panels = () => [{ title: "matrix (popped ✓)", keyW: 30, valW: 140, entries: m.map((row, r) => [r, row.map((v, c) => (taken.has(r + "," + c) ? v + "✓" : v)).join("  ")]) }];
      const st = (mk) => ({ items: H.items(), marks: mk || {}, panels: panels() });
      for (let r = 0; r < Math.min(n, k); r++) H.push([m[r][0], r, 0]);
      Tr.add({ at: "init", state: st(), vars: { k }, say: `Push the first value of each row (at most k rows). The smallest of all is among them.` });
      let value = -1;
      for (let i = 0; i < k; i++) {
        const [v, r, c] = H.pop();
        value = v; taken.add(r + "," + c);
        if (c + 1 < n) { H.push([m[r][c + 1], r, c + 1]); const at = H.data.findIndex((d) => d.x[1] === r && d.x[2] === c + 1); Tr.add({ key: "p" + (i + 1), at: "next", state: st({ [at]: "focus" }), vars: { pop: i + 1, value: v }, say: `Pop #${i + 1}: ${v} at (${r},${c}). Push its right neighbor ${m[r][c + 1]}.` }); }
        else Tr.add({ key: "p" + (i + 1), at: "pop", state: st(), vars: { pop: i + 1, value: v }, say: `Pop #${i + 1}: ${v} at (${r},${c}), the end of its row: push nothing.` });
      }
      Tr.add({ at: "ret", state: st(), vars: { answer: value }, say: `The ${k}th pop is the answer: ${value}. O(k log n).` });
      return Tr.done(value);
    },
  };

  /* ---------- Problem 5: Meeting rooms II ---------- */
  A.rooms = {
    title: "Meeting Rooms II: a min-heap of end times",
    viz: "heap", legend: ["anchor:the room that frees first", "focus:this meeting's end, pushed"],
    inputLabel: "meetings as start-end", hint: "0-30 5-10 15-20",
    presets: [{ label: "[[0,30],[5,10],[15,20]]", input: "0-30 5-10 15-20" }, { label: "[[1,5],[2,6],[3,7]]", input: "1-5 2-6 3-7" }, { label: "back to back", input: "1-3 3-5 5-7 2-4" }],
    parse(s) {
      const t = String(s).replace(/[\[\]]/g, " ").trim().split(/[\s,]+/).filter(Boolean);
      if (!t.length) throw new Error("Type meetings like 0-30 5-10.");
      if (t.length > 8) throw new Error("Up to 8 meetings.");
      return t.map((x) => { const m = x.match(/^(\d+)-(\d+)$/); if (!m || +m[1] >= +m[2] || +m[2] > 99) throw new Error(`"${x}" should look like 5-10 (start < end ≤ 99).`); return [+m[1], +m[2]]; });
    },
    lines: { sort: { ts: "const sorted = [...intervals].sort((a, b) => a[0] - b[0]);", go: "sort.Slice(sorted" }, check: { ts: "if (endTimes.size > 0 && endTimes.peek()! <= start) endTimes.pop();", go: "if endTimes.Len() > 0 && endTimes.Peek() <= start {" }, reuse: { ts: "if (endTimes.size > 0 && endTimes.peek()! <= start) endTimes.pop();", go: "endTimes.Pop() // reuse a freed room" }, push: { ts: "endTimes.push(end);", go: "endTimes.Push(end)" }, rooms: { ts: "rooms = Math.max(rooms, endTimes.size);", go: "rooms = max(rooms, endTimes.Len())" } },
    table: { id: "tbl-5", preset: 0, rows: ["m0", "m1", "m2"] },
    trace(ms) {
      const Tr = new G.Trace();
      const sorted = ms.slice().sort((a, b) => a[0] - b[0]);
      const H = new SimHeap(lt);
      let rooms = 0;
      const st = (mk, cur) => ({ items: H.items(), marks: mk || {}, panels: [{ title: "meetings by start", keyW: 70, entries: sorted.map((m) => [`${m[0]}–${m[1]}`]), hi: cur ? [`${cur[0]}–${cur[1]}`] : [] }], note: { text: `rooms used: ${rooms}` } });
      Tr.add({ at: "sort", flow: ["A"], state: st(), vars: {}, say: `Sort by start time. The heap will hold the end time of every meeting in progress.` });
      sorted.forEach(([s, e], i) => {
        let free = false;
        if (H.data.length) {
          free = H.data[0].x <= s;
          Tr.add({ at: "check", flow: ["B", "C"], state: st({ 0: "anchor" }, [s, e]), vars: { start: s, "earliest end": H.data[0].x }, say: `Meeting ${s}–${e}. The room that frees first frees at ${H.data[0].x}.`, ask: { q: `Earliest end ${H.data[0].x}, this meeting starts at ${s}. Reuse that room?`, options: ["Yes: pop its end time", "No: it needs a new room"], answer: free ? 0 : 1, why: free ? `${H.data[0].x} ≤ ${s}: that meeting is over.` : `${H.data[0].x} > ${s}: every room is still busy.` } });
          if (free) { const old = H.pop(); Tr.add({ at: "reuse", flow: ["D"], state: st({}, [s, e]), vars: { freed: old }, say: `Pop ${old}: that room is free, and this meeting takes it.` }); }
        }
        H.push(e);
        rooms = Math.max(rooms, H.data.length);
        const at = H.data.findIndex((d) => d.id === UID - 1);
        Tr.add({ key: "m" + i, at: "rooms", flow: [free ? "D" : "E", "F", "G"], state: st({ [at]: "focus" }, [s, e]), vars: { "in use": H.data.length, rooms }, say: `Push its end ${e}. ${H.data.length} room${H.data.length > 1 ? "s" : ""} in use; most so far ${rooms}.` });
      });
      Tr.add({ state: st(), vars: { rooms }, say: `Answer: ${rooms} room${rooms === 1 ? "" : "s"}. O(n log n).` });
      return Tr.done(rooms);
    },
  };

  /* ---------- Problem 6: median of a stream with two heaps ---------- */
  function twoHeaps(scene, st) {
    const NW = 40, NH = 32, RH = 56;
    let maxH = 0;
    const draw = (pre, items, marks, x0, title, cls) => {
      const n = items.length, levels = Math.max(1, Math.ceil(Math.log2(n + 1))), W = Math.max(4, 2 ** (levels - 1)) * (NW + 10);
      const xy = (i) => { const d = Math.floor(Math.log2(i + 1)), slot = i - (2 ** d - 1), span = W / 2 ** d; return { x: x0 + span * slot + span / 2 - NW / 2, y: 34 + d * RH }; };
      G.drawText(scene, pre + "t", x0 + W / 2, 14, title, "lbl panel-title " + cls, "middle");
      for (let i = 1; i < n; i++) { const a = xy((i - 1) >> 1), b = xy(i); G.drawLine(scene, `${pre}e${i}`, a.x + NW / 2, a.y + NH, b.x + NW / 2, b.y, "edge"); }
      items.forEach((it, i) => { const p = xy(i); G.drawCell(scene, `hn${it.id}`, p.x, p.y, NW, NH, it.v, (marks && marks[i]) || (i === 0 ? cls : null), "tnode"); });
      maxH = Math.max(maxH, 34 + levels * RH);
      return W;
    };
    const wl = draw("L", st.low, st.lowMarks, 10, "low: max-heap (smaller half)", "p1");
    const wh = draw("H", st.high, st.highMarks, wl + 40, "high: min-heap (larger half)", "p2");
    let h = maxH + 6;
    if (st.note) { G.drawText(scene, "note", 10, h + 6, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 28; }
    return { x: 0, y: 0, w: wl + wh + 60, h };
  }
  A.median = {
    title: "Median of a stream: two heaps meet in the middle",
    viz: twoHeaps, legend: ["p1:top of low (the largest small value)", "p2:top of high (the smallest large value)", "focus:just moved"],
    inputLabel: "numbers arriving", hint: "1 2 3 -5",
    presets: [{ label: "1, 2, 3, −5", input: "1 2 3 -5" }, { label: "5 15 1 3 8 7", input: "5 15 1 3 8 7" }],
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 10, min: -99, max: 99 }),
    lines: { s1: { ts: "this.low.push(num);", go: "m.low.Push(num)" }, s2: { ts: "this.high.push(this.low.pop()!);", go: "m.high.Push(m.low.Pop())" }, s3: { ts: "if (this.high.size > this.low.size) this.low.push(this.high.pop()!);", go: "m.low.Push(m.high.Pop())" }, ok: { ts: "if (this.high.size > this.low.size) this.low.push(this.high.pop()!);", go: "if m.high.Len() > m.low.Len() {" }, med1: { ts: "if (this.low.size > this.high.size) return this.low.peek()!;", go: "return float64(m.low.Peek())" }, med2: { ts: "return (this.low.peek()! + this.high.peek()!) / 2;", go: "return float64(m.low.Peek()+m.high.Peek()) / 2" } },
    table: { id: "tbl-6", preset: 0, rows: ["a0", "a1", "a2"] },
    trace(nums) {
      const Tr = new G.Trace();
      const low = new SimHeap((a, b) => a > b), high = new SimHeap(lt);
      const meds = [];
      const find = (H, id) => H.data.findIndex((d) => d.id === id);
      const st = (lm, hm, note) => ({ low: low.items(), high: high.items(), lowMarks: lm || {}, highMarks: hm || {}, note: { text: note || `low ${low.data.length} · high ${high.data.length}` } });
      nums.forEach((x, i) => {
        low.push(x);
        let id = UID - 1;
        Tr.add({ at: "s1", state: st({ [find(low, id)]: "focus" }), vars: { add: x }, say: `Add ${x}: step 1, push it into low.` });
        const up = low.pop(); high.push(up); id = UID - 1;
        Tr.add({ at: "s2", state: st({}, { [find(high, id)]: "focus" }), vars: { moved: up }, say: `Step 2: low's largest, ${up}, moves to high. Now everything in low ≤ everything in high.` });
        if (high.data.length > low.data.length) {
          const back = high.pop(); low.push(back); id = UID - 1;
          Tr.add({ at: "s3", state: st({ [find(low, id)]: "focus" }), vars: { moved: back }, say: `Step 3: high is bigger, so its smallest, ${back}, goes back to low. low keeps the extra item when the count is odd.` });
        } else Tr.add({ at: "ok", state: st(), vars: {}, say: "Step 3: sizes are fine (low ≥ high)." });
        const m = low.data.length > high.data.length ? low.data[0].x : (low.data[0].x + high.data[0].x) / 2;
        meds.push(m);
        Tr.add({ key: "a" + i, at: low.data.length > high.data.length ? "med1" : "med2", state: st({ 0: "answer" }, low.data.length > high.data.length ? {} : { 0: "answer" }, `median ${m}`), vars: { median: m }, say: low.data.length > high.data.length ? `Odd count: the median is low's top, ${m}.` : `Even count: the median is the average of the two tops, (${low.data[0].x} + ${high.data[0].x}) / 2 = ${m}.` });
      });
      Tr.add({ state: st(), vars: {}, say: "Each add costs O(log n); reading the median is O(1)." });
      return Tr.done(meds);
    },
  };

  G.quizzes.heap17 = {
    title: "Heaps",
    items: [
      { q: "A min-heap is stored as an array. Where are the children of index i?", options: ["2i + 1 and 2i + 2", "i + 1 and i + 2", "2i and 2i − 1", "i / 2"], answer: 0, why: "And the parent of i is (i − 1) / 2, rounded down." },
      { q: "You need the k largest values from a stream. Which heap?", options: ["A min-heap of size k", "A max-heap of size k", "A max-heap of everything", "A sorted array"], answer: 0, why: "Its top is the smallest of the k kept, the one to evict when something bigger arrives." },
      { q: "How long does building a heap from n unsorted values take?", options: ["O(n)", "O(n log n)", "O(log n)", "O(n²)"], answer: 0, why: "Half the nodes are leaves and do no work; most of the rest sift only a level or two." },
      { q: "Does iterating over a heap's array give sorted order?", options: ["No: only the top is guaranteed", "Yes, always", "Yes, for a min-heap", "Only after heapify"], answer: 0, why: "Siblings and cousins are in no particular order." },
      { q: "Meeting rooms: which values go into the heap?", options: ["End times of meetings in progress", "Start times", "Meeting lengths", "Room numbers"], answer: 0, why: "The smallest end time tells you which room frees first." },
      { q: "In the two-heap median, what does each heap hold?", options: ["low: max-heap of the smaller half; high: min-heap of the larger half", "low: min-heap; high: max-heap", "Both: min-heaps", "One heap of all values"], answer: 0, why: "The two tops are the middle values." },
    ],
  };
})();

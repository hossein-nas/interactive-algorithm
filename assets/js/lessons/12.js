/* Lesson 12 · Linked lists — arrows that rewire, pointers that walk. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;
  const parseList = (s, o) => P.nums(s, Object.assign({ minLen: 1, maxLen: 7, min: -99, max: 99 }, o));
  // a list held as {nodes, next}; node ids are numbers, the dummy is "d"
  const chain = (vals, idOf) => { const nodes = vals.map((v, i) => ({ id: idOf ? idOf(i) : i, v, c: i, r: 0 })); const next = {}; nodes.forEach((n, i) => (next[n.id] = i + 1 < nodes.length ? nodes[i + 1].id : null)); return { nodes, next }; };
  const walk = (next, head, limit) => { const out = []; let n = head; while (n != null && out.length < (limit || 50)) { out.push(n); n = next[n]; } return out; };

  /* ---------------- reverse ---------------- */
  A.reverseIter = {
    title: "Reverse Linked List", short: "Iterative: prev, cur, next",
    viz: "list", legend: ["p1:prev", "p2:cur", "focus:next (saved)", "answer:already reversed"],
    inputLabel: "values", hint: "1 2 3",
    presets: [{ label: "1 → 2 → 3 (the trace table)", input: "1 2 3" }, { label: "five nodes", input: "1 2 3 4 5" }],
    table: { id: "tbl-1", preset: 0, rows: ["start", "s1", "s2", "s3", "end"] },
    parse: (s) => parseList(s),
    lines: { save: { ts: "const next = cur.next; // 1. save", go: "next := cur.Next // 1. save" }, flip: { ts: "cur.next = prev; // 2. flip", go: "func reverseList>>cur.Next = prev" }, step: { ts: "prev = cur; // 3. step forward", go: "func reverseList>>prev = cur" }, move: { ts: "cur = next; // 4.", go: "func reverseList>>cur = next" }, ret: { ts: "function reverseList>>return prev;", go: "func reverseList>>return prev" } },
    trace(vals) {
      const T = new G.Trace();
      const { nodes, next } = chain(vals);
      let prev = null, cur = 0, nx = null, step = 0;
      const st = (hot) => ({ nodes: nodes.map((n) => Object.assign({}, n, { m: prev != null && walk(next, prev).includes(n.id) ? "answer" : null })), next: Object.assign({}, next), hot, ptrs: [{ name: "prev", id: prev, role: "p1" }, { name: "cur", id: cur, role: "p2" }, { name: "next", id: nx, role: "focus" }] });
      T.add({ key: "start", state: st(), vars: { prev: "null", cur: vals[0] }, say: "`prev` is null and `cur` is the head." });
      while (cur != null) {
        step++;
        nx = next[cur];
        T.add({ at: "save", key: `s${step}`, state: st(), vars: { cur: vals[cur], next: nx == null ? "null" : vals[nx] }, say: "1. Save `next = cur.next` first. Otherwise flipping the arrow would lose the rest of the list.", ask: { q: "What comes after saving next?", options: ["Flip: cur.next = prev", "Move cur = next", "Move prev = cur"], answer: 0, why: "Flip the arrow now; the rest of the list is safe in `next`." } });
        next[cur] = prev;
        T.add({ at: "flip", key: `s${step}`, state: st([cur]), vars: { cur: vals[cur] }, say: `2. Flip: node ${vals[cur]} now points back to ${prev == null ? "null" : vals[prev]}.` });
        prev = cur;
        T.add({ at: "step", key: `s${step}`, state: st(), vars: { prev: vals[prev] }, say: "3. `prev = cur`." });
        cur = nx;
        T.add({ at: "move", key: `s${step}`, state: st(), vars: { cur: cur == null ? "null" : vals[cur] }, say: "4. `cur = next`." });
      }
      nx = null;
      T.add({ at: "ret", key: "end", state: st(), vars: { "new head": vals[prev] }, say: `\`cur\` is null. Return \`prev\` (${vals[prev]}): the new head. \`O(n)\` time, \`O(1)\` space.` });
      return T.done(walk(next, prev).map((i) => vals[i]));
    },
  };
  A.reverseRec = {
    title: "Reverse Linked List", short: "Recursive: trust the rest",
    viz: "list", legend: ["focus:the call's node", "answer:already reversed"],
    inputLabel: "values", hint: "1 2 3",
    presets: [{ label: "1 → 2 → 3", input: "1 2 3" }, { label: "five nodes", input: "1 2 3 4 5" }],
    parse: (s) => parseList(s),
    lines: { base: { ts: "if (head === null || head.next === null) return head; // base case", go: "return head // base case: 0 or 1 node" }, rec: { ts: "const newHead = reverseListRec(head.next);", go: "newHead := reverseListRec(head.Next)" }, back: { ts: "head.next.next = head;", go: "head.Next.Next = head" }, cut: { ts: "head.next = null; // and I become the tail", go: "func reverseListRec>>head.Next = nil" } },
    trace(vals) {
      const T = new G.Trace();
      const { nodes, next } = chain(vals);
      const done = new Set();
      const st = (h, hot) => ({ nodes: nodes.map((n) => Object.assign({}, n, { m: n.id === h ? "focus" : done.has(n.id) ? "answer" : null })), next: Object.assign({}, next), hot, ptrs: [{ name: "head", id: h, role: "focus" }] });
      function rec(h, depth) {
        if (h == null || next[h] == null) { if (h != null) done.add(h); T.add({ at: "base", state: st(h), vars: { depth }, say: `Node ${vals[h]} is the last one: base case, return it as the new head.` }); return h; }
        T.add({ at: "rec", state: st(h), vars: { depth }, say: `Reverse everything after ${vals[h]} first. Trust the call.` });
        const nh = rec(next[h], depth + 1);
        const after = next[h];
        next[after] = h;
        T.add({ at: "back", state: st(h, [after]), vars: { depth }, say: `The node after me (${vals[after]}) now points back at me (${vals[h]}).` });
        next[h] = null; done.add(h);
        T.add({ at: "cut", state: st(h, [h]), vars: { depth }, say: `${vals[h]} becomes the tail: point it at null.` });
        return nh;
      }
      const nh = rec(0, 1);
      return T.done(walk(next, nh).map((i) => vals[i]));
    },
  };

  /* ---------------- merge ---------------- */
  A.mergeLists = {
    title: "Merge Two Sorted Lists with a dummy node",
    viz: "list", legend: ["p1:a", "p2:b", "focus:tail", "answer:in the merged list"],
    inputLabel: "list a ; list b (sorted)", hint: "1 2 4 ; 1 3 4",
    presets: [{ label: "1→2→4 and 1→3→4", input: "1 2 4 ; 1 3 4" }, { label: "one empty", input: " ; 0" }],
    parse(s) { const [x, y] = P.parts(s, 2, 'List a, then ";" and list b'); const a = P.nums(x, { sorted: true, allowEmpty: true, maxLen: 5 }), b = P.nums(y, { sorted: true, allowEmpty: true, maxLen: 5 }); return { a, b }; },
    lines: { cmp: { ts: "if (a.val <= b.val) {", go: "if a.Val <= b.Val {" }, takeA: { ts: "function mergeTwoLists>>tail.next = a;", go: "func mergeTwoLists>>tail.Next = a" }, takeB: { ts: "function mergeTwoLists>>tail.next = b;", go: "func mergeTwoLists>>tail.Next = b" }, rest: { ts: "tail.next = a !== null ? a : b;", go: "tail.Next = a // attach the leftover" } },
    trace({ a, b }) {
      const T = new G.Trace();
      const nodes = [{ id: "d", v: "dummy", c: 0, r: 1, cls: "kv-key" }].concat(a.map((v, i) => ({ id: "a" + i, v, c: i + 1, r: 0 })), b.map((v, i) => ({ id: "b" + i, v, c: i + 1, r: 2 })));
      const next = { d: null };
      a.forEach((_, i) => (next["a" + i] = i + 1 < a.length ? "a" + (i + 1) : null));
      b.forEach((_, i) => (next["b" + i] = i + 1 < b.length ? "b" + (i + 1) : null));
      let pa = a.length ? "a0" : null, pb = b.length ? "b0" : null, tail = "d";
      const val = (id) => (id[0] === "a" ? a[+id.slice(1)] : b[+id.slice(1)]);
      const st = (hot) => { const inM = new Set(walk(next, next.d)); return { nodes: nodes.map((n) => Object.assign({}, n, { m: inM.has(n.id) ? "answer" : n.id === "d" ? null : n.m })), next: Object.assign({}, next), hot, ptrs: [{ name: "a", id: pa, role: "p1" }, { name: "b", id: pb, role: "p2" }, { name: "tail", id: tail, role: "focus" }] }; };
      T.add({ state: st(), vars: {}, say: "A dummy node means the head never needs a special case. `tail` starts at it." });
      while (pa && pb) {
        const takeA = val(pa) <= val(pb);
        T.add({ at: "cmp", state: st(), vars: { "a.val": val(pa), "b.val": val(pb) }, say: `Compare ${val(pa)} and ${val(pb)}.`, ask: { q: "Which node is attached to tail?", options: ["a's front", "b's front"], answer: takeA ? 0 : 1, why: takeA ? `${val(pa)} ≤ ${val(pb)} (ties take a).` : `${val(pb)} < ${val(pa)}.` } });
        const pick = takeA ? pa : pb;
        next[tail] = pick;
        if (takeA) pa = next[pa]; else pb = next[pb];
        T.add({ at: takeA ? "takeA" : "takeB", state: st([tail]), vars: {}, say: `Attach ${val(pick)} after tail, and advance ${takeA ? "a" : "b"}.` });
        tail = pick;
      }
      next[tail] = pa || pb;
      T.add({ at: "rest", state: st([tail]), vars: {}, say: pa || pb ? "One list is empty: attach the rest of the other one in a single step. It is already sorted." : "Both lists are used up." });
      const out = walk(next, next.d).map(val);
      T.add({ state: st(), vars: { merged: out }, say: `Return dummy.next: ${out.join(" → ") || "empty"}. \`O(a + b)\` time, \`O(1)\` space: no new nodes.` });
      return T.done(out);
    },
  };

  /* ---------------- cycle ---------------- */
  A.detectCycle = {
    title: "Floyd's cycle detection, and where the cycle starts",
    viz: "list", legend: ["p1:slow (1 step)", "p2:fast (2 steps)", "focus:ptr from the head", "answer:cycle start"],
    inputLabel: "values ; index the tail points back to (−1 = none)", hint: "1 2 3 4 5 6 ; 2",
    presets: [{ label: "1..6, tail → index 2", input: "1 2 3 4 5 6 ; 2" }, { label: "no cycle", input: "1 2 3 4 ; -1" }, { label: "tail → head", input: "1 2 3 4 5 ; 0" }],
    parse(s) { const [x, p] = P.parts(s, 2, 'Values, then ";" and the index (−1 for no cycle)'); const vals = parseList(x, { maxLen: 8 }); const pos = P.num(p, "The index"); if (!Number.isInteger(pos) || pos < -1 || pos >= vals.length) throw new Error(`Index from −1 to ${vals.length - 1}.`); return { vals, pos }; },
    lines: { step: { ts: "function detectCycle>>fast = fast.next.next;", go: "func detectCycle>>fast = fast.Next.Next" }, meet: { ts: "function detectCycle>>if (slow === fast) {", go: "func detectCycle>>if slow == fast {" }, walk: { ts: "ptr = ptr!.next;", go: "ptr = ptr.Next" }, ret: { ts: "return ptr; // both arrive", go: "return ptr // both arrive" }, none: { ts: "function detectCycle>>return null;", go: "func detectCycle>>return nil" } },
    trace({ vals, pos }) {
      const T = new G.Trace();
      const { nodes, next } = chain(vals);
      if (pos >= 0) next[vals.length - 1] = pos;
      let slow = 0, fast = 0, ptr = null, start = null;
      const st = () => ({ nodes: nodes.map((n) => Object.assign({}, n, { m: n.id === start ? "answer" : null })), next, ptrs: [{ name: "slow", id: slow, role: "p1" }, { name: "fast", id: fast, role: "p2" }, { name: "ptr", id: ptr, role: "focus" }] });
      T.add({ state: st(), vars: {}, say: pos >= 0 ? `The tail points back to node ${vals[pos]}: a cycle. Both pointers start at the head.` : "No cycle in this list. Both pointers start at the head." });
      let rounds = 0;
      while (fast != null && next[fast] != null) {
        slow = next[slow]; fast = next[next[fast]]; rounds++;
        T.add({ at: "step", state: st(), vars: { round: rounds, slow: vals[slow], fast: fast == null ? "null" : vals[fast] }, say: `slow moves 1 to ${vals[slow]}; fast moves 2 to ${fast == null ? "null" : vals[fast]}. Inside a cycle the gap shrinks by exactly 1 each round, so fast cannot jump over slow.` });
        if (slow === fast) {
          T.add({ at: "meet", state: st(), vars: { meeting: vals[slow] }, say: `They meet at ${vals[slow]}: there is a cycle. Now put \`ptr\` at the head and move both one step at a time.` });
          ptr = 0;
          T.add({ at: "walk", state: st(), vars: { ptr: vals[ptr], slow: vals[slow] }, say: "Head-to-start distance a equals meeting-point-to-start distance (modulo laps), because a + b is a whole number of laps." });
          while (ptr !== slow) { ptr = next[ptr]; slow = next[slow]; T.add({ at: "walk", state: st(), vars: { ptr: vals[ptr], slow: vals[slow] }, say: `ptr → ${vals[ptr]}, slow → ${vals[slow]}.` }); }
          start = ptr;
          T.add({ at: "ret", state: st(), vars: { "cycle start": vals[ptr] }, say: `They meet at ${vals[ptr]}: the start of the cycle. \`O(n)\` time, \`O(1)\` space.` });
          return T.done(ptr);
        }
      }
      T.add({ at: "none", state: st(), vars: {}, say: "fast reached the end: no cycle. Return null." });
      return T.done(null);
    },
  };

  /* ---------------- remove n-th from end ---------------- */
  A.removeNth = {
    title: "Remove the N-th Node From the End: a gap of n + 1",
    viz: "list", legend: ["p1:slow", "p2:fast", "bug:the node being removed"],
    inputLabel: "values ; n", hint: "1 2 3 4 5 ; 2",
    presets: [{ label: "1..5, n = 2 (the trace table)", input: "1 2 3 4 5 ; 2" }, { label: "remove the head", input: "1 2 3 ; 3" }],
    table: { id: "tbl-2", preset: 0, rows: ["gap", "t1", "t2", "t3", "del"] },
    parse(s) { const [x, k] = P.parts(s, 2, 'Values, then ";" and n'); const vals = parseList(x); const n = P.num(k, "n"); if (!Number.isInteger(n) || n < 1 || n > vals.length) throw new Error(`n from 1 to ${vals.length}.`); return { vals, n }; },
    lines: { gap: { ts: "for (let i = 0; i <= n; i++) fast = fast!.next;", go: "fast = fast.Next // gap of n + 1 nodes" }, move: { ts: "function removeNthFromEnd>>slow = slow.next!;", go: "func removeNthFromEnd>>slow = slow.Next" }, skip: { ts: "slow.next = slow.next!.next; // skip the target node", go: "slow.Next = slow.Next.Next // skip the target node" } },
    trace({ vals, n }) {
      const T = new G.Trace();
      const c = chain(vals, (i) => i);
      const nodes = [{ id: "d", v: "dummy", c: 0, r: 0, cls: "kv-key" }].concat(c.nodes.map((x) => Object.assign(x, { c: x.c + 1 })));
      const next = Object.assign({ d: 0 }, c.next);
      let slow = "d", fast = "d";
      const st = (mk, hot) => ({ nodes: nodes.map((x) => Object.assign({}, x, { m: mk && mk[x.id] })), next: Object.assign({}, next), hot, ptrs: [{ name: "slow", id: slow, role: "p1" }, { name: "fast", id: fast, role: "p2" }] });
      for (let i = 0; i <= n; i++) fast = next[fast];
      T.add({ at: "gap", key: "gap", state: st(), vars: { n }, say: `Send fast n + 1 = ${n + 1} steps ahead of slow. ${fast == null ? "It already fell off the end." : ""}` });
      let t = 0;
      while (fast != null) { fast = next[fast]; slow = next[slow]; t++; T.add({ at: "move", key: `t${t}`, state: st(), vars: {}, say: `Move both. fast → ${fast == null ? "null" : vals[fast]}.` }); }
      const target = next[slow];
      T.add({ at: "skip", key: "del", state: st({ [target]: "bug" }), vars: { removing: vals[target] }, say: `fast is null, so slow (${slow === "d" ? "the dummy" : vals[slow]}) is right before the target ${vals[target]}.` });
      next[slow] = next[target];
      nodes.splice(nodes.findIndex((x) => x.id === target), 1);
      T.add({ at: "skip", key: "del", state: st({}, [slow]), vars: {}, say: `Skip it: \`slow.next = slow.next.next\`. The dummy makes removing the head the same case.` });
      return T.done(walk(next, next.d).map((i) => vals[i]));
    },
  };

  /* ---------------- add two numbers ---------------- */
  A.addTwo = {
    title: "Add Two Numbers: digits in reverse, carry forward",
    viz: "list", legend: ["p1:a", "p2:b", "answer:result digits"],
    varRoles: { carry: "focus" },
    inputLabel: "digits of a (ones first) ; digits of b", hint: "9 9 ; 1",
    presets: [{ label: "99 + 1 (the trace table)", input: "9 9 ; 1" }, { label: "342 + 465", input: "2 4 3 ; 5 6 4" }],
    table: { id: "tbl-3", preset: 0, rows: ["d1", "d2", "d3"] },
    parse(s) { const [x, y] = P.parts(s, 2, 'Digits of a, then ";" and digits of b'); return { a: P.nums(x, { only: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], minLen: 1, maxLen: 5 }), b: P.nums(y, { only: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], minLen: 1, maxLen: 5 }) }; },
    lines: { sum: { ts: "const sum = (a?.val ?? 0) + (b?.val ?? 0) + carry;", go: "sum := carry" }, node: { ts: "tail.next = new ListNode(sum % 10);", go: "tail.Next = &ListNode{Val: sum % 10}" }, carry: { ts: "carry = Math.floor(sum / 10);", go: "carry = sum / 10" } },
    trace({ a, b }) {
      const T = new G.Trace();
      const out = [];
      let i = 0, carry = 0;
      const st = () => {
        const nodes = a.map((v, k) => ({ id: "a" + k, v, c: k, r: 0, m: k === i ? "p1" : null })).concat(b.map((v, k) => ({ id: "b" + k, v, c: k, r: 1, m: k === i ? "p2" : null })), out.map((v, k) => ({ id: "o" + k, v, c: k, r: 2, m: "answer" })));
        const next = {};
        a.forEach((_, k) => (next["a" + k] = k + 1 < a.length ? "a" + (k + 1) : null));
        b.forEach((_, k) => (next["b" + k] = k + 1 < b.length ? "b" + (k + 1) : null));
        out.forEach((_, k) => (next["o" + k] = k + 1 < out.length ? "o" + (k + 1) : null));
        return { nodes, next, note: { text: `carry ${carry}` } };
      };
      while (i < a.length || i < b.length || carry) {
        const sum = (a[i] || 0) + (b[i] || 0) + carry;
        T.add({ at: "sum", key: `d${i + 1}`, state: st(), vars: { "a digit": a[i] || 0, "b digit": b[i] || 0, "carry in": carry, sum }, say: `${a[i] || 0} + ${b[i] || 0} + carry ${carry} = ${sum}.` });
        out.push(sum % 10);
        T.add({ at: "node", key: `d${i + 1}`, state: st(), vars: { digit: sum % 10 }, say: `Write ${sum % 10}.` });
        carry = Math.floor(sum / 10);
        T.add({ at: "carry", key: `d${i + 1}`, state: st(), vars: { carry }, say: carry ? "Carry 1 to the next digit. Keep looping while a carry remains, even after both lists end." : "No carry." });
        i++;
      }
      return T.done(out);
    },
  };

  /* ---------------- reorder ---------------- */
  A.reorder = {
    title: "Reorder List: middle, reverse, interleave",
    viz: "list", legend: ["p1:slow / first", "p2:fast / second", "answer:woven in"],
    inputLabel: "values", hint: "1 2 3 4 5",
    presets: [{ label: "1..5", input: "1 2 3 4 5" }, { label: "1..4", input: "1 2 3 4" }],
    parse: (s) => parseList(s, { minLen: 1 }),
    lines: { mid: { ts: "function reorderList>>slow = slow.next!;", go: "func reorderList>>slow = slow.Next" }, rev: { ts: "let second = reverseList(slow.next);", go: "second := reverseList(slow.Next)" }, cut: { ts: "function reorderList>>slow.next = null;", go: "func reorderList>>slow.Next = nil" }, weave: { ts: "first!.next = second;", go: "first.Next = second" }, weave2: { ts: "second.next = firstNext;", go: "second.Next = firstNext" } },
    trace(vals) {
      const T = new G.Trace();
      const { nodes, next } = chain(vals);
      const st = (ptrs, hot, rows) => ({ nodes: nodes.map((n) => Object.assign({}, n, rows ? rows[n.id] : {})), next: Object.assign({}, next), hot, ptrs });
      if (vals.length < 2) { T.add({ state: st([]), vars: {}, say: "Zero or one node: nothing to do." }); return T.done(vals.slice()); }
      let slow = 0, fast = 0;
      T.add({ at: "mid", state: st([{ name: "slow", id: slow, role: "p1" }, { name: "fast", id: fast, role: "p2" }]), vars: {}, say: "Phase 1: find the middle with slow (1 step) and fast (2 steps)." });
      while (next[fast] != null && next[next[fast]] != null) { slow = next[slow]; fast = next[next[fast]]; T.add({ at: "mid", state: st([{ name: "slow", id: slow, role: "p1" }, { name: "fast", id: fast, role: "p2" }]), vars: { slow: vals[slow] }, say: `slow → ${vals[slow]}, fast → ${vals[fast]}.` }); }
      // phase 2: cut and reverse the second half (draw it on a second row)
      let second = next[slow];
      next[slow] = null;
      const half = walk(next, second);
      const rows = {};
      half.forEach((id, k) => (rows[id] = { r: 1, c: half.length - 1 - k + (slow + 1) }));
      T.add({ at: "cut", state: st([{ name: "slow", id: slow, role: "p1" }], [slow], rows), vars: {}, say: `Phase 2: cut after ${vals[slow]}; the second half starts at ${vals[second]}.` });
      let prev = null, cur = second;
      while (cur != null) { const nx = next[cur]; next[cur] = prev; prev = cur; cur = nx; }
      second = prev;
      T.add({ at: "rev", state: st([{ name: "second", id: second, role: "p2" }], half, rows), vars: {}, say: `Reverse it (lesson's reverseList): ${walk(next, second).map((i) => vals[i]).join(" → ")}.` });
      // phase 3: interleave
      let first = 0;
      const woven = new Set([0]);
      while (second != null) {
        const fn = next[first], sn = next[second];
        next[first] = second;
        T.add({ at: "weave", state: st([{ name: "first", id: first, role: "p1" }, { name: "second", id: second, role: "p2" }], [first], Object.fromEntries(nodes.map((n) => [n.id, Object.assign({}, rows[n.id], woven.has(n.id) ? { m: "answer" } : {})]))), vars: {}, say: `Phase 3: ${vals[first]} → ${vals[second]}.` });
        next[second] = fn; woven.add(second);
        T.add({ at: "weave2", state: st([{ name: "first", id: fn, role: "p1" }, { name: "second", id: sn, role: "p2" }], [second], Object.fromEntries(nodes.map((n) => [n.id, Object.assign({}, rows[n.id], woven.has(n.id) ? { m: "answer" } : {})]))), vars: {}, say: `${vals[second]} → ${fn == null ? "null" : vals[fn]}. Move both forward.` });
        first = fn; second = sn;
        if (first != null) woven.add(first);
      }
      const order = walk(next, 0);
      const fin = {}; order.forEach((id, k) => (fin[id] = { r: 0, c: k, m: "answer" }));
      T.add({ state: st([], [], fin), vars: { result: order.map((i) => vals[i]) }, say: `Done in place: ${order.map((i) => vals[i]).join(" → ")}. Three tools combined, \`O(n)\` time, \`O(1)\` space.` });
      return T.done(order.map((i) => vals[i]));
    },
  };

  G.quizzes.list12 = {
    title: "Which linked-list tool?",
    items: [
      { q: "Delete every node with value 7, including possibly the head.", options: ["A dummy node", "Slow and fast pointers", "Gap pointers", "Reversal"], answer: 0, why: "With a dummy in front of the head, deleting the head is just another deletion." },
      { q: "Find the middle node in one pass.", options: ["Slow and fast pointers", "A dummy node", "Gap pointers", "Recursion"], answer: 0, why: "When fast reaches the end, slow is halfway." },
      { q: "Return the 3rd node from the end in one pass.", options: ["Gap pointers", "Slow and fast pointers", "Reverse the list first", "A hash set"], answer: 0, why: "Start one pointer 3 ahead, then move both together." },
      { q: "Is this linked list a palindrome, in O(1) space?", options: ["Find the middle, reverse the second half, compare", "Copy into an array", "A hash map of values", "Recursion only"], answer: 0, why: "Two tools combined; reverse back afterwards if the list must be restored." },
      { q: "Detect whether a list has a loop without extra memory.", options: ["Slow and fast pointers (Floyd)", "A visited set", "Gap pointers", "Sort the values"], answer: 0, why: "Inside a loop, fast gains one step per round and must meet slow." },
    ],
  };
})();

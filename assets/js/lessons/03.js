/* Lesson 03 · Language toolkit — the traps and structures, animated, and a quiz. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;

  /* references: names on the left pointing at boxes on the right.
     st = { refs: [{name, to, m}], boxes: [{id, vals, m, label}], note } */
  G.viz.refs = function (scene, st) {
    const RW = 92, BX = 250, rowH = 46;
    st.refs.forEach((r, i) => G.drawCell(scene, `r:${r.name}`, 10, 16 + i * rowH, RW, 32, r.name, r.m, "kv-key"));
    const boxY = {};
    st.boxes.forEach((b, i) => {
      const y = 16 + i * rowH * (st.refs.length / Math.max(1, st.boxes.length));
      boxY[b.id] = y;
      const g = G.drawCell(scene, `b:${b.id}`, BX, y, 150, 32, "[" + b.vals.join(", ") + "]", b.m, "kv-val");
      if (b.label) G.drawText(scene, `bl:${b.id}`, BX + 160, y + 16, b.label, "lbl");
      g.style.opacity = "1";
    });
    st.refs.forEach((r, i) => {
      const y1 = 16 + i * rowH + 16, y2 = (boxY[r.to] != null ? boxY[r.to] : 0) + 16;
      G.drawLine(scene, `rl:${r.name}`, 10 + RW, y1, BX, y2, "edge ref" + (r.m ? " m-" + r.m : ""));
    });
    let h = 16 + Math.max(st.refs.length, 1) * rowH + 6;
    if (st.note) { G.drawText(scene, "note", 10, h + 6, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 26; }
    return { x: 0, y: 0, w: BX + 330, h };
  };

  A.fillTrap = {
    title: "The shared-row trap in TypeScript",
    viz: "refs", codeLang: "ts",
    legend: ["bug:all rows share one array", "answer:each row owns its array", "focus:just changed"],
    noCode: "",
    inputLabel: "(no input: this replays the snippet)", hint: "",
    presets: [{ label: "replay the snippet", input: "replay" }],
    parse: () => null,
    lines: {
      bad: { ts: "const bad = Array(3).fill([] as number[]);" },
      push: { ts: "bad[0].push(1);" },
      print: { ts: "console.log(bad); // [ [ 1 ], [ 1 ], [ 1 ] ]" },
      good: { ts: "const good = makeGrid(2, 3, 7);" },
      set: { ts: "good[0][1] = 9;" },
      print2: { ts: "console.log(good); // [ [ 7, 9, 7 ], [ 7, 7, 7 ] ]" },
    },
    trace() {
      const T = new G.Trace();
      const bad = (vals, m) => ({ refs: ["bad[0]", "bad[1]", "bad[2]"].map((name) => ({ name, to: "x", m: "bug" })), boxes: [{ id: "x", vals, m, label: "one array, three names" }] });
      T.add({ at: "bad", state: bad([]), say: "`fill([])` evaluates `[]` once and puts that same array in all three slots." });
      T.add({ at: "push", state: bad([1], "focus"), say: "`bad[0].push(1)` changes the one shared array…" });
      T.add({ at: "print", state: Object.assign(bad([1], "bug"), { note: { text: "[ [1], [1], [1] ]: every row changed", cls: "bad" } }), say: "…so every row prints `[1]`. Surprise." });
      const good = (r0, m) => ({ refs: [{ name: "good[0]", to: "g0", m: "answer" }, { name: "good[1]", to: "g1", m: "answer" }], boxes: [{ id: "g0", vals: r0, m, label: "row 0's own array" }, { id: "g1", vals: [7, 7, 7], label: "row 1's own array" }] });
      T.add({ at: "good", state: good([7, 7, 7]), say: "`Array.from({ length: rows }, () => …)` calls the function once per row, so each row gets a new array." });
      T.add({ at: "set", state: good([7, 9, 7], "focus"), say: "`good[0][1] = 9` changes only row 0." });
      T.add({ at: "print2", state: Object.assign(good([7, 9, 7]), { note: { text: "[ [7, 9, 7], [7, 7, 7] ]: correct", cls: "ok" } }), say: "Use `Array.from` (or a loop) whenever every row needs its own array." });
      return T.done(null);
    },
  };

  A.sliceAlias = {
    title: "The shared-memory trap in Go",
    viz: "array", codeLang: "go",
    legend: ["p1:a", "p2:b", "bug:overwritten by accident", "answer:a safe copy"],
    inputLabel: "(no input: this replays the snippet)", hint: "",
    presets: [{ label: "replay the snippet", input: "replay" }],
    parse: () => null,
    lines: {
      a: { go: "a := []int{1, 2, 3, 4}" }, b: { go: "b := a[:2]" }, app: { go: "b = append(b, 99) // overwrites a[2]!" },
      pr: { go: "fmt.Println(a, b) // [1 2 99 4] [1 2 99]" }, c: { go: "c := make([]int, 2)" }, cp: { go: "copy(c, a[:2])" }, app2: { go: "c = append(c, 100)" }, pr2: { go: "fmt.Println(a, c) // [1 2 99 4] [1 2 100]" },
    },
    trace() {
      const T = new G.Trace();
      const arr = [1, 2, 3, 4];
      let blen = 0, c = null;
      const st = (mk, cm) => ({
        labelW: 120, rows: [{ label: "backing array", cells: G.cells(arr), marks: mk || {}, zones: [{ key: "a", from: 0, to: 3, label: "a (len 4)", cls: "soft" }].concat(blen ? [{ key: "b", from: 0, to: blen - 1, label: `b (len ${blen}, cap 4)`, cls: "u" }] : []) }]
          .concat(c ? [{ label: "c's own array", cells: G.cells(c), marks: cm || {} }] : []),
      });
      T.add({ at: "a", state: st(), say: "`a` is a window onto a backing array of four ints." });
      blen = 2;
      T.add({ at: "b", state: st({ 0: "p2", 1: "p2" }), say: "`b := a[:2]` is a second window onto the **same** array: length 2, but capacity 4." });
      arr[2] = 99; blen = 3;
      T.add({ at: "app", state: st({ 2: "bug" }), say: "`append(b, 99)` sees spare capacity, so it writes into slot 2, which is `a[2]`." });
      T.add({ at: "pr", state: st({ 2: "bug" }), say: "`a` is now `[1 2 99 4]`. Nothing warned you." });
      c = [0, 0];
      T.add({ at: "c", state: st({ 2: "bug" }), say: "`make` gives `c` its own array." });
      c = [1, 2];
      T.add({ at: "cp", state: st({ 2: "bug" }, { 0: "answer", 1: "answer" }), say: "`copy` copies the values; `c` shares nothing with `a`." });
      c = [1, 2, 100];
      T.add({ at: "app2", state: st({ 2: "bug" }, { 2: "focus" }), say: "Appending to `c` cannot touch `a`. Copy explicitly whenever you save a slice for later (the classic case is saving a path in backtracking)." });
      T.add({ at: "pr2", state: st({ 2: "bug" }, { 0: "answer", 1: "answer", 2: "answer" }), say: "`a` stays `[1 2 99 4]`, `c` is `[1 2 100]`." });
      return T.done(null);
    },
  };

  A.letterCounts = {
    title: "Counting letters with a 26-slot array",
    viz: "array",
    legend: ["focus:current letter and its slot"],
    inputLabel: "A lowercase word", hint: "banana",
    presets: [{ label: "banana", input: "banana" }, { label: "mississippi", input: "mississippi" }],
    parse(s) { const t = String(s).trim(); if (!/^[a-z]{1,12}$/.test(t)) throw new Error("Use 1 to 12 lowercase letters a to z."); return t; },
    lines: { loop: { ts: "for (let i = 0; i < s.length; i++) counts[s.charCodeAt(i) - 97]++;", go: "counts[s[i]-'a']++" }, ret: { ts: "function letterCounts>>return counts;", go: "func letterCounts>>return counts" } },
    trace(s) {
      const T = new G.Trace();
      const counts = new Array(26).fill(0);
      const st = (i) => ({ cellW: 26, cellH: 30, gap: 3, labelW: 70, rows: [
        { label: "word", cells: s.split("").map((ch, k) => ({ id: k, v: ch })), marks: i != null ? { [i]: "focus" } : {} },
        { label: "counts", cells: counts.map((v, k) => ({ id: k, v: v || "" })), marks: i != null ? { [s.charCodeAt(i) - 97]: "focus" } : {}, zones: [{ key: "l", from: 0, to: 25, label: "slots for a … z", cls: "soft" }] },
      ] });
      T.add({ at: "loop", state: st(null), say: "26 zeros, one slot per letter. Slot = char code − 97 (the code of `a`)." });
      for (let i = 0; i < s.length; i++) {
        counts[s.charCodeAt(i) - 97]++;
        T.add({ at: "loop", state: st(i), vars: { letter: s[i], slot: s.charCodeAt(i) - 97, count: counts[s.charCodeAt(i) - 97] }, say: `\`${s[i]}\` has code ${s.charCodeAt(i)}, so slot ${s.charCodeAt(i) - 97}. Count it.` });
      }
      T.add({ at: "ret", state: st(null), vars: { a: counts[0], b: counts[1], c: counts[2] }, say: "Done in one pass, with no hashing at all. In Go a `[26]int` array can even be a map key." });
      return T.done(counts);
    },
  };

  const parseOps = (allowed) => (s) => {
    const ops = String(s).split(",").map((x) => x.trim()).filter(Boolean).map((x) => { const [op, v] = x.split(/\s+/); return { op, v }; });
    if (!ops.length || ops.length > 14) throw new Error("Give 1 to 14 operations separated by commas.");
    ops.forEach((o) => { if (!allowed.includes(o.op)) throw new Error(`Unknown operation "${o.op}". Use: ${allowed.join(", ")}.`); });
    return ops;
  };
  A.queueHead = {
    title: "A queue with a head index",
    viz: "array", codeLang: "ts",
    legend: ["p1:head (next to leave)", "done:already left (never moved)", "focus:just changed"],
    varRoles: { head: "p1", size: "answer" },
    inputLabel: "Operations", hint: "push a, push b, shift, push c, shift, shift, shift",
    presets: [{ label: "the example and more", input: "push a, push b, shift, push c, shift, shift, shift" }],
    parse: parseOps(["push", "shift"]),
    lines: { push: { ts: "this.items.push(x);" }, empty: { ts: "if (this.head >= this.items.length) return undefined;" }, shift: { ts: "return this.items[this.head++];" } },
    trace(ops) {
      const T = new G.Trace();
      const items = [];
      let head = 0;
      const st = (mk) => ({ cells: items.map((v, i) => ({ id: i, v })), marks: Object.assign(Object.fromEntries(items.map((_, i) => [i, i < head ? "done" : null]).filter((e) => e[1])), mk), ptrs: [{ name: "head", at: head, role: "p1" }], minW: 380 });
      T.add({ state: st(), vars: { head, size: 0 }, say: "An array plus a `head` index. Nothing ever shifts." });
      ops.forEach(({ op, v }) => {
        if (op === "push") { items.push(v == null ? "x" : v); T.add({ at: "push", state: st({ [items.length - 1]: "focus" }), vars: { head, size: items.length - head }, say: `push(${v}): append at the end, \`O(1)\`.` }); }
        else if (head >= items.length) T.add({ at: "empty", state: st(), vars: { head, size: 0, returned: "undefined" }, say: "The queue is empty: return `undefined`." });
        else { const x = items[head++]; T.add({ at: "shift", state: st({ [head - 1]: "focus" }), vars: { head, size: items.length - head, returned: x }, say: `shift(): return \`${x}\` and move \`head\` forward. Still \`O(1)\`: no item moved.` }); }
      });
      return T.done(items.slice(head));
    },
  };

  A.minHeap = {
    title: "A min-heap: push sifts up, pop sifts down",
    viz: "heap", codeLang: "ts",
    legend: ["focus:moving item", "anchor:compared with", "answer:popped (the smallest)"],
    inputLabel: "Operations", hint: "push 5, push 1, push 4, push 2, pop, pop",
    presets: [{ label: "the lesson's example", input: "push 5, push 1, push 4, push 2, pop, pop" }, { label: "push 7 values, pop 3", input: "push 9, push 4, push 7, push 1, push 8, push 2, push 6, pop, pop, pop" }],
    parse(s) { const ops = parseOps(["push", "pop"])(s); ops.forEach((o) => { if (o.op === "push") { const v = Number(o.v); if (!Number.isFinite(v)) throw new Error("push needs a number, like push 5."); o.v = v; } }); return ops; },
    lines: {
      push: { ts: "this.data.push(item);" }, parent: { ts: "const parent = (i - 1) >> 1;" }, stopUp: { ts: "if (!this.less(this.data[i], this.data[parent])) break;" },
      swapUp: { ts: "[this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];" }, top: { ts: "const top = this.data[0];" }, last: { ts: "this.data[0] = last;" },
      pick: { ts: "if (r < this.data.length && this.less(this.data[r], this.data[smallest])) smallest = r;" }, stopDown: { ts: "if (smallest === i) break;" },
      swapDown: { ts: "[this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];" }, ret: { ts: "return top;" },
    },
    trace(ops) {
      const T = new G.Trace();
      let data = [];
      let uid = 0;
      const popped = [];
      const st = (mk) => ({ items: data.slice(), marks: mk || {}, panels: [{ title: "popped so far", entries: popped.map((v, k) => [`#${k + 1}`, v]), empty: "(none)" }] });
      const sw = (i, j) => { [data[i], data[j]] = [data[j], data[i]]; };
      ops.forEach(({ op, v }) => {
        if (op === "push") {
          data.push({ id: uid++, v });
          let i = data.length - 1;
          T.add({ at: "push", state: st({ [i]: "focus" }), vars: { pushed: v, size: data.length }, say: `push(${v}): put it at the end, the next free spot in the bottom row.` });
          while (i > 0) {
            const parent = (i - 1) >> 1;
            const up = data[i].v < data[parent].v;
            T.add({ at: up ? "parent" : "stopUp", state: st({ [i]: "focus", [parent]: "anchor" }), vars: { i, parent }, say: up ? `${data[i].v} < its parent ${data[parent].v}: they are in the wrong order.` : `${data[i].v} ≥ its parent ${data[parent].v}: in place. Stop.`, ask: { q: `${data[i].v} vs its parent ${data[parent].v}: swap?`, options: ["Swap and keep sifting up", "Stop: the heap is valid"], answer: up ? 0 : 1, why: "Every parent must be ≤ its children." } });
            if (!up) break;
            sw(i, parent);
            T.add({ at: "swapUp", state: st({ [parent]: "focus" }), vars: { i: parent }, say: `Swap: ${data[parent].v} moves up to index ${parent}.` });
            i = parent;
          }
        } else {
          if (!data.length) { T.add({ state: st(), say: "pop on an empty heap returns `undefined`." }); return; }
          const top = data[0];
          T.add({ at: "top", state: st({ 0: "answer" }), vars: { top: top.v, size: data.length }, say: `pop(): the smallest is always at the root: ${top.v}.` });
          const last = data.pop();
          popped.push(top.v);
          if (!data.length) { T.add({ at: "ret", state: st(), vars: { returned: top.v }, say: `That was the only item. Return ${top.v}.` }); return; }
          data[0] = last;
          T.add({ at: "last", state: st({ 0: "focus" }), vars: { returned: top.v }, say: `Move the last item, ${last.v}, to the root. Now sift it down.` });
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = 2 * i + 2;
            let smallest = i;
            if (l < data.length && data[l].v < data[smallest].v) smallest = l;
            if (r < data.length && data[r].v < data[smallest].v) smallest = r;
            const kids = [l, r].filter((k) => k < data.length);
            const mk = { [i]: "focus" }; kids.forEach((k) => (mk[k] = "anchor"));
            T.add({ at: smallest === i ? "stopDown" : "pick", state: st(mk), vars: { i, smallest }, say: !kids.length ? `${data[i].v} has no children. Stop.` : smallest === i ? `${data[i].v} is ≤ its children. Stop.` : `The smaller child is ${data[smallest].v}, smaller than ${data[i].v}: swap with it.` });
            if (smallest === i) break;
            sw(i, smallest);
            T.add({ at: "swapDown", state: st({ [smallest]: "focus" }), vars: { i: smallest }, say: `Swap: ${data[smallest].v} sinks to index ${smallest}.` });
            i = smallest;
          }
          T.add({ at: "ret", state: st(), vars: { returned: top.v }, say: `Return ${top.v}. Each push or pop walks one root-to-leaf path: \`O(log n)\`.` });
        }
      });
      return T.done({ popped, heap: data.map((x) => x.v) });
    },
  };

  G.quizzes.toolkit03 = {
    title: "TypeScript or Go?",
    intro: "Each gotcha bites in one language. Pick where.",
    items: [
      { q: "`[10, 9, 1].sort()` returns `[1, 10, 9]`.", options: ["TypeScript", "Go", "Both", "Neither"], answer: 0, why: "The default JavaScript sort compares values as text. Always pass `(a, b) => a - b`." },
      { q: "Map iteration order changes from run to run.", options: ["Go", "TypeScript", "Both", "Neither"], answer: 0, why: "Go randomizes map iteration on purpose. TypeScript `Map` keeps insertion order." },
      { q: "Reading a missing key gives `0` instead of an error or `undefined`.", options: ["Go", "TypeScript", "Both", "Neither"], answer: 0, why: "Go returns the zero value. Use `v, ok := m[k]` when 0 is a valid stored value." },
      { q: "`1 << 31` is negative.", options: ["TypeScript", "Go", "Both", "Neither"], answer: 0, why: "JavaScript bit operators work on 32-bit integers." },
      { q: "Popping from an empty slice or array crashes the program.", options: ["Go", "TypeScript", "Both", "Neither"], answer: 0, why: "Go panics with index out of range. TypeScript `pop()` returns `undefined`." },
      { q: "`[1, 2]` and `[1, 2]` are two different keys in a map.", options: ["TypeScript", "Go", "Both", "Neither"], answer: 0, why: "`Map` compares objects by identity. In Go, arrays like `[2]int` compare by value and work as keys (slices cannot be keys at all)." },
      { q: "`-7 % 3` is `-1`, not `2`.", options: ["Both", "TypeScript", "Go", "Neither"], answer: 0, why: "In both languages the sign of `%` follows the left operand. Use `((a % b) + b) % b` for a positive result." },
    ],
  };
})();

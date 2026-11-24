/* Lesson 10 · Recursion and the call stack — animators and quizzes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  // A recursion recorder: each call is a node in a call tree, the live calls form the stack.
  function recorder() {
    const nodes = [], stack = [];
    let id = 0, calls = 0;
    return {
      nodes, stack,
      get calls() { return calls; },
      enter(label, parent) { calls++; const n = { id: id++, label, parent, m: "focus" }; nodes.forEach((x) => { if (x.m === "focus") x.m = "anchor"; }); nodes.push(n); stack.push(label); return n; },
      leave(n, value) { n.m = null; n.sub = `= ${value}`; stack.pop(); const parent = nodes.find((x) => x.id === n.parent); if (parent) parent.m = "focus"; },
      state(extra) { return Object.assign({ nodes: nodes.map((x) => Object.assign({}, x)), stack: stack.slice() }, extra); },
    };
  }

  /* ---------------- factorial and sumList ---------------- */
  A.factorial = {
    title: "The call stack, one sticky note per call", short: "factorial(n)",
    viz: "tree", legend: ["focus:the running call (top of the stack)", "anchor:waiting for the call below"],
    varRoles: { depth: "focus" },
    inputLabel: "n (0 to 8)", hint: "4",
    presets: [{ label: "factorial(3)", input: "3" }, { label: "factorial(5)", input: "5" }],
    parse(s) { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 0 || n > 8) throw new Error("Pick n from 0 to 8."); return n; },
    lines: { base: { ts: "if (n <= 1) return 1; // base case", go: "return 1 // base case (also protects against n = 0)" }, rec: { ts: "return n * factorial(n - 1);", go: "return n * factorial(n-1)" } },
    trace(n0) {
      const T = new G.Trace();
      const R = recorder();
      function f(n, parent) {
        const me = R.enter(`factorial(${n})`, parent);
        if (n <= 1) { T.add({ at: "base", state: R.state(), vars: { n, depth: R.stack.length }, say: `factorial(${n}) is the base case: return 1. Its note comes off the top of the stack.` }); R.leave(me, 1); return 1; }
        T.add({ at: "rec", state: R.state(), vars: { n, depth: R.stack.length }, say: `factorial(${n}) needs factorial(${n - 1}) first. Its note stays on the stack, waiting, with n = ${n} saved.` });
        const r = n * f(n - 1, me.id);
        R.leave(me, r);
        T.add({ at: "rec", state: R.state(), vars: { n, returned: r, depth: R.stack.length }, say: `Back in factorial(${n}): ${n} × ${r / n} = ${r}. Return it to the call below.` });
        return r;
      }
      const r = f(n0, null);
      T.add({ state: R.state(), vars: { result: r, "max depth": Math.max(1, n0) }, say: `factorial(${n0}) = ${r}. The stack was ${Math.max(1, n0)} notes deep at its peak: \`O(n)\` memory with no arrays at all.` });
      return T.done(r);
    },
  };
  A.sumList = {
    title: "The call stack, one sticky note per call", short: "sumList(list)",
    viz: "tree", legend: ["focus:the running call", "anchor:waiting"],
    inputLabel: "numbers", hint: "2 4 6",
    presets: [{ label: "[2,4,6] (the trace table)", input: "2 4 6" }, { label: "five numbers", input: "1 2 3 4 5" }],
    table: { id: "tbl-3", preset: 0, rows: ["c0", "c1", "c2", "c3"] },
    parse: (s) => P.nums(s, { allowEmpty: true, maxLen: 6, min: -99, max: 99 }),
    lines: { base: { ts: "if (start === list.length) return 0; // base case: nothing left", go: "return 0 // base case: nothing left" }, rec: { ts: "return list[start] + sumList(list, start + 1);", go: "return list[0] + sumList(list[1:])" } },
    trace(list) {
      const T = new G.Trace();
      const R = recorder();
      function f(k, parent) {
        const me = R.enter(`[${list.slice(k).join(",")}]`, parent);
        if (k === list.length) { T.add({ at: "base", key: `c${k}`, state: R.state({ colW: 92 }), vars: { depth: R.stack.length }, say: "The empty list: base case, return 0." }); R.leave(me, 0); return 0; }
        T.add({ at: "rec", key: `c${k}`, state: R.state({ colW: 92 }), vars: { depth: R.stack.length }, say: `${list[k]} + sumList of the rest. Trust the call to return the right sum.` });
        const r = list[k] + f(k + 1, me.id);
        R.leave(me, r);
        T.add({ at: "rec", key: `c${k}`, state: R.state({ colW: 92 }), vars: { returned: r }, say: `${list[k]} + ${r - list[k]} = ${r}.` });
        return r;
      }
      const r = f(0, null);
      return T.done(r);
    },
  };

  /* ---------------- Pow ---------------- */
  A.myPow = {
    title: "Pow(x, n): halve the exponent",
    viz: "tree", legend: ["focus:running", "anchor:waiting"],
    inputLabel: "x ; n", hint: "2 ; 10",
    presets: [{ label: "2^10", input: "2 ; 10" }, { label: "2^-2", input: "2 ; -2" }, { label: "3^13", input: "3 ; 13" }],
    parse(s) { const [x, n] = P.parts(s, 2, 'Write x, then ";" and n').map((v) => P.num(v)); if (!Number.isInteger(n) || Math.abs(n) > 64) throw new Error("n: a whole number from −64 to 64."); return { x, n }; },
    lines: { neg: { ts: "if (n < 0) return 1 / myPow(x, -n);", go: "return 1 / myPow(x, -n)" }, base: { ts: "if (n === 0) return 1; // base case", go: "func myPow>>return 1 // base case" }, half: { ts: "const half = myPow(x, Math.floor(n / 2)); // compute the half ONCE", go: "half := myPow(x, n/2) // compute the half ONCE" }, ret: { ts: "return n % 2 === 0 ? half * half : half * half * x;", go: "if n%2 == 0 {" } },
    trace({ x, n: n0 }) {
      const T = new G.Trace();
      const R = recorder();
      const fmt = (v) => (Number.isInteger(v) ? v : +v.toPrecision(6));
      function f(n, parent) {
        const me = R.enter(`pow(${x}, ${n})`, parent);
        if (n < 0) { T.add({ at: "neg", state: R.state(), vars: { n }, say: `A negative exponent: compute pow(${x}, ${-n}) and take 1 over it.` }); const r = 1 / f(-n, me.id); R.leave(me, fmt(r)); T.add({ at: "neg", state: R.state(), vars: { result: fmt(r) }, say: `1 / ${fmt(1 / r)} = ${fmt(r)}.` }); return r; }
        if (n === 0) { T.add({ at: "base", state: R.state(), vars: { n }, say: "n = 0: return 1." }); R.leave(me, 1); return 1; }
        T.add({ at: "half", state: R.state(), vars: { n }, say: `pow(${x}, ${n}) needs pow(${x}, ${Math.floor(n / 2)}) once.` });
        const h = f(Math.floor(n / 2), me.id);
        const r = n % 2 === 0 ? h * h : h * h * x;
        R.leave(me, fmt(r));
        T.add({ at: "ret", state: R.state(), vars: { half: fmt(h), result: fmt(r) }, say: n % 2 === 0 ? `${n} is even: ${fmt(h)}² = ${fmt(r)}.` : `${n} is odd: ${fmt(h)}² × ${x} = ${fmt(r)}.` });
        return r;
      }
      const r = f(n0, null);
      T.add({ state: R.state(), vars: { result: fmt(r), calls: R.calls }, say: `${R.calls} calls instead of ${Math.abs(n0)} multiplications: \`O(log n)\`. Computing the half twice would undo that.` });
      return T.done(fmt(r));
    },
  };

  /* ---------------- Pascal ---------------- */
  A.pascal = {
    title: "Pascal's Triangle: trust the smaller call, then add one row",
    viz: "grid", legend: ["focus:being added", "anchor:the two numbers above it"],
    inputLabel: "numRows (1 to 7)", hint: "5",
    presets: [{ label: "5 rows", input: "5" }, { label: "7 rows", input: "7" }],
    parse(s) { const n = P.num(s, "numRows"); if (!Number.isInteger(n) || n < 0 || n > 7) throw new Error("0 to 7 rows."); return n; },
    lines: { base: { ts: "if (numRows === 0) return []; // base case", go: "return [][]int{} // base case" }, rec: { ts: "const rows = generatePascal(numRows - 1);", go: "rows := generatePascal(numRows - 1)" }, sum: { ts: "for (let i = 1; i < prev.length; i++) row.push(prev[i - 1] + prev[i]);", go: "row = append(row, prev[i-1]+prev[i])" }, push: { ts: "rows.push(row);", go: "return append(rows, row)" } },
    trace(N) {
      const T = new G.Trace();
      const rows = [];
      const grid = (mk) => ({ cell: 34, cells: Array.from({ length: Math.max(1, N) }, (_, r) => Array.from({ length: Math.max(1, N) }, (_, c) => ({ v: rows[r] && rows[r][c] != null ? rows[r][c] : "", m: (mk && mk[`${r},${c}`]) || (rows[r] && rows[r][c] != null ? null : "ghost") }))), rowLabels: Array.from({ length: Math.max(1, N) }, (_, r) => `row ${r + 1}`) });
      for (let k = N; k >= 1; k--) T.add({ at: "rec", state: grid(), vars: { call: `pascal(${k})` }, say: `pascal(${k}) first asks for pascal(${k - 1}), and trusts it.` });
      T.add({ at: "base", state: grid(), vars: { call: "pascal(0)" }, say: "pascal(0) returns no rows: the base case. Now the calls return one by one, each adding a row." });
      for (let k = 1; k <= N; k++) {
        const prev = rows[k - 2] || [];
        const row = [1];
        rows.push(row);
        for (let i = 1; i < prev.length; i++) { row.push(prev[i - 1] + prev[i]); T.add({ at: "sum", state: grid({ [`${k - 1},${i}`]: "focus", [`${k - 2},${i - 1}`]: "anchor", [`${k - 2},${i}`]: "anchor" }), vars: { row: k }, say: `${prev[i - 1]} + ${prev[i]} = ${row[i]}.` }); }
        if (prev.length) row.push(1);
        T.add({ at: "push", state: grid(), vars: { row: k, rows: rows.length }, say: `pascal(${k}) adds row ${k}: [${row.join(", ")}].` });
      }
      return T.done(rows.map((r) => r.slice()));
    },
  };

  /* ---------------- flatten ---------------- */
  A.flatten = {
    title: "Flatten a Nested List: a box inside a box",
    viz: "tree", legend: ["focus:the box being opened", "anchor:waiting for an inner box"],
    inputLabel: "a nested list", hint: "[1, [2, [3, 4]], 5]",
    presets: [{ label: "[1, [2, [3, 4]], 5]", input: "[1, [2, [3, 4]], 5]" }, { label: "deeper", input: "[[1], [[2]], [[[3]]], 4]" }],
    parse(s) { let v; try { v = JSON.parse(s); } catch (e) { throw new Error("Write it like [1, [2, 3]]."); } const ok = (x) => (Array.isArray(x) ? x.length <= 6 && x.every(ok) : Number.isInteger(x)); if (!Array.isArray(v) || !ok(v)) throw new Error("A list of whole numbers and lists (up to 6 items each)."); return v; },
    lines: { keep: { ts: 'if (typeof item === "number") out.push(item); // a key: keep it', go: "out = append(out, v) // a key: keep it" }, box: { ts: "else out.push(...flatten(item)); // a smaller box", go: "out = append(out, flatten(v)...) // a smaller box" }, ret: { ts: "function flatten>>return out;", go: "func flatten>>return out" } },
    trace(list) {
      const T = new G.Trace();
      const R = recorder();
      const out = [];
      const lab = (x) => JSON.stringify(x).replace(/,/g, ", ");
      function f(items, parent) {
        const me = R.enter(lab(items), parent);
        items.forEach((it) => {
          if (typeof it === "number") { out.push(it); T.add({ at: "keep", state: R.state({ colW: 110, note: { text: `output: [${out.join(", ")}]` } }), vars: { item: it }, say: `${it} is a number (a key): keep it.` }); }
          else { T.add({ at: "box", state: R.state({ colW: 110, note: { text: `output: [${out.join(", ")}]` } }), vars: { item: lab(it) }, say: `${lab(it)} is a smaller box: do the same thing to it.` }); f(it, me.id); }
        });
        R.leave(me, "✓");
        T.add({ at: "ret", state: R.state({ colW: 110, note: { text: `output: [${out.join(", ")}]` } }), vars: { depth: R.stack.length }, say: `Box ${lab(items)} is done.` });
      }
      f(list, null);
      return T.done(out.slice());
    },
  };

  /* ---------------- decode string ---------------- */
  A.decodeString = {
    title: "Decode String: a bracket is a smaller copy of the problem",
    viz: "array", legend: ["focus:position i", "p1:inside the current brackets"],
    inputLabel: "an encoded string", hint: "3[a2[c]]",
    presets: [{ label: "2[a3[b]] (the trace table)", input: "2[a3[b]]" }, { label: "3[a2[c]]", input: "3[a2[c]]" }, { label: "2[abc]3[cd]ef", input: "2[abc]3[cd]ef" }],
    table: { id: "tbl-4", preset: 0, rows: ["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7"] },
    parse(s) { const t = String(s).trim(); if (!/^[a-z0-9\[\]]{1,16}$/.test(t)) throw new Error("Letters, digits and brackets, up to 16 characters."); let d = 0; for (const c of t) { d += c === "[" ? 1 : c === "]" ? -1 : 0; if (d < 0) throw new Error("Brackets do not match."); } if (d) throw new Error("Brackets do not match."); return t; },
    lines: { digit: { ts: "count = count * 10 + Number(ch);", go: "count = count*10 + int(ch-'0')" }, open: { ts: "const inner = parse(); // a smaller copy", go: "inner := parse() // a smaller copy" }, rep: { ts: "result += inner.repeat(count);", go: "sb.WriteString(strings.Repeat(inner, count))" }, close: { ts: "return result; // this level is finished", go: "return sb.String() // this level is finished" }, letter: { ts: "result += ch;", go: "sb.WriteByte(ch)" } },
    trace(s) {
      const T = new G.Trace();
      let i = 0;
      const frames = []; // [{result, count}]
      const st = () => ({ cellW: 36, cells: G.cells(s.split("")), marks: i < s.length ? { [i]: "focus" } : {}, ptrs: [{ name: "i", at: Math.min(i, s.length - 1), role: "focus", hidden: i >= s.length }], panels: [{ title: "call stack: level → partial result (count)", entries: frames.map((f, k) => [`level ${k}`, `"${f.result}" (${f.count})`]), valW: 150 }] });
      function parse() {
        frames.push({ result: "", count: 0 });
        const me = frames[frames.length - 1];
        while (i < s.length) {
          const ch = s[i];
          const key = `p${i}`;
          if (ch >= "0" && ch <= "9") { me.count = me.count * 10 + Number(ch); T.add({ at: "digit", key, state: st(), vars: { count: me.count }, say: `Digit ${ch}: count = ${me.count}.` }); i++; }
          else if (ch === "[") { T.add({ at: "open", key, state: st(), vars: { depth: frames.length }, say: "`[`: a smaller copy of the same problem starts. Call parse() for the inside." }); i++; const inner = parse(); me.result += inner.repeat(me.count); T.add({ at: "rep", key: `p${i - 1}`, state: st(), vars: { inner, count: me.count }, say: `Back one level: append "${inner}" × ${me.count}. Now "${me.result}".` }); me.count = 0; }
          else if (ch === "]") { T.add({ at: "close", key, state: st(), vars: { returned: me.result }, say: `\`]\`: this level is finished. Return "${me.result}".` }); i++; frames.pop(); return me.result; }
          else { me.result += ch; T.add({ at: "letter", key, state: st(), vars: { result: me.result }, say: `Letter ${ch}: append. "${me.result}".` }); i++; }
        }
        frames.pop();
        return me.result;
      }
      const r = parse();
      T.add({ state: Object.assign(st(), { note: { text: `"${r}"`, cls: "ok" } }), vars: { result: r }, say: `Decoded: "${r}". The stack was as deep as the brackets are nested.` });
      return T.done(r);
    },
  };

  /* ---------------- Tower of Hanoi ---------------- */
  G.viz.hanoi = function (scene, st) {
    const pegX = { A: 110, B: 320, C: 530 }, base = 260, H = 32, n = st.n;
    ["A", "B", "C"].forEach((p) => {
      G.drawLine(scene, `peg${p}`, pegX[p], base - (n + 1) * H - 6, pegX[p], base, "edge peg");
      G.drawText(scene, `pl${p}`, pegX[p], base + 16, p, "lbl", "middle");
      st.pegs[p].forEach((d, k) => {
        const w = 44 + (d / n) * 150;
        const g = scene.el(`d${d}`, "g", "mid");
        if (g.__fresh) { G.svgEl("rect", { rx: 8 }, g); G.svgEl("text", { "text-anchor": "middle", "dominant-baseline": "central" }, g); }
        g.setAttribute("class", "cell disk" + (st.moving === d ? " m-focus" : ""));
        G.attr(g.children[0], { width: w, height: H - 4, x: -w / 2 });
        G.attr(g.children[1], { x: 0, y: (H - 4) / 2 });
        G.setText(g.children[1], d);
        G.place(g, pegX[p], base - (k + 1) * H);
      });
    });
    G.drawLine(scene, "ground", 20, base, 620, base, "edge");
    return { x: 0, y: 0, w: 640, h: base + 26 };
  };
  A.hanoi = {
    title: "Tower of Hanoi: trust the function",
    viz: "hanoi", legend: ["focus:the disk that just moved"],
    varRoles: { moves: "answer" },
    inputLabel: "disks (1 to 6)", hint: "3",
    presets: [{ label: "3 disks", input: "3" }, { label: "4 disks", input: "4" }],
    parse(s) { const n = P.num(s, "disks"); if (!Number.isInteger(n) || n < 1 || n > 6) throw new Error("1 to 6 disks."); return n; },
    lines: { base: { ts: "if (n === 0) return moves; // base case: nothing to move", go: "return // base case: nothing to move" }, park: { ts: "hanoi(n - 1, from, spare, to, moves); // park", go: "hanoi(n-1, from, spare, to, moves)" }, move: { ts: "moves.push(`${from}->${to}`); // move the biggest disk", go: "*moves = append(*moves, from+\"->\"+to)" }, bring: { ts: "hanoi(n - 1, spare, to, from, moves); // bring", go: "hanoi(n-1, spare, to, from, moves)" } },
    trace(N) {
      const T = new G.Trace();
      const pegs = { A: Array.from({ length: N }, (_, i) => N - i), B: [], C: [] };
      const moves = [];
      const st = (moving) => ({ n: N, pegs: { A: pegs.A.slice(), B: pegs.B.slice(), C: pegs.C.slice() }, moving });
      T.add({ state: st(), vars: { moves: 0 }, say: `Move all ${N} disks from A to C, one at a time, never a bigger disk on a smaller one.` });
      function h(n, from, to, spare, depth) {
        if (n === 0) return;
        if (n > 1) T.add({ at: "park", state: st(), vars: { call: `hanoi(${n}, ${from}→${to})`, moves: moves.length }, say: `To move ${n} disks ${from}→${to}: first park the top ${n - 1} on ${spare}. Trust the call.` });
        h(n - 1, from, spare, to, depth + 1);
        const d = pegs[from].pop(); pegs[to].push(d); moves.push(`${from}->${to}`);
        T.add({ at: "move", state: st(d), vars: { call: `hanoi(${n}, ${from}→${to})`, moves: moves.length }, say: `Move disk ${d}: ${from} → ${to}.` });
        if (n > 1) T.add({ at: "bring", state: st(), vars: { moves: moves.length }, say: `Now bring the ${n - 1} parked disks from ${spare} onto ${to}.` });
        h(n - 1, spare, to, from, depth + 1);
      }
      h(N, "A", "C", "B", 0);
      T.add({ state: st(), vars: { moves: moves.length, "2^n − 1": 2 ** N - 1 }, say: `${moves.length} moves = 2^${N} − 1. Each extra disk doubles the work plus one.` });
      return T.done(moves);
    },
  };

  G.quizzes.recur10 = {
    title: "Spot the recursion bug",
    items: [
      { q: "`function f(n) { return n * f(n - 1); }`", options: ["No base case: it never stops", "It computes the wrong value", "It is fine", "It should be a loop"], answer: 0, why: "Every recursive function needs a base case, such as `if (n <= 1) return 1`." },
      { q: "`const half = pow(x, n / 2) * pow(x, n / 2);`", options: ["The same call twice: back to O(n)", "Wrong for negative n only", "It is the fast version", "Stack overflow"], answer: 0, why: "Compute the half once and square it to keep O(log n)." },
      { q: "`function sum(list) { if (!list.length) return 0; return list[0] + sum(list.slice(1)); }` on a long list in TypeScript.", options: ["O(n²) copying, and the stack may overflow", "It is O(n) and fine", "It returns the wrong sum", "slice is free"], answer: 0, why: "`slice` copies the rest every call. Pass an index; for very long lists, use a loop." },
      { q: "A recursive tree walk crashes on a 200,000-node chain in JavaScript.", options: ["Stack overflow: switch to an explicit stack", "The tree is invalid", "Use more memory", "Recursion is always wrong for trees"], answer: 0, why: "The JS stack holds roughly ten thousand frames; an explicit stack has no such limit." },
      { q: "`function f(n) { if (n === 0) return 0; f(n - 1) + 1; }`", options: ["The recursive result is never returned", "Missing base case", "It is fine", "It recurses on a bigger input"], answer: 0, why: "The value is computed and dropped; the function returns `undefined`." },
    ],
  };
})();

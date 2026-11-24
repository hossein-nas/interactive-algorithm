/* Lesson 15 · Trees and BST — "ask each child", traversals, and the classic problems. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;

  const parseLevel = (s) => {
    const t = String(s).replace(/[\[\],]/g, " ").trim().split(/\s+/).filter(Boolean);
    if (!t.length || t.length > 15) throw new Error("A level-order list of up to 15 entries, with null for gaps.");
    return t.map((x) => { if (x === "null") return null; const v = Number(x); if (!Number.isInteger(v) || Math.abs(v) > 99) throw new Error(`"${x}" is not a whole number or null.`); return v; });
  };
  const snap = (T, extra) => Object.assign({ nodes: T.nodes, root: T.root }, extra);
  const clone = (T) => ({ root: T.root, nodes: Object.fromEntries(Object.entries(T.nodes).map(([k, v]) => [k, Object.assign({}, v)])) });

  /* ---------------- Problem 1 ---------------- */
  A.maxDepth = {
    title: "Ask each child", short: "Maximum depth",
    viz: "btree", legend: ["focus:the call running now", "anchor:waiting for its children", "answer:returned (its depth below)"],
    inputLabel: "tree, level order", hint: "3 9 20 null null 15 7",
    presets: [{ label: "[3,9,20,null,null,15,7]", input: "3 9 20 null null 15 7" }, { label: "a left chain", input: "1 2 null 3 null 4" }],
    parse: parseLevel,
    lines: { base: { ts: "if (root === null) return 0; // base case", go: "return 0 // base case" }, ret: { ts: "return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));", go: "return 1 + max(maxDepth(root.Left), maxDepth(root.Right))" } },
    trace(vals) {
      const Tr = new G.Trace();
      const T = G.btreeFromLevel(vals);
      const marks = {}, sub = {};
      const st = () => snap(T, { marks: Object.assign({}, marks), sub: Object.assign({}, sub) });
      function f(n) {
        if (n == null) return 0;
        marks[n] = "focus";
        Tr.add({ at: "base", state: st(), vars: { node: T.nodes[n].v }, say: `At ${T.nodes[n].v}: ask the left child and the right child for their depths. Trust both.` });
        marks[n] = "anchor";
        const l = f(T.nodes[n].l), r = f(T.nodes[n].r);
        const d = 1 + Math.max(l, r);
        marks[n] = "answer"; sub[n] = d;
        Tr.add({ at: "ret", state: st(), vars: { node: T.nodes[n].v, left: l, right: r, depth: d }, say: `${T.nodes[n].v}: 1 + max(${l}, ${r}) = ${d}. (A missing child answers 0.)` });
        return d;
      }
      const d = f(T.root);
      return Tr.done(d);
    },
  };
  A.invertTree = {
    title: "Ask each child", short: "Invert the tree",
    viz: "btree", legend: ["focus:being inverted", "answer:done"],
    inputLabel: "tree, level order", hint: "4 2 7 1 3 6 9",
    presets: [{ label: "[4,2,7,1,3,6,9]", input: "4 2 7 1 3 6 9" }, { label: "[2,1,3]", input: "2 1 3" }],
    parse: parseLevel,
    lines: { base: { ts: "function invertTree>>if (root === null) return null;", go: "func invertTree>>return nil" }, left: { ts: "const left = invertTree(root.left);", go: "left := invertTree(root.Left)" }, swap: { ts: "root.left = right; // swap", go: "root.Left, root.Right = right, left // swap" } },
    trace(vals) {
      const Tr = new G.Trace();
      const T = G.btreeFromLevel(vals);
      const marks = {};
      const st = () => snap(clone(T), { marks: Object.assign({}, marks) });
      function f(n) {
        if (n == null) return null;
        marks[n] = "focus";
        Tr.add({ at: "left", state: st(), vars: { node: T.nodes[n].v }, say: `At ${T.nodes[n].v}: invert both subtrees first.` });
        const l = f(T.nodes[n].l), r = f(T.nodes[n].r);
        T.nodes[n].l = r; T.nodes[n].r = l; marks[n] = "answer";
        Tr.add({ at: "swap", state: st(), vars: { node: T.nodes[n].v }, say: `Swap ${T.nodes[n].v}'s children: the whole subtrees trade places.` });
        return n;
      }
      f(T.root);
      const out = [], q = [T.root];
      for (let h = 0; h < q.length; h++) { const n = q[h]; if (n == null) { out.push(null); continue; } out.push(T.nodes[n].v); q.push(T.nodes[n].l, T.nodes[n].r); }
      while (out.length && out[out.length - 1] == null) out.pop();
      return Tr.done(out);
    },
  };

  /* ---------------- Problem 2 ---------------- */
  A.inorderRec = {
    title: "Inorder traversal", short: "Recursive",
    viz: "btree", legend: ["focus:the current call", "answer:visited"],
    inputLabel: "tree, level order", hint: "1 null 2 3",
    presets: [{ label: "[1,null,2,3]", input: "1 null 2 3" }, { label: "a BST: sorted order", input: "4 2 6 1 3 5 7" }],
    parse: parseLevel,
    lines: { left: { ts: "inorderRecursive(root.left, out);", go: "inorderRecursive(root.Left, out)" }, visit: { ts: "out.push(root.val); // visit", go: "*out = append(*out, root.Val)" }, right: { ts: "inorderRecursive(root.right, out);", go: "inorderRecursive(root.Right, out)" } },
    trace(vals) {
      const Tr = new G.Trace();
      const T = G.btreeFromLevel(vals);
      const marks = {}, out = [];
      const st = (cur) => snap(T, { marks: Object.assign({}, marks, cur != null ? { [cur]: "focus" } : {}), note: { text: `out: [${out.join(", ")}]` } });
      function f(n) {
        if (n == null) return;
        Tr.add({ at: "left", state: st(n), vars: { node: T.nodes[n].v }, say: `At ${T.nodes[n].v}: left subtree first.` });
        f(T.nodes[n].l);
        out.push(T.nodes[n].v); marks[n] = "answer";
        Tr.add({ at: "visit", state: st(n), vars: { out: out.slice() }, say: `Visit ${T.nodes[n].v}, between its two subtrees.` });
        f(T.nodes[n].r);
        if (T.nodes[n].r != null) Tr.add({ at: "right", state: st(n), vars: {}, say: `${T.nodes[n].v}'s right subtree is done.` });
      }
      f(T.root);
      return Tr.done(out);
    },
  };
  A.inorderIter = {
    title: "Inorder traversal", short: "Iterative, with a stack",
    viz: "btree", legend: ["p2:cur", "anchor:on the stack", "answer:visited"],
    inputLabel: "tree, level order", hint: "1 null 2 3",
    presets: [{ label: "[1,null,2,3] (the trace table)", input: "1 null 2 3" }, { label: "a BST", input: "4 2 6 1 3 5 7" }],
    parse: parseLevel,
    lines: { push: { ts: "stack.push(cur); // keep going left", go: "stack = append(stack, cur) // keep going left" }, pop: { ts: "cur = stack.pop()!; // nothing further left", go: "cur = stack[len(stack)-1] // nothing further left" }, visit: { ts: "function inorderIterative>>out.push(cur.val);", go: "func inorderIterative>>out = append(out, cur.Val)" }, right: { ts: "cur = cur.right; // then handle", go: "cur = cur.Right // then handle" } },
    trace(vals) {
      const Tr = new G.Trace();
      const T = G.btreeFromLevel(vals);
      const marks = {}, out = [], stack = [];
      let cur = T.root, step = 0;
      const st = () => { const m = Object.assign({}, marks); stack.forEach((n) => (m[n] = "anchor")); return snap(T, { marks: m, ptrs: [{ name: "cur", id: cur, role: "p2" }], panels: [{ title: "stack (top first)", entries: stack.map((n, k) => [`#${k}`, T.nodes[n].v]).reverse(), empty: "(empty)", keyW: 34, valW: 40 }], note: { text: `out: [${out.join(", ")}]` } }); };
      while (cur != null || stack.length) {
        while (cur != null) { stack.push(cur); Tr.add({ at: "push", state: st(), vars: {}, say: `Push ${T.nodes[cur].v} and go left. The stack remembers the way back.` }); cur = T.nodes[cur].l; }
        cur = stack.pop();
        Tr.add({ at: "pop", state: st(), vars: {}, say: `Nothing further left: pop ${T.nodes[cur].v}. It is the next smallest.` });
        out.push(T.nodes[cur].v); marks[cur] = "answer";
        Tr.add({ at: "visit", state: st(), vars: { out: out.slice() }, say: `Visit ${T.nodes[cur].v}.` });
        cur = T.nodes[cur].r;
        Tr.add({ at: "right", state: st(), vars: {}, say: cur == null ? "No right child." : `Go to the right child, ${T.nodes[cur].v}.` });
      }
      return Tr.done(out);
    },
  };

  /* ---------------- Problem 3 ---------------- */
  A.levelOrder = {
    title: "Level Order Traversal: one level at a time",
    viz: "btree", legend: ["focus:the level being read", "anchor:the next level", "answer:done"],
    inputLabel: "tree, level order", hint: "3 9 20 null null 15 7",
    presets: [{ label: "[3,9,20,null,null,15,7]", input: "3 9 20 null null 15 7" }, { label: "a full tree", input: "1 2 3 4 5 6 7" }],
    parse: parseLevel,
    lines: { level: { ts: "const level: number[] = [];", go: "size := len(queue)" }, visit: { ts: "level.push(node.val);", go: "level = append(level, node.Val)" }, push: { ts: "result.push(level);", go: "result = append(result, level)" } },
    trace(vals) {
      const Tr = new G.Trace();
      const T = G.btreeFromLevel(vals);
      const marks = {}, result = [];
      let queue = T.root == null ? [] : [T.root];
      const st = (next) => { const m = Object.assign({}, marks); queue.forEach((n) => (m[n] = "focus")); (next || []).forEach((n) => (m[n] = "anchor")); return snap(T, { marks: m, note: { text: `result: ${JSON.stringify(result)}` } }); };
      while (queue.length) {
        const level = [], next = [];
        Tr.add({ at: "level", state: st(), vars: { "nodes on this level": queue.length }, say: `This level has ${queue.length} node${queue.length === 1 ? "" : "s"}. Read them all; collect their children for the next level.` });
        queue.forEach((n) => { level.push(T.nodes[n].v); if (T.nodes[n].l != null) next.push(T.nodes[n].l); if (T.nodes[n].r != null) next.push(T.nodes[n].r); Tr.add({ at: "visit", state: st(next), vars: { level: level.slice() }, say: `Read ${T.nodes[n].v}; queue its children.` }); });
        result.push(level); queue.forEach((n) => (marks[n] = "answer"));
        queue = next;
        Tr.add({ at: "push", state: st(), vars: { levels: result.length }, say: `Level done: [${level.join(", ")}].` });
      }
      return Tr.done(result);
    },
  };

  /* ---------------- Problem 4 ---------------- */
  A.validBST = {
    title: "Validate BST: every node lives inside a window",
    viz: "btree", legend: ["focus:being checked", "answer:inside its window", "bug:outside its window"],
    inputLabel: "tree, level order", hint: "5 1 4 null null 3 6",
    presets: [{ label: "[2,1,3] valid", input: "2 1 3" }, { label: "[5,1,4,null,null,3,6] invalid", input: "5 1 4 null null 3 6" }, { label: "the deep trap [5,4,6,null,null,3,7]", input: "5 4 6 null null 3 7" }],
    parse: parseLevel,
    lines: { nil: { ts: "if (root === null) return true;", go: "return true // an empty tree" }, bad: { ts: "if (root.val <= lo || root.val >= hi) return false;", go: "return false // outside the allowed window" }, rec: { ts: "return isValidBST(root.left, lo, root.val) && isValidBST(root.right, root.val, hi);", go: "return isValidBST(root.Left, lo, root.Val) && isValidBST(root.Right, root.Val, hi)" } },
    trace(vals) {
      const Tr = new G.Trace();
      const T = G.btreeFromLevel(vals);
      const marks = {}, sub = {};
      const f = (x) => (x === -Infinity ? "−∞" : x === Infinity ? "+∞" : x);
      const st = () => snap(T, { marks: Object.assign({}, marks), sub: Object.assign({}, sub) });
      function go(n, lo, hi) {
        if (n == null) return true;
        const v = T.nodes[n].v;
        sub[n] = `(${f(lo)}, ${f(hi)})`;
        marks[n] = "focus";
        const ok = !(v <= lo || v >= hi);
        Tr.add({ at: "bad", state: st(), vars: { node: v, lo: f(lo), hi: f(hi) }, say: `${v} must be strictly between ${f(lo)} and ${f(hi)}.`, ask: { q: `Is ${v} inside (${f(lo)}, ${f(hi)})?`, options: ["Yes", "No: not a BST"], answer: ok ? 0 : 1, why: ok ? "It fits every ancestor's limit, not just its parent's." : `${v} breaks a limit set by an ancestor.` } });
        if (!ok) { marks[n] = "bug"; Tr.add({ at: "bad", state: st(), vars: {}, say: `${v} is outside its window: return \`false\`.` }); return false; }
        marks[n] = "answer";
        Tr.add({ at: "rec", state: st(), vars: {}, say: `Left children must stay below ${v}; right children above it.` });
        return go(T.nodes[n].l, lo, v) && go(T.nodes[n].r, v, hi);
      }
      const r = go(T.root, -Infinity, Infinity);
      Tr.add({ state: st(), vars: { valid: r }, say: r ? "Every node fits its window: a valid BST." : "Not a valid BST." });
      return Tr.done(r);
    },
  };
  A.kthSmallest = {
    title: "Kth Smallest in a BST: stop the inorder walk early",
    viz: "btree", legend: ["p2:cur", "anchor:on the stack", "answer:counted"],
    inputLabel: "BST level order ; k", hint: "5 3 6 2 4 null null 1 ; 3",
    presets: [{ label: "[3,1,4,null,2], k = 1", input: "3 1 4 null 2 ; 1" }, { label: "[5,3,6,2,4,null,null,1], k = 3", input: "5 3 6 2 4 null null 1 ; 3" }],
    parse(s) { const [a, k] = String(s).split(";"); const vals = parseLevel(a); const kk = Number(k); const n = vals.filter((x) => x != null).length; if (!Number.isInteger(kk) || kk < 1 || kk > n) throw new Error(`k from 1 to ${n}.`); return { vals, k: kk }; },
    lines: { push: { ts: "function kthSmallest>>stack.push(cur);", go: "func kthSmallest>>stack = append(stack, cur)" }, pop: { ts: "function kthSmallest>>cur = stack.pop()!;", go: "func kthSmallest>>cur = stack[len(stack)-1]" }, hit: { ts: "if (--k === 0) return cur.val;", go: "return cur.Val // the k-th node" }, right: { ts: "function kthSmallest>>cur = cur.right;", go: "func kthSmallest>>cur = cur.Right" } },
    trace({ vals, k }) {
      const Tr = new G.Trace();
      const T = G.btreeFromLevel(vals);
      const marks = {}, stack = [];
      let cur = T.root, count = 0;
      const st = () => { const m = Object.assign({}, marks); stack.forEach((n) => (m[n] = "anchor")); return snap(T, { marks: m, ptrs: [{ name: "cur", id: cur, role: "p2" }], note: { text: `counted ${count} of ${k}` } }); };
      while (cur != null || stack.length) {
        while (cur != null) { stack.push(cur); Tr.add({ at: "push", state: st(), vars: {}, say: `Push ${T.nodes[cur].v}, go left.` }); cur = T.nodes[cur].l; }
        cur = stack.pop(); count++; marks[cur] = "answer";
        Tr.add({ at: count === k ? "hit" : "pop", state: st(), vars: { count }, say: count === k ? `${T.nodes[cur].v} is the ${k}-th smallest: stop here. \`O(h + k)\` work.` : `${T.nodes[cur].v} is number ${count} in sorted order.` });
        if (count === k) return Tr.done(T.nodes[cur].v);
        cur = T.nodes[cur].r;
        Tr.add({ at: "right", state: st(), vars: {}, say: "Then its right subtree." });
      }
      return Tr.done(null);
    },
  };

  /* ---------------- Problem 5 ---------------- */
  A.lca = {
    title: "Lowest Common Ancestor: pass found targets upward",
    viz: "btree", legend: ["focus:the call", "p1:p", "p2:q", "answer:the LCA"],
    inputLabel: "tree ; p ; q (values)", hint: "3 5 1 6 2 0 8 null null 7 4 ; 5 ; 1",
    presets: [{ label: "p = 5, q = 1", input: "3 5 1 6 2 0 8 null null 7 4 ; 5 ; 1" }, { label: "p = 5, q = 4 (one is the ancestor)", input: "3 5 1 6 2 0 8 null null 7 4 ; 5 ; 4" }, { label: "p = 7, q = 0", input: "3 5 1 6 2 0 8 null null 7 4 ; 7 ; 0" }],
    parse(s) { const [a, p, q] = String(s).split(";"); const vals = parseLevel(a); const pv = Number(p), qv = Number(q); const have = vals.filter((x) => x != null); if (new Set(have).size !== have.length) throw new Error("Values must be distinct."); if (!have.includes(pv) || !have.includes(qv)) throw new Error("p and q must be values in the tree."); return { vals, p: pv, q: qv }; },
    lines: { base: { ts: "if (root === null || root === p || root === q) return root;", go: "return root // found a target (or ran out)" }, both: { ts: "if (left !== null && right !== null) return root;", go: "return root // targets are on different sides" }, pass: { ts: "return left ?? right;", go: "return left // otherwise pass up" } },
    trace({ vals, p, q }) {
      const Tr = new G.Trace();
      const T = G.btreeFromLevel(vals);
      const marks = {}, sub = {};
      const idOf = (v) => Object.keys(T.nodes).find((k) => T.nodes[k].v === v);
      const pid = idOf(p), qid = idOf(q);
      const st = (cur, fin) => snap(T, { marks: Object.assign({ [pid]: "p1", [qid]: "p2" }, marks, cur != null ? { [cur]: "focus" } : {}, fin != null ? { [fin]: "answer" } : {}), sub: Object.assign({}, sub) });
      function go(n) {
        if (n == null) return null;
        const v = T.nodes[n].v;
        if (n == pid || n == qid) { sub[n] = `→ ${v}`; Tr.add({ at: "base", state: st(n), vars: { node: v }, say: `${v} is a target: return it upward without looking below.` }); return n; }
        Tr.add({ at: "base", state: st(n), vars: { node: v }, say: `${v}: ask both children what they found.` });
        const l = go(T.nodes[n].l), r = go(T.nodes[n].r);
        if (l != null && r != null) { sub[n] = "LCA"; Tr.add({ at: "both", state: st(n), vars: { node: v }, say: `Both sides found a target, so ${v} is the lowest common ancestor.` }); return n; }
        const up = l != null ? l : r;
        sub[n] = up != null ? `→ ${T.nodes[up].v}` : "→ null";
        Tr.add({ at: "pass", state: st(n), vars: { node: v, returns: up != null ? T.nodes[up].v : "null" }, say: up != null ? `Only one side found something: pass ${T.nodes[up].v} up.` : "Neither side found anything: return null." });
        return up;
      }
      const ans = go(T.root);
      Tr.add({ state: st(null, ans), vars: { lca: T.nodes[ans].v }, say: `The answer: ${T.nodes[ans].v}. One pass over the tree, \`O(n)\`.` });
      return Tr.done(T.nodes[ans].v);
    },
  };

  /* ---------------- Problem 6 ---------------- */
  A.buildPreIn = {
    title: "Build a tree from preorder and inorder",
    viz: "btree", legend: ["focus:the root just created", "answer:built"],
    inputLabel: "preorder ; inorder", hint: "3 9 20 15 7 ; 9 3 15 20 7",
    presets: [{ label: "the lesson's example", input: "3 9 20 15 7 ; 9 3 15 20 7" }, { label: "a left chain", input: "1 2 3 ; 3 2 1" }],
    parse(s) { const [a, b] = String(s).split(";"); const pre = G.parse.nums(a, { minLen: 1, maxLen: 9 }), ino = G.parse.nums(b, { minLen: 1, maxLen: 9 }); if (new Set(pre).size !== pre.length || pre.length !== ino.length || [...pre].sort().join() !== [...ino].sort().join()) throw new Error("Both lists must hold the same distinct values."); return { pre, ino }; },
    lines: { empty: { ts: "if (inLo > inHi) return null;", go: "return nil // empty range: no subtree" }, root: { ts: "const rootVal = preorder[preIdx++];", go: "rootVal := preorder[preIdx]" }, left: { ts: "root.left = build(inLo, mid - 1);", go: "root.Left = build(inLo, mid-1)" }, right: { ts: "root.right = build(mid + 1, inHi);", go: "root.Right = build(mid+1, inHi)" } },
    trace({ pre, ino }) {
      const Tr = new G.Trace();
      const T = { nodes: {}, root: null };
      const marks = {};
      let preIdx = 0, id = 0;
      const st = (lo, hi, cur) => snap(clone(T), { marks: Object.assign({}, marks, cur != null ? { [cur]: "focus" } : {}), note: { text: `preorder next: ${pre.slice(preIdx).join(" ") || "(used up)"} · inorder range [${ino.slice(lo, hi + 1).join(" ")}]` } });
      function build(lo, hi, parent, side) {
        if (lo > hi) return null;
        const v = pre[preIdx++];
        const n = id++;
        T.nodes[n] = { v, l: null, r: null };
        if (parent == null) T.root = n; else T.nodes[parent][side] = n;
        const mid = ino.indexOf(v);
        Tr.add({ at: "root", state: st(lo, hi, n), vars: { root: v, "inorder position": mid }, say: `The next preorder value, ${v}, is this subtree's root. In inorder it sits at ${mid}: [${ino.slice(lo, mid).join(" ")}] goes left, [${ino.slice(mid + 1, hi + 1).join(" ")}] goes right.` });
        marks[n] = "answer";
        Tr.add({ at: "left", state: st(lo, mid - 1), vars: {}, say: "Build the left subtree first, because preorder lists the left side before the right." });
        build(lo, mid - 1, n, "l");
        Tr.add({ at: "right", state: st(mid + 1, hi), vars: {}, say: `Now ${v}'s right subtree.` });
        build(mid + 1, hi, n, "r");
        return n;
      }
      build(0, ino.length - 1, null, null);
      const out = [], q = [T.root];
      for (let h = 0; h < q.length; h++) { const n = q[h]; if (n == null) { out.push(null); continue; } out.push(T.nodes[n].v); q.push(T.nodes[n].l, T.nodes[n].r); }
      while (out.length && out[out.length - 1] == null) out.pop();
      return Tr.done(out);
    },
  };

  /* ---------------- Problem 7 ---------------- */
  A.maxPathSum = {
    title: "Binary Tree Maximum Path Sum",
    viz: "btree", legend: ["focus:the call", "answer:gain returned upward (below)"],
    varRoles: { best: "answer" },
    inputLabel: "tree, level order", hint: "-10 9 20 null null 15 7",
    presets: [{ label: "[-10,9,20,null,null,15,7] (the trace table)", input: "-10 9 20 null null 15 7" }, { label: "[1,2,3]", input: "1 2 3" }, { label: "all negative", input: "-3 -1 -2" }],
    parse: parseLevel,
    lines: { gainL: { ts: "const leftGain = Math.max(0, gain(node.left));", go: "leftGain := max(0, gain(node.Left))" }, best: { ts: "best = Math.max(best, node.val + leftGain + rightGain);", go: "best = max(best, node.Val+leftGain+rightGain)" }, ret: { ts: "return node.val + Math.max(leftGain, rightGain);", go: "return node.Val + max(leftGain, rightGain)" } },
    trace(vals) {
      const Tr = new G.Trace();
      const T = G.btreeFromLevel(vals);
      const marks = {}, sub = {};
      let best = -Infinity;
      const st = (cur) => snap(T, { marks: Object.assign({}, marks, cur != null ? { [cur]: "focus" } : {}), sub: Object.assign({}, sub), note: { text: `best path so far: ${best === -Infinity ? "−∞" : best}` } });
      function gain(n) {
        if (n == null) return 0;
        Tr.add({ at: "gainL", state: st(n), vars: { node: T.nodes[n].v }, say: `${T.nodes[n].v}: get the best downward gain from each child (negative gains count as 0).` });
        const l = Math.max(0, gain(T.nodes[n].l)), r = Math.max(0, gain(T.nodes[n].r));
        const through = T.nodes[n].v + l + r;
        best = Math.max(best, through);
        Tr.add({ at: "best", state: st(n), vars: { node: T.nodes[n].v, leftGain: l, rightGain: r, best }, say: `A path that bends at ${T.nodes[n].v}: ${l} + ${T.nodes[n].v} + ${r} = ${through}. best = ${best}.` });
        const g = T.nodes[n].v + Math.max(l, r);
        sub[n] = g; marks[n] = "answer";
        Tr.add({ at: "ret", state: st(n), vars: { returns: g }, say: `Upward, a path can only continue down ONE side: return ${T.nodes[n].v} + max(${l}, ${r}) = ${g}.` });
        return g;
      }
      gain(T.root);
      return Tr.done(best);
    },
  };

  G.quizzes.tree15 = {
    title: "Which traversal or template?",
    items: [
      { q: "Print a BST's values in sorted order.", options: ["Inorder", "Preorder", "Postorder", "Level order"], answer: 0, why: "Left subtree, node, right subtree visits a BST in increasing order." },
      { q: "Copy a tree (create each node before its children).", options: ["Preorder", "Inorder", "Postorder", "Level order"], answer: 0, why: "The parent must exist before its children are attached." },
      { q: "Compute each subtree's size (children before the parent).", options: ["Postorder (ask each child, then combine)", "Preorder", "Inorder", "Level order"], answer: 0, why: "A node's answer depends on its children's answers." },
      { q: "The rightmost node of every level.", options: ["Level order (BFS)", "Inorder", "Preorder", "A heap"], answer: 0, why: "Read each level fully; keep its last node." },
      { q: "Checking only `left.val < node.val < right.val` at each node validates a BST.", options: ["False: every node must respect all its ancestors' limits", "True", "True only for balanced trees", "True only without duplicates"], answer: 0, why: "Try [5,4,6,null,null,3,7]: 3 sits in 5's right subtree." },
    ],
  };
})();

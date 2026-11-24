/* Lesson 16 · Balanced trees — sorted array to BST, balance checks, delete, and AVL rotations. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  // a mutable tree whose nodes keep their ids, so rotations glide in the picture
  function Tree() { this.nodes = {}; this.root = null; this.id = 0; }
  Tree.prototype.make = function (v) { const n = this.id++; this.nodes[n] = { v, l: null, r: null, h: 1 }; return n; };
  Tree.prototype.snap = function (extra) { return Object.assign({ nodes: Object.fromEntries(Object.entries(this.nodes).map(([k, x]) => [k, Object.assign({}, x)])), root: this.root }, extra); };
  const height = (T, n) => (n == null ? 0 : 1 + Math.max(height(T, T.nodes[n].l), height(T, T.nodes[n].r)));
  const levelOf = (T) => { const out = [], q = [T.root]; for (let h = 0; h < q.length; h++) { const n = q[h]; if (n == null) { out.push(null); continue; } out.push(T.nodes[n].v); q.push(T.nodes[n].l, T.nodes[n].r); } while (out.length && out[out.length - 1] == null) out.pop(); return out; };

  // the generic rotation: x, y and the three subtrees A < x < B < y < C
  A.rotate = {
    title: "A rotation rewires three links", short: "Rotation",
    viz: "btree", legend: ["p1:x", "p2:y", "focus:the inner subtree B, which changes parent"],
    inputLabel: "direction: right or left", hint: "right",
    presets: [{ label: "rotate right at y", input: "right" }, { label: "rotate left at x", input: "left" }],
    parse(s) { const t = String(s).trim().toLowerCase(); if (t !== "right" && t !== "left") throw new Error('Type "right" or "left".'); return t; },
    lines: { up: { ts: "const x = y.left!; // x moves up", go: "x := y.Left // x moves up" }, inner: { ts: "y.left = x.right; // x's inner subtree becomes y's left", go: "y.Left = x.Right // x's inner subtree becomes y's left" }, down: { ts: "x.right = y; // y moves down", go: "x.Right = y      // y moves down" }, ref: { ts: "refreshHeight(y); // y first: it is now lower than x", go: "refreshHeight(y) // y first: it is now lower than x" }, ret: { ts: "return x; // the new root of this subtree", go: "return x // the new root of this subtree" },
      upL: { ts: "const y = x.right!; // y moves up", go: "y := x.Right // y moves up" }, innerL: { ts: "function rotateLeft>>x.right = y.left;", go: "x.Right = y.Left" }, downL: { ts: "function rotateLeft>>y.left = x;", go: "y.Left = x" }, retL: { ts: "function rotateLeft>>return y;", go: "func rotateLeft>>return y" } },
    trace(dir) {
      const Tr = new G.Trace();
      // ids: 0 y, 1 x, 2 A, 3 B, 4 C
      const R = dir === "right";
      const nodes = R ? { 0: { v: "y", l: 1, r: 4 }, 1: { v: "x", l: 2, r: 3 }, 2: { v: "A", l: null, r: null }, 3: { v: "B", l: null, r: null }, 4: { v: "C", l: null, r: null } }
                      : { 1: { v: "x", l: 2, r: 0 }, 0: { v: "y", l: 3, r: 4 }, 2: { v: "A", l: null, r: null }, 3: { v: "B", l: null, r: null }, 4: { v: "C", l: null, r: null } };
      let root = R ? 0 : 1;
      const st = (b, roots) => ({ nodes: G.copy(nodes), root, roots, marks: Object.assign({ 0: "p2", 1: "p1" }, b ? { 3: "focus" } : {}), note: { text: "in order: A < x < B < y < C" } });
      if (R) {
        Tr.add({ at: "up", state: st(), vars: {}, say: "y is too heavy on the left. Its left child x will move up." });
        nodes[0].l = 3; Tr.add({ at: "inner", state: st(true, [1, 0]), vars: {}, say: "B holds values between x and y, so it can hang under y on the left. For a moment x is held only by the variable x." });
        nodes[1].r = 0; root = 1; Tr.add({ at: "down", state: st(), vars: {}, say: "y becomes x's right child. x is the top now." });
        Tr.add({ at: "ref", state: st(), vars: {}, say: "Refresh heights, y first because it is now below x." });
        Tr.add({ at: "ret", state: st(), vars: { returns: "x" }, say: "Return x so the parent reattaches the subtree. The in-order sequence A x B y C did not change." });
      } else {
        Tr.add({ at: "upL", state: st(), vars: {}, say: "x is too heavy on the right. Its right child y will move up." });
        nodes[1].r = 3; Tr.add({ at: "innerL", state: st(true, [1, 0]), vars: {}, say: "B holds values between x and y, so it can hang under x on the right. For a moment y is held only by the variable y." });
        nodes[0].l = 1; root = 0; Tr.add({ at: "downL", state: st(), vars: {}, say: "x becomes y's left child. y is the top now." });
        Tr.add({ at: "retL", state: st(), vars: { returns: "y" }, say: "Return y. Mirror image of the right rotation; the order A x B y C still holds." });
      }
      return Tr.done(R ? "x" : "y");
    },
  };

  A.sortedToBST = {
    title: "Sorted array to a height-balanced BST",
    viz: "btree", legend: ["focus:the middle, made the root of this range", "answer:built"],
    inputLabel: "sorted numbers", hint: "-10 -3 0 5 9",
    presets: [{ label: "[-10,-3,0,5,9]", input: "-10 -3 0 5 9" }, { label: "1..7", input: "1 2 3 4 5 6 7" }],
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 9, sorted: true, min: -99, max: 99 }),
    lines: { mid: { ts: "const mid = lo + Math.floor((hi - lo) / 2); // the middle becomes the root", go: "mid := lo + (hi-lo)/2 // the middle becomes the root" }, node: { ts: "return new TreeNode(nums[mid], build(lo, mid - 1), build(mid + 1, hi));", go: "return &TreeNode{Val: nums[mid], Left: build(lo, mid-1), Right: build(mid+1, hi)}" } },
    trace(nums) {
      const Tr = new G.Trace();
      const T = new Tree();
      const marks = {};
      const st = (lo, hi, cur) => T.snap({ marks: Object.assign({}, marks, cur != null ? { [cur]: "focus" } : {}), note: { text: `range [${nums.slice(lo, hi + 1).join(", ")}]` } });
      function build(lo, hi, parent, side) {
        if (lo > hi) return null;
        const mid = lo + Math.floor((hi - lo) / 2);
        const n = T.make(nums[mid]);
        if (parent == null) T.root = n; else T.nodes[parent][side] = n;
        Tr.add({ at: "mid", state: st(lo, hi, n), vars: { lo, hi, mid, root: nums[mid] }, say: `Range [${nums.slice(lo, hi + 1).join(", ")}]: its middle, ${nums[mid]}, becomes the root, so both sides get about half.` });
        marks[n] = "answer";
        build(lo, mid - 1, n, "l"); build(mid + 1, hi, n, "r");
        Tr.add({ at: "node", state: st(lo, hi), vars: {}, say: `Subtree rooted at ${nums[mid]} is done.` });
        return n;
      }
      build(0, nums.length - 1, null, null);
      Tr.add({ state: st(0, nums.length - 1), vars: { height: height(T, T.root) }, say: `Height ${height(T, T.root)} for ${nums.length} values: about log₂ n.` });
      return Tr.done(levelOf(T));
    },
  };

  A.isBalanced = {
    title: "Balanced Binary Tree: height, or −1 for failure",
    viz: "btree", legend: ["focus:the call", "answer:balanced (height below)", "bug:unbalanced"],
    inputLabel: "tree, level order", hint: "1 2 2 3 3 null null 4 4",
    presets: [{ label: "[3,9,20,null,null,15,7] balanced", input: "3 9 20 null null 15 7" }, { label: "[1,2,2,3,3,null,null,4,4] not", input: "1 2 2 3 3 null null 4 4" }, { label: "a chain", input: "1 2 null 3" }],
    parse(s) { const t = String(s).replace(/[\[\],]/g, " ").trim().split(/\s+/); if (t.length > 15) throw new Error("Up to 15 entries."); return t.map((x) => (x === "null" ? null : Number(x))); },
    lines: { zero: { ts: "function isBalanced>>if (node === null) return 0;", go: "func isBalanced>>return 0" }, up: { ts: "if (left === -1) return -1; // bad news travels up", go: "return -1 // bad news travels up" }, fail: { ts: "if (Math.abs(left - right) > 1) return -1;", go: "return -1 // this node is unbalanced" }, ret: { ts: "return 1 + Math.max(left, right);", go: "func isBalanced>>return 1 + max(left, right)" } },
    trace(vals) {
      const Tr = new G.Trace();
      const T = G.btreeFromLevel(vals);
      const marks = {}, sub = {};
      const st = (cur) => ({ nodes: T.nodes, root: T.root, marks: Object.assign({}, marks, cur != null ? { [cur]: "focus" } : {}), sub: Object.assign({}, sub) });
      function h(n) {
        if (n == null) return 0;
        Tr.add({ at: "zero", state: st(n), vars: { node: T.nodes[n].v }, say: `${T.nodes[n].v}: get each child's height (−1 means "already unbalanced below").` });
        const l = h(T.nodes[n].l);
        if (l === -1) { marks[n] = "bug"; sub[n] = "−1"; Tr.add({ at: "up", state: st(n), vars: {}, say: "The left side failed: pass −1 straight up." }); return -1; }
        const r = h(T.nodes[n].r);
        if (r === -1) { marks[n] = "bug"; sub[n] = "−1"; Tr.add({ at: "up", state: st(n), vars: {}, say: "The right side failed: pass −1 up." }); return -1; }
        if (Math.abs(l - r) > 1) { marks[n] = "bug"; sub[n] = "−1"; Tr.add({ at: "fail", state: st(n), vars: { left: l, right: r }, say: `Heights ${l} and ${r} differ by more than 1: ${T.nodes[n].v} is unbalanced.` }); return -1; }
        marks[n] = "answer"; sub[n] = `h ${1 + Math.max(l, r)}`;
        Tr.add({ at: "ret", state: st(n), vars: { left: l, right: r }, say: `Heights ${l} and ${r}: balanced here. Height ${1 + Math.max(l, r)}.` });
        return 1 + Math.max(l, r);
      }
      const r = h(T.root) !== -1;
      Tr.add({ state: st(null), vars: { balanced: r }, say: r ? "Balanced. One pass, `O(n)`, because each node returns its height instead of recomputing it." : "Not balanced." });
      return Tr.done(r);
    },
  };

  A.deleteBST = {
    title: "Delete Node in a BST: three cases",
    viz: "btree", legend: ["focus:being visited", "bug:being deleted", "anchor:the in-order successor"],
    inputLabel: "values to insert ; keys to delete", hint: "5 3 6 2 4 7 ; 3 5",
    presets: [{ label: "the lesson's example", input: "5 3 6 2 4 7 ; 3 5" }, { label: "delete a leaf, then one child", input: "8 4 12 2 6 10 14 ; 2 4" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'Values to insert, then ";" and keys to delete'); const ins = P.nums(a, { minLen: 1, maxLen: 10, min: -99, max: 99 }); if (new Set(ins).size !== ins.length) throw new Error("Insert distinct values."); return { ins, del: P.nums(b, { allowEmpty: true, maxLen: 4, min: -99, max: 99 }) }; },
    lines: { goL: { ts: "if (key < root.val) root.left = deleteNode(root.left, key);", go: "root.Left = deleteNode(root.Left, key)" }, goR: { ts: "else if (key > root.val) root.right = deleteNode(root.right, key);", go: "root.Right = deleteNode(root.Right, key)" }, notfound: { ts: "if (root === null) return null; // key not found", go: "return nil // key not found" }, one: { ts: "if (root.left === null) return root.right;", go: "return root.Right // 0 or 1 child" }, oneL: { ts: "if (root.right === null) return root.left;", go: "return root.Left // 1 child" }, succ: { ts: "while (successor.left !== null) successor = successor.left;", go: "successor = successor.Left" }, copy: { ts: "root.val = successor.val; // copy its value up", go: "root.Val = successor.Val" }, insert: { ts: "function insertBST>>if (root === null) return new TreeNode(val);", go: "return &TreeNode{Val: val}" } },
    trace({ ins, del }) {
      const Tr = new G.Trace();
      const T = new Tree();
      const ins1 = (n, v) => { if (n == null) return T.make(v); if (v < T.nodes[n].v) T.nodes[n].l = ins1(T.nodes[n].l, v); else T.nodes[n].r = ins1(T.nodes[n].r, v); return n; };
      ins.forEach((v) => (T.root = ins1(T.root, v)));
      const st = (mk) => T.snap({ marks: mk || {} });
      Tr.add({ at: "insert", state: st(), vars: {}, say: `Start from the BST built by inserting ${ins.join(", ")}.` });
      function rm(n, key) {
        if (n == null) { Tr.add({ at: "notfound", state: st(), vars: { key }, say: `${key} is not in the tree.` }); return null; }
        const x = T.nodes[n];
        if (key < x.v) { Tr.add({ at: "goL", state: st({ [n]: "focus" }), vars: { key }, say: `${key} < ${x.v}: go left.` }); x.l = rm(x.l, key); return n; }
        if (key > x.v) { Tr.add({ at: "goR", state: st({ [n]: "focus" }), vars: { key }, say: `${key} > ${x.v}: go right.` }); x.r = rm(x.r, key); return n; }
        if (x.l == null) { Tr.add({ at: "one", state: st({ [n]: "bug" }), vars: {}, say: `Found ${key}. It has no left child: replace it by its right child${x.r == null ? " (nothing: it was a leaf)" : ""}.` }); delete T.nodes[n]; return x.r; }
        if (x.r == null) { Tr.add({ at: "oneL", state: st({ [n]: "bug" }), vars: {}, say: `Found ${key}. Only a left child: replace it by that child.` }); delete T.nodes[n]; return x.l; }
        let s = x.r;
        while (T.nodes[s].l != null) s = T.nodes[s].l;
        Tr.add({ at: "succ", state: st({ [n]: "bug", [s]: "anchor" }), vars: { successor: T.nodes[s].v }, say: `Found ${key}, with two children. Its in-order successor is the smallest node of its right subtree: ${T.nodes[s].v}.` });
        x.v = T.nodes[s].v;
        Tr.add({ at: "copy", state: st({ [n]: "focus", [s]: "anchor" }), vars: {}, say: `Copy ${x.v} up into this node. Now delete the original ${x.v} from the right subtree (it has at most one child).` });
        x.r = rm(x.r, x.v);
        return n;
      }
      del.forEach((k) => { T.root = rm(T.root, k); Tr.add({ state: st(), vars: { deleted: k }, say: `After deleting ${k}. The BST rule still holds everywhere.` }); });
      return Tr.done(levelOf(T));
    },
  };

  function avlTrace(vals, plain) {
    const Tr = new G.Trace();
    const T = new Tree();
    const hOf = (n) => (n == null ? 0 : T.nodes[n].h);
    const refresh = (n) => (T.nodes[n].h = 1 + Math.max(hOf(T.nodes[n].l), hOf(T.nodes[n].r)));
    const bf = (n) => hOf(T.nodes[n].l) - hOf(T.nodes[n].r);
    // the picture shows true heights and balances, so the labels never look stale
    const subs = () => plain ? {} : Object.fromEntries(Object.keys(T.nodes).map((k) => { const x = T.nodes[k]; const b = height(T, x.l) - height(T, x.r); return [k, `b ${b > 0 ? "+" : ""}${b}`]; }));
    const st = (mk) => T.snap({ marks: mk || {}, sub: subs(), note: { text: `height ${height(T, T.root)} for ${Object.keys(T.nodes).length} node${Object.keys(T.nodes).length > 1 ? "s" : ""}` } });
    const rotR = (y) => { const x = T.nodes[y].l; T.nodes[y].l = T.nodes[x].r; T.nodes[x].r = y; refresh(y); refresh(x); return x; };
    const rotL = (x) => { const y = T.nodes[x].r; T.nodes[x].r = T.nodes[y].l; T.nodes[y].l = x; refresh(x); refresh(y); return y; };
    function ins(n, v, link) {
      if (n == null) { const m = T.make(v); link(m); Tr.add({ key: "i" + v, at: plain ? null : "new", state: st({ [m]: "focus" }), vars: { inserted: v }, say: plain ? `Insert ${v}: walk down by comparing and attach it as a leaf. Height ${height(T, T.root)}.` : `Insert ${v} as a new leaf. Now walk back up, refreshing each height and checking each balance.` }); return m; }
      const x = T.nodes[n];
      if (v < x.v) ins(x.l, v, (c) => (x.l = c));
      else if (v > x.v) ins(x.r, v, (c) => (x.r = c));
      else return n;
      if (plain) return n;
      refresh(n);
      const b = bf(n);
      if (b <= 1 && b >= -1) return n;
      const left = b > 1;
      const zig = left ? v > T.nodes[x.l].v : v < T.nodes[x.r].v;
      const kind = left ? (zig ? "LR" : "LL") : zig ? "RL" : "RR";
      Tr.add({ key: "bal", at: "bal", flow: ["A", "B", left ? "C" : "D"], state: st({ [n]: "bug" }), vars: { node: x.v, balance: b }, say: `${x.v} has balance ${b > 0 ? "+" : ""}${b}: ${left ? "left" : "right"}-heavy. The new value went to the ${zig ? "inner" : "outer"} side: the ${kind} case.`,
        ask: { q: `Balance ${b > 0 ? "+" : ""}${b} at ${x.v}, and ${v} went ${left ? "left" : "right"} then ${(left ? !zig : zig) ? "left" : "right"}. Which fix comes next?`, options: ["Rotate right at this node (LL)", "Rotate left at this node (RR)", "First rotate the left child left (LR)", "First rotate the right child right (RL)"], answer: { LL: 0, RR: 1, LR: 2, RL: 3 }[kind], why: zig ? "A zig-zag must be straightened into a line before the single rotation can fix it." : "A straight line: one rotation lifts the middle node." } });
      if (kind === "LR") { x.l = rotL(x.l); Tr.add({ key: "straight", at: "lr", flow: ["C", "F"], state: st({ [n]: "bug", [x.l]: "focus" }), vars: {}, say: `Straighten the zig-zag: rotate ${T.nodes[T.nodes[x.l].l].v} left, so ${T.nodes[x.l].v} moves up. Now it is a straight left line: the LL case.` }); }
      if (kind === "RL") { x.r = rotR(x.r); Tr.add({ key: "straight", at: "rl", flow: ["D", "H"], state: st({ [n]: "bug", [x.r]: "focus" }), vars: {}, say: `Straighten the zig-zag: rotate ${T.nodes[T.nodes[x.r].r].v} right, so ${T.nodes[x.r].v} moves up. Now it is a straight right line: the RR case.` }); }
      const nr = left ? rotR(n) : rotL(n);
      link(nr);
      Tr.add({ key: "rot", at: left ? "ll" : "rr", flow: [left ? "C" : "D", { LL: "E", LR: "F", RR: "G", RL: "H" }[kind]], state: st({ [nr]: "focus" }), vars: { "new subtree root": T.nodes[nr].v }, say: `Rotate ${left ? "right" : "left"} at ${x.v}: ${T.nodes[nr].v} moves up, ${x.v} moves down to its ${left ? "right" : "left"}, and the inner subtree changes sides. Balanced again; height ${height(T, T.root)}.` });
      return nr;
    }
    vals.forEach((v) => { ins(T.root, v, (c) => (T.root = c)); });
    Tr.add({ state: st(), vars: { height: height(T, T.root) }, say: plain ? `Done: height ${height(T, T.root)} for ${vals.length} values. Sorted input makes a chain.` : `Done: height ${height(T, T.root)} for ${vals.length} values. Every balance is −1, 0 or +1.` });
    return Tr.done({ inorder: (function io(n, o) { if (n == null) return o; io(T.nodes[n].l, o); o.push(T.nodes[n].v); io(T.nodes[n].r, o); return o; })(T.root, []), height: height(T, T.root), level: levelOf(T) });
  }
  const avlLines = {
    new: { ts: "if (node === null) return new AVLNode(val);", go: "return &AVLNode{Val: val, Height: 1}" },
    bal: { ts: "const balance = balanceFactor(node);", go: "balance := balanceFactor(node)" },
    lr: { ts: "if (val > node.left!.val) node.left = rotateLeft(node.left!);", go: "node.Left = rotateLeft(node.Left)" },
    ll: { ts: "return rotateRight(node); // LL case", go: "return rotateRight(node) // LL case" },
    rl: { ts: "if (val < node.right!.val) node.right = rotateRight(node.right!);", go: "node.Right = rotateRight(node.Right)" },
    rr: { ts: "return rotateLeft(node); // RR case", go: "return rotateLeft(node) // RR case" },
  };
  const parseAvl = (s) => { const a = P.nums(s, { minLen: 1, maxLen: 12, min: -99, max: 99 }); if (new Set(a).size !== a.length) throw new Error("Distinct values."); return a; };
  A.avl = {
    title: "AVL insert: rotate to stay balanced", short: "AVL tree",
    viz: "btree", legend: ["focus:just inserted, or just moved up", "bug:out of balance"],
    inputLabel: "values to insert in order", hint: "1 2 3 4 5 6 7",
    presets: [{ label: "sorted 1..7", input: "1 2 3 4 5 6 7" }, { label: "LL case: 3 2 1", input: "3 2 1" }, { label: "LR case: 3 1 2", input: "3 1 2" }, { label: "10 20 30 40 50 25", input: "10 20 30 40 50 25" }],
    parse: parseAvl, lines: avlLines,
    trace: (v) => avlTrace(v, false),
  };
  A.avlIntro = Object.assign({}, A.avl, { short: "AVL insert", presets: [{ label: "1, 2, 3 (the walk-through)", input: "1 2 3" }, { label: "sorted 1..7", input: "1 2 3 4 5 6 7" }], table: { id: "tbl-2", preset: 0, rows: ["i1", "i2", "bal", "rot"] } });
  A.avl.table = { id: "tbl-4", preset: 1, rows: ["i3", "i2", "bal", "rot"] };
  function singleRotBug() {
    const Tr = new G.Trace();
    const T = new Tree();
    const a = T.make(3), b = T.make(1), c = T.make(2);
    T.root = a; T.nodes[a].l = b; T.nodes[b].r = c;
    const sub = () => Object.fromEntries(Object.keys(T.nodes).map((k) => { const x = T.nodes[k]; const d = height(T, x.l) - height(T, x.r); return [k, `b ${d > 0 ? "+" : ""}${d}`]; }));
    Tr.add({ at: "bal", state: T.snap({ marks: { [a]: "bug" }, sub: sub() }), vars: { balance: 2 }, say: "After 3, 1, 2: balance +2 at 3, and the new value 2 sits on the inner side." });
    T.root = b; T.nodes[a].l = c; T.nodes[b].r = a;
    Tr.add({ at: "ll", state: T.snap({ marks: { [b]: "bug" }, sub: sub() }), vars: { balance: -2 }, say: "One right rotation only: 1 moves up, 2 goes under 3. Now 1 has balance −2. The zig-zag just flipped sides." });
    Tr.add({ state: T.snap({ marks: { [b]: "bug" }, sub: sub() }), vars: {}, say: "The fix: straighten first (rotate 1 left), then rotate right at 3." });
    return Tr.done(null);
  }
  A.avlLR = Object.assign({}, A.avl, { bugs: [{ label: "Replay the bug: one rotation for a zig-zag", input: "3 1 2", banner: "<b>Replaying a bug.</b> This version skips the straightening rotation in the LR case.", trace: singleRotBug }], short: "LR case", presets: [{ label: "3, 1, 2", input: "3 1 2" }, { label: "RL case: 1, 3, 2", input: "1 3 2" }], table: { id: "tbl-5", preset: 0, rows: ["bal", "straight", "rot"] } });
  A.plainBST = {
    title: "AVL insert: rotate to stay balanced", short: "Plain BST (no balancing)", 
    viz: "btree", legend: ["focus:just inserted"],
    inputLabel: "values to insert in order", hint: "1 2 3 4 5 6 7",
    presets: [{ label: "sorted 1..7", input: "1 2 3 4 5 6 7" }, { label: "10 20 30 40 50 25", input: "10 20 30 40 50 25" }],
    parse: parseAvl, lines: {},
    trace: (v) => avlTrace(v, true),
  };

  G.quizzes.bal16 = {
    title: "Balance and rotations",
    items: [
      { q: "A node's balance factor is +2 and its left child's is +1.", options: ["LL: one right rotation", "LR: left then right", "RR: one left rotation", "RL: right then left"], answer: 0, why: "Heavy on the outer left side: one right rotation." },
      { q: "A node's balance factor is −2 and its right child's is +1.", options: ["RL: rotate the child right, then the node left", "RR: one left rotation", "LL", "LR"], answer: 0, why: "Right-heavy with a zig-zag: straighten first." },
      { q: "Why do databases use B-trees instead of binary trees?", options: ["Many keys per node means few levels, so few disk reads", "B-trees are always sorted", "Binary trees cannot be stored on disk", "B-trees use less memory per key"], answer: 0, why: "A node fills a disk page; height ≈ log₅₀₀ n is about 4 for 10⁹ keys." },
      { q: "Which balanced tree backs Java's TreeMap and C++'s std::map?", options: ["Red-black tree", "AVL tree", "B-tree", "Splay tree"], answer: 0, why: "Looser balance than AVL, so fewer rotations on insert and delete." },
      { q: "Insert 1..1,000,000 in order into a plain BST. Search cost?", options: ["O(n): it is a chain", "O(log n)", "O(1)", "O(n log n)"], answer: 0, why: "Every value goes right; balancing fixes it." },
    ],
  };
})();

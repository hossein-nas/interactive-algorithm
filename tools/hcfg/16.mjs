export const expose = "(globalThis as any).TreeNode = TreeNode; (globalThis as any).toLevelArray = toLevelArray; (globalThis as any).insertBST = insertBST; (globalThis as any).avlInsert = avlInsert; (globalThis as any).avlInorder = avlInorder;\n";
export function specs({ A, R, rnd, arr, sorted }) {
  const lvlTree = (a) => { const nodes = a.map((v) => (v == null ? null : new R.TreeNode(v))); let i = 1; for (const n of nodes) { if (!n) continue; if (i < a.length) n.left = nodes[i++]; if (i < a.length) n.right = nodes[i++]; } return nodes[0] || null; };
  const distinct = (n, lo, hi) => { const s = new Set(); while (s.size < n) s.add(rnd(lo, hi)); return [...s]; };
  const avlLevel = (root) => { const out = [], q = [root]; for (let h = 0; h < q.length; h++) { const x = q[h]; if (!x) { out.push(null); continue; } out.push(x.val); q.push(x.left, x.right); } while (out.length && out[out.length - 1] == null) out.pop(); return out; };
  const plainH = (n) => (n ? 1 + Math.max(plainH(n.left), plainH(n.right)) : 0);
  return {
    sortedToBST: { gen: () => sorted(arr(rnd(1, 9), -20, 20)).join(" "), want: (s) => R.toLevelArray(R.sortedArrayToBST(A.sortedToBST.parse(s))) },
    isBalanced: {
      gen: () => { if (rnd(0, 1)) { let t = null; for (const v of distinct(rnd(1, 10), 1, 40)) t = R.insertBST(t, v); return R.toLevelArray(t).slice(0, 15).map((x) => (x == null ? "null" : x)).join(" "); } const a = [rnd(1, 9)]; while (a.length < rnd(1, 15)) a.push(rnd(0, 3) ? rnd(1, 9) : null); while (a.length && a[a.length - 1] == null) a.pop(); return a.map((x) => (x == null ? "null" : x)).join(" "); },
      want: (s) => R.isBalanced(lvlTree(A.isBalanced.parse(s))),
    },
    deleteBST: {
      gen: () => { const ins = distinct(rnd(1, 10), 1, 30); const del = Array.from({ length: rnd(0, 4) }, () => (rnd(0, 4) ? ins[rnd(0, ins.length - 1)] : rnd(1, 30))); return `${ins.join(" ")} ; ${del.join(" ")}`; },
      want: (s) => { const { ins, del } = A.deleteBST.parse(s); let t = null; ins.forEach((v) => (t = R.insertBST(t, v))); del.forEach((k) => (t = R.deleteNode(t, k))); return R.toLevelArray(t); },
    },
    avl: {
      gen: () => (rnd(0, 2) ? distinct(rnd(1, 12), -30, 30) : sorted(distinct(rnd(1, 12), 1, 40))).join(" "),
      want: (s) => { let t = null; A.avl.parse(s).forEach((v) => (t = R.avlInsert(t, v))); return { inorder: R.avlInorder(t), height: t.height, level: avlLevel(t) }; },
      askNext: { 0: ["ll"], 1: ["rr"], 2: ["lr"], 3: ["rl"] },
    },
    avlIntro: { gen: () => sorted(Array.from(new Set(Array.from({length: rnd(1, 10)}, () => rnd(1, 30))))).join(" "), want: (s) => { let t = null; A.avl.parse(s).forEach((v) => (t = R.avlInsert(t, v))); return { inorder: R.avlInorder(t), height: t.height, level: avlLevel(t) }; }, askNext: { 0: ["ll"], 1: ["rr"], 2: ["lr"], 3: ["rl"] } },
    avlLR: { want: (s) => { let t = null; A.avl.parse(s).forEach((v) => (t = R.avlInsert(t, v))); return { inorder: R.avlInorder(t), height: t.height, level: avlLevel(t) }; } },
    rotate: { want: (s) => (s === "right" ? "x" : "y") },
    plainBST: {
      gen: () => distinct(rnd(1, 12), 1, 40).join(" "),
      want: (s) => { let t = null; A.plainBST.parse(s).forEach((v) => (t = R.insertBST(t, v))); return { inorder: (function io(n, o) { if (n) { io(n.left, o); o.push(n.val); io(n.right, o); } return o; })(t, []), height: plainH(t), level: R.toLevelArray(t) }; },
    },
  };
}

export const expose = "(globalThis as any).buildTree = buildTree; (globalThis as any).toLevelArray = toLevelArray; (globalThis as any).findNode = findNode;\n";
export function specs({ A, R, rnd }) {
  const randTree = (n, bst) => { if (bst) { const vals = []; let root = null; const ins = (t, v) => { if (!t) return { v, l: null, r: null }; if (v < t.v) t.l = ins(t.l, v); else if (v > t.v) t.r = ins(t.r, v); return t; }; for (let i = 0; i < n; i++) root = ins(root, rnd(1, 30)); const out = [], q = [root]; for (let h = 0; h < q.length; h++) { const x = q[h]; if (!x) { out.push(null); continue; } out.push(x.v); q.push(x.l, x.r); } while (out.length && out[out.length - 1] == null) out.pop(); return out.slice(0, 15); } const a = [rnd(-9, 9)]; while (a.length < n) a.push(rnd(0, 3) ? rnd(-9, 9) : null); while (a.length && a[a.length - 1] == null) a.pop(); return a; };
  const lvl = (a) => a.map((x) => (x == null ? "null" : x)).join(" ");
  const T = (s) => R.buildTree(A.maxDepth.parse(s));
  return {
    maxDepth: { gen: () => lvl(randTree(rnd(1, 12))), want: (s) => R.maxDepth(T(s)) },
    invertTree: { gen: () => lvl(randTree(rnd(1, 12))), want: (s) => R.toLevelArray(R.invertTree(T(s))) },
    inorderRec: { gen: () => lvl(randTree(rnd(1, 12))), want: (s) => R.inorderRecursive(T(s)) },
    inorderIter: { gen: () => lvl(randTree(rnd(1, 12))), want: (s) => R.inorderIterative(T(s)) },
    levelOrder: { gen: () => lvl(randTree(rnd(1, 12))), want: (s) => R.levelOrder(T(s)) },
    validBST: { gen: () => lvl(rnd(0, 1) ? randTree(rnd(1, 10), true) : randTree(rnd(1, 10))), want: (s) => R.isValidBST(T(s)) },
    kthSmallest: { gen: () => { const t = randTree(rnd(1, 10), true); const n = t.filter((x) => x != null).length; return `${lvl(t)} ; ${rnd(1, n)}`; }, want: (s) => { const { vals, k } = A.kthSmallest.parse(s); return R.kthSmallest(R.buildTree(vals), k); } },
    lca: { gen: () => { const t = randTree(rnd(2, 10), true); const v = t.filter((x) => x != null); return `${lvl(t)} ; ${v[rnd(0, v.length - 1)]} ; ${v[rnd(0, v.length - 1)]}`; }, want: (s) => { const { vals, p, q } = A.lca.parse(s); const root = R.buildTree(vals); return R.lowestCommonAncestor(root, R.findNode(root, p), R.findNode(root, q)).val; } },
    buildPreIn: { gen: () => { const t = R.buildTree(randTree(rnd(1, 9), true)); const pre = [], ino = []; const p = (n) => { if (!n) return; pre.push(n.val); p(n.left); p(n.right); }; const i = (n) => { if (!n) return; i(n.left); ino.push(n.val); i(n.right); }; p(t); i(t); return `${pre.join(" ")} ; ${ino.join(" ")}`; }, want: (s) => { const { pre, ino } = A.buildPreIn.parse(s); return R.toLevelArray(R.buildTreeFromPreIn(pre, ino)); } },
    maxPathSum: { gen: () => lvl(randTree(rnd(1, 12))), want: (s) => R.maxPathSum(T(s)) },
  };
}

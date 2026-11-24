S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "16", "title": "Balanced trees", "sub": "Keep the tree short, and every search stays fast.",
 "kicker": ["Lesson 16", "Data structures"], "stars": 2, "pattern": "Balanced BST",
 "desc": "Balanced trees animated: rotations, AVL inserts with all four cases, building a balanced BST, checking balance and deleting from a BST.",
 "glance": [("Why it matters", "A BST costs <code>O(height)</code>. Sorted input makes a chain (height n); balancing keeps it about log₂ n."),
            ("The repair tool", "A rotation rewires three links in <code>O(1)</code> and keeps the BST order."),
            ("Know by name", "AVL (strict), red-black (TreeMap, std::map), B-tree (databases), skip list (Redis).")],
 "added": "added-16.md", "added_names": ["ex4", "ex5"], "added_langs": {"ex5": ["go"]},
 "inserts": [
  ('<h2>3. AVL trees: the strict-balance tree</h2>', S("st-rot", "rotate", "code-4"), 'before'),
  ('<p><strong>Guarantees.</strong>', S("st-avl0", "avlIntro,plainBST", "code-4", ' data-flow="fig-3"'), 'before'),
  ('<div class="code-tabs" id="code-1">', S("st-p1", "sortedToBST", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "isBalanced", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "deleteBST", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "avl,avlLR,plainBST", "code-4", ' data-flow="fig-3"'), 'before'),
 ],
 "recap": "bal16",
 "exercises": [
  {"title": "Six AVL inserts", "hint": "After 10, 20, 30 the first rotation happens. Watch for a zig-zag when 25 arrives.",
   "answer": "<p>10, 20, 30: RR at 10, so rotate left: <code>20(10, 30)</code>. 40 hangs under 30. 50 makes 30 right-heavy (RR): rotate left at 30, giving <code>20(10, 40(30, 50))</code>. 25 goes 20 → 40 → 30 → left. Now 20 has balance −2 and its right child 40 has +1: the <strong>RL case</strong>. Rotate 40 right, then 20 left. Result, level order: <code>[30, 20, 40, 10, 25, null, 50]</code>, height 3. Run the last preset of the AVL animation to check each step.</p>"},
  {"title": "Balance −2, right child +1", "answer": "<p>The <strong>RL case</strong>: heavy on the right, with the extra weight on the inner (left) side of the right child. First rotate the right child <em>right</em> to straighten the zig-zag, then rotate the node <em>left</em>. The second preset of the “LR case” tab shows the mirror image.</p>"},
  {"title": "B-tree height", "answer": "<p>A node fills one disk page, so it holds hundreds of keys and has hundreds of children: each disk read rules out far more than half. With 500 keys per node, about 501 children: height ≈ log₅₀₀(10⁹) = 9 / 2.7 ≈ 3.3, so <strong>4 levels</strong>, and the top one or two usually sit in memory. A balanced binary tree would need about 30 levels, each one a disk read.</p>"},
  {"title": "Sorted list to BST", "answer": "<p>Find the middle of the range <code>[start, end)</code> with slow/fast pointers, make it the root, and recurse on the two halves. Each level of recursion walks the whole list once in total, and there are log n levels: <strong><code>O(n log n)</code> time</strong>, <code>O(log n)</code> stack. (An <code>O(n)</code> version builds in inorder order while walking the list once.)</p>{{code:ex4}}"},
  {"title": "An ordered set in Go", "answer": "<p>Go has no built-in ordered map. Options: (1) a <strong>sorted slice + <code>sort.SearchInts</code></strong>: <code>O(log n)</code> floor/ceiling, <code>O(n)</code> insert, simplest and fine for interviews; (2) an external library (a B-tree or red-black tree package, or a skip list); (3) write your own tree (treap or AVL), which is rarely worth it in an interview. TypeScript is in the same position: no built-in TreeMap.</p>{{code:ex5}}"},
 ],
}

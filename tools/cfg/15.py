S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "15", "title": "Trees and binary search trees", "sub": "Ask each child, then combine.",
 "kicker": ["Lesson 15", "Data structures"], "stars": 3, "pattern": "Binary tree",
 "desc": "Trees animated: depth, inverting, traversals, level order, BST validation, kth smallest, LCA, building from traversals and max path sum.",
 "glance": [("The template", "Handle the empty tree; ask the left and right children; combine their answers at the node."),
            ("Traversals", "Preorder, inorder (sorted for a BST), postorder; level order uses a queue."),
            ("What it costs", "<code>O(n)</code> time; <code>O(h)</code> stack, where h is the height.")],
 "inserts": [
  ('<div class="code-tabs" id="code-2">', S("st-p1", "maxDepth,invertTree", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p2", "inorderIter,inorderRec", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p3", "levelOrder", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p4a", "validBST", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p4b", "kthSmallest", "code-6"), 'before'),
  ('<div class="code-tabs" id="code-7">', S("st-p5", "lca", "code-7"), 'before'),
  ('<div class="code-tabs" id="code-8">', S("st-p6", "buildPreIn", "code-8"), 'before'),
  ('<div class="code-tabs" id="code-9">', S("st-p7", "maxPathSum", "code-9"), 'before'),
 ],
 "recap": "tree15",
 "exercises": [
  {"title": "Four contracts", "answer": "<ul><li><strong>Count nodes:</strong> count(null) = 0; count(n) = 1 + count(left) + count(right).</li><li><strong>Sum:</strong> sum(null) = 0; sum(n) = n.val + sum(left) + sum(right).</li><li><strong>Symmetric:</strong> mirror(a, b): both null → true; one null → false; else a.val == b.val and mirror(a.left, b.right) and mirror(a.right, b.left). Call mirror(root.left, root.right).</li><li><strong>Path sum:</strong> has(null, t) = false; at a leaf, t == leaf.val; otherwise has(left, t − val) or has(right, t − val).</li></ul>"},
  {"title": "Why left < node < right is not enough", "answer": "<p>In <code>[5, 4, 6, null, null, 3, 7]</code> every node is bigger than its left child and smaller than its right child, yet 3 sits in 5's right subtree, where everything must be bigger than 5. Each node needs a window from all its ancestors. Run the third preset of the Validate BST animation.</p>"},
  {"title": "Pushing into the queue you are reading", "answer": "<p>The loop would keep going into the next level's nodes, so levels merge into one list (a <code>for…of</code> over a growing array keeps reading new items). Either build a separate <code>next</code> array, as the TypeScript code does, or record the level size first and read exactly that many, as the Go code does.</p>"},
  {"title": "Serialize and deserialize", "answer": "<p><strong>Preorder with # for null</strong> (or level order with nulls). Preorder with null markers is unambiguous: read a value, build the node, then recursively build its left and right subtrees from the following tokens; # ends a branch.</p>"},
  {"title": "Inserting 1, 2, 3, 4, 5 in order", "answer": "<p>Each new value is bigger, so it goes right every time: the tree becomes a chain, height 5. Searching costs <code>O(n)</code> instead of <code>O(log n)</code>. Self-balancing trees (AVL, red-black) fix it by rotating after inserts: lesson 16.</p>"},
 ],
}

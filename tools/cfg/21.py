S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "21", "title": "Union-find", "sub": "Every group has a leader; merging is just pointing one leader at another.",
 "kicker": ["Lesson 21", "Graphs"], "stars": 2, "pattern": "Union-find (DSU)",
 "desc": "Union-find animated: a forest of leaders, path halving, union by size, components, redundant edges, valid trees, merging accounts and islands that appear one cell at a time.",
 "glance": [("Reach for it when", "Groups that only ever merge: connectivity as edges arrive, cycles in undirected graphs, Kruskal."),
            ("How it works", "<code>parent[]</code> forms a forest; a tree's root is the group's leader. <code>find</code> climbs to it; <code>union</code> hangs one root under another."),
            ("What it costs", "With union by size and path compression, nearly <code>O(1)</code> per operation.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', S("st-uf", "ufOps", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p1", "components", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p2", "redundant", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p3", "validTree", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p4", "accounts", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p5", "islands2", "code-6"), 'before'),
 ],
 "recap": "uf21",
 "exercises": [
  {"title": "Write it from memory", "answer": "<p>The loop in <code>find</code> runs while <code>parent[x] !== x</code> (x is not a leader yet). Line one, <code>parent[x] = parent[parent[x]]</code>, points x at its grandparent: path halving, so later finds are shorter. Line two, <code>x = parent[x]</code>, climbs. After the loop, return x, the leader. <code>union</code> finds both leaders, returns false if they are equal, hangs the smaller tree's leader under the bigger one, adds the sizes and decrements <code>count</code>.</p>"},
  {"title": "Four unions", "answer": "<p><code>union(1,2)</code> → true; <code>union(3,4)</code> → true; <code>union(2,4)</code> → true (it joins {1,2} and {3,4}); <code>union(1,3)</code> → <strong>false</strong>, they are already together. Three successful merges, so <code>count</code> = n − 3: with n = 5 (items 0..4) that is 2 groups, {0} and {1,2,3,4}. The third preset of the first animation runs exactly this.</p>"},
  {"title": "Number of Provinces", "answer": "<p>The matrix is symmetric and its diagonal is all 1s, so union only the upper triangle: <code>for i in 0..n-1, for j in i+1..n-1, if isConnected[i][j] == 1: union(i, j)</code>. The answer is <code>count</code>. (BFS or DFS from each unvisited city also works.)</p>"},
  {"title": "Equality equations", "answer": "<p>The <code>==</code> equations build the groups; a <code>!=</code> can only be checked once every group is complete. If you checked <code>a != b</code> first, a later <code>a == c</code> and <code>c == b</code> could still put a and b together. So: union every <code>==</code>, then for each <code>!=</code> return false if <code>find(a) === find(b)</code>.</p>"},
  {"title": "Kruskal", "answer": "<p><strong><code>union</code>'s return value</strong> (or comparing <code>find(a)</code> and <code>find(b)</code>). Sort edges by weight; for each, if <code>union(a, b)</code> returns true, the edge joins two different trees, so add it to the spanning tree; if false, it would close a cycle, so skip it. Stop after V − 1 edges. Cost <code>O(E log E)</code>, from the sort.</p>"},
 ],
}

S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "22", "title": "Shortest paths: Dijkstra and Bellman-Ford", "sub": "Settle the closest node first, unless weights can be negative.",
 "kicker": ["Lesson 22", "Graphs"], "stars": 3, "pattern": "Shortest paths",
 "desc": "Shortest paths animated: Dijkstra with its heap and stale entries, network delay, minimum effort, cheapest flights within K stops, Bellman-Ford with a negative cycle, and BFS over visited sets.",
 "viz": ["viz/graph.js"],
 "glance": [("Pick the tool", "Equal weights: BFS. Non-negative weights: Dijkstra. Negative weights or \"at most k edges\": Bellman-Ford."),
            ("Dijkstra's idea", "Pop the node with the smallest known distance; with weights ≥ 0 nothing later can beat it. Relax its edges."),
            ("What it costs", "Dijkstra <code>O((V + E) log V)</code>; Bellman-Ford <code>O(V · E)</code>.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', S("st-dij", "dijkstra", "code-1", ' data-flow="fig-2"'), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p1", "network", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p2", "effort", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p3", "flights", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p4", "bellman", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p5", "visitAll", "code-6"), 'before'),
 ],
 "recap": "sp22",
 "exercises": [
  {"title": "Why Dijkstra is correct, and where it breaks", "answer": "<p>When Dijkstra pops u with distance d, every other route to u must leave the settled set through some node whose distance is already ≥ d. With non-negative weights, the rest of such a route can only add, so it costs ≥ d. That makes d final. A negative edge breaks the \"can only add\" step. Example: 0 → 1 (weight 2), 0 → 2 (weight 3), 2 → 1 (weight −2). Dijkstra pops 1 at distance 2 and calls it final, but 0 → 2 → 1 costs 1.</p>"},
  {"title": "Relaxation and the stale check", "answer": "<p><code>const [d, u] = heap.pop(); if (d &gt; dist[u]) continue;</code> then for each edge <code>(v, w)</code>: <code>if (d + w &lt; dist[v]) { dist[v] = d + w; heap.push([dist[v], v]); }</code>. Watch both in the first animation; its bug replay shows what goes wrong if you lock a node when it is first pushed.</p>"},
  {"title": "Path With Maximum Probability", "answer": "<p>Same Dijkstra skeleton, three changes: a <strong>max</strong>-heap on probability, start at probability 1, and combine with <strong>×</strong> instead of +. It still works because multiplying by a number in [0, 1] can never increase the value, the same way adding a non-negative weight can never decrease a distance.</p>"},
  {"title": "Swim in Rising Water", "answer": "<p>Reuse Problem 2's idea that <strong>a path's cost is its maximum</strong>, not its sum: Dijkstra with <code>next = max(cost, grid[nr][nc])</code>, return when the bottom-right is popped. (Binary search on the time plus a BFS also works.)</p>"},
  {"title": "Spanning tree versus shortest paths", "answer": "<p>A <strong>minimum spanning tree</strong> picks edges with the smallest <em>total</em> weight that connect every node; there is no source. <strong>Shortest paths</strong> minimize the route from one source to each node. The trees differ: in a triangle with weights 1, 1, 1.5, the MST uses the two 1s, while the shortest path between the ends of the 1.5 edge is that edge. Use Prim (a heap of edge weights) or Kruskal (sort + union-find) for 1584.</p>"},
  {"title": "Return −1, not infinity", "answer": "<p>The problem defines −1 as \"not every node gets the signal\". Returning <code>Infinity</code> breaks the contract, and in Go <code>math.MaxInt</code> looks like a real (huge) answer; worse, adding a weight to it overflows into a negative number. Check for the sentinel before using it.</p>"},
 ],
}

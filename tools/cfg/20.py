S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "20", "title": "Topological sort", "sub": "Put things in an order that respects every \"before\".",
 "kicker": ["Lesson 20", "Graphs"], "stars": 3, "pattern": "Topological sort",
 "desc": "Topological sort animated: Kahn's in-degree queue, three-color cycle detection, course orders, semesters, the alien alphabet and minimum height trees.",
 "viz": ["viz/graph.js"],
 "glance": [("Reach for it when", "Prerequisites, build steps, \"X must happen before Y\", or detecting a cycle in a directed graph."),
            ("Two algorithms", "Kahn: repeatedly take a node with in-degree 0. DFS: three colors; a back edge to a \"visiting\" node is a cycle."),
            ("What it costs", "<code>O(V + E)</code>. An order exists only if the graph has no cycle.")],
 "added": "added-20.md", "added_names": ["ex3", "ex5"],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', S("st-p1", "kahn,dfs3", "code-1", ' data-flow="fig-3,fig-4"'), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "findOrder", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "semesters", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "alien", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "mht", "code-5"), 'before'),
 ],
 "recap": "topo20",
 "exercises": [
  {"title": "Find the cycle", "answer": "<p>Edges 0 → 1 → 2 → 3 → 4 → 2. Yes, a cycle: <strong>2 → 3 → 4 → 2</strong>. Kahn takes 0, then 1; that drops 2's in-degree from 2 to 1, and it never reaches 0 because 4 is waiting on 3, which waits on 2. Processed: 0 and 1. Not processed: <strong>2, 3, 4</strong>. It is the third preset of the course animations.</p>"},
  {"title": "Why a cycle blocks every order", "answer": "<p>Every node on a cycle has a predecessor on the same cycle that must come before it. Follow the cycle around and each node must come before itself, which is impossible.</p>"},
  {"title": "DFS order in your head", "answer": "<p>Use the three colors. A node is pushed to <code>post</code> <strong>after</strong> all its outgoing neighbors finish, so everything that depends on it is already in the list. Reversing puts every node before everything it unlocks. A back edge to a \"visiting\" node means a cycle: return <code>[]</code>.</p>{{code:ex3}}"},
  {"title": "A unique order", "answer": "<p>The order is unique exactly when the queue holds <strong>one node at every step</strong>. If two nodes are ready together, they could go in either order. Uniqueness also means the order is a single path through every node (each consecutive pair is joined by an edge).</p>"},
  {"title": "Critical path", "answer": "<p>Process tasks in topological order and keep <code>finish[v] = time[v] + max(finish[u])</code> over its prerequisites u (just <code>time[v]</code> if it has none). The answer is the largest finish time: the longest weighted path in the DAG. This is LeetCode 2050, Parallel Courses III.</p>{{code:ex5}}"},
 ],
}

S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "17", "title": "Heaps and priority queues", "sub": "Always know the smallest, cheaply.",
 "kicker": ["Lesson 17", "Data structures"], "stars": 3, "pattern": "Heap / top K",
 "desc": "Heaps animated: sift up and down in the tree and the array at once, heapify and heap sort, top K, merging K lists, meeting rooms and the two-heap median.",
 "glance": [("Reach for it when", "\"K largest / smallest / closest\", \"merge K sorted\", \"the next earliest event\", or a running median."),
            ("How it works", "A complete tree stored in an array: children of i at 2i+1 and 2i+2. Push sifts up; pop sifts down."),
            ("What it costs", "Push and pop <code>O(log n)</code>; peek <code>O(1)</code>; heapify <code>O(n)</code>.")],
 "inserts": [
  ('<h3 id="building-a-heap-in-o-n-a-favorite-trick-question">', S("st-ops", "heapOps", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-1">', S("st-build", "heapify", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p1", "kthLargest", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p2", "topK", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p3", "mergeK", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p4", "kthMatrix", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p5", "rooms", "code-6", ' data-flow="fig-8"'), 'before'),
  ('<div class="code-tabs" id="code-7">', S("st-p6", "median", "code-7"), 'before'),
 ],
 "recap": "heap17",
 "exercises": [
  {"title": "Draw it, then insert 1", "answer": "<p>Index 0 is 2 with children 5 and 3; 5 has children 9 and 6; 3 has child 4. Every parent ≤ its children, so it <strong>is</strong> a valid min-heap. Insert 1 at index 6 (under 3). 1 &lt; 3: swap, 1 is at index 2. 1 &lt; 2: swap, 1 is the root. Result: <code>[1, 5, 2, 9, 6, 4, 3]</code>. Run the second preset of the push-and-pop animation to watch the two swaps.</p>"},
  {"title": "K largest, min-heap", "answer": "<p>Keep the k largest seen so far. When a new value arrives, the one to evict is the <em>smallest</em> of those k, so it must be on top: a <strong>min</strong>-heap. Its top is also the answer (the kth largest). Cost <code>O(n log k)</code> and <code>O(k)</code> memory.</p>"},
  {"title": "Why heapify is O(n)", "answer": "<p>Sift-down costs the height <em>below</em> a node, not above it. Half the nodes are leaves (cost 0), a quarter sit one level up (cost ≤ 1), an eighth cost ≤ 2, and so on: n/4·1 + n/8·2 + n/16·3 + … ≤ n. Pushing items one by one would instead pay up to log n for most of them: <code>O(n log n)</code>.</p>"},
  {"title": "Last Stone Weight", "answer": "<p>A <strong>max</strong>-heap of the stones. Each round pop the two heaviest, x ≥ y. If x &gt; y, push back <code>x − y</code>; if equal, push nothing. When at most one stone is left, return it (or 0). <code>O(n log n)</code>.</p>"},
  {"title": "K Closest Points", "answer": "<p>Store <code>[squaredDistance, point]</code> (no square root needed) in a <strong>max</strong>-heap of size k. Push each point; when the size passes k, pop the farthest. What remains are the k closest: <code>O(n log k)</code>. It is the K-largest pattern turned around: keep the k smallest, so evict the biggest.</p>"},
  {"title": "Reorganize String and Task Scheduler", "answer": "<p>Both are greedy with a max-heap of counts. <strong>Reorganize String:</strong> always place the most frequent letter that is not the one you just placed (pop the top two, use one each, push them back with count − 1). If one letter has more than ⌈n/2⌉, it is impossible. <strong>Task Scheduler:</strong> in each window of <code>n + 1</code> slots run the most frequent distinct tasks, idle for the rest, then push back the leftovers. Shortcut: the answer is <code>max(tasks, (maxCount − 1)·(n + 1) + numberOfTasksWithMaxCount)</code>.</p>"},
 ],
}

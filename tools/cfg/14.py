S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "14", "title": "Queues and the monotonic deque", "sub": "First come, first served, and the window maximum in O(n).",
 "kicker": ["Lesson 14", "Data structures"], "stars": 2, "pattern": "Queue and deque",
 "desc": "Queues animated: recent calls, a queue from two stacks, a circular buffer, the sliding window maximum and the shortest subarray with negatives.",
 "glance": [("Queue", "Process in order of arrival: BFS, recent events, round-robin."),
            ("Monotonic deque", "Keep indexes with decreasing values; the front is the window's maximum."),
            ("What it costs", "<code>O(1)</code> per operation (amortized); <code>O(n)</code> for all windows.")],
 "inserts": [
  ('<table id="tbl-3">', '<table id="tbl-3" class="trace">'),
  ('<table id="tbl-5">', '<table id="tbl-5" class="trace">'),
  ('<div class="code-tabs" id="code-1">', S("st-p1", "recentCounter", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "queueStacks", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "circularQueue", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "windowMax", "code-4", ' data-flow="fig-3"'), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "shortestK", "code-5", ' data-flow="fig-6"'), 'before'),
 ],
 "recap": "queue14",
 "exercises": [
  {"title": "Amortized pop with two stacks", "answer": "<p>Each item is pushed onto the inbox once, moved to the outbox at most once, and popped from the outbox once: at most three constant-time steps per item over its whole life. A single pop can be <code>O(n)</code> when it pours the inbox, but across n operations the total is <code>O(n)</code>, so each is amortized <code>O(1)</code>.</p>"},
  {"title": "maxSlidingWindow([4, 2, 12, 11, −5], 2)", "answer": "<p>i=0: deque [0]. i=1: [0, 1] → max 4. i=2: 12 pops 1 and 0 → [2] → max 12. i=3: [2, 3] → max 12. i=4: [2, 3, 4], index 2 expires → [3, 4] → max 11. Answer <code>[4, 12, 12, 11]</code>. Check it with Problem 4's second preset.</p>"},
  {"title": "Indexes, not values", "answer": "<p>The front must be dropped when it slides out of the window, and only its index tells you that (<code>index ≤ i − k</code>). Values also repeat, so a value cannot tell two positions apart.</p>"},
  {"title": "Sliding Window Median", "answer": "<p>A median needs the middle of the window, not just its extreme, so a deque is not enough. Use two heaps (a max-heap for the lower half and a min-heap for the upper half) with lazy deletion, or a balanced ordered structure, for <code>O(n log k)</code>.</p>"},
  {"title": "Jump Game VI", "answer": "<p>A <strong>monotonic deque</strong> over <code>dp</code> values: it holds the indexes of the last k dp values in decreasing order, so <code>max(dp[i−k..i−1])</code> is always at the front. That gives <code>O(n)</code> instead of <code>O(n·k)</code>.</p>"},
 ],
}

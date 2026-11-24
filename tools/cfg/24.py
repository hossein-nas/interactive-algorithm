S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "24", "title": "Intervals", "sub": "Sort them, then walk left to right: merge, cut, or count.",
 "kicker": ["Lesson 24", "Greedy and hard problems"], "stars": 3, "pattern": "Intervals / sweep line",
 "desc": "Intervals animated on a timeline: merging, inserting, intersecting two lists, arrows for balloons, meeting rooms with a sweep line, and the skyline.",
 "viz": ["viz/timeline.js"],
 "glance": [("Reach for it when", "Ranges with a start and an end: meetings, bookings, segments, \"overlap\", \"free time\", \"rooms\"."),
            ("The overlap test", "<code>a1 ≤ b2 and a2 ≤ b1</code> (use &lt; if touching does not count). Ask which one the problem means."),
            ("The three moves", "Sort by start to merge; sort by end to choose the most; split into +1/−1 events to count overlaps (sweep line).")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', S("st-p1", "merge", "code-1", ' data-flow="fig-4"'.replace(' data-flow="fig-4"', '')), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "insert", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "intersect", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "arrows", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "attend,sweepRooms", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p6", "skyline", "code-6"), 'before'),
 ],
 "recap": "iv24",
 "exercises": [
  {"title": "The overlap test", "answer": "<p>Touching counts: <code>a1 ≤ b2 &amp;&amp; a2 ≤ b1</code>. Touching does not count: <code>a1 &lt; b2 &amp;&amp; a2 &lt; b1</code>. <code>[1,5]</code> and <code>[5,8]</code> overlap only if touching counts. <code>[1,5]</code> and <code>[6,8]</code> never overlap.</p>"},
  {"title": "Employee Free Time", "answer": "<p>Two tools: <strong>merge K sorted lists</strong> (a heap, lesson 17, or just flatten and sort) and <strong>merge intervals</strong>. After merging all busy time into one sorted list, every gap between consecutive merged intervals is free time for everyone.</p>"},
  {"title": "Car Pooling", "answer": "<p>Both views are the same idea. Add <code>+passengers</code> at each pickup and <code>−passengers</code> at each drop-off (a difference array over positions, lesson 07, or sorted events, this lesson), then take a running sum. If it ever exceeds the capacity, return false. Process drop-offs before pickups at the same position.</p>"},
  {"title": "My Calendar I", "answer": "<p>Keep bookings in a <strong>sorted structure</strong> keyed by start: a balanced BST or ordered map (lesson 16). For a new booking <code>[s, e)</code>, look at the booking just before s (floor) and just after (ceiling); reject if either overlaps. <code>O(log n)</code> per booking. In TypeScript or Go, a sorted array with binary search gives <code>O(log n)</code> lookups but <code>O(n)</code> inserts.</p>"},
  {"title": "Remove Covered Intervals", "answer": "<p>Sort by start ascending, and for equal starts by <strong>end descending</strong>, so the longest of a tie comes first and the shorter ones after it are recognized as covered. Then walk once, tracking the largest end so far: an interval whose end ≤ that maximum is covered. Ascending ends would let <code>[1,2]</code> come before <code>[1,4]</code> and miss that it is covered.</p>"},
  {"title": "Counting overlaps with events", "answer": "<p>Events for <code>[[1,4],[2,5],[7,9]]</code>: <code>(1,+1) (2,+1) (4,−1) (5,−1) (7,+1) (9,−1)</code>. Running sum: 1, 2, 1, 0, 1, 0. The maximum, <strong>2</strong>, is the most intervals overlapping at once. At equal coordinates, put −1 before +1 if intervals are half-open (touching does not overlap).</p>"},
 ],
}

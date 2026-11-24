S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "08", "title": "Binary search", "sub": "Find the place where the answer changes.",
 "kicker": ["Lesson 08", "Core patterns on arrays and strings"], "stars": 3, "pattern": "Binary search",
 "desc": "Binary search animated: the first-true template, rotated arrays, searching on the answer and the median of two arrays.",
 "glance": [("Reach for it when", "Sorted data, a boundary, \"minimum X such that…\", or O(log n) required."),
            ("The template", "<code>lo &lt; hi</code>; if <code>isGood(mid)</code> then <code>hi = mid</code>, else <code>lo = mid + 1</code>."),
            ("What it costs", "<code>O(log n)</code>: every test throws away half of what is left.")],
 "added": "added-08.md", "added_names": ["ex1", "ex2"],
 "inserts": [
  ('<figure class="diagram" id="fig-2">', S("st-guess", "guessing", ""), 'before'),
  ('<div class="code-tabs" id="code-1">', S("st-tpl", "lowerBound", "code-1", ' data-flow="fig-3"'), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p1", "classicSearch", "code-2", ' data-flow="fig-3"'), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p2", "searchRange", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p3", "rotated", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p4", "koko", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p5", "ship", "code-6", ' data-flow="fig-8"'), 'before'),
  ('<div class="code-tabs" id="code-7">', S("st-p6", "median", "code-7"), 'before'),
 ],
 "recap": "bsearch08",
 "exercises": [
  {"title": "The template, then two one-liners", "track": True, "answer": "<p>Search Insert Position is exactly lower bound. Sqrt(x) is (first r with r·r &gt; x) − 1.</p>{{code:ex1}}"},
  {"title": "Find a peak", "track": True, "hint": "Is nums[i] > nums[i+1]?", "answer": "<p>The test \"going down at i?\" flips once from no to yes (the last index counts as yes), so first-true finds a peak in <code>O(log n)</code>.</p>" + S("st-ex2", "peak", "code-ex2") + "{{code:ex2}}"},
  {"title": "Split Array Largest Sum", "answer": "<p><code>isGood(cap)</code>: can the array be cut, in order, into at most k pieces whose sums are all ≤ cap (greedy, like shipping packages)? Range: max(nums) to sum(nums). Monotonic: a bigger cap never needs more pieces.</p>"},
  {"title": "Why not a linked list", "answer": "<p>Binary search needs <code>O(1)</code> access to the middle. A linked list must walk to it, <code>O(n)</code> per step, so the whole search is <code>O(n)</code> or worse.</p>"},
  {"title": "Rotated with duplicates", "answer": "<p>When <code>nums[lo] == nums[mid] == nums[hi]</code> you cannot tell which half is sorted, so you can only shrink by one. Input <code>[1,1,1,1,1,1,2,1,1]</code> forces nearly n steps: <code>O(n)</code>.</p>"},
 ],
}

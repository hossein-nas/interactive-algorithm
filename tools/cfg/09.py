S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "09", "title": "Sorting and divide and conquer", "sub": "Split the problem, solve the pieces, combine.",
 "kicker": ["Lesson 09", "Recursion family"], "stars": 2, "pattern": "Divide and conquer",
 "desc": "Sorting and divide and conquer animated: selection, insertion, merge sort, quicksort, quickselect, inversions and Euclid's GCD.",
 "glance": [("Divide and conquer", "Base case, divide into smaller copies, combine the answers."),
            ("The two big sorts", "Merge sort: always <code>O(n log n)</code>, stable, <code>O(n)</code> memory. Quicksort: fast in place, random pivot."),
            ("Selection", "Quickselect finds the k-th item in <code>O(n)</code> on average by keeping one side only.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', S("st-simple", "selection,insertion", "code-1"), 'before'),
  ('<table id="tbl-3">', '<table id="tbl-3" class="trace">'),
  ('<div class="code-tabs" id="code-2">', S("st-p1", "gcd", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p2", "mergeSort", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p3", "quickSort", "code-4", ' data-flow="fig-5"'), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p4", "quickSelect", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p5", "inversions", "code-6"), 'before'),
  ('<div class="code-tabs" id="code-7">', S("st-p6", "largestNumber", "code-7"), 'before'),
 ],
 "recap": "sort09",
 "exercises": [
  {"title": "mergeTwo from memory", "track": True, "answer": "<p>Invariant: <code>out</code> holds the smallest items of both arrays in sorted order, and <code>left[i]</code>, <code>right[j]</code> are the smallest items not yet taken. Each step takes the smaller front (the left one on ties), so the invariant holds; when one side runs out, the other's rest is already sorted and bigger. Compare with Problem 2's code.</p>"},
  {"title": "The recursion tree for 8 items", "answer": "<p>Level 0: one problem of 8; level 1: two of 4; level 2: four of 2; level 3: eight of 1. Each level's merges touch all 8 items once, so each level costs n. There are log₂ 8 = 3 merging levels: 8 × 3 = 24, in general n log n. The merge-sort animation shows the levels as rows.</p>"},
  {"title": "Fixed pivots on sorted input", "answer": "<p>With the last item as the pivot, a sorted array puts everything on one side every time: partitions of size n−1, n−2, …, so n levels and about n²/2 comparisons, plus an n-deep stack. The cheapest fix is a <strong>random pivot</strong> (or median-of-three). Replay it in Problem 3.</p>"},
  {"title": "Merge Sorted Array from the back", "answer": "<p>Fill <code>nums1</code> from its last slot: compare the last real items of both arrays and write the bigger one at the back. Writes land in empty room, never on an unread value, so no copy is needed. Lesson 05's exercise 4 animates exactly this.</p>"},
  {"title": "Pick a sort for each case", "answer": "<ul><li>(a) Linked list: merge sort (sequential access, no extra array).</li><li>(b) A billion numbers on disk: external merge sort (sort chunks in memory, merge runs).</li><li>(c) Ten almost-sorted numbers: insertion sort.</li><li>(d) Ages 0–120: counting sort, <code>O(n + 121)</code>.</li></ul>"},
 ],
}

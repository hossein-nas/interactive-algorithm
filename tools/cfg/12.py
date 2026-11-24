S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "12", "title": "Linked lists", "sub": "Following a chain of \"what comes next\".",
 "kicker": ["Lesson 12", "Data structures"], "stars": 3, "pattern": "Linked list",
 "desc": "Linked lists animated: reversing arrows, merging with a dummy, Floyd's cycle detection, gap pointers, adding digits and reordering.",
 "glance": [("The golden rule", "Before you overwrite <code>node.next</code>, save what it pointed to."),
            ("Five tools", "Dummy node, prev/cur/next, slow and fast, gap pointers, reverse a segment."),
            ("What it costs", "Usually <code>O(n)</code> time and <code>O(1)</code> extra space: you rewire, you do not copy.")],
 "inserts": [
  ('<div class="code-tabs" id="code-2">', S("st-p1", "reverseIter,reverseRec", "code-2", ' data-flow="fig-4,"'), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p2", "mergeLists", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p3", "detectCycle", "code-4"), 'before'),
  ('<table id="tbl-2">', '<table id="tbl-2" class="trace">'),
  ('<div class="code-tabs" id="code-5">', S("st-p4", "removeNth", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p5", "addTwo", "code-6"), 'before'),
  ('<div class="code-tabs" id="code-7">', S("st-p6", "reorder", "code-7"), 'before'),
 ],
 "recap": "list12",
 "exercises": [
  {"title": "Arrows of reverseList", "answer": "<p>Start: null ← (prev), 1 → 2 → 3. Iteration 1: 1 → null. Iteration 2: 2 → 1. Iteration 3: 3 → 2. Return 3. If you skip \"save next\", the line <code>cur = next</code> has nothing to move to: after <code>cur.next = prev</code> the rest of the list is unreachable. Step through Problem 1 to watch each arrow flip.</p>"},
  {"title": "The middle in one pass", "answer": "<p>Slow moves 1, fast moves 2. With <code>while (fast !== null &amp;&amp; fast.next !== null)</code>, for <code>1→2→3→4</code> slow ends at <strong>3</strong> (the second middle). With <code>while (fast.next !== null &amp;&amp; fast.next.next !== null)</code> (as in Reorder List) it ends at <strong>2</strong> (the first middle).</p>"},
  {"title": "Palindrome Linked List", "answer": "<p>Slow/fast pointers to find the middle, then <strong>reverse the second half</strong>, then compare the two halves node by node. Optionally reverse it back to restore the list. <code>O(n)</code> time, <code>O(1)</code> space.</p>"},
  {"title": "Intersection of Two Linked Lists", "answer": "<p>Pointer A walks list a then list b; pointer B walks list b then list a. Both walk exactly <code>len(a) + len(b)</code> steps before reaching the end, so if the lists share a tail they line up and meet at the first shared node; if not, both reach null at the same time.</p>"},
  {"title": "Swap Nodes in Pairs", "answer": "<p>The head itself changes (the second node becomes the new head). With a dummy in front, every swap is the same rewiring: <code>prev → second → first → rest</code>, then move <code>prev</code> to <code>first</code>. No special case for the first pair.</p>"},
 ],
}

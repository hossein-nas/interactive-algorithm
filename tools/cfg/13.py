S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "13", "title": "Stacks and the monotonic stack", "sub": "Finish the newest unfinished thing first.",
 "kicker": ["Lesson 13", "Data structures"], "stars": 3, "pattern": "Stack",
 "desc": "Stacks animated: bracket matching, min stack, postfix evaluation, daily temperatures, decoding and the largest rectangle in a histogram.",
 "glance": [("Plain stack", "Unfinished business resolved in reverse order of arrival: brackets, undo, nested decoding."),
            ("Monotonic stack", "Keep the stack sorted; popping gives each item its next greater or smaller element."),
            ("What it costs", "<code>O(n)</code>: every item is pushed once and popped at most once.")],
 "inserts": [
  ('<table id="tbl-3">', '<table id="tbl-3" class="trace">'),
  ('<table id="tbl-5">', '<table id="tbl-5" class="trace">'),
  ('<table id="tbl-2">', '<table id="tbl-2" class="trace">'),
  ('<div class="code-tabs" id="code-1">', S("st-p1", "validParens", "code-1", ' data-flow="fig-4"'), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "minStack", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "evalRPN", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "dailyTemps", "code-4", ' data-flow="fig-6"'), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "decodeIter", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p6", "histogram", "code-6", ' data-flow="fig-8"'), 'before'),
 ],
 "recap": "stack13",
 "exercises": [
  {"title": "Why a stack for brackets", "answer": "<p>In <code>\"([{}])\"</code> the <code>{</code> is opened last, so it must be closed first; then <code>[</code>, then <code>(</code>. Closing happens in reverse order of opening: last in, first out. A queue would try to close <code>(</code> first and fail.</p>"},
  {"title": "Daily Temperatures on [5, 4, 3, 6]", "answer": "<p>i=0: stack [0]. i=1: 4 &lt; 5, stack [0, 1]. i=2: stack [0, 1, 2]. i=3: 6 pops 2 (answer 1), pops 1 (answer 2), pops 0 (answer 3), then stack [3]. Answer <code>[3, 2, 1, 0]</code>. Try it in Problem 4's animation.</p>"},
  {"title": "Next Greater Element II (circular)", "answer": "<p>Loop <code>i</code> from 0 to <code>2n − 1</code> and use <code>nums[i % n]</code>. Only push indexes during the first lap (<code>i &lt; n</code>). The second lap lets items near the end find a greater element at the start.</p>"},
  {"title": "Remove K Digits", "answer": "<p>Keep an <strong>increasing</strong> stack of digits. When a smaller digit arrives and removals remain, pop the bigger digits before it, because a smaller digit earlier always gives a smaller number. Remove any leftover k from the end, and strip leading zeros.</p>"},
  {"title": "Trapping Rain Water with a stack", "answer": "<p>Keep a decreasing stack of bar indexes. When a taller bar arrives, pop the bottom bar: the three bars are the popped bar (the floor), the new top of the stack (the left wall) and the current bar (the right wall). Water = (min(left, right) − floor) × (distance between the walls − 1).</p>"},
 ],
}

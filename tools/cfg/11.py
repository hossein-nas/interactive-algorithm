S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "11", "title": "Backtracking", "sub": "Try a choice, explore, undo it, try the next.",
 "kicker": ["Lesson 11", "Recursion family"], "stars": 3, "pattern": "Backtracking",
 "desc": "Backtracking animated as growing decision trees: subsets, permutations, combination sum, parentheses and N-Queens.",
 "glance": [("Reach for it when", "\"Generate all…\", \"every way to…\", small inputs, answers built piece by piece."),
            ("The rhythm", "Choose, explore, un-choose. Save a copy of the path, never the live one."),
            ("What it costs", "Exponential: 2ⁿ subsets, n! permutations. Pruning shrinks the tree.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', '<p>Watch the bug: every saved entry is the same array, so they all change together and end up empty.</p>\n' + S("st-bug", "buggySubsets", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p1", "subsets", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p2", "permutations", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p3", "combinationSum", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p4", "parens", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p5", "nQueens", "code-6"), 'before'),
 ],
 "recap": "back11",
 "exercises": [
  {"title": "The tree for subsets([1, 2])", "answer": "<p>Root <code>[]</code> (saved). Its children: <code>[1]</code> (saved) and <code>[2]</code> (saved). <code>[1]</code> has one child <code>[1,2]</code> (saved). <code>[2]</code> has none, because only items after 2 may follow. Four nodes, four subsets. Run the Subsets animation with <code>1 2</code>.</p>"},
  {"title": "i versus i + 1", "answer": "<p>In Combination Sum a number may be used again, so after choosing <code>candidates[i]</code> the next choice may still be <code>i</code>. In Subsets each item is used at most once, so the next choice must come strictly after it: <code>i + 1</code>. Both only move forward, which is what prevents reordered duplicates.</p>"},
  {"title": "Letter Combinations of a Phone Number", "answer": "<p>Level k chooses one letter for digit k (3 or 4 options). The path length equals the number of digits; when it is full, save the string. About <code>O(4ⁿ · n)</code> time.</p>"},
  {"title": "Word Search", "answer": "<p>Mark the current cell as visited before exploring its four neighbors, and un-mark it when you return, so other paths can use it. A common trick: overwrite the cell with a marker character and restore it afterwards.</p>"},
  {"title": "Palindrome Partitioning", "answer": "<p>The choice is <strong>where to cut next</strong>: from position <code>start</code>, try every end <code>e</code>. Only recurse when <code>s[start..e]</code> is a palindrome, which prunes every branch that starts with a non-palindrome. Save the list of pieces when <code>start</code> reaches the end.</p>"},
  {"title": "No filter for parentheses", "answer": "<p>Every partial string obeys the two rules: never more than n opens, never more closes than opens. A string of length 2n built this way has n opens and n closes and never dips below zero, which is exactly a valid string. Invalid strings are never created, so there is nothing to filter.</p>"},
 ],
}

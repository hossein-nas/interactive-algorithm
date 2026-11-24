S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "02", "title": "Big O and complexity", "sub": "How the work grows as the input grows, and how to read it straight from code.",
 "kicker": ["Lesson 02", "Foundations"], "stars": 3, "pattern": "Big O",
 "desc": "Big O with animations: growth families, loop shapes, halving, recursion trees, amortized cost and hidden costs.",
 "glance": [("The one question", "If the input gets 10 times bigger, how much more work does the code do?"),
            ("Read code fast", "After one another: add. Inside one another: multiply. Different inputs: different letters."),
            ("The traps", "Shrinking inner loops, pointers that only move forward, and built-ins that hide a loop.")],
 "inserts": [
  ('<h3 id="how-big-can', '<p>Race the families yourself. Each step makes n ten times bigger.</p>\n' + S("st-growth", "growthRace", ""), 'before'),
  ('<div class="code-tabs" id="code-1">', S("st-loops", "countPairs,countCommon", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-halving", "countHalvings,halvingWithWork", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-fib", "fibNaive,fibMemo", "code-3"), 'before'),
  ('<p>Where this shows up in interviews:</p>', S("st-doubling", "doubling", ""), 'before'),
  ('<ul>\n<li><strong>TypeScript:</strong> <code>shift()</code>', S("st-pa", "queueShift,queueSlice", "code-4", " data-clone"), 'before'),
  ('<p>The inner loop runs <code>0 + 1', S("st-pb", "triangle", "code-5", " data-clone"), 'before'),
  ('<p>Line 1 loops', S("st-pc", "countPairsMap", "code-6", " data-clone"), 'before'),
  ('<p>Each call makes two calls', S("st-pd", "countSubsets", "code-7", " data-clone"), 'before'),
  ('<p>It <em>looks</em> quadratic', S("st-pe", "atMostKZeros", "code-8", " data-clone"), 'before'),
 ],
 "recap": "bigo02",
 "exercises": [
  {"title": "Why binary search needs about 20 steps", "answer": "<p>Each look throws away half of what is left. Starting from a million, after one look about half a million remain, after two a quarter of a million, and so on. Halving a million until one item is left takes about 20 halvings, because doubling 1 twenty times gives about a million. A book twice as big needs only one more look.</p>"},
  {"title": "Why building a heap is O(n)", "hint": "Most nodes sit near the bottom of the tree. How far can a node near the bottom move?", "answer": "<p>Heapify sifts each node <em>down</em>, starting from the last parent. A node can only move as far as its height. Half of the nodes are leaves and move 0 steps, a quarter move at most 1, an eighth at most 2, and so on. The total is n/4 · 1 + n/8 · 2 + n/16 · 3 + …, which adds up to less than n. This is the same shape as the halving-with-work loop: the big work happens on few nodes, so the sum is <code>O(n)</code>, not <code>O(n log n)</code>.</p>"},
  {"title": "Four costs to state", "answer": "<ul><li>Reversing a string with <code>+=</code> in a loop (TypeScript): each <code>+=</code> may copy the whole string so far, so it can reach <code>O(n²)</code>. Collect characters in an array and <code>join</code>.</li><li>Joining with <code>strings.Builder</code> (Go): amortized <code>O(1)</code> per write, <code>O(n)</code> total.</li><li><code>Array.includes</code> inside a loop: <code>O(n · m)</code>, because <code>includes</code> is a hidden loop. Use a <code>Set</code> for <code>O(n + m)</code>.</li><li>Sorting, then scanning once: <code>O(n log n) + O(n)</code> = <code>O(n log n)</code>.</li></ul>"},
  {"title": "The call tree for fib(5)", "hint": "fib(5) calls fib(4) and fib(3). You already know how many calls fib(4) and fib(3) make.", "answer": "<p><strong>15 calls.</strong> calls(n) = 1 + calls(n − 1) + calls(n − 2), with calls(0) = calls(1) = 1: so calls(2) = 3, calls(3) = 5, calls(4) = 9, calls(5) = 15. Check it by setting the call-tree animation in section 4.4 to <code>5</code>: it ends with \"15 calls\". With the memo it drops to 9.</p>"},
 ],
}

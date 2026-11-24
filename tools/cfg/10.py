S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "10", "title": "Recursion and the call stack", "sub": "Trust the smaller problem.",
 "kicker": ["Lesson 10", "Recursion family"], "stars": 3, "pattern": "Recursion",
 "desc": "Recursion animated: the call stack as sticky notes, fast power, Pascal's triangle, nested lists, Decode String and the Tower of Hanoi.",
 "glance": [("Every recursion has", "A base case answered directly, and a recursive case on a strictly smaller input."),
            ("The mental trick", "Write the contract, then trust that the smaller call already works."),
            ("What it costs", "Time = number of calls; extra memory = the deepest the stack gets.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', '<p>Watch the stack grow and shrink. Each box is one call; the column on the left is the stack, newest on top.</p>\n' + S("st-p1", "factorial,sumList", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "myPow", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "pascal", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "flatten", "code-4"), 'before'),
  ('<table id="tbl-4">', '<table id="tbl-4" class="trace">'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "decodeString", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p6", "hanoi", "code-6"), 'before'),
 ],
 "recap": "recur10",
 "exercises": [
  {"title": "Contracts in words", "answer": "<ul><li><strong>Reverse a string:</strong> rev(s) returns s backwards. Base: length ≤ 1 → s. Step: rev(s without its first char) + first char.</li><li><strong>Palindrome:</strong> isPal(s) is true if s reads the same both ways. Base: length ≤ 1 → true. Step: first == last and isPal(the middle).</li><li><strong>Sum of digits:</strong> digits(n) for n ≥ 0. Base: n &lt; 10 → n. Step: (n mod 10) + digits(n div 10).</li></ul>"},
  {"title": "The stack of factorial(4)", "answer": "<p>While factorial(1) runs, the stack holds (top to bottom): factorial(1), factorial(2) waiting with n = 2, factorial(3) waiting with n = 3, factorial(4) waiting with n = 4. Four notes. Set the factorial animation to 4 to see it.</p>"},
  {"title": "Why fibNaive(40) is slow", "answer": "<p>Each call makes two more, so the call tree roughly doubles each level: about 2<sup>40</sup> calls, most of them repeats (fib(38) is computed twice, fib(37) three times…). Saving each answer the first time (memoization) means each n is computed once: <code>O(n)</code>. Lesson 02's call-tree animation shows both.</p>"},
  {"title": "sumList with an explicit stack", "track": True, "answer": "<p>Push the indexes (or the items) still to add; loop while the stack is not empty: pop one, add it to the total. For a flat list the stack is overkill (a loop is enough), but the same shape converts any recursion: push \"work still to do\", pop and process, push any sub-work it creates.</p>"},
  {"title": "Prove 2ⁿ − 1 moves", "answer": "<p>Let T(n) be the number of moves. Moving n disks takes T(n−1) to park, 1 for the biggest, and T(n−1) to bring them back: T(n) = 2T(n−1) + 1, with T(0) = 0. If T(n−1) = 2<sup>n−1</sup> − 1, then T(n) = 2(2<sup>n−1</sup> − 1) + 1 = 2<sup>n</sup> − 1. By induction it holds for every n.</p>"},
 ],
}

import json
WALK1 = [
 {"n":["F1","F2","F3"],"say":"Foundations first: the interview routine, Big O, and the TypeScript and Go toolkit."},
 {"n":["P1","P2","P3","P4","P5"],"say":"Core patterns on arrays and strings: hash maps, two pointers, sliding window, prefix sums, binary search."},
 {"n":["R1","R2","R3"],"say":"The recursion family: divide and conquer, the call stack, and backtracking."},
 {"n":["S1","S2","S3","S4","S5","S6","S7"],"say":"Data structures: linked lists, stacks, queues, trees, balanced trees, heaps and tries."},
 {"n":["G1","G2","G3","G4"],"say":"The graph family: BFS and DFS, topological sort, union-find and shortest paths."},
 {"n":["T1","T2","T3","T4"],"say":"Strategies: greedy, intervals, and dynamic programming in one and two dimensions."},
 {"n":["E1","E2","E3"],"say":"Extras and the wrap-up: bits, k-NN, and the pattern chooser with three mock interviews."},
]
WALK2 = [
 {"n":["A"],"say":"Every lesson opens with the idea in plain English, using an everyday comparison before any code."},
 {"n":["B"],"say":"Then the clues: the words in a problem statement that should make you think of this pattern."},
 {"n":["C"],"say":"Diagrams show the moving parts. In these pages they are animated and you can step through them."},
 {"n":["D"],"say":"Templates: the skeleton code you adapt to each problem."},
 {"n":["E"],"say":"Practice problems from easy to hard, each with brute force, key insight, trace table, both languages, complexity and follow-ups."},
 {"n":["F"],"say":"The mistakes people actually make, several of them replayed as animations."},
 {"n":["G"],"say":"Exercises to do without looking, with hints and answers hidden until you want them."},
]
WALK3 = [
 {"n":["A"],"say":"About 20 minutes: read the idea and the recognition clues."},
 {"n":["B"],"say":"For each problem read only the task, try for 10 minutes, then read the solution."},
 {"n":["C"],"say":"Close the page and re-solve from a blank page, out loud, in one language. This is the cover-and-recreate rule."},
 {"n":["D"],"say":"Next day, solve it again in the other language."},
 {"n":["E"],"say":"After 3 days and after 7 days, redo what you missed. Mark a problem Needs redo and the home page reminds you."},
]
w = lambda x: '<script type="application/json" class="walk">' + json.dumps(x) + '</script>'
CFG = {
 "id": "00", "title": "Start here", "sub": "How this guide works, how each lesson is built, and a study plan for 2 to 4 weeks.",
 "kicker": ["Lesson 00", "Start"], "stars": 0, "pattern": "Study plan",
 "desc": "Start here: how the interactive algorithm guide is organized, the five habits, and a 2 to 4 week study plan.",
 "glance": [("Who it is for", "A mid-level to senior engineer preparing for coding interviews over 2 to 4 weeks."),
            ("How to study", "Read one lesson, solve its problems, then re-solve them from a blank page, out loud."),
            ("What makes it stick", "Redo every miss after 3 days and again after 7. Your misses are your real study list.")],
 "howto": False,
 "inserts": [
  ('<figure class="diagram" id="fig-1"><pre class="mermaid-src">', '<figure class="diagram" id="fig-1">' + w(WALK1) + '<pre class="mermaid-src">'),
  ('<figure class="diagram" id="fig-2"><pre class="mermaid-src">', '<figure class="diagram" id="fig-2">' + w(WALK2) + '<pre class="mermaid-src">'),
  ('<figure class="diagram" id="fig-3"><pre class="mermaid-src">', '<figure class="diagram" id="fig-3">' + w(WALK3) + '<pre class="mermaid-src">'),
  ('<figure class="diagram" id="fig-1">', '<p>Walk through the map for a one-line summary of each family. Lessons whose interactive page is ready open when you click them.</p>\n', 'before'),
  ('<li><strong>State complexity with the reason.</strong> "<code>O(n)</code>, because each index is added and removed once."</li>\n</ol>\n',
   '<div class="quiz" data-quiz="habits00"></div>\n', 'after'),
  ('<figure class="diagram" id="fig-4">',
   '<div class="callout why"><b>Let the guide keep the schedule</b><p>Pick the 2-week or 4-week plan and a start date on the <a href="../index.html#plan">home page</a>. Each day it shows what to study, and the problems you mark <em>Needs redo</em> come back after 3 and 7 days. That is the weekly-review log from this section, kept for you.</p></div>\n', 'before'),
  ('<div class="table-wrap"><table id="tbl-4">', '<div class="quiz" data-quiz="glossary00"></div>\n', 'after_table'),
 ],
 "exercises": None,
}
# the glossary quiz goes after the glossary table: handled by replacing the end of the table
CFG["inserts"][-1] = ("</tbody></table></div>\n<p>Now begin", "</tbody></table></div>\n<div class=\"quiz\" data-quiz=\"glossary00\"></div>\n<p>Now begin")

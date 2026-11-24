import json
S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
T = lambda phases, note: f'<p>Run this mock against the clock. Read the problem above, press Start, and talk out loud through each phase.</p>\n<div class="round-timer" data-note="{note}" data-phases=\'{json.dumps(phases)}\'></div>\n'
M1 = [["Restate and clarify", 3, "Say the task back; ask about letters, sizes, overlaps"], ["Examples", 2, "Work cbaebabacd / abc by hand"], ["Brute force", 3, "Name it and its cost"], ["Pattern and design", 4, "Fixed window, need[], missing"], ["Code", 8, "Write it cleanly, narrating"], ["Test", 5, "Trace the example and the edge cases"]]
M2 = [["Restate and clarify", 4, "Unknown variables? Zero values? a/a?"], ["Model it", 6, "Variables are nodes; ratios are weighted edges"], ["Design", 5, "DFS multiplying ratios; or weighted union-find"], ["Code", 12, "Build the graph, then one search per query"], ["Test", 8, "a/c, b/a, a/e, a/a, x/x"]]
M3 = [["Restate and clarify", 4, "Substring, not subsequence; empty string?"], ["Brute force", 5, "Check every substring: O(n³) or O(n²)"], ["Insight", 8, "A stack of indexes, or two counting passes"], ["Code", 13, "Write the stack version"], ["Test", 10, "Trace )()()) and (() out loud"]]
CFG = {
 "id": "29", "title": "Pattern chooser, mock interviews and the v2 map", "sub": "Pick the tool, rehearse under a clock, and know where everything lives.",
 "kicker": ["Lesson 29", "Putting it together"], "stars": 3, "pattern": "Everything",
 "desc": "A clickable pattern chooser, a which-pattern drill, three timed mock interviews with animated solutions, and a searchable map from the v2 guides to this one.",
 "scripts": ["timer.js", "viz/graph.js"],
 "glance": [("Use the chooser", "Answer a few questions about a problem and it names the pattern and the lesson."),
            ("Rehearse", "Three mocks with phase timers: restate, examples, brute force, pattern, code, test."),
            ("Find anything", "Search the v2 map by LeetCode number, topic or v2 file.")],
 "inserts": [
  ('<figure class="diagram" id="fig-1">', '<div class="chooser" data-chooser></div>\n', 'before'),
  ('<h3 id="1-5-complexity-cheat-sheet">', '<div class="quiz" data-quiz="drill29"></div>\n', 'before'),
  ('<div class="table-wrap"><table id="tbl-6">', T(M1, "25 minutes in total. When a phase runs out, say what you would do with more time and move on."), 'before'),
  ('<div class="code-tabs" id="code-1">', S("st-m1", "anagrams", "code-1"), 'before'),
  ('<div class="table-wrap"><table id="tbl-8">', T(M2, "35 minutes in total."), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-m2", "division", "code-2"), 'before'),
  ('<div class="table-wrap"><table id="tbl-9">', T(M3, "40 minutes in total."), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-m3", "parens,parens2", "code-3"), 'before'),
  ('<h3 id="v2-guides-v3-files">', '<div class="v2-search" data-v2search></div>\n', 'before'),
 ],
 "recap": "final29",
}

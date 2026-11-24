import json
w = lambda x: '<script type="application/json" class="walk">' + json.dumps(x) + '</script>'
WALK2 = [
 {"n":["A"],"say":"Restate: one or two sentences in your own words. It catches the one interview in five lost to solving a slightly different problem."},
 {"n":["B"],"say":"Clarify: size, order, duplicates, negatives, empty input, output form, no-answer value, mutation, memory. Only the questions that could change the algorithm."},
 {"n":["C"],"say":"Example: a tiny case solved by hand, out loud, then a tricky one. Watching yourself solve it often reveals the pattern."},
 {"n":["D"],"say":"Brute force: say the slow way and its cost. Its repeated work points to the fix."},
 {"n":["E"],"say":"Improve: name the pattern and say what every variable means. If the idea does not work, step back to the brute force."},
 {"n":["F"],"say":"Code: skeleton first, clear names, empty case at the top, narrate in short phrases."},
 {"n":["G"],"say":"Test and analyze: trace the example, an edge case and the tricky branch, then state Big O with the reason. A bug sends you back to the code."},
]
PHASES = json.dumps([["Understand",5,"Read, restate, ask questions"],["Plan",8,"Brute force, a better idea, a quick trace"],["Build",17,"Write the code while narrating"],["Check",8,"Test by hand and fix bugs"],["Wrap up",7,"Complexity and follow-ups"]])
CFG = {
 "id": "01", "title": "The interview process", "sub": "How to think, talk and test out loud, with a routine that keeps you calm.",
 "kicker": ["Lesson 01", "Foundations"], "stars": 3, "pattern": "Interview routine",
 "desc": "The seven-step interview routine, edge cases, debugging aloud and a 45-minute practice timer.",
 "glance": [("The routine", "Restate, clarify, example, brute force, improve, code, test and analyze."),
            ("The split", "Only about a third of a 45-minute round is typing code."),
            ("When stuck", "Shrink the problem, draw it, say your best guess, and ask for a hint.")],
 "scripts": ["timer.js"],
 "inserts": [
  ('Candidates who start typing in minute one usually run out of time, because they have to rewrite everything when they discover a misunderstanding in minute 20.</p>\n',
   '<p>Practice the shape with a real clock. Pick any problem, start the timer, and move on when each phase runs out.</p>\n<div class="round-timer" data-phases=\'' + PHASES + '\'></div>\n', 'after'),
  ('<figure class="diagram" id="fig-2"><pre class="mermaid-src">', '<figure class="diagram" id="fig-2">' + w(WALK2) + '<pre class="mermaid-src">'),
  ('</section>\n<section class="sec" id="the-edge-case-checklist">', '<div class="quiz" data-quiz="routine01"></div>\n', 'before'),
  ('<p>Then <strong>say what every variable means</strong>', '<div class="quiz" data-quiz="chooser01"></div>\n', 'before'),
  ('</section>\n<section class="sec" id="debugging-when-your-code-is-wrong-it-will-be">', '<div class="quiz" data-quiz="edge01"></div>\n', 'before'),
  ('<div class="code-tabs" id="code-1">', '<p>Watch the candidate\'s words line up with the code. Switch to the brute-force version to see why step 4 comes before step 5.</p>\n<div class="stage" id="st-twosum" data-anim="twoSumThink,twoSumBrute" data-code="code-1"></div>\n', 'before'),
 ],
 "exercises": [
  {"title": "The seven steps from memory", "answer": "<ol><li>Restate</li><li>Clarify</li><li>Example</li><li>Brute force</li><li>Improve and name the pattern</li><li>Code</li><li>Test and analyze</li></ol><p>If you missed one, walk through the routine diagram above once more, then try again tomorrow.</p>"},
  {"title": "Steps 1 to 4 on a fresh problem", "track": True, "hint": "Set the timer above to the Understand and Plan phases only (13 minutes) and say every step out loud.", "answer": "<p>There is no single answer; check yourself against this list. Did you restate in one sentence? Did you ask at least three questions from the clarify table (size, order, duplicates, empty, output form)? Did you solve a tiny example and a tricky one by hand? Did you state the brute force <em>and</em> its cost, and say what work it repeats? If any is missing, that is the habit to practice next time.</p>", "label": "Self-check list"},
  {"title": "Edge cases for strings and trees", "answer": "<p><strong>String:</strong> the empty string; one character; all the same character; upper vs. lower case; spaces and punctuation; a very long string; non-ASCII characters (accents, emoji).</p><p><strong>Binary tree:</strong> <code>null</code> (empty tree); a single node; a left-only chain; a right-only chain; duplicate values; negative values; a perfect tree; a very deep tree (recursion depth).</p>"},
  {"title": "Why check before storing", "answer": "<p>When you look up <code>target − x</code> before inserting <code>x</code>, the map holds only the numbers before the current index, so any partner it finds is a different element. If you stored first, a number equal to <code>target / 2</code> (like 3 with target 6) would find its own index and pair itself.</p><p>Try it: run the Two Sum animation above on <code>3 3 ; 6</code>.</p>"},
 ],
}

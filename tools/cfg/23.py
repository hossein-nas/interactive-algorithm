S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "23", "title": "Greedy algorithms and NP-complete problems", "sub": "Take the best-looking step, but only when you can prove it never hurts.",
 "kicker": ["Lesson 23", "Greedy and hard problems"], "stars": 2, "pattern": "Greedy",
 "desc": "Greedy animated: earliest-end scheduling, jump games, gas station, partition labels, task scheduler, greedy set cover and the knapsack where greedy fails.",
 "viz": ["viz/timeline.js"],
 "glance": [("Reach for it when", "A local rule (earliest end, furthest reach, most coverage) never needs to be undone. Test a tiny counterexample first."),
            ("How to argue it", "An exchange argument: swapping the greedy choice into any optimal answer keeps it optimal."),
            ("When it fails", "Coin change with odd coins, 0/1 knapsack, set cover, TSP: use DP, search, or accept an approximation.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', S("st-p1", "schedule", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "canJump,jump2", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "gas", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "partition", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "tasks", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p6", "setCover", "code-6"), 'before'),
  ('<div class="code-tabs" id="code-7">', S("st-ks", "knapsack", "code-7"), 'before'),
 ],
 "recap": "greedy23",
 "exercises": [
  {"title": "When greedy change-making fails", "answer": "<p>Coins <strong>{1, 3, 4}</strong>, amount 6: greedy takes 4 + 1 + 1 (3 coins), but 3 + 3 uses 2. With US coins {1, 5, 10, 25} greedy is always optimal (each coin is worth enough of the smaller ones that taking it never hurts). For an arbitrary coin set, use DP (lesson 25).</p>"},
  {"title": "Assign Cookies", "answer": "<p>Sort children by greed and cookies by size. Two pointers: give the current (least greedy) child the <strong>smallest cookie that satisfies them</strong>; if a cookie is too small for this child, it is too small for everyone after, so skip it. Count the matches. <code>O(n log n + m log m)</code>.</p>"},
  {"title": "Minimum arrows for balloons", "answer": "<p>Sort balloons by <strong>end</strong>. Shoot the first arrow at the first balloon's end; it bursts every balloon whose start ≤ that point. When a balloon starts after the arrow, shoot a new arrow at its end. Track only the last arrow's position. It is activity selection again: the arrows are the chosen non-overlapping representatives.</p>"},
  {"title": "Boats to Save People", "answer": "<p>The heaviest person must go in some boat. The best partner for them is the lightest person: if even the lightest does not fit, nobody does, so the heaviest goes alone. If the lightest fits, pairing them uses the least capacity and leaves heavier people more options. Sort, then move the two pointers inward.</p>"},
  {"title": "Fractional versus 0/1 knapsack", "answer": "<p>With fractions you can always fill the remaining room with the item of the best <strong>value per weight</strong>, so taking that first is never wrong (exchange argument). With whole items, a high-ratio item can leave room that nothing else fits, as the last animation shows (stereo 3000 versus guitar + laptop 3500). 0/1 needs DP over capacities.</p>"},
  {"title": "Fast TSP?", "answer": "<p>Ask: <strong>is it exact or approximate</strong> (a heuristic like nearest neighbor or 2-opt), and <strong>how close to optimal is it guaranteed</strong>, or was it just measured on some inputs? An exact polynomial algorithm would prove P = NP.</p>"},
 ],
}

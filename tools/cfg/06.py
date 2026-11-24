S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "06", "title": "Sliding window", "sub": "Keep a useful stretch of neighbors, and slide it forward.",
 "kicker": ["Lesson 06", "Core patterns on arrays and strings"], "stars": 3, "pattern": "Sliding window",
 "desc": "Sliding window animated: fixed and variable windows, longest substring, minimum window substring and the classic bugs.",
 "glance": [("Reach for it when", "A contiguous subarray or substring, with longest, shortest, at most k, or every window of size k."),
            ("The template", "Grow <code>right</code>; while the rule breaks, shrink <code>left</code>; then record."),
            ("What it costs", "<code>O(n)</code>: each item enters once and leaves once, even with the inner <code>while</code>.")],
 "added": "added-06.md", "added_names": ["ex3", "ex5"],
 "inserts": [
  ('</section>\n<section class="sec" id="the-template-for-a-variable-window">', '<div class="quiz" data-quiz="window06"></div>\n', 'before'),
  ('<div class="code-tabs" id="code-1">', '<p>Step through both skeletons. In the variable version, the decision map below the stage shows the template\'s loop.</p>\n' + S("st-skel", "fixedWindow,varWindow", "code-1", ' data-flow=",fig-3"'), 'before'),
  ('<p>The code is <code>bestSumOfSizeK</code>', S("st-p1", "fixedWindow", "code-1", " data-clone"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "longestNoRepeat", "code-2", ' data-flow="fig-4"'), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "minSubArray", "code-3", ' data-flow="fig-5"'), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "kDistinct", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "charReplace", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p6", "minWindow", "code-6", ' data-flow="fig-7"'), 'before'),
  ('</section>\n<section class="sec" id="try-it-without-looking">', '<div class="callout bug"><b>Watch these bugs happen</b><p>Each button jumps to the animation and replays the mistake on an input that exposes it.</p><div class="presets"><button class="chip bug" data-bug="st-p2:0">Moving left backward (abba)</button><button class="chip bug" data-bug="st-p4:0">Not deleting a key at zero</button><button class="chip bug" data-bug="st-p3:0">A window with negative numbers</button></div></div>\n', 'before'),
 ],
 "exercises": [
  {"title": "The rule, and where to record", "answer": "<ol><li><strong>Max sum of size k:</strong> fixed size k; record after each slide.</li><li><strong>No repeating characters:</strong> no character twice in the window; longest, so record after adjusting <code>left</code>.</li><li><strong>Minimum size subarray sum:</strong> sum ≥ target; shortest, so record inside the shrink loop.</li><li><strong>At most k distinct:</strong> the count map has at most k keys; longest, record after the loop.</li><li><strong>Character replacement:</strong> length − maxCount ≤ k; longest, record after the loop.</li><li><strong>Minimum window substring:</strong> missing = 0; shortest, record inside the loop.</li></ol>"},
  {"title": "Why positives only", "hint": "Find an input where shrinking the window makes the sum bigger.", "answer": "<p>The algorithm assumes that removing an item from the left can only lower the sum, so once the sum drops below the target it stops shrinking. A negative number breaks that. Counter-example: <code>[1, -1, 3]</code>, target 3. The window reaches sum 3 at <code>[1, -1, 3]</code> (length 3), removes 1 (sum 2), and stops. But <code>[3]</code> alone has length 1. Removing the −1 would have <em>raised</em> the sum. The bug replay in Problem 3 shows another case.</p>"},
  {"title": "Permutation in String", "track": True, "hint": "Keep a window exactly as long as t, and the same missing-count trick as Minimum Window Substring.", "answer": "<p>A fixed window of size <code>|t|</code> slides over <code>s</code>. <code>need[c]</code> starts as the letter counts of <code>t</code>; <code>missing</code> starts at <code>|t|</code>. When a letter enters and <code>need[c]</code> was positive, <code>missing--</code>; when a letter leaves and <code>need[c]</code> becomes positive again, <code>missing++</code>. If <code>missing</code> hits 0, the window is a permutation. <code>O(|s|)</code> time, 26 counters.</p>" + S("st-ex3", "permInString", "code-ex3") + "{{code:ex3}}"},
  {"title": "Fruit Into Baskets in disguise", "answer": "<p>It is <strong>Problem 4 with k = 2</strong>: the longest subarray with at most two distinct values (two baskets, one fruit type each). Same counts map, delete a key at zero, record after the shrink loop.</p>"},
  {"title": "Count subarrays with sum below k", "track": True, "hint": "When the window [left, right] is valid, how many valid subarrays end exactly at right?", "answer": "<p>Grow <code>right</code>; while the sum is at least <code>k</code>, shrink from the left. Now every subarray that ends at <code>right</code> and starts anywhere from <code>left</code> to <code>right</code> has a smaller sum (all numbers are positive), so add <code>right − left + 1</code> to the count. <code>O(n)</code> time.</p>" + S("st-ex5", "countBelow", "code-ex5") + "{{code:ex5}}"},
 ],
}

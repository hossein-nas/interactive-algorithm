S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "07", "title": "Prefix sums", "sub": "Answer any range by subtracting two running totals.",
 "kicker": ["Lesson 07", "Core patterns on arrays and strings"], "stars": 3, "pattern": "Prefix sums",
 "desc": "Prefix sums animated: range queries, product except self, subarray sum equals k, 2D prefix sums and difference arrays.",
 "glance": [("The formula", "<code>prefix[0] = 0</code>; sum of <code>nums[l..r]</code> = <code>prefix[r+1] − prefix[l]</code>."),
            ("With a map", "Count subarrays with sum k by looking up <code>prefix − k</code>. Works with negatives."),
            ("What it costs", "<code>O(n)</code> to build once, then <code>O(1)</code> per range query.")],
 "added": "added-07.md", "added_names": ["ex3", "ex4"],
 "inserts": [
  ('</section>\n<section class="sec" id="reusable-templates">', '<div class="quiz" data-quiz="prefix07"></div>\n', 'before'),
  ('<div class="code-tabs" id="code-1">', S("st-basics", "prefixBasics", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p1", "numArray", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p2", "productExceptSelf", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p3", "subarraySum", "code-4", ' data-flow="fig-4"'), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p4", "contiguousArray", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p5", "numMatrix", "code-6"), 'before'),
  ('<div class="code-tabs" id="code-7">', S("st-p6", "flightBookings", "code-7"), 'before'),
  ('<table id="tbl-5">', '<table id="tbl-5" class="trace">'),
  ('</section>\n<section class="sec" id="try-it-without-looking">', '<div class="callout bug"><b>Watch these bugs happen</b><div class="presets"><button class="chip bug" data-bug="st-p3:0">No {0: 1} seed</button><button class="chip bug" data-bug="st-p3:1">Storing before looking up</button></div></div>\n', 'before'),
 ],
 "exercises": [
  {"title": "Why both ends are included", "answer": "<p><code>prefix[r + 1]</code> is the total of <code>nums[0..r]</code>, which includes <code>r</code>. <code>prefix[l]</code> is the total of <code>nums[0..l−1]</code>, which stops just before <code>l</code>. Subtracting removes exactly the items before <code>l</code>, so what remains is <code>nums[l..r]</code> with both ends.</p>"},
  {"title": "Why the map starts as {0: 1}", "answer": "<p>The seed stands for the empty prefix before the array. Without it, a subarray that starts at index 0 has nothing to match. Example: <code>[5]</code>, <code>k = 5</code>. At index 0, prefix = 5 and we look up 5 − 5 = 0. With the seed we find it once and count the subarray <code>[5]</code>; without it the answer is 0, which is wrong. Use the \"No {0: 1} seed\" replay in Problem 3 to watch it fail.</p>"},
  {"title": "Find Pivot Index", "track": True, "hint": "If you know the total and the sum to the left of i, what is the sum to the right?", "answer": "<p>Compute the total once. Walk left to right keeping <code>leftSum</code>; the right side is <code>total − leftSum − nums[i]</code>. Return the first <code>i</code> where they are equal. <code>O(n)</code> time, <code>O(1)</code> space.</p>" + S("st-ex3", "pivotIndex", "code-ex3") + "{{code:ex3}}"},
  {"title": "Subarray Sums Divisible by K", "track": True, "hint": "Two subarray boundaries give a sum divisible by k exactly when their prefixes have the same remainder.", "answer": "<p>Two details from this lesson: the map seeded with remainder 0 seen once (the empty prefix), and the <strong>positive modulo</strong> <code>((prefix % k) + k) % k</code> from lesson 03, because a negative prefix would otherwise give a negative remainder that never matches. Count how many earlier prefixes have the same remainder.</p>{{code:ex4}}"},
  {"title": "Why the difference array is fast", "answer": "<p>Each update touches only its two edges, <code>diff[first] += v</code> and <code>diff[last + 1] −= v</code>, no matter how long the range is: <code>O(1)</code> per update. One prefix-sum pass at the end (<code>O(n)</code>) turns the edges into actual values. A thousand updates cost a thousand constant steps plus one sweep, instead of up to a thousand times n.</p>"},
 ],
}

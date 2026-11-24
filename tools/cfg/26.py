S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "26", "title": "Dynamic programming, part 2: two dimensions", "sub": "When one index is not enough, fill a table cell by cell.",
 "kicker": ["Lesson 26", "Dynamic programming"], "stars": 3, "pattern": "2-D DP",
 "desc": "Two-dimensional DP animated: grid paths, the book's knapsack grid with read-back, subset sums, LCS and the common substring, edit distance, an interval table and regex matching.",
 "glance": [("Reach for it when", "Two strings, a grid, items and a capacity, or a range i..j: the answer depends on two indexes."),
            ("The table", "<code>dp[i][j]</code> answers the question for the first i of one thing and the first j of the other. Pad row 0 and column 0 for the empty case."),
            ("What it costs", "Cells × work per cell, usually <code>O(m × n)</code>; often one or two rolling rows of memory.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', S("st-p1", "uniquePaths,minPath", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "knap,partition", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "lcs,substr", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "edit", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "palin", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p6", "regex", "code-6"), 'before'),
 ],
 "recap": "dp26",
 "exercises": [
  {"title": "Fill an LCS table by hand", "answer": "<p>The bottom-right cell is <strong>4</strong>, and walking back along the matches spells <strong>\"GTAB\"</strong>. Check every cell with the second preset of the LCS animation (it uses lowercase: <code>aggtab ; gxtxayb</code>).</p>"},
  {"title": "Why high to low", "answer": "<p>With one array, <code>best[w − weight]</code> must still hold the value <em>without</em> the current item. Going from high capacities to low, every cell you read is to the left of the ones written so far this pass, so it is still the previous row. Going upward, the cell you read may already include this item, so the item could be taken twice (that is the unbounded knapsack). The bug replay on Partition shows exactly that.</p>"},
  {"title": "Longest Palindromic Substring", "answer": "<p><strong>Expand around each center</strong>: there are 2n − 1 centers (each letter, and each gap between letters). From a center, move left and right while the two letters match; record the longest stretch. <code>O(n²)</code> time and only a few index variables, so <code>O(1)</code> extra space, while the table version needs <code>O(n²)</code> memory.</p>"},
  {"title": "Target Sum as subset counting", "answer": "<p>Split the numbers into a plus group (sum P) and a minus group (sum S − P). Then P − (S − P) = target, so <strong>P = (S + target) / 2</strong>. If that is negative or not a whole number, the answer is 0. Otherwise count subsets summing to P: <code>ways[0] = 1</code>, and for each number loop sums high to low with <code>ways[s] += ways[s − x]</code>.</p>"},
  {"title": "Wildcard Matching", "answer": "<p>The star line changes. In wildcard matching a <code>*</code> stands alone and matches any sequence, so <code>dp[i][j] = dp[i][j−1]</code> (the star matches nothing) <code>|| dp[i−1][j]</code> (it eats one more letter of s). There is no \"previous character\" to check, and row 0 is true only while the pattern is all stars.</p>"},
  {"title": "Distinct Subsequences", "answer": "<p><code>dp[i][j]</code> = the number of ways the first j letters of t appear as a subsequence of the first i letters of s. Base: <code>dp[i][0] = 1</code> (empty t), <code>dp[0][j] = 0</code> for j &gt; 0. If <code>s[i−1] === t[j−1]</code>: <code>dp[i][j] = dp[i−1][j−1] + dp[i−1][j]</code> (use this letter, or skip it). Otherwise <code>dp[i][j] = dp[i−1][j]</code> (skip it).</p>"},
 ],
}

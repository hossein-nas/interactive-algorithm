S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "25", "title": "Dynamic programming, part 1: one dimension", "sub": "Solve each smaller question once, write it down, and build up.",
 "kicker": ["Lesson 25", "Dynamic programming"], "stars": 3, "pattern": "1-D DP",
 "desc": "One-dimensional DP animated: climbing stairs four ways (recursion tree, memo, table, two variables), house robber, coin change, LIS, word break and maximum subarray.",
 "glance": [("Reach for it when", "\"How many ways\", \"the minimum or maximum\", \"is it possible\", and the choices overlap: the same smaller question keeps coming back."),
            ("The recipe", "Say what <code>dp[i]</code> means; write the recurrence from the last choice; set the base case; pick the fill order; read the answer."),
            ("What it costs", "Usually states × choices per state; often <code>O(n)</code> memory, or <code>O(1)</code> with rolling variables.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', S("st-p1", "climbNaive,climbMemo,climbTable,climbRoll", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "rob", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "coinChange,change", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "lisQuad,lisTails", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "wordBreak", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p6", "kadane,maxProd", "code-6"), 'before'),
 ],
 "recap": "dp25",
 "exercises": [
  {"title": "Six problems in one breath", "answer": "<ul><li><strong>Stairs:</strong> ways[i] = ways to reach step i; ways[i−1] + ways[i−2]; ways[1] = 1, ways[2] = 2.</li><li><strong>Robber:</strong> best[i] = most money from the first i houses; max(best[i−1], best[i−2] + nums[i−1]); best[0] = 0.</li><li><strong>Coin change:</strong> fewest[a] = fewest coins for amount a; min over coins of fewest[a − c] + 1; fewest[0] = 0, the rest ∞.</li><li><strong>LIS:</strong> len[i] = longest increasing subsequence ending at i; 1 + max len[j] over j &lt; i with nums[j] &lt; nums[i]; each len starts at 1; answer max len.</li><li><strong>Word break:</strong> can[i] = the first i letters split; true if some j has can[j] and s[j..i) a word; can[0] = true.</li><li><strong>Max subarray:</strong> end[i] = best sum ending at i; max(nums[i], end[i−1] + nums[i]); end[0] = nums[0]; answer max end.</li></ul>"},
  {"title": "Decode Ways", "answer": "<p><code>dp[i]</code> = the number of ways to decode the first i digits; <code>dp[0] = 1</code>. Take <strong>one</strong> digit if it is 1–9: add <code>dp[i−1]</code>. Take <strong>two</strong> digits if they form 10–26 (so the first is not 0): add <code>dp[i−2]</code>. For \"226\": dp = 1, 1, 2, 3.</p>"},
  {"title": "Min Cost Climbing Stairs", "answer": "<p>It is <strong>Climbing Stairs with a cost</strong> (and House Robber's \"from one or two back\" shape): <code>cost to reach i = cost[i] + min(reach[i−1], reach[i−2])</code>, answer <code>min(reach[n−1], reach[n−2])</code>. Two rolling variables suffice.</p>"},
  {"title": "Extra state beside len[i]", "answer": "<p><strong>Number of LIS (673):</strong> also keep <code>count[i]</code>, how many subsequences of length len[i] end at i. When len[j] + 1 beats len[i], copy count[j]; when it ties, add count[j]. <strong>Longest arithmetic subsequence:</strong> the state needs the <strong>difference</strong>: <code>dp[i][d]</code> = length of the longest arithmetic subsequence ending at i with step d (a map per index).</p>"},
  {"title": "1, 2 or 3 steps", "answer": "<p>The recurrence gains a term: <code>ways[i] = ways[i−1] + ways[i−2] + ways[i−3]</code>, with bases ways[0] = 1, ways[1] = 1, ways[2] = 2 (or start at 0 with ways[0] = 1 and treat negative indices as 0). The rolling version keeps <strong>three</strong> variables and slides them each step.</p>"},
  {"title": "Counts and loop order", "answer": "<p>It is a <em>count</em> because the recurrence adds the counts of sub-answers instead of taking a min or max. Coins in the outer loop build every combination in one fixed coin order, so {1, 2} is counted once. Amounts in the outer loop let any coin be last at every amount, so 1+2 and 2+1 are counted separately: that is permutations (Combination Sum IV, LeetCode 377).</p>"},
 ],
}

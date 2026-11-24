#!/usr/bin/env python3
"""One-time assembly of lessons/05-two-pointers.html from the converted draft plus hand-written additions.
After this runs once, the HTML file is maintained by hand."""
import re, html, sys, os

SP = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
draft = open(os.path.join(SP, "05-draft.html"), encoding="utf-8").read()
added = open(os.path.join(SP, "added-05.md"), encoding="utf-8").read()
blocks = re.findall(r"^```(ts|go)\n(.*?)^```", added, re.S | re.M)
pairs = [(blocks[i][1].rstrip("\n"), blocks[i + 1][1].rstrip("\n")) for i in range(0, len(blocks), 2)]
assert all(blocks[i][0] == "ts" and blocks[i + 1][0] == "go" for i in range(0, len(blocks), 2))
names = ["trap-arrays", "ex2", "ex3", "ex4", "ex5"]
caps = ["prefix-array version", "", "", "", ""]


def code_tabs(name, cap):
    ts, go = pairs[names.index(name)]
    c = f' data-caption="{cap}"' if cap else ""
    return (f'<div class="code-tabs" id="code-{name}">\n<pre data-lang="ts"{c}><code class="language-ts">{html.escape(ts, quote=False)}</code></pre>\n'
            f'<pre data-lang="go"><code class="language-go">{html.escape(go, quote=False)}</code></pre>\n</div>')


def sub(old, new, count=1):
    global draft
    assert draft.count(old) >= 1, f"anchor not found: {old[:80]}"
    draft = draft.replace(old, new, count)


INKS = ('<div class="inks"><span class="ink p1"><i></i>left, low, slow, write, i</span><span class="ink p2"><i></i>right, high, fast, read, j</span>'
        '<span class="ink focus"><i></i>being looked at</span><span class="ink anchor"><i></i>fixed for now</span><span class="ink done"><i></i>discarded or skipped</span>'
        '<span class="ink answer"><i></i>answer</span><span class="ink bug"><i></i>a bug</span></div>')

# ---- hero ----
m = re.match(r"<h1>.*?</h1>\n(<blockquote>.*?</blockquote>)\n", draft, re.S)
book = m.group(1)
draft = draft[m.end():]
hero = f'''<header class="lesson-hero">
<div class="kicker"><span>Lesson 05</span><span>Core patterns on arrays and strings</span><span class="stars" title="Very likely to appear in interviews">★★★</span></div>
<h1>Two pointers</h1>
<p class="sub">Move a pointer only when you can prove it is safe.</p>
{book}
<div class="glance">
<div><b>Reach for it when</b><p>The data is sorted, the work must happen in place, or the problem is symmetric, like a palindrome.</p></div>
<div><b>The sentence to say</b><p>"This candidate can be thrown away because…" Every move needs that reason.</p></div>
<div><b>What it costs</b><p><code>O(n)</code> time and <code>O(1)</code> memory: each step moves a pointer, and no pointer ever moves back.</p></div>
</div>
<div class="callout analogy"><b>How to use the animations</b><p>Press play, or click a stage and step with the arrow keys. Turn on <em>Predict the next move</em> to guess each decision before it is shown. Type your own input to test an idea. The colors mean the same thing in every lesson:</p>{INKS}</div>
</header>
'''
draft = hero + draft

# ---- 1. idea: people analogy ----
sub('is the heart of the pattern.</p>\n',
    'is the heart of the pattern.</p>\n<p>Watch it happen. Each look sends one person away for good, so the line shrinks by one every step.</p>\n'
    '<div class="stage" id="st-people" data-anim="heightsLine"></div>\n')

FLAV = '''<div class="flavors">
<a href="#st-templates" data-variant="0"><svg class="mini" viewBox="0 0 196 64" aria-hidden="true">
<rect class="c" x="8" y="6" width="26" height="26" rx="4"/><rect class="c" x="38" y="6" width="26" height="26" rx="4"/><rect class="c" x="68" y="6" width="26" height="26" rx="4"/><rect class="c" x="98" y="6" width="26" height="26" rx="4"/><rect class="c" x="128" y="6" width="26" height="26" rx="4"/><rect class="c" x="158" y="6" width="26" height="26" rx="4"/>
<path class="a1" d="M21 50 H58"/><path class="h1" d="M58 45 L66 50 L58 55 Z"/><path class="a2" d="M171 50 H134"/><path class="h2" d="M134 45 L126 50 L134 55 Z"/></svg>
<b>Opposite ends</b><span>The pointers walk toward each other. Templates, and Problems 1, 4, 5 and 6.</span></a>
<a href="#st-templates" data-variant="1"><svg class="mini" viewBox="0 0 196 64" aria-hidden="true">
<rect class="c d" x="8" y="6" width="26" height="26" rx="4"/><rect class="c d" x="38" y="6" width="26" height="26" rx="4"/><rect class="c" x="68" y="6" width="26" height="26" rx="4"/><rect class="c" x="98" y="6" width="26" height="26" rx="4"/><rect class="c" x="128" y="6" width="26" height="26" rx="4"/><rect class="c" x="158" y="6" width="26" height="26" rx="4"/>
<path class="a1" d="M81 50 H108"/><path class="h1" d="M108 45 L116 50 L108 55 Z"/><path class="a2" d="M141 44 H168"/><path class="h2" d="M168 39 L176 44 L168 49 Z"/></svg>
<b>Same direction</b><span>One pointer reads, one writes; the finished part grows behind the writer. Problem 2.</span></a>
<a href="#p3"><svg class="mini" viewBox="0 0 196 64" aria-hidden="true">
<rect class="c z0" x="8" y="6" width="26" height="26" rx="4"/><rect class="c z0" x="38" y="6" width="26" height="26" rx="4"/><rect class="c z1" x="68" y="6" width="26" height="26" rx="4"/><rect class="c zu" x="98" y="6" width="26" height="26" rx="4"/><rect class="c zu" x="128" y="6" width="26" height="26" rx="4"/><rect class="c z2" x="158" y="6" width="26" height="26" rx="4"/>
<path class="zl" d="M10 44 V50 H62 V44"/><path class="zl" d="M70 44 V50 H92 V44"/><path class="zl u" d="M100 44 V50 H152 V44"/><path class="zl" d="M160 44 V50 H182 V44"/></svg>
<b>Partition</b><span>Pointers split the array into zones, like the Dutch flag. Problem 3.</span></a>
</div>
'''
sub('<div class="table-wrap"><table id="tbl-1">', FLAV + '<div class="table-wrap"><table id="tbl-1">')

# ---- 2. recognize: quiz at end of section ----
sub('or use the map.</p>\n</section>', 'or use the map.</p>\n<div class="quiz" data-quiz="recognize05"></div>\n</section>')

# ---- 3. proof habit: pointer to the linked map ----
sub('</figure>\n</section>\n<section class="sec" id="reusable-templates">',
    '</figure>\n<div class="callout why"><b>See the proof run</b><p>The Pair Sum animation in <a href="#p1">Problem 1</a> carries a copy of this map. As it runs, the branch being taken lights up, so every move comes with its reason.</p></div>\n</section>\n<section class="sec" id="reusable-templates">')

# ---- 4. templates ----
sub('<div class="code-tabs" id="code-1">',
    '<p>Step through both skeletons. The code beside the picture follows along one line at a time; switch between TypeScript and Go at the top of the page.</p>\n'
    '<div class="stage" id="st-templates" data-anim="reverseString,readWrite" data-code="code-1" data-title="The basic skeletons"></div>\n<div class="code-tabs" id="code-1">')

# ---- problems: a stage right before each solution ----
stages = {
    2: '<div class="stage" id="st-p1" data-anim="pairSum" data-code="code-2" data-flow="fig-3"></div>',
    3: '<div class="stage" id="st-p2" data-anim="removeDuplicates" data-code="code-3" data-flow="fig-4"></div>',
    4: '<div class="stage" id="st-p3" data-anim="sortColors" data-code="code-4"></div>',
    5: '<div class="stage" id="st-p4" data-anim="threeSum" data-code="code-5" data-flow="fig-6"></div>',
    6: '<div class="stage" id="st-p5" data-anim="maxArea" data-code="code-6" data-flow="fig-7"></div>',
}
for k, s in stages.items():
    sub(f'<div class="code-tabs" id="code-{k}">', s + f'\n<div class="code-tabs" id="code-{k}">')
sub('<div class="code-tabs" id="code-7">',
    '<p>Both versions are animated below. Switch between them with the buttons at the top of the stage.</p>\n' + code_tabs("trap-arrays", "prefix-array version") + '\n'
    '<div class="stage" id="st-p6" data-anim="trapRain,trapArrays" data-code="code-7,code-trap-arrays" data-flow="fig-9,fig-8"></div>\n<div class="code-tabs" id="code-7">')

# ---- common mistakes: bug replays ----
sub('<li><strong>Sorting a copy vs. the original:</strong> know whether the caller\'s array may be changed.</li>\n</ul>',
    '<li><strong>Sorting a copy vs. the original:</strong> know whether the caller\'s array may be changed.</li>\n</ul>\n'
    '<div class="callout bug"><b>Watch these bugs happen</b><p>Each button jumps to the matching animation and replays the buggy version on an input that exposes it.</p>'
    '<div class="presets"><button class="chip bug" data-bug="st-p3:0">Moving mid after swapping with high</button><button class="chip bug" data-bug="st-p4:0">No duplicate skipping in 3Sum</button>'
    '<button class="chip bug" data-bug="st-p4:1">Skipping before recording</button><button class="chip bug" data-bug="st-p5:0">Moving the taller line</button></div></div>')

# ---- try it without looking: exercises ----
old_ol = re.search(r'<section class="sec" id="try-it-without-looking">\n<h2>Try it without looking</h2>\n<ol>.*?</ol>\n<p><strong>Previous:.*?</p>\n</section>', draft, re.S)
assert old_ol
EX = f'''<section class="sec" id="try-it-without-looking">
<h2>Try it without looking</h2>
<p>Try each one on paper or in an editor first. Open the hint only when you are stuck, and the answer only after you have an attempt.</p>
<div class="exercise" id="ex1">
<h3>1 · Say why each move is safe</h3>
<p>State out loud the "why safe" argument for pair sum, container with most water, and trapping rain water. Each one in two sentences.</p>
<details class="reveal"><summary>Show model answers</summary><div class="reveal-body">
<p><strong>Pair sum.</strong> When the sum is too small, <code>nums[left]</code> is already paired with the biggest value left and still falls short, so no partner can work for it: discard it. When the sum is too big, <code>nums[right]</code> overshoots even with the smallest value left, so discard it.</p>
<p><strong>Container with most water.</strong> The water is limited by the shorter line, and moving inward only shrinks the width. Any container that keeps the shorter line is narrower and no taller, so it can never beat the current one: discard that line.</p>
<p><strong>Trapping rain water.</strong> If <code>h[left] &lt; h[right]</code>, there is a wall on the right at least <code>h[right]</code> tall, so the water at <code>left</code> is decided by <code>leftMax</code> alone and can be settled now. The same argument, mirrored, settles <code>right</code> when <code>h[right] ≤ h[left]</code>.</p>
</div></details>
</div>
<div class="exercise" id="ex2" data-track>
<h3>2 · Move Zeroes (LeetCode 283)</h3>
<p>Move all zeros to the end, keep the order of the rest, in place. Which flavor is it?</p>
<details class="reveal"><summary>Hint</summary><div class="reveal-body"><p>Which part of the array is "finished" as you go? Keep one pointer at the next free slot for a non-zero.</p></div></details>
<details class="reveal"><summary>Answer, animation and code</summary><div class="reveal-body">
<p>It is the <strong>same-direction (read/write)</strong> flavor. <code>read</code> visits every value; each non-zero is swapped into <code>write</code>. The non-zeros keep their order and the zeros drift to the back. Swapping instead of copying means no second pass to fill in zeros. <code>O(n)</code> time, <code>O(1)</code> memory.</p>
<div class="stage" id="st-ex2" data-anim="moveZeroes" data-code="code-ex2"></div>
{code_tabs("ex2", "")}
</div></details>
</div>
<div class="exercise" id="ex3" data-track>
<h3>3 · Valid Palindrome (LeetCode 125)</h3>
<p>Ignore non-letters and case. Write it with opposite ends in both languages.</p>
<details class="reveal"><summary>Hint</summary><div class="reveal-body"><p>Before comparing, let each pointer skip past anything that is not a letter or digit.</p></div></details>
<details class="reveal"><summary>Answer, animation and code</summary><div class="reveal-body">
<p>Opposite ends. Skip characters that are not letters or digits on either side, then compare the two characters in lower case, and return <code>false</code> at the first mismatch. The loop uses <code>left &lt; right</code>: the middle character of an odd-length string needs no partner. <code>O(n)</code> time, <code>O(1)</code> memory.</p>
<div class="stage" id="st-ex3" data-anim="isPalindrome" data-code="code-ex3"></div>
{code_tabs("ex3", "")}
</div></details>
</div>
<div class="exercise" id="ex4" data-track>
<h3>4 · Merge Sorted Array (LeetCode 88)</h3>
<p>Merge two sorted arrays into one. What happens when you merge from the <strong>back</strong> into an array with spare room?</p>
<details class="reveal"><summary>Hint</summary><div class="reveal-body"><p>Merging from the front would overwrite values of <code>nums1</code> you have not read yet. Where is the empty space?</p></div></details>
<details class="reveal"><summary>Answer, animation and code</summary><div class="reveal-body">
<p>The spare room is at the back, so fill it from the back: compare the last real values of both arrays and put the bigger one at <code>write</code>. A write never lands on a value you still need. When <code>nums2</code> runs out, what is left of <code>nums1</code> is already in place; if <code>nums1</code> runs out first, the loop keeps copying <code>nums2</code>. <code>O(m + n)</code> time, <code>O(1)</code> extra memory.</p>
<div class="stage" id="st-ex4" data-anim="mergeSorted" data-code="code-ex4"></div>
{code_tabs("ex4", "")}
</div></details>
</div>
<div class="exercise" id="ex5" data-track>
<h3>5 · 3Sum Closest (LeetCode 16)</h3>
<p>Modify the 3Sum loop to track the closest sum.</p>
<details class="reveal"><summary>Hint</summary><div class="reveal-body"><p>Same loop as 3Sum. Instead of a list of triplets, what single value do you remember?</p></div></details>
<details class="reveal"><summary>Answer and code</summary><div class="reveal-body">
<p>Keep <code>best</code>, the sum closest to the target so far. For each sum, replace <code>best</code> when <code>|sum − target|</code> is smaller, return at once on an exact match, and otherwise move <code>left</code> or <code>right</code> toward the target, exactly as in 3Sum. Duplicate skipping is optional here because only a sum is returned. <code>O(n²)</code> time.</p>
{code_tabs("ex5", "")}
</div></details>
</div>
<h3 id="check-yourself">Check yourself</h3>
<div class="quiz" data-quiz="recap05"></div>
<nav class="pager" data-auto aria-label="Previous and next lesson"></nav>
</section>'''
draft = draft[: old_ol.start()] + EX + draft[old_ol.end():]

HEAD = '''<!doctype html>
<html lang="en" data-root="../" data-lesson="05" data-pattern="Two pointers">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>05 Two pointers | Algorithm guide</title>
<meta name="description" content="Two pointers, step by step: animations you can drive, code that follows along, and checks to test yourself.">
<script>try{var t=localStorage.getItem("algov3:theme");if(t)document.documentElement.setAttribute("data-theme",JSON.parse(t));}catch(e){}</script>
<link rel="stylesheet" href="../assets/css/theme.css">
<link rel="stylesheet" href="../assets/css/components.css">
</head>
<body>
<header class="topbar"></header>
<div class="shell">
<nav class="rail rail-left" aria-label="All lessons"></nav>
<main id="main">
<article class="lesson">
'''
FOOT = '''
</article>
</main>
<aside class="rail rail-right" aria-label="On this page"></aside>
</div>
<script src="../assets/js/core.js"></script>
<script src="../lib/prism-core.min.js"></script>
<script src="../lib/prism-clike.min.js"></script>
<script src="../lib/prism-javascript.min.js"></script>
<script src="../lib/prism-typescript.min.js"></script>
<script src="../lib/prism-go.min.js"></script>
<script src="../lib/prism-bash.min.js"></script>
<script src="../lib/mermaid.min.js"></script>
<script src="../assets/js/progress.js"></script>
<script src="../assets/js/diagrams.js"></script>
<script src="../assets/js/stage.js"></script>
<script src="../assets/js/viz/array.js"></script>
<script src="../assets/js/viz/bars.js"></script>
<script src="../assets/js/quiz.js"></script>
<script src="../assets/js/lessons/05.js"></script>
</body>
</html>
'''
open(OUT, "w", encoding="utf-8").write(HEAD + draft + FOOT)
print("wrote", OUT, len(HEAD + draft + FOOT), "bytes")

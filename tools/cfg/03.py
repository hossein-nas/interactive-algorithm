S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "03", "title": "Language toolkit: TypeScript and Go", "sub": "The moves you need in a coding round, side by side, and the gotchas that cost minutes.",
 "kicker": ["Lesson 03", "Foundations"], "stars": 3, "pattern": "Language toolkit",
 "desc": "TypeScript and Go side by side: arrays, slices, strings, maps, queues, heaps and integer gotchas, with animated traps.",
 "glance": [("Sequences", "TS arrays copy on <code>slice</code>; Go sub-slices share memory until you <code>copy</code>."),
            ("Lookups", "TS <code>Map</code> keeps insertion order; Go maps are random and return zero for missing keys."),
            ("Priority", "TypeScript has no heap, so you write one; Go has <code>container/heap</code>.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', '<p>Watch both traps happen. The first version is the TypeScript one; switch to the second for Go.</p>\n' + S("st-traps", "fillTrap,sliceAlias", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-letters", "letterCounts", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-queue", "queueHead", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-heap", "minHeap", "code-5"), 'before'),
  ('</section>\n<section class="sec" id="try-it-without-looking">', '<div class="quiz" data-quiz="toolkit03"></div>\n', 'before'),
 ],
 "exercises": [
  {"title": "Write a heap from memory", "track": True, "hint": "Push: append, then swap with the parent while smaller. Pop: save the root, move the last item to the root, then swap with the smaller child while bigger.", "answer": "<p>Compare your code with section 5 line by line. The parts people forget: the parent index <code>(i - 1) &gt;&gt; 1</code>; checking that a child exists before comparing it; handling the case where the heap had one item (after <code>pop</code> the array is empty, so do not write to index 0). In Go: <code>Len</code>, <code>Less</code>, <code>Swap</code>, and pointer-receiver <code>Push</code> and <code>Pop</code>, where <code>Pop</code> removes the <em>last</em> element.</p><p>Step through the heap animation above and predict each swap before you press next.</p>"},
  {"title": "From shift() to a head index", "answer": "<p>Keep the array and an integer <code>head</code>. <code>push</code> appends; <code>shift</code> returns <code>items[head]</code> and increments <code>head</code>; the size is <code>items.length - head</code>. The original is <code>O(n²)</code> overall because each <code>shift()</code> moves every remaining item one slot left, which is <code>(n−1) + (n−2) + … + 1</code> moves for <code>n</code> shifts. Lesson 02, Problem A animates exactly that.</p>"},
  {"title": "Letter counts for banana", "answer": "<p>a = 3, b = 1, n = 2, every other slot 0. Slot index = character code minus the code of <code>'a'</code>: <code>s.charCodeAt(i) - 97</code> in TypeScript, <code>s[i] - 'a'</code> in Go. The letter-count animation in section 2 shows it step by step.</p>"},
  {"title": "What heap.Pop returns", "answer": "<p><code>heap.Pop(h)</code> returns a value of type <code>any</code> (the empty interface). Turn it into an <code>int</code> with a type assertion: <code>x := heap.Pop(h).(int)</code>. For a heap of structs it is <code>heap.Pop(h).(Item)</code>. Call the package function <code>heap.Pop(h)</code>, not the method <code>h.Pop()</code>, which skips the sifting.</p>"},
  {"title": "Two ways a sub-slice corrupts data", "answer": "<ol><li><strong>Appending to a sub-slice with spare capacity</strong> writes into the original's backing array: <code>b := a[:2]; b = append(b, 99)</code> overwrites <code>a[2]</code>. Prevent it with an explicit copy, or limit the capacity with a full slice expression <code>a[:2:2]</code>, which forces <code>append</code> to allocate.</li><li><strong>Saving a slice that you keep modifying</strong>, such as appending the current path to the results in backtracking and then changing the path. Every saved result shares the same memory and changes with it. Save <code>append([]int(nil), path...)</code> or a <code>copy</code> instead.</li></ol>"},
 ],
}

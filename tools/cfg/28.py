S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "28", "title": "k-nearest neighbors and where to go next", "sub": "Judge something by the company it keeps, then a tour of real-world structures.",
 "kicker": ["Lesson 28", "Extras"], "stars": 1, "pattern": "k-NN, Bloom filter, inverted index",
 "desc": "k-NN animated on a scatter plot: k closest points with a heap, the orange-or-grapefruit classifier with and without normalizing, regression, recommendations, a Bloom filter and an inverted index.",
 "glance": [("The idea", "To classify or predict for a new point, find the k most similar known points and let them vote (or average)."),
            ("The decisions", "Which features, how to measure distance, which k. Normalize features so one big scale does not dominate."),
            ("Beyond", "Bloom filters answer \"seen it?\" in tiny memory; inverted indexes power search; LSH finds near neighbors fast.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', S("st-p1", "kClosest", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "classifyNorm,classifyRaw", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "regress,similar", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "bloom", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "inverted", "code-5"), 'before'),
 ],
 "recap": "knn28",
 "exercises": [
  {"title": "k-NN in three sentences", "answer": "<p>To decide whether a new fruit is an orange or a grapefruit, look at the fruits you already know that are most like it in size and color. Take the k closest, say 3. Whatever most of them are, call the new fruit that.</p>"},
  {"title": "Squared distances", "answer": "<p>The square root is increasing, so it never changes which point is closer: comparing <code>x² + y²</code> gives the same order, with no slow square root and no floating-point rounding. You need the true distance when the number itself matters: reporting it, comparing it with a radius given in real units, or adding distances together.</p>"},
  {"title": "Can a Bloom filter be wrong?", "answer": "<p>\"Not present\" is <strong>always right</strong>: adding an item sets all its bits, and bits are never cleared, so a 0 at any of its positions proves it was never added. \"Present\" <strong>can be wrong</strong>: other items may have set all of its bits by chance (a false positive). The second preset of the Bloom animation crowds a small filter to show this.</p>"},
  {"title": "Sorted posting lists", "answer": "<p>Two sorted lists intersect with two pointers in <code>O(a + b)</code>, like the merge step of merge sort: advance whichever pointer has the smaller id. Starting from the shortest list keeps the intermediate results small, and sorted lists also allow skip pointers or galloping to jump ahead. Without sorting you would need a hash set per query.</p>"},
  {"title": "MapReduce word count", "answer": "<p><strong>Map</strong> reads a chunk of text and emits <code>(word, 1)</code> for every word. The framework groups by key, so <strong>reduce</strong> receives <code>(word, [1, 1, …])</code> and emits <code>(word, sum)</code>. Each machine maps its own chunk; each reducer handles its own share of the words.</p>"},
  {"title": "Exact k-NN or LSH", "answer": "<p><strong>LSH.</strong> Exact k-NN compares every document with every other: about 10¹⁸ comparisons for a billion. Locality-sensitive hashing hashes similar documents into the same buckets with high probability, so you compare only within buckets. You accept a small chance of missing a pair in return for a huge speed-up.</p>"},
 ],
}

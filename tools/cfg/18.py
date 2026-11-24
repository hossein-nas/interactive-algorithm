S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "18", "title": "Tries", "sub": "Words that share a beginning share a path.",
 "kicker": ["Lesson 18", "Data structures"], "stars": 2, "pattern": "Trie",
 "desc": "Tries animated: inserting and searching, longest common prefix, replacing words with roots, wildcard search, and Word Search II on a board.",
 "glance": [("Reach for it when", "Many words and prefix questions: autocomplete, \"starts with\", a dictionary searched on a board."),
            ("How it works", "Each node is one letter; a path from the root spells a prefix; a flag marks where a word ends."),
            ("What it costs", "<code>O(L)</code> per insert or lookup for a word of length L, whatever the number of words.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', S("st-basic", "trieOps", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "lcp", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "replaceWords", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "wildcard", "code-4", ' data-flow="fig-4"'), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "wordSearch2", "code-5"), 'before'),
 ],
 "recap": "trie18",
 "exercises": [
  {"title": "Draw a small trie", "answer": "<p><code>c → a</code>, then <code>a</code> has children <code>r</code> and <code>t</code>; <code>r</code> has children <code>d</code> and <code>e</code>. Word ends: <code>r</code> (car), <code>d</code> (card), <code>e</code> (care), <code>t</code> (cat). <strong>6 nodes</strong> besides the root, against 14 letters in the four words. Run the second preset of the first animation.</p>"},
  {"title": "Prefix queries", "answer": "<p>A hash set can only test whole words, so it must scan every word to find those starting with <code>ca</code>. A trie walks <code>c</code>, <code>a</code> in two steps and returns the <strong>node</strong> for that prefix; every word below it starts with <code>ca</code>, so a DFS from there lists them in time proportional to the output.</p>"},
  {"title": "Search Suggestions System", "answer": "<p>Either store at each trie node a list of up to 3 smallest words that pass through it (insert words in sorted order and append while the list has fewer than 3), or skip the trie: <strong>sort the products</strong>, and for each typed prefix binary-search the first word ≥ prefix and take up to 3 that still start with it. Both are about <code>O(n log n + typed · log n)</code>; the sort + binary search one is shorter to write.</p>"},
  {"title": "Maximum XOR", "answer": "<p>The alphabet is <strong>bits</strong>: insert every number as its 31 or 32 bits from the highest down, so each node has at most two children (0 and 1). For each number, walk the trie preferring the child with the <em>opposite</em> bit at each level; that greedily builds the largest XOR. <code>O(n · 32)</code>.</p>"},
  {"title": "Set versus trie memory", "answer": "<p>A set stores each word once plus hashing overhead: about the total number of letters. A trie stores one node per <em>distinct prefix</em>, and each node carries a map or a 26-slot array, which costs far more than a letter. The trie wins on memory only when words share long prefixes (dictionaries, URLs, IP routes); with random strings it is much bigger. It wins on <em>speed</em> for prefix queries either way. Compressed tries (radix trees) merge single-child chains to cut memory.</p>"},
 ],
}

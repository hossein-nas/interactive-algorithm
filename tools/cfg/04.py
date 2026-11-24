S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "04", "title": "Hash tables: Map and Set", "sub": "Remember things so you never search twice.",
 "kicker": ["Lesson 04", "Core patterns on arrays and strings"], "stars": 3, "pattern": "Hash map",
 "desc": "Hash tables animated: hashing, collisions, resizing, Two Sum, anagrams, longest consecutive sequence and an LRU cache.",
 "glance": [("Reach for it when", "You keep asking \"have I seen this?\", \"how many?\", \"group by…\", or \"where is its partner?\"."),
            ("The big trick", "Replace an inner search loop with a lookup: <code>O(n²)</code> becomes <code>O(n)</code>."),
            ("What it costs", "<code>O(1)</code> per operation on average, paid for with <code>O(n)</code> memory.")],
 "added": "added-04.md", "added_names": ["ex2", "ex3", "ex5"],
 "inserts": [
  ('<h3 id="performance-table">', '<p>Watch a small table work: hash, collide, chain, and resize when the load factor passes 0.75. The code is the hash set from exercise 5.</p>\n' + S("st-hash", "hashSet", "code-ex5", " data-clone"), 'before'),
  ('</section>\n<section class="sec" id="reusable-templates">', '<div class="quiz" data-quiz="hash04"></div>\n', 'before'),
  ('<h3 id="template-a-frequency-count">', S("st-templates", "frequencyOf,hasDuplicate", "code-1,code-2"), 'after_dummy'),
  ('<div class="code-tabs" id="code-3">', S("st-p1", "twoSum", "code-3", ' data-flow="fig-4"'), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p2", "isAnagram", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p3", "groupAnagrams", "code-5", ' data-flow="fig-5"'), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p4", "intersection", "code-6"), 'before'),
  ('<div class="code-tabs" id="code-7">', S("st-p5", "longestConsecutive", "code-7", ' data-flow="fig-6"'), 'before'),
  ('<div class="code-tabs" id="code-8">', S("st-p6", "lruCache", "code-8"), 'before'),
  ('<table id="tbl-5">', '<table id="tbl-5" class="trace">'),
 ],
 "exercises": [
  {"title": "Explain collisions with the coat check", "answer": "<p>A model answer: \"The attendant turns my name into a hook number. Sometimes two names give the same hook. That is a collision. With chaining, the hook holds a short list of coats; to find mine, the attendant goes to the hook and checks the few tags on it. As long as no hook gets crowded, it is still about one step. When the room gets too full, they move to a room with twice as many hooks and re-hang every coat.\" The animation in section 2 shows exactly this.</p>"},
  {"title": "First non-repeating character", "track": True, "hint": "A character's count is only known after you have seen the whole string.", "answer": "<p>Pass 1 counts every character. Pass 2 walks the string again in order and returns the first index whose count is 1. It needs two passes because when you first meet a character you cannot know whether it appears again later. <code>O(n)</code> time, <code>O(k)</code> space.</p>" + S("st-ex2", "firstUnique", "code-ex2") + "{{code:ex2}}"},
  {"title": "Isomorphic strings", "track": True, "hint": "Try \"badc\" and \"baba\" with only one map. What goes wrong?", "answer": "<p>You need <strong>two maps</strong>: <code>s → t</code> makes sure each character of <code>s</code> always maps to the same character of <code>t</code>, and <code>t → s</code> makes sure no two characters of <code>s</code> map to the same character of <code>t</code>. With only the first map, \"badc\" and \"baba\" would pass, because <code>b → b</code> and <code>d → b</code> both look fine on their own.</p>" + S("st-ex3", "isomorphic", "code-ex3") + "{{code:ex3}}"},
  {"title": "Why start only at run beginnings", "answer": "<p>If you counted upward from every number, a run of length <code>n</code> would be walked from each of its numbers: <code>n + (n−1) + … + 1</code>, which is <code>O(n²)</code>. Starting only where <code>x − 1</code> is missing walks each run exactly once, from its first number, so every number is visited at most twice in total: <code>O(n)</code>. Step through Problem 5's animation and watch the visit counter.</p>"},
  {"title": "A HashSet with chaining", "track": True, "hint": "Store an array of buckets; the slot is key mod the number of buckets. What should happen when there are many more keys than buckets?", "answer": "<p>Keep an array of buckets, each a small list. <code>add</code> hashes the key to a slot and appends it if it is not already in that chain; <code>contains</code> searches one chain; <code>remove</code> deletes from one chain. On resize, when <code>count / buckets</code> passes about 0.75, allocate twice as many buckets and <strong>re-insert every key</strong>, because a key's slot depends on the number of buckets. The resize is <code>O(n)</code> but rare, so operations stay amortized <code>O(1)</code>. The hash-table animation in section 2 runs this exact code.</p>{{code:ex5}}"},
 ],
}
# the templates stage goes right before Template A's code block
CFG["inserts"][2] = ('<div class="code-tabs" id="code-1">', S("st-freq", "frequencyOf", "code-1"), 'before')
CFG["inserts"].insert(3, ('<div class="code-tabs" id="code-2">', S("st-dup", "hasDuplicate", "code-2"), 'before'))

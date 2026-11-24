S = lambda id, anim, code, extra="": f'<div class="stage" id="{id}" data-anim="{anim}" data-code="{code}"{extra}></div>\n'
CFG = {
 "id": "27", "title": "Bit manipulation", "sub": "A number is a row of switches; flip them in bulk.",
 "kicker": ["Lesson 27", "Extras"], "stars": 2, "pattern": "Bits",
 "desc": "Bits animated as rows of switches: counting 1s, powers of two, counting bits, XOR cancellations, adding without +, subsets as masks and the bit trie for maximum XOR.",
 "glance": [("Reach for it when", "\"O(1) extra space\" with pairs, sets of up to ~20 items, powers of two, or the problem talks about bits."),
            ("The key tricks", "<code>x &amp; (x − 1)</code> clears the lowest 1; <code>x &amp; −x</code> keeps it; <code>x ^ x = 0</code>; bit i of a mask = item i is in."),
            ("Language traps", "JavaScript bit operators are 32-bit signed; <code>&gt;&gt;&gt;</code> is the unsigned shift. Go's unary <code>^</code> is NOT; parenthesize every bit test.")],
 "inserts": [
  ('<div class="code-tabs" id="code-1">', S("st-p1", "popcount,pow2", "code-1"), 'before'),
  ('<div class="code-tabs" id="code-2">', S("st-p2", "countBits", "code-2"), 'before'),
  ('<div class="code-tabs" id="code-3">', S("st-p3", "single,missing,single3", "code-3"), 'before'),
  ('<div class="code-tabs" id="code-4">', S("st-p4", "getSum", "code-4"), 'before'),
  ('<div class="code-tabs" id="code-5">', S("st-p5", "masks,submasks", "code-5"), 'before'),
  ('<div class="code-tabs" id="code-6">', S("st-p6", "maxXor", "code-6"), 'before'),
 ],
 "recap": "bit27",
 "exercises": [
  {"title": "By hand", "answer": "<p>13 = <code>1101</code>, 7 = <code>0111</code>. <code>13 &amp; 7</code> = <code>0101</code> = <strong>5</strong>; <code>13 | 7</code> = <code>1111</code> = <strong>15</strong>; <code>13 ^ 7</code> = <code>1010</code> = <strong>10</strong>; <code>13 &gt;&gt; 2</code> = <code>11</code> = <strong>3</strong>; <code>13 &lt;&lt; 1</code> = <code>11010</code> = <strong>26</strong>.</p>"},
  {"title": "44 and 43", "answer": "<p>44 = <code>101100</code>, 43 = <code>101011</code>. Subtracting 1 turns the lowest 1 (bit 2) into 0 and the zeros below it into 1s; everything above is unchanged. ANDing keeps the unchanged upper bits and wipes the rest: <code>101000</code> = 40. Run 44 in the first animation.</p>"},
  {"title": "Reverse Bits", "answer": "<p>Each of the 32 rounds needs a <strong>shift-and-OR</strong> into the result and a <strong>shift</strong> of n: <code>result = (result &lt;&lt; 1) | (n &amp; 1); n &gt;&gt;&gt;= 1;</code>. In JavaScript finish with <code>result &gt;&gt;&gt; 0</code> to read it as unsigned.</p>"},
  {"title": "Hamming Distance", "answer": "<p><strong>XOR</strong> marks the positions where the two numbers differ, then <strong>count the 1 bits</strong> with <code>n &amp;= n − 1</code>: <code>hammingWeight(x ^ y)</code>.</p>"},
  {"title": "Gray Code for n = 3", "answer": "<p>i = 0..7 gives <code>000, 001, 011, 010, 110, 111, 101, 100</code>. Each neighbor differs in exactly one bit (including 100 back to 000).</p>"},
  {"title": "A set in one integer", "answer": "<p>Add: <code>s |= 1 &lt;&lt; k</code>. Remove: <code>s &amp;= ~(1 &lt;&lt; k)</code> (Go: <code>s &amp;^= 1 &lt;&lt; k</code>). Test: <code>(s &gt;&gt; k) &amp; 1</code> (or <code>(s &amp; (1 &lt;&lt; k)) !== 0</code>). Count: the popcount, <code>hammingWeight(s)</code> (Go: <code>bits.OnesCount(uint(s))</code>).</p>"},
 ],
}

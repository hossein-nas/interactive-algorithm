/* Lesson 00 · Start here — map links and quizzes. */
(function () {
  "use strict";
  const G = window.Guide;

  // Clicking a lesson box in the guide map opens that lesson (once its page is built).
  const NODE = { F1: "01", F2: "02", F3: "03", P1: "04", P2: "05", P3: "06", P4: "07", P5: "08", R1: "09", R2: "10", R3: "11", S1: "12", S2: "13", S3: "14", S4: "15", S5: "16", S6: "17", S7: "18", G1: "19", G2: "20", G3: "21", G4: "22", T1: "23", T2: "24", T3: "25", T4: "26", E1: "27", E2: "28", E3: "29" };
  const fig = document.getElementById("fig-1");
  if (fig) {
    // On screen, each family reads better as one row; the source text in the page stays as written.
    const pre = fig.querySelector("pre.mermaid-src");
    pre.textContent = pre.textContent.replace(/(\n(\s*)subgraph [^\n]+)/g, "$1\n$2    direction LR");
    const links = {};
    for (const k in NODE) if (G.BUILT.has(NODE[k])) links[k] = G.lessonHref(NODE[k]);
    const s = document.createElement("script");
    s.type = "application/json";
    s.className = "links";
    s.textContent = JSON.stringify(links);
    fig.appendChild(s);
  }

  G.quizzes.habits00 = {
    title: "Which habit is missing?",
    intro: "Each scene shows a candidate skipping one of the five habits. Name it.",
    items: [
      { q: "The candidate reads the problem and starts typing a solution within thirty seconds.", options: ["Ask first, code later", "Say the slow way out loud", "Trace before you declare victory", "State complexity with the reason"], answer: 0, why: "Restating and asking about size, order, duplicates and empty input comes before any code." },
      { q: "The candidate cannot see the fast solution, so they stay silent for five minutes.", options: ["Name the pattern and say why", "Say the slow way out loud", "Ask first, code later", "Trace before you declare victory"], answer: 1, why: "A correct `O(n²)` answer with a clear path to something better beats silence." },
      { q: "\"I'll use two pointers.\" The interviewer asks why, and the candidate shrugs.", options: ["State complexity with the reason", "Ask first, code later", "Name the pattern and say why", "Say the slow way out loud"], answer: 2, why: "A pattern needs a reason: \"the array is sorted, so I can discard from either end\"." },
      { q: "The code compiles, and the candidate says \"done\".", options: ["Trace before you declare victory", "Say the slow way out loud", "Name the pattern and say why", "Ask first, code later"], answer: 0, why: "Trace one normal case, one edge case and one tricky branch first." },
      { q: "\"It's O(n).\" Nothing else.", options: ["Name the pattern and say why", "State complexity with the reason", "Trace before you declare victory", "Ask first, code later"], answer: 1, why: "Say why: \"`O(n)`, because each index is added and removed once\"." },
    ],
  };

  G.quizzes.glossary00 = {
    title: "Glossary check",
    intro: "Quick recall of the words every lesson uses.",
    items: [
      { q: "What does **amortized** cost mean?", options: ["The average cost per operation over a long run, even if a few are expensive", "The cost in the worst case", "The cost after removing constants", "The memory an operation uses"], answer: 0, why: "Dynamic-array `push` is the classic case: an occasional `O(n)` copy, `O(1)` on average." },
      { q: "`[2, 3, 4]` taken from `[1, 2, 3, 4, 5]` is a…", options: ["subarray (contiguous)", "subsequence that is not contiguous", "permutation", "partition"], answer: 0, why: "Its items sit next to each other in the original. Every subarray is also a subsequence, but not the other way around." },
      { q: "`[1, 3, 5]` taken from `[1, 2, 3, 4, 5]` is a…", options: ["subarray", "subsequence", "window", "prefix"], answer: 1, why: "Same order as the original, but not adjacent: a subsequence." },
      { q: "A **stable** sort…", options: ["keeps equal items in their original order", "never uses extra memory", "always runs in `O(n log n)`", "sorts in place"], answer: 0, why: "Stability is about ties. Merge sort is stable; quicksort usually is not." },
      { q: "An **invariant** is…", options: ["a statement that stays true throughout a loop", "a variable that never changes", "the base case of a recursion", "a constant factor in Big O"], answer: 0, why: "\"Everything before `write` is the finished answer\" is an invariant. It is how you prove a loop correct and find bugs." },
      { q: "**Overlapping subproblems** are the sign of…", options: ["dynamic programming", "a greedy algorithm", "binary search", "a hash map"], answer: 0, why: "The same sub-question is asked again and again, so you save each answer once." },
      { q: "**Monotonic** means…", options: ["only ever increasing, or only ever decreasing", "having one value", "sorted and without duplicates", "constant time"], answer: 0, why: "It is the property that makes binary search, monotonic stacks and sliding windows work." },
    ],
  };
})();

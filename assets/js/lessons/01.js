/* Lesson 01 · The interview process — the think-aloud Two Sum, and quizzes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  const parseTwoSum = (s) => {
    const [a, t] = P.parts(s, 2, 'Write the numbers, then ";" and the target, e.g. 2 7 11 15 ; 9');
    return { nums: P.nums(a, { minLen: 1, maxLen: 10, min: -99, max: 99 }), target: P.num(t) };
  };
  const presets = [
    { label: "[2, 7, 11, 15] → 9", input: "2 7 11 15 ; 9" },
    { label: "edge: [3, 3] → 6", input: "3 3 ; 6" },
    { label: "no answer: [1, 2] → 10", input: "1 2 ; 10" },
    { label: "unsorted, negatives", input: "4 -3 8 1 9 ; 5" },
  ];

  A.twoSumThink = {
    title: "Two Sum, said out loud",
    short: "Hash map, one pass",
    viz: "array",
    legend: ["focus:current number", "anchor:partner found", "answer:the pair"],
    varRoles: { i: "focus", need: "focus" },
    inputLabel: "Numbers ; target",
    hint: "2 7 11 15 ; 9",
    presets,
    parse: parseTwoSum,
    lines: {
      init: { ts: "const seen = new Map<number, number>();", go: "seen := make(map[int]int)" },
      need: { ts: "const need = target - nums[i];", go: "need := target - v" },
      look: { ts: "const j = seen.get(need);", go: "if j, ok := seen[need]; ok" },
      found: { ts: "if (j !== undefined) return [j, i];", go: "return []int{j, i}" },
      store: { ts: "seen.set(nums[i], i);", go: "seen[v] = i" },
      none: { ts: 'return []; // the agreed "no answer" value', go: 'return []int{} // the agreed "no answer" value' },
    },
    trace({ nums, target }) {
      const T = new G.Trace();
      const seen = new Map();
      const st = (i, mk, hi) => ({
        cells: G.cells(nums), marks: Object.assign({}, i != null ? { [i]: "focus" } : {}, mk),
        ptrs: i != null && i < nums.length ? [{ name: "i", at: i, role: "focus" }] : [],
        panels: [{ title: "seen: value → index", entries: [...seen.entries()], hi: hi != null ? [hi] : [], empty: "(nothing yet)" }],
      });
      T.add({ at: "init", state: st(null), vars: { target }, say: "You say: \"I'll keep a map called `seen` from each value to the index where I saw it.\"" });
      for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        T.add({ at: "need", state: st(i), vars: { i, "nums[i]": nums[i], need }, say: `"At index ${i} the value is ${nums[i]}, so the partner I need is ${target} − ${nums[i]} = ${need}."` });
        const j = seen.get(need);
        T.add({
          at: "look", state: st(i, {}, seen.has(need) ? need : null), vars: { i, need, found: j !== undefined },
          say: j !== undefined ? `"Have I seen ${need}? Yes, at index ${j}."` : `"Have I seen ${need}? Not yet."`,
          ask: { q: `Is ${need} already in \`seen\`?`, options: ["Yes: return the pair", "No: store this number and move on"], answer: j !== undefined ? 0 : 1, why: j !== undefined ? `It was stored at index ${j}.` : "Only earlier numbers are in the map, and none of them is the partner." },
        });
        if (j !== undefined) {
          T.add({ at: "found", state: st(i, { [j]: "answer", [i]: "answer" }, need), vars: { i, j, answer: [j, i] }, say: `"Return \`[${j}, ${i}]\`. I checked before storing, so a number can never pair with itself."` });
          return T.done([j, i]);
        }
        seen.set(nums[i], i);
        T.add({ at: "store", state: st(i, {}, nums[i]), vars: { i, stored: `${nums[i]} → ${i}` }, say: `"Store ${nums[i]} → ${i}, so a later number can find it."` });
      }
      T.add({ at: "none", state: st(null), vars: { answer: [] }, say: "\"No pair adds up to the target, so I return the empty array we agreed on.\"" });
      return T.done([]);
    },
  };

  A.twoSumBrute = {
    title: "Two Sum, said out loud",
    short: "Brute force, every pair",
    viz: "array",
    legend: ["p1:i", "p2:j", "answer:the pair"],
    varRoles: { i: "p1", j: "p2", checks: "focus" },
    noCodeBlock: true,
    noCode: "Step 4 of the routine: describe the slow way and its cost before improving it. Watch the number of checks grow with n².",
    inputLabel: "Numbers ; target",
    hint: "2 7 11 15 ; 9",
    presets,
    parse: parseTwoSum,
    trace({ nums, target }) {
      const T = new G.Trace();
      let checks = 0;
      const st = (i, j, mk) => ({ cells: G.cells(nums), marks: Object.assign({ [i]: "p1", [j]: "p2" }, mk), ptrs: [{ name: "i", at: i, role: "p1" }, { name: "j", at: j, role: "p2" }] });
      T.add({ state: { cells: G.cells(nums) }, say: "\"The brute-force way tries every pair: two nested loops.\"" });
      for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) {
        checks++;
        const hit = nums[i] + nums[j] === target;
        T.add({ state: st(i, j, hit ? { [i]: "answer", [j]: "answer" } : {}), vars: { i, j, sum: nums[i] + nums[j], checks }, say: hit ? `${nums[i]} + ${nums[j]} = ${target}: found after ${checks} checks.` : `${nums[i]} + ${nums[j]} = ${nums[i] + nums[j]}, not ${target}.` });
        if (hit) { T.add({ state: st(i, j, { [i]: "answer", [j]: "answer" }), vars: { answer: [i, j], checks }, say: `"That works, but in the worst case it is about n²/2 checks: \`O(n²)\` time. For a million items that is far too slow, so let me look for something better."` }); return T.done([i, j]); }
      }
      T.add({ state: { cells: G.cells(nums) }, vars: { checks }, say: `No pair found after ${checks} checks, every pair once: \`O(n²)\`.` });
      return T.done([]);
    },
  };

  G.quizzes.routine01 = {
    title: "Which step of the routine is this?",
    intro: "Each line is something a candidate says. Name the step.",
    items: [
      { q: "\"So I get a list and a target and return two positions that add up to it. Is that right?\"", options: ["1. Restate", "2. Clarify", "3. Example", "5. Improve"], answer: 0, why: "Saying the problem back in your own words catches a misread problem in ten seconds." },
      { q: "\"Can values repeat? Can the list be empty?\"", options: ["2. Clarify", "1. Restate", "4. Brute force", "7. Test and analyze"], answer: 0, why: "Questions that could change the algorithm: duplicates, empty input, size, order." },
      { q: "\"For [2, 7, 11, 15] and 9, it's positions 0 and 1, because 2 + 7 = 9.\"", options: ["3. Example", "6. Code", "1. Restate", "7. Test and analyze"], answer: 0, why: "A tiny example solved by hand proves you understand the task and often shows the pattern." },
      { q: "\"Trying every pair is O(n²) time and O(1) space.\"", options: ["4. Brute force", "5. Improve", "7. Test and analyze", "2. Clarify"], answer: 0, why: "State the slow way and its cost first; its waste points to the fix." },
      { q: "\"I keep asking 'have I seen 2?', so a hash map from value to index removes the inner loop.\"", options: ["5. Improve", "4. Brute force", "3. Example", "6. Code"], answer: 0, why: "Name the pattern, and say what each variable means." },
      { q: "\"At index 1 I need 2, it's in the map at 0, so I return [0, 1]. Edge case [3, 3] also works because I check before I store.\"", options: ["7. Test and analyze", "3. Example", "6. Code", "1. Restate"], answer: 0, why: "Run your code by hand on the example, an edge case and the tricky branch, then state Big O." },
    ],
  };

  G.quizzes.chooser01 = {
    title: "Follow the decision guide",
    intro: "Use the two-minute guide above. Which pattern does each problem point to first?",
    items: [
      { q: "A sorted array: find the first position where the value is at least `x`.", options: ["Binary search", "Two pointers", "Hash map", "Backtracking"], answer: 0, why: "Sorted, and the question is about a boundary or threshold." },
      { q: "An unsorted array: does any value appear twice?", options: ["Hash map or set", "Binary search", "Dynamic programming", "Graph search"], answer: 0, why: "Not sorted, not a contiguous stretch, but you need to remember what you have seen." },
      { q: "The longest substring with at most two distinct characters.", options: ["Sliding window", "Hash map alone", "Backtracking", "Heap"], answer: 0, why: "A contiguous stretch, asking for the longest." },
      { q: "Courses with prerequisites: can all of them be finished?", options: ["Graph: topological sort", "Two pointers", "Sliding window", "Greedy"], answer: 0, why: "Items connected to other items through dependencies." },
      { q: "Generate every valid arrangement of n queens on a board.", options: ["Backtracking", "Dynamic programming", "Binary search", "Prefix sums"], answer: 0, why: "Try all choices, with undo." },
      { q: "The fewest coins that make an amount.", options: ["Dynamic programming", "Two pointers", "Hash map", "Graph BFS only"], answer: 0, why: "The same sub-question (fewest coins for a smaller amount) repeats, and it asks for a minimum." },
    ],
  };

  G.quizzes.edge01 = {
    title: "Which input breaks it?",
    intro: "Each snippet has a hidden assumption. Pick the edge case that exposes it.",
    items: [
      { q: "`let best = 0; for (const x of nums) best = Math.max(best, x); return best;`", options: ["All numbers negative", "An array that is already sorted", "Duplicates", "Two items"], answer: 0, why: "For `[-3, -1]` it returns 0, a number that is not in the array. Start from `-Infinity` or from `nums[0]`." },
      { q: "`return nums[0] + nums[nums.length - 1];`", options: ["The empty array", "A sorted array", "Negative numbers", "A very large array"], answer: 0, why: "`nums[0]` is `undefined` in TypeScript (the result is `NaN`), and Go panics. Guard the empty case at the top." },
      { q: "A sliding window that shrinks while `sum > target`, on an array of integers.", options: ["Negative numbers", "One item", "All values equal", "An already-sorted array"], answer: 0, why: "With negatives, adding an item can make the sum smaller, so the window's rule no longer moves in one direction." },
      { q: "A recursive tree height that starts with `return 1 + max(height(root.left), height(root.right))`.", options: ["An empty tree (`null` root)", "A perfect tree", "A tree with duplicate values", "A tree with two nodes"], answer: 0, why: "There is no base case for `null`, so it crashes on the empty tree and on every leaf's missing child." },
      { q: "Two Sum that stores `nums[i]` in the map **before** looking up `target − nums[i]`.", options: ["`[3, 3]` with target 6, or any x = target / 2", "`[]`", "Negative numbers", "A sorted array"], answer: 0, why: "With target 6 and x = 3, it finds its own index and pairs an element with itself." },
    ],
  };
})();

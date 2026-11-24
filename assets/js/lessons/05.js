/* Lesson 05 · Two pointers — animators and quizzes.
   Each trace mirrors the lesson's verified TypeScript/Go code step by step; `at` names the code line being run. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  // marks: indexes outside [lo, hi] are discarded (pencil grey)
  const outside = (n, lo, hi) => { const m = {}; for (let i = 0; i < n; i++) if (i < lo || i > hi) m[i] = "done"; return m; };
  const allMark = (n, mark) => { const m = {}; for (let i = 0; i < n; i++) m[i] = mark; return m; };

  /* =====================================================================
     Opening analogy: a line of people sorted by height
     ===================================================================== */
  A.heightsLine = {
    title: "Two people whose heights add up to the target",
    short: "People in a line",
    viz: "bars",
    legend: ["p1:shortest still in line", "p2:tallest still in line", "done:sent away", "answer:the pair"],
    noCode: "This picture is the everyday version of the idea. The same moves appear as code in Problem 1.",
    inputLabel: "Heights in feet, shortest first ; target",
    hint: "3 4 4.5 5.5 6 7.5 ; 10",
    presets: [
      { label: "find 10 ft", input: "3 4 4.5 5.5 6 7.5 ; 10" },
      { label: "no pair adds up", input: "3 4 5 5.5 ; 12" },
    ],
    parse(s) {
      const [a, t] = P.parts(s, 2, 'Write the heights, then ";" and the target, e.g. 3 4 5 ; 9');
      return { h: P.nums(a, { ints: false, min: 1, max: 9, minLen: 2, maxLen: 9, sorted: true }), t: P.num(t) };
    },
    trace({ h, t }) {
      const T = new G.Trace();
      let l = 0, r = h.length - 1;
      const st = (extra) => Object.assign({
        h, people: true, unit: "ft", maxH: Math.max(...h),
        marks: Object.assign(outside(h.length, l, r), { [l]: "p1", [r]: "p2" }),
        ptrs: [{ name: "shortest", at: l, role: "p1" }, { name: "tallest", at: r, role: "p2" }],
      }, extra);
      T.add({ state: st(), say: "Everyone stands in a line from shortest to tallest. Look at the two people at the ends together." });
      while (l < r) {
        const s = +(h[l] + h[r]).toFixed(2);
        T.add({
          state: st(), vars: { shortest: h[l], tallest: h[r], together: s, target: t },
          say: `${h[l]} ft + ${h[r]} ft = ${s} ft. The target is ${t} ft.`,
          ask: {
            q: `Together they are ${s} ft. Who can be sent away for good?`,
            options: ["The shortest person", "The tallest person", "Nobody: this is the pair"],
            answer: s < t ? 0 : s > t ? 1 : 2,
            why: s < t ? "The shortest person is too short even with the tallest partner, so they are too short with everyone." :
              s > t ? "The tallest person is too tall even with the shortest partner, so they are too tall with everyone." : `Exactly ${t} ft.`,
          },
        });
        if (s === t) {
          T.add({ state: st({ marks: Object.assign(outside(h.length, l, r), { [l]: "answer", [r]: "answer" }) }), vars: { pair: [h[l], h[r]] }, say: `Exactly ${t} ft: found the pair. We looked at a few pairs, not every pair.` });
          return T.done([l, r]);
        }
        if (s > t) { r--; T.add({ state: st(), say: "Too tall. The tallest person is too tall even next to the shortest, so they can't pair with anyone. Send them away." }); }
        else { l++; T.add({ state: st(), say: "Too short. The shortest person is too short even next to the tallest, so they can't pair with anyone. Send them away." }); }
      }
      T.add({ state: st({ marks: allMark(h.length, "done") }), say: `Only one person is left, so no pair adds up to ${t} ft. Each look sent someone away for good, which is why we never had to try every pair.` });
      return T.done(null);
    },
  };

  /* =====================================================================
     Templates: Reverse String, and the read/write skeleton
     ===================================================================== */
  A.reverseString = {
    title: "Reverse String (opposite ends)",
    short: "Reverse String",
    viz: "array",
    legend: ["p1:left", "p2:right", "focus:being swapped", "answer:finished"],
    varRoles: { left: "p1", right: "p2" },
    inputLabel: "A word or short phrase",
    hint: "hello",
    presets: [{ label: "hello", input: "hello" }, { label: "even length: abcd", input: "abcd" }, { label: "one letter", input: "x" }],
    parse(s) {
      const t = String(s);
      if (!t.length) throw new Error("Type at least one character.");
      if (t.length > 14) throw new Error("Keep it to 14 characters so the picture stays readable.");
      return t.split("");
    },
    lines: {
      init: { ts: "function reverseString>>let left = 0, right = chars.length - 1;", go: "func reverseString>>left, right := 0, len(chars)-1" },
      loop: { ts: "function reverseString>>while (left < right)", go: "func reverseString>>for left < right" },
      swap: { ts: "function reverseString>>[chars[left], chars[right]] = [chars[right], chars[left]];", go: "func reverseString>>chars[left], chars[right] = chars[right], chars[left]" },
      move: { ts: "function reverseString>>left++;", go: "func reverseString>>left++" },
    },
    trace(chars0) {
      const c = chars0.slice();
      const ids = c.map((_, i) => i);
      const n = c.length;
      const T = new G.Trace();
      let left = 0, right = n - 1;
      const st = (mk) => ({
        cells: c.map((v, i) => ({ id: ids[i], v })), cellW: 44,
        marks: Object.assign({}, mk),
        ptrs: [{ name: "left", at: left, role: "p1" }, { name: "right", at: Math.max(right, 0), role: "p2" }],
      });
      const fin = () => { const m = {}; for (let i = 0; i < n; i++) if (i < left || i > right) m[i] = "answer"; return m; };
      T.add({ at: "init", state: st(), vars: { left, right }, say: "`left` starts at the first character and `right` at the last." });
      while (left < right) {
        T.add({ at: "loop", state: st(fin()), vars: { left, right }, say: `\`left < right\` (${left} < ${right}), so there is still a pair to swap.` });
        [c[left], c[right]] = [c[right], c[left]];
        [ids[left], ids[right]] = [ids[right], ids[left]];
        T.add({ at: "swap", state: st(Object.assign(fin(), { [left]: "focus", [right]: "focus" })), vars: { left, right }, say: `Swap \`${c[right]}\` and \`${c[left]}\`. Both ends are now final.` });
        left++; right--;
        T.add({ at: "move", state: st(fin()), vars: { left, right }, say: "Both pointers step inward: `left++` and `right--`." });
      }
      T.add({
        at: "loop", state: st(allMark(n, "answer")), vars: { left, right, result: c.join("") },
        say: left === right ? `\`left\` and \`right\` meet at the middle character, which stays where it is. Result: \`${c.join("")}\`.` : `\`left\` passed \`right\`, so every pair has been swapped. Result: \`${c.join("")}\`.`,
        ask: null,
      });
      return T.done(c.join(""));
    },
  };

  A.readWrite = {
    title: "Read/write pointers: keep the even numbers",
    short: "Read/write: keep evens",
    viz: "array",
    legend: ["p2:read (scans ahead)", "p1:write (next free slot)", "focus:being read", "done:skipped"],
    varRoles: { read: "p2", write: "p1" },
    inputLabel: "Numbers (the rule keeps the even ones)",
    hint: "1 2 3 4 5 6",
    presets: [{ label: "1 2 3 4 5 6", input: "1 2 3 4 5 6" }, { label: "all odd", input: "1 3 5" }, { label: "all even", input: "2 4 6 8" }],
    parse(s) { return P.nums(s, { minLen: 1, maxLen: 10, min: -99, max: 99 }); },
    lines: {
      init: { ts: "function readWrite>>let write = 0;", go: "func readWrite>>write := 0" },
      test: { ts: "function readWrite>>if (keep(a[read]))", go: "func readWrite>>if keep(a[read])" },
      write: { ts: "function readWrite>>a[write++] = a[read];", go: "func readWrite>>a[write] = a[read]" },
      loop: { ts: "function readWrite>>for (let read = 0;", go: "func readWrite>>for read := 0;" },
      ret: { ts: "function readWrite>>return write;", go: "func readWrite>>return write" },
    },
    trace(a0) {
      const a = a0.slice();
      const n = a.length;
      const T = new G.Trace();
      let write = 0;
      const skipped = new Set();
      const st = (read, mk, fly) => {
        const marks = {};
        skipped.forEach((i) => { if (i >= write) marks[i] = "done"; });
        return {
          rows: [{
            cells: G.cells(a), marks: Object.assign(marks, mk),
            ptrs: [{ name: "write", at: write, role: "p1" }].concat(read != null && read < n ? [{ name: "read", at: read, role: "p2" }] : []),
            boundary: write, zones: [{ key: "ans", from: 0, to: write - 1, label: "finished answer", cls: "done" }],
          }],
          fly,
        };
      };
      T.add({ at: "init", state: st(0), vars: { write }, say: "Everything before `write` is the finished answer. Right now that part is empty." });
      for (let read = 0; read < n; read++) {
        const v = a[read];
        const keep = v % 2 === 0;
        T.add({
          at: "test", state: st(read, { [read]: "focus" }), vars: { read, write, "a[read]": v },
          say: `\`read\` looks at ${v}. Is it even?`,
          ask: { q: `Keep ${v}?`, options: ["Yes: copy it to `write`", "No: skip it"], answer: keep ? 0 : 1, why: keep ? `${v} is even, so it belongs in the answer.` : `${v} is odd, so it is left behind. Only \`read\` moves on.` },
        });
        if (keep) {
          a[write] = v;
          const from = read, to = write;
          write++;
          T.add({ at: "write", state: st(read, { [to]: "focus" }, from !== to ? { from, to, v } : null), vars: { read, write }, say: from === to ? `Keep it. It is already in slot ${to}, so the copy changes nothing; \`write\` becomes ${write}.` : `Keep it: copy ${v} into slot ${to}, then \`write\` becomes ${write}.` });
        } else {
          skipped.add(read);
          T.add({ at: "loop", state: st(read + 1 < n ? read + 1 : null), vars: { read: read + 1, write }, say: `Skip ${v}. Only \`read\` moves on.` });
        }
      }
      T.add({ at: "ret", state: st(null), vars: { write, answer: a.slice(0, write) }, say: `Return \`write\` = ${write}. The first ${write} slots, ${G.show(a.slice(0, write))}, are the answer; anything after them is leftover.` });
      return T.done({ k: write, arr: a.slice(0, write) });
    },
  };

  /* =====================================================================
     Problem 1 · Pair Sum in a sorted array
     ===================================================================== */
  A.pairSum = {
    title: "Pair Sum in a sorted array",
    viz: "array",
    legend: ["p1:left", "p2:right", "done:discarded for good", "answer:the pair"],
    varRoles: { left: "p1", right: "p2", sum: "focus" },
    inputLabel: "Sorted numbers ; target",
    hint: "2 7 11 15 ; 9",
    presets: [
      { label: "[2, 7, 11, 15] → 9", input: "2 7 11 15 ; 9" },
      { label: "[1, 2, 4, 8] → 10 (the trace table)", input: "1 2 4 8 ; 10" },
      { label: "no pair: [1, 2, 3] → 100", input: "1 2 3 ; 100" },
      { label: "longer: → 16", input: "1 3 4 6 8 9 11 14 ; 16" },
    ],
    table: { id: "tbl-2", preset: 1, rows: ["l0 r3", "l1 r3"] },
    parse(s) {
      const [a, t] = P.parts(s, 2, 'Write the sorted numbers, then ";" and the target, e.g. 2 7 11 15 ; 9');
      return { nums: P.nums(a, { sorted: true, minLen: 1, maxLen: 12, min: -999, max: 999 }), target: P.num(t) };
    },
    lines: {
      init: { ts: "let left = 0, right = nums.length - 1;", go: "left, right := 0, len(nums)-1" },
      sum: { ts: "const sum = nums[left] + nums[right];", go: "sum := nums[left] + nums[right]" },
      found: { ts: "if (sum === target) return [left, right];", go: "return left, right, true" },
      left: { ts: "if (sum < target) left++;", go: "left++" },
      right: { ts: "else right--;", go: "right--" },
      none: { ts: "return null;", go: "return -1, -1, false" },
    },
    trace({ nums, target }) {
      const T = new G.Trace();
      const n = nums.length;
      let left = 0, right = n - 1;
      const st = (mk) => ({
        cells: G.cells(nums),
        marks: Object.assign(outside(n, left, right), mk || { [left]: "p1", [right]: "p2" }),
        ptrs: [{ name: "left", at: left, role: "p1" }, { name: "right", at: Math.max(0, right), role: "p2" }],
      });
      T.add({ at: "init", state: st(), vars: { left, right, target }, say: "`left` starts at the smallest value and `right` at the largest." });
      while (left < right) {
        const sum = nums[left] + nums[right];
        const key = `l${left} r${right}`;
        T.add({
          at: "sum", key, state: st(), flow: ["S", "Q"], vars: { left, right, sum, target },
          say: `\`${nums[left]} + ${nums[right]} = ${sum}\`. Compare it with the target, ${target}.`,
          ask: {
            q: `The sum is ${sum} and the target is ${target}. Which move is safe?`,
            options: ["`left++`: we need something bigger", "`right--`: we need something smaller", "Found it: return the pair"],
            answer: sum < target ? 0 : sum > target ? 1 : 2,
            why: sum < target ? `${nums[left]} plus the biggest partner available (${nums[right]}) is still too small, so ${nums[left]} works with no partner at all.` :
              sum > target ? `${nums[right]} plus the smallest partner available (${nums[left]}) is still too big, so ${nums[right]} works with no partner at all.` : "The sum equals the target.",
          },
        });
        if (sum === target) {
          T.add({ at: "found", key, state: st({ [left]: "answer", [right]: "answer" }), flow: ["Q", "C"], vars: { left, right, sum, target }, say: `Equal to the target: return \`[${left}, ${right}]\`.` });
          return T.done([left, right]);
        }
        if (sum < target) {
          const gone = nums[left];
          left++;
          T.add({ at: "left", key, state: st(), flow: ["Q", "A"], vars: { left, right, sum, target }, say: `Too small. ${gone} can't reach ${target} even with the biggest partner, ${nums[right]}, so no partner can help it. Throw it away for good: \`left++\`.` });
        } else {
          const gone = nums[right];
          right--;
          T.add({ at: "right", key, state: st(), flow: ["Q", "B"], vars: { left, right, sum, target }, say: `Too big. ${gone} overshoots even with the smallest partner, ${nums[left]}, so no partner can help it. Throw it away for good: \`right--\`.` });
        }
      }
      T.add({ at: "none", key: `l${left} r${right}`, state: st(allMark(n, "done")), vars: { left, right, target }, say: `\`left\` and \`right\` met, and every value was thrown away for a reason. No pair adds up to ${target}: return \`null\`.` });
      return T.done(null);
    },
  };

  /* =====================================================================
     Problem 2 · Remove Duplicates from a Sorted Array
     ===================================================================== */
  A.removeDuplicates = {
    title: "Remove Duplicates from a sorted array",
    viz: "array",
    legend: ["p1:write", "p2:read", "focus:being read", "anchor:last kept value", "done:duplicate"],
    varRoles: { write: "p1", read: "p2" },
    inputLabel: "Sorted numbers",
    hint: "0 0 1 1 1 2 2 3",
    presets: [
      { label: "[0,0,1,1,1,2,2,3]", input: "0 0 1 1 1 2 2 3" },
      { label: "[0,0,1,1,2] (the trace table)", input: "0 0 1 1 2" },
      { label: "no duplicates", input: "1 2 3" },
      { label: "empty", input: "[]" },
    ],
    table: { id: "tbl-3", preset: 1, rows: ["init", "r1", "r2", "r3", "r4"] },
    parse(s) { return P.nums(s, { sorted: true, allowEmpty: true, maxLen: 12, min: -99, max: 99 }); },
    lines: {
      empty: { ts: "if (nums.length === 0) return 0;", go: "if len(nums) == 0" },
      init: { ts: "let write = 1;", go: "write := 1" },
      cmp: { ts: "if (nums[read] !== nums[write - 1])", go: "if nums[read] != nums[write-1]" },
      copy: { ts: "nums[write] = nums[read];", go: "nums[write] = nums[read]" },
      inc: { ts: "write++;", go: "write++" },
      loop: { ts: "for (let read = 1;", go: "for read := 1;" },
      ret: { ts: "return write;", go: "return write" },
    },
    trace(nums0) {
      const nums = nums0.slice();
      const n = nums.length;
      const T = new G.Trace();
      if (n === 0) {
        T.add({ at: "empty", state: { cells: [], minW: 120 }, vars: {}, say: "The array is empty: return 0 right away. (Forgetting this case is a classic bug.)" });
        return T.done({ k: 0, arr: [] });
      }
      let write = 1;
      const dup = new Set();
      const st = (read, mk, fly) => {
        const marks = {};
        dup.forEach((i) => { if (i >= write) marks[i] = "done"; });
        return {
          rows: [{
            cells: G.cells(nums), marks: Object.assign(marks, mk),
            ptrs: [{ name: "write", at: write, role: "p1" }].concat(read != null && read < n ? [{ name: "read", at: read, role: "p2" }] : []),
            boundary: write, zones: [{ key: "kept", from: 0, to: write - 1, label: "kept", cls: "done" }],
          }],
          fly,
        };
      };
      T.add({ at: "init", key: "init", state: st(1), vars: { write }, say: "`nums[0]` is always kept, so `write` starts at 1. Everything before `write` is the finished answer." });
      for (let read = 1; read < n; read++) {
        const v = nums[read], last = nums[write - 1];
        const isNew = v !== last;
        T.add({
          at: "cmp", key: `r${read}`, state: st(read, { [read]: "focus", [write - 1]: "anchor" }), flow: ["A", "B"],
          vars: { read, write, "nums[read]": v, "nums[write-1]": last },
          say: `Compare \`nums[read]\` = ${v} with the last kept value, \`nums[write - 1]\` = ${last}.`,
          ask: { q: `Is ${v} a new value?`, options: ["Yes: copy it to `write`", "No: it's a duplicate, skip it"], answer: isNew ? 0 : 1, why: isNew ? `${v} differs from the last kept value. The array is sorted, so it can't have appeared earlier.` : "It equals the last kept value, so it's a duplicate." },
        });
        if (isNew) {
          const to = write;
          nums[to] = v;
          T.add({ at: "copy", key: `r${read}`, state: st(read, { [to]: "focus" }, read !== to ? { from: read, to, v } : null), flow: ["B", "C"], vars: { read, write }, say: `New value: copy ${v} into slot ${to}.` });
          write++;
          T.add({ at: "inc", key: `r${read}`, state: st(read), flow: ["C", "E"], vars: { read, write }, say: `\`write++\`, so \`write\` = ${write}. The kept part is now ${G.show(nums.slice(0, write))}.` });
        } else {
          dup.add(read);
          T.add({ at: "loop", key: `r${read}`, state: st(read, { [read]: "done" }), flow: ["B", "D", "E"], vars: { read, write }, say: `${v} is a duplicate of the last kept value: skip it. Only \`read\` moves on.` });
        }
      }
      T.add({ at: "ret", state: st(null), vars: { write, answer: nums.slice(0, write) }, say: `Return \`write\` = ${write}. The first ${write} slots, ${G.show(nums.slice(0, write))}, are the answer.` });
      return T.done({ k: write, arr: nums.slice(0, write) });
    },
  };

  /* =====================================================================
     Problem 3 · Sort Colors (Dutch national flag)
     ===================================================================== */
  function sortColorsTrace(arr, bug) {
    const a = arr.slice();
    const ids = a.map((_, i) => i);
    const n = a.length;
    const T = new G.Trace();
    let low = 0, mid = 0, high = n - 1;
    const unchecked = new Set();
    const st = (mk, extra) => {
      const marks = {};
      unchecked.forEach((id) => { const i = ids.indexOf(id); if (i >= 0) marks[i] = "bug"; });
      return Object.assign({
        cells: a.map((v, i) => ({ id: ids[i], v, cls: "v" + v })),
        marks: Object.assign(marks, mk),
        ptrs: [{ name: "low", at: low, role: "p1" }, { name: "mid", at: Math.min(mid, Math.max(n - 1, 0)), role: "focus", hidden: mid > n - 1 }, { name: "high", at: Math.max(high, 0), role: "p2", hidden: high < 0 }],
        zones: [
          { key: "z0", from: 0, to: low - 1, label: "0s", cls: "0" },
          { key: "z1", from: low, to: mid - 1, label: "1s", cls: "1" },
          { key: "zu", from: mid, to: high, label: "unknown", cls: "u" },
          { key: "z2", from: high + 1, to: n - 1, label: "2s", cls: "2" },
        ],
      }, extra);
    };
    const sw = (i, j) => { [a[i], a[j]] = [a[j], a[i]]; [ids[i], ids[j]] = [ids[j], ids[i]]; };
    const vars = (x) => Object.assign({ low, mid, high }, x);
    T.add({ at: "init", state: st({}), vars: vars(), say: "Three pointers split the array into zones: 0s before `low`, 1s from `low` to `mid − 1`, unknown from `mid` to `high`, 2s after `high`. At the start, everything is unknown." });
    while (mid <= high) {
      const v = a[mid];
      const key = `l${low} m${mid} h${high}`;
      T.add({
        at: "check", key, state: st({ [mid]: "focus" }), vars: vars({ "nums[mid]": v }),
        say: `\`nums[mid]\` is ${v}.`,
        ask: bug ? null : {
          q: `\`nums[mid]\` is ${v}. What's the move?`,
          options: ["Swap with `low`, then `low++` and `mid++`", "Just `mid++`", "Swap with `high`, then `high--` (`mid` stays)"],
          answer: v === 0 ? 0 : v === 1 ? 1 : 2,
          why: v === 0 ? "A 0 goes to the end of the 0-zone. What comes back from `low` was already checked, so both pointers move." :
            v === 1 ? "A 1 is already in the 1-zone. Only `mid` moves." : "A 2 goes to the front of the 2-zone. What comes back from `high` is unknown, so `mid` must stay and check it.",
        },
      });
      if (v === 0) {
        sw(low, mid);
        T.add({ at: "swap0", key, state: st({ [low]: "focus", [mid]: "focus" }), vars: vars(), say: low === mid ? "It's a 0. `low` and `mid` are the same slot, so the swap changes nothing." : "It's a 0: swap it with `nums[low]`, the first slot after the 0-zone." });
        low++; mid++;
        T.add({ at: "inc0", key, state: st({}), vars: vars(), say: "The item that came back from `low` was already checked (it's a 1, or the same item), so both `low` and `mid` move on." });
      } else if (v === 1) {
        mid++;
        T.add({ at: "inc1", key, state: st({}), vars: vars(), say: "It's a 1: it already belongs in the 1-zone. `mid++`." });
      } else {
        sw(mid, high);
        T.add({ at: "swap2", key, state: st({ [mid]: "focus", [high]: "focus" }), vars: vars(), say: "It's a 2: swap it with `nums[high]`, the last unknown slot." });
        high--;
        if (bug) {
          unchecked.add(ids[mid]); // the item that just arrived from the right
          mid++;
          T.add({ at: null, key, state: st({}), vars: vars(), say: `The bug: \`high--\` and also \`mid++\`. The ${a[mid - 1]} that just arrived from the right is never checked (red).` });
        } else {
          T.add({ at: "dec2", key, state: st({ [mid]: "anchor" }), vars: vars(), say: `\`high--\`. Do **not** move \`mid\`: the ${a[mid]} that just arrived from the right is still unchecked.` });
        }
      }
    }
    const sorted = arr.slice().sort((x, y) => x - y);
    const ok = a.every((v, i) => v === sorted[i]);
    if (bug) {
      T.add({
        at: null, state: st(ok ? {} : allMark(n, "bug"), { note: { text: ok ? "Lucky: this input happens to come out sorted." : `Result ${G.show(a)} is not sorted.`, cls: ok ? "ok" : "bad" } }),
        vars: vars({ result: a.slice() }),
        say: ok ? "This input got lucky: the items that were never checked happened to be in the right zone. Try `1 2 0`, which exposes the bug." : `\`mid\` passed \`high\`, but the result ${G.show(a)} is wrong: items that arrived from the right were skipped without being checked.`,
      });
    } else {
      T.add({ at: "loop", key: `l${low} m${mid} h${high}`, state: st(allMark(n, "answer")), vars: vars({ result: a.slice() }), say: `\`mid\` (${mid}) passed \`high\` (${high}), so the unknown zone is empty and the array is sorted: ${G.show(a)}.` });
    }
    return T.done(a.slice());
  }
  A.sortColors = {
    title: "Sort Colors: three zones, one pass",
    viz: "array",
    legend: ["p1:low", "focus:mid", "p2:high", "v0:a 0", "v1:a 1", "v2:a 2", "bug:never checked"],
    varRoles: { low: "p1", mid: "focus", high: "p2" },
    inputLabel: "Only 0, 1 and 2",
    hint: "2 0 2 1 1 0",
    presets: [
      { label: "[2,0,2,1,1,0]", input: "2 0 2 1 1 0" },
      { label: "[2,0,1] (the trace table)", input: "2 0 1" },
      { label: "already sorted", input: "0 0 1 2 2" },
      { label: "all 2s", input: "2 2 2" },
    ],
    table: { id: "tbl-4", preset: 1, rows: ["l0 m0 h2", "l0 m0 h1", "l0 m1 h1", "l1 m2 h1"] },
    parse(s) { return P.nums(s, { only: [0, 1, 2], minLen: 1, maxLen: 12 }); },
    lines: {
      init: { ts: "let low = 0, mid = 0, high = nums.length - 1;", go: "low, mid, high := 0, 0, len(nums)-1" },
      check: { ts: "if (nums[mid] === 0)", go: "switch nums[mid]" },
      swap0: { ts: "[nums[low], nums[mid]] = [nums[mid], nums[low]];", go: "nums[low], nums[mid] = nums[mid], nums[low]" },
      inc0: { ts: "[nums[low], nums[mid]] = [nums[mid], nums[low]];>>low++;", go: "case 0:>>low++" },
      inc1: { ts: "else if (nums[mid] === 1)>>mid++;", go: "case 1:>>mid++" },
      swap2: { ts: "[nums[mid], nums[high]] = [nums[high], nums[mid]];", go: "nums[mid], nums[high] = nums[high], nums[mid]" },
      dec2: { ts: "high--;", go: "high--" },
      loop: { ts: "while (mid <= high)", go: "for mid <= high" },
    },
    trace: (a) => sortColorsTrace(a, false),
    bugs: [{
      label: "Replay the bug: mid++ after swapping with high",
      input: "1 2 0",
      banner: "<b>Replaying a bug.</b> After swapping with <code>high</code>, this version also runs <code>mid++</code>. Watch the item that arrives from the right: it is never checked.",
      trace: (a) => sortColorsTrace(a, true),
    }],
  };

  /* =====================================================================
     Problem 4 · 3Sum
     ===================================================================== */
  function threeSumTrace(nums, opt) {
    const T = new G.Trace();
    const n = nums.length;
    let cells = nums.map((v, id) => ({ id, v }));
    let i = -1, left = -1, right = -1;
    const result = [];
    const st = (mk, extra) => Object.assign({
      cells: cells.map((c) => ({ id: c.id, v: c.v })), marks: mk || {},
      ptrs: [
        { name: "i", at: Math.max(i, 0), role: "anchor", side: "above", hidden: i < 0 },
        { name: "left", at: Math.max(left, 0), role: "p1", hidden: left < 0 },
        { name: "right", at: Math.max(right, 0), role: "p2", hidden: right < 0 },
      ],
    }, extra);
    const res = () => result.map((t) => t.slice());
    T.add({ at: "sort", state: st({}), vars: { nums: nums.slice() }, say: "Here is the input, still unsorted." });
    cells = cells.slice().sort((x, y) => x.v - y.v);
    const a = cells.map((c) => c.v);
    T.add({ at: "sort", state: st({}), flow: ["A"], vars: { a: a.slice() }, say: `Sort a copy: ${G.show(a)}. Now equal values sit side by side, and pair-sum works on the rest.` });
    for (i = 0; i < n - 2; i++) {
      left = -1; right = -1;
      T.add({ at: "loopI", state: st({ [i]: "anchor" }), flow: ["B"], vars: { i, "a[i]": a[i], result: res() }, say: `Next first number: \`a[${i}]\` = ${a[i]}.` });
      if (a[i] > 0) {
        const m = {}; for (let k = i; k < n; k++) m[k] = "done";
        T.add({ at: "brk", state: st(m), vars: { i, "a[i]": a[i], result: res() }, say: `${a[i]} is positive, and everything after it is at least as big. No triplet can sum to 0: stop.` });
        break;
      }
      if (opt.skipDup && i > 0 && a[i] === a[i - 1]) {
        T.add({ at: "skipI", key: `i${i} skip`, state: st({ [i]: "done" }), flow: ["B", "C"], vars: { i, "a[i]": a[i], result: res() }, say: `${a[i]} is the same as the value before it, which already found every triplet it can start. Skip it.` });
        continue;
      }
      left = i + 1; right = n - 1;
      T.add({ at: "initLR", state: st({ [i]: "anchor" }), flow: ["C", "D"], vars: { i, left, right, result: res() }, say: `Fix ${a[i]}. Now look for two numbers after it that add up to ${-a[i] === 0 ? 0 : -a[i]}, so all three sum to 0.` });
      while (left < right) {
        if (opt.skipBefore) {
          let jumped = false;
          while (left < right && a[left] === a[left + 1]) { left++; jumped = true; }
          if (jumped) T.add({ at: null, state: st({ [i]: "anchor", [left]: "bug" }), vars: { i, left, right, result: res() }, say: `The bug: skipping equal values **before** checking the sum. \`left\` jumps straight to ${left}.` });
          if (!(left < right)) break;
        }
        const sum = a[i] + a[left] + a[right];
        const key = `i${i} l${left} r${right}`;
        const pm = { [i]: "anchor", [left]: "p1", [right]: "p2" };
        T.add({
          at: "sum", key, state: st(pm), flow: ["E", "F", "G"], vars: { i, left, right, sum, result: res() },
          say: `${a[i]} + ${a[left]} + ${a[right]} = ${sum}.`,
          ask: opt.bug ? null : {
            q: `The sum is ${sum}. What next?`,
            options: ["`left++`: the sum is too small", "`right--`: the sum is too big", "Record the triplet"],
            answer: sum < 0 ? 0 : sum > 0 ? 1 : 2,
            why: sum < 0 ? "Too small: `left` moves to a bigger number." : sum > 0 ? "Too big: `right` moves to a smaller number." : "It sums to 0, so record it, then move both pointers.",
          },
        });
        if (sum < 0) { left++; T.add({ at: "lpp", key, state: st({ [i]: "anchor" }), flow: ["G", "H"], vars: { i, left, right, result: res() }, say: "Too small: `left++` to a bigger number." }); }
        else if (sum > 0) { right--; T.add({ at: "rmm", key, state: st({ [i]: "anchor" }), flow: ["G", "I"], vars: { i, left, right, result: res() }, say: "Too big: `right--` to a smaller number." }); }
        else {
          result.push([a[i], a[left], a[right]]);
          T.add({ at: "push", key, state: st({ [i]: "answer", [left]: "answer", [right]: "answer" }), flow: ["G", "J"], vars: { i, left, right, sum, result: res() }, say: `It sums to 0: record ${G.show([a[i], a[left], a[right]])}.` });
          left++; right--;
          T.add({ at: "move", key, state: st({ [i]: "anchor" }), vars: { i, left, right, result: res() }, say: "Move both pointers inward to look for more pairs." });
          if (opt.skipDup && !opt.skipBefore) {
            while (left < right && a[left] === a[left - 1]) { left++; T.add({ at: "skipL", key, state: st({ [i]: "anchor", [left - 1]: "done" }), vars: { i, left, right, result: res() }, say: `${a[left - 1]} repeats the value just used, so it would make the same triplet again. Skip it: \`left\` = ${left}.` }); }
            while (left < right && a[right] === a[right + 1]) { right--; T.add({ at: "skipR", key, state: st({ [i]: "anchor", [right + 1]: "done" }), vars: { i, left, right, result: res() }, say: `${a[right + 1]} repeats too. Skip it: \`right\` = ${right}.` }); }
          }
        }
      }
    }
    i = -1; left = -1; right = -1;
    const seen = new Set(); const dups = [];
    result.forEach((t) => { const k = t.join(","); if (seen.has(k)) dups.push(t); seen.add(k); });
    let say = `Return ${G.show(result)}.`, note = null;
    if (opt.bug === "dups") { say = dups.length ? `Return ${G.show(result)}. ${G.show(dups[0])} appears more than once: without the skips, equal values start the same triplets again.` : `Return ${G.show(result)}. This input has no repeated values, so no duplicates appear. Try the default input.`; note = dups.length ? { text: "Duplicate triplets in the answer", cls: "bad" } : null; }
    if (opt.bug === "before") { say = `Return ${G.show(result)}. ${result.length ? "" : "But [0, 0, 0] is a valid triplet! "}Skipping equal values before checking the sum jumped over valid answers.`; note = { text: "Missed valid triplets", cls: "bad" }; }
    T.add({ at: opt.bug ? null : "ret", state: st({}, { note }), vars: { result: res() }, say });
    return T.done(result);
  }
  A.threeSum = {
    title: "3Sum: fix one number, pair-sum the rest",
    viz: "array",
    legend: ["anchor:i (fixed)", "p1:left", "p2:right", "answer:recorded", "done:skipped duplicate"],
    varRoles: { i: "anchor", left: "p1", right: "p2", sum: "focus", result: "answer" },
    inputLabel: "Numbers (any order)",
    hint: "-1 0 1 2 -1 -4",
    presets: [
      { label: "[-1,0,1,2,-1,-4] (the trace table)", input: "-1 0 1 2 -1 -4" },
      { label: "[0,0,0,0]", input: "0 0 0 0" },
      { label: "no answer: [1,2,3]", input: "1 2 3" },
      { label: "busier", input: "-2 0 1 1 2 -1 -4 3" },
    ],
    table: { id: "tbl-5", preset: 0, rows: ["i0 l1 r5", "i0 l2 r5", "i0 l3 r5", "i1 l2 r5", "i1 l3 r4", "i2 skip", "i3 l4 r5"] },
    parse(s) { return P.nums(s, { minLen: 3, maxLen: 10, min: -99, max: 99 }); },
    lines: {
      sort: { ts: "const a = [...nums].sort(", go: "sort.Ints(a)" },
      loopI: { ts: "for (let i = 0; i < a.length - 2; i++)", go: "for i := 0; i < len(a)-2; i++" },
      brk: { ts: "if (a[i] > 0) break;", go: "if a[i] > 0" },
      skipI: { ts: "if (i > 0 && a[i] === a[i - 1]) continue;", go: "if i > 0 && a[i] == a[i-1]" },
      initLR: { ts: "let left = i + 1, right = a.length - 1;", go: "left, right := i+1, len(a)-1" },
      sum: { ts: "const sum = a[i] + a[left] + a[right];", go: "sum := a[i] + a[left] + a[right]" },
      lpp: { ts: "if (sum < 0) left++;", go: "if sum < 0>>left++" },
      rmm: { ts: "else if (sum > 0) right--;", go: "else if sum > 0>>right--" },
      push: { ts: "result.push(", go: "result = append(result" },
      move: { ts: "result.push(>>left++;", go: "result = append(result>>left++" },
      skipL: { ts: "while (left < right && a[left] === a[left - 1]) left++;", go: "for left < right && a[left] == a[left-1]" },
      skipR: { ts: "while (left < right && a[right] === a[right + 1]) right--;", go: "for left < right && a[right] == a[right+1]" },
      ret: { ts: "return result;", go: "return result" },
    },
    trace: (nums) => threeSumTrace(nums, { skipDup: true }),
    bugs: [
      { label: "Replay a bug: no duplicate skipping", input: "-1 0 1 2 -1 -4", banner: "<b>Replaying a bug.</b> This version never skips equal values, neither for <code>i</code> nor after recording a triplet.", trace: (nums) => threeSumTrace(nums, { skipDup: false, bug: "dups" }) },
      { label: "Replay a bug: skip before recording", input: "0 0 0 0", banner: "<b>Replaying a bug.</b> This version skips equal values for <code>left</code> <em>before</em> checking the sum, instead of after recording.", trace: (nums) => threeSumTrace(nums, { skipDup: true, skipBefore: true, bug: "before" }) },
    ],
  };

  /* =====================================================================
     Problem 5 · Container With Most Water
     ===================================================================== */
  function maxAreaTrace(h, bug) {
    const T = new G.Trace();
    const n = h.length;
    let left = 0, right = n - 1, best = 0, bestBox = null;
    const st = (extra, mk) => Object.assign({
      h, marks: Object.assign(outside(n, left, right), mk || { [left]: "p1", [right]: "p2" }),
      ptrs: [{ name: "left", at: left, role: "p1" }, { name: "right", at: Math.max(0, right), role: "p2" }],
      best: bestBox,
    }, extra);
    T.add({ at: "init", state: st(), vars: { left, right, best }, say: "Start with the widest container: the first and the last line." });
    while (left < right) {
      const width = right - left, limit = Math.min(h[left], h[right]), area = width * limit;
      const improved = area > best;
      best = Math.max(best, area);
      if (improved) bestBox = { l: left, r: right, level: limit };
      const key = `l${left} r${right}`;
      const leftShorter = h[left] < h[right];
      T.add({
        at: "best", key, state: st({ area: { l: left, r: right, level: limit } }), flow: ["A", "B", "C"],
        vars: { left, right, width, limit, area, best },
        say: `Width ${width} × shorter line ${limit} = area ${area}.${improved ? " A new best." : ` The best stays ${best}.`}`,
        ask: bug ? null : {
          q: "Which line should be dropped?", options: ["`left`", "`right`"], answer: leftShorter ? 0 : 1,
          why: `The ${leftShorter ? "left" : "right"} line (height ${leftShorter ? h[left] : h[right]}) is ${h[left] === h[right] ? "equal to the other, so either works; the code drops the right one" : "the shorter one"}. Every container that keeps it is narrower and no taller than it, so it can never beat ${area}.`,
        },
      });
      if (bug) {
        if (h[left] < h[right]) { right--; T.add({ at: null, key, state: st(), vars: { left, right, best }, say: "The bug: dropping the **taller** right line. The short left line still limits every container, so nothing can improve, and the right line's chances are thrown away." }); }
        else { left++; T.add({ at: null, key, state: st(), vars: { left, right, best }, say: "The bug: dropping the **taller** (or equal) left line instead of the shorter one." }); }
      } else if (leftShorter) {
        left++;
        T.add({ at: "left", key, state: st(), flow: ["C", "D"], vars: { left, right, best }, say: "The left line is shorter, so it limits every container that keeps it. Drop it: `left++`." });
      } else {
        right--;
        T.add({ at: "right", key, state: st(), flow: ["C", "E"], vars: { left, right, best }, say: h[left + 0] === h[right + 1] ? "Both lines are the same height, so either can go. The code drops the right one: `right--`." : "The right line is shorter, so it limits every container that keeps it. Drop it: `right--`." });
      }
    }
    const fin = bestBox ? { [bestBox.l]: "answer", [bestBox.r]: "answer" } : {};
    if (bug) {
      const good = maxAreaTrace(h, false).result;
      T.add({ at: null, state: st({ note: { text: best === good ? "Same answer here, by luck." : `Found ${best}, but the real answer is ${good}.`, cls: best === good ? "ok" : "bad" } }, fin), vars: { best, correct: good }, say: best === good ? `This input happens to give the right answer (${good}) anyway. The default input shows the bug.` : `The pointers met with a best of ${best}, but the real answer is ${good}. Moving the taller line threw away the container that wins.` });
      return T.done(best);
    }
    T.add({ at: "ret", state: st({}, fin), vars: { best }, say: `The pointers met. The most water any container holds is **${best}**.` });
    return T.done(best);
  }
  A.maxArea = {
    title: "Container With Most Water",
    viz: "bars",
    legend: ["p1:left", "p2:right", "water:current container", "answer:best so far (dashed)", "done:dropped"],
    varRoles: { left: "p1", right: "p2", area: "focus", best: "answer" },
    inputLabel: "Line heights",
    hint: "1 8 6 2 5 4 8 3 7",
    presets: [
      { label: "[1,8,6,2,5,4,8,3,7] (the trace table)", input: "1 8 6 2 5 4 8 3 7" },
      { label: "[1,1]", input: "1 1" },
      { label: "equal heights", input: "4 3 2 1 4" },
      { label: "a valley", input: "6 2 1 1 2 7" },
    ],
    table: { id: "tbl-6", preset: 0, rows: ["l0 r8", "l1 r8", "l1 r7"] },
    parse(s) { return P.nums(s, { minLen: 2, maxLen: 12, min: 0, max: 12 }); },
    lines: {
      init: { ts: "let left = 0, right = height.length - 1, best = 0;", go: "left, right, best := 0, len(height)-1, 0" },
      best: { ts: "best = Math.max(best, width * limit);", go: "best = max(best, width*limit)" },
      left: { ts: "if (height[left] < height[right]) left++;", go: "if height[left] < height[right]>>left++" },
      right: { ts: "else right--;", go: "right--" },
      ret: { ts: "return best;", go: "return best" },
    },
    trace: (h) => maxAreaTrace(h, false),
    bugs: [{ label: "Replay the bug: move the taller line", input: "1 8 6 2 5 4 8 3 7", banner: "<b>Replaying a bug.</b> This version drops the <em>taller</em> line each time instead of the shorter one.", trace: (h) => maxAreaTrace(h, true) }],
  };

  /* =====================================================================
     Problem 6 · Trapping Rain Water (two pointers, and the prefix-array version)
     ===================================================================== */
  A.trapRain = {
    title: "Trapping Rain Water",
    short: "Two pointers, O(1) memory",
    viz: "bars",
    legend: ["p1:left and leftMax", "p2:right and rightMax", "water:trapped water", "done:settled"],
    varRoles: { left: "p1", right: "p2", leftMax: "p1", rightMax: "p2", water: "answer" },
    inputLabel: "Bar heights",
    hint: "0 1 0 2 1 0 1 3 2 1 2 1",
    presets: [
      { label: "[0,1,0,2,1,0,1,3,2,1,2,1] → 6", input: "0 1 0 2 1 0 1 3 2 1 2 1" },
      { label: "[2,0,1,3] (the trace table)", input: "2 0 1 3" },
      { label: "[4,2,0,3,2,5] → 9", input: "4 2 0 3 2 5" },
      { label: "a hill: nothing trapped", input: "1 2 3 2 1" },
    ],
    table: { id: "tbl-7", preset: 1, rows: ["l0 r3", "l1 r3", "l2 r3", "l3 r3"] },
    parse(s) { return P.nums(s, { allowEmpty: true, maxLen: 14, min: 0, max: 9 }); },
    lines: {
      init: { ts: "let left = 0, right = height.length - 1;", go: "left, right := 0, len(height)-1" },
      cmp: { ts: "if (height[left] < height[right])", go: "if height[left] < height[right]" },
      lmax: { ts: "if (height[left] >= leftMax) leftMax = height[left];", go: "if height[left] >= leftMax" },
      lwater: { ts: "else water += leftMax - height[left];", go: "water += leftMax - height[left]" },
      lmove: { ts: "left++;", go: "left++" },
      rmax: { ts: "if (height[right] >= rightMax) rightMax = height[right];", go: "if height[right] >= rightMax" },
      rwater: { ts: "else water += rightMax - height[right];", go: "water += rightMax - height[right]" },
      rmove: { ts: "right--;", go: "right--" },
      ret: { ts: "return water;", go: "return water" },
      empty: { ts: "return water;", go: "if len(height) == 0" },
    },
    trace(h) {
      const T = new G.Trace();
      const n = h.length;
      if (n === 0) { T.add({ at: "empty", state: { h: [], maxH: 1 }, vars: { water: 0 }, say: "No bars, no water: the answer is 0." }); return T.done(0); }
      const water = new Array(n).fill(0);
      let left = 0, right = n - 1, leftMax = 0, rightMax = 0, total = 0;
      const st = (mk) => {
        const marks = {};
        for (let i = 0; i < n; i++) if (i < left || i > right) marks[i] = "done";
        Object.assign(marks, { [left]: "p1", [right]: "p2" }, mk);
        return {
          h, water: water.slice(), marks,
          ptrs: [{ name: "left", at: left, role: "p1" }, { name: "right", at: right, role: "p2" }],
          levels: [
            { key: "lm", role: "p1", from: 0, to: Math.min(left, n - 1), v: leftMax, label: `leftMax ${leftMax}` },
            { key: "rm", role: "p2", from: Math.max(right, 0), to: n - 1, v: rightMax, label: `rightMax ${rightMax}` },
          ],
        };
      };
      const vars = () => ({ left, right, leftMax, rightMax, water: total });
      T.add({ at: "init", state: st(), vars: vars(), say: "`left` and `right` start at the ends. `leftMax` and `rightMax` will hold the tallest bar seen so far from each side." });
      while (left < right) {
        const key = `l${left} r${right}`;
        const goLeft = h[left] < h[right];
        T.add({
          at: "cmp", key, state: st(), flow: ["A", "B"], vars: Object.assign(vars(), { "h[left]": h[left], "h[right]": h[right] }),
          say: `Compare \`h[left]\` = ${h[left]} with \`h[right]\` = ${h[right]}.`,
          ask: {
            q: "Which side can be settled right now?",
            options: ["`left`: its water depends only on `leftMax`", "`right`: its water depends only on `rightMax`"],
            answer: goLeft ? 0 : 1,
            why: goLeft ? `\`h[left]\` < \`h[right]\`, so somewhere on the right there is a wall at least ${h[right]} tall. The lower wall for \`left\` must be on its own side: \`leftMax\` decides.` :
              `\`h[right]\` ≤ \`h[left]\`, so somewhere on the left there is a wall at least ${h[left]} tall. The lower wall for \`right\` is on its own side: \`rightMax\` decides.`,
          },
        });
        if (goLeft) {
          let node;
          if (h[left] >= leftMax) { leftMax = h[left]; node = "D"; T.add({ at: "lmax", key, state: st({ [left]: "focus" }), flow: ["B", "C", "D"], vars: vars(), say: `${h[left]} is at least \`leftMax\`, so it is the new tallest wall on the left: \`leftMax\` = ${leftMax}. No water sits on the tallest wall.` }); }
          else { const w = leftMax - h[left]; water[left] = w; total += w; node = "E"; T.add({ at: "lwater", key, state: st({ [left]: "focus" }), flow: ["B", "C", "E"], vars: vars(), say: `${h[left]} is below \`leftMax\` = ${leftMax}, so ${w} unit${w > 1 ? "s" : ""} of water sit here. Total so far: ${total}.` }); }
          left++;
          T.add({ at: "lmove", key, state: st(), flow: [node, "F"], vars: vars(), say: "That position is settled. `left++`." });
        } else {
          let node;
          if (h[right] >= rightMax) { rightMax = h[right]; node = "H"; T.add({ at: "rmax", key, state: st({ [right]: "focus" }), flow: ["B", "G", "H"], vars: vars(), say: `${h[right]} is at least \`rightMax\`, so it is the new tallest wall on the right: \`rightMax\` = ${rightMax}.` }); }
          else { const w = rightMax - h[right]; water[right] = w; total += w; node = "I"; T.add({ at: "rwater", key, state: st({ [right]: "focus" }), flow: ["B", "G", "I"], vars: vars(), say: `${h[right]} is below \`rightMax\` = ${rightMax}, so ${w} unit${w > 1 ? "s" : ""} of water sit here. Total so far: ${total}.` }); }
          right--;
          T.add({ at: "rmove", key, state: st(), flow: [node, "J"], vars: vars(), say: "That position is settled. `right--`." });
        }
      }
      T.add({ at: "ret", key: `l${left} r${right}`, state: st({ [left]: "done" }), vars: vars(), say: `\`left\` met \`right\`. Total trapped water: **${total}**.` });
      return T.done(total);
    },
  };

  A.trapArrays = {
    title: "Trapping Rain Water",
    short: "Prefix arrays, O(n) memory",
    viz: "bars",
    legend: ["p1:maxLeft", "p2:maxRight", "focus:current bar", "water:trapped water"],
    varRoles: { water: "answer" },
    inputLabel: "Bar heights",
    hint: "0 1 0 2 1 0 1 3 2 1 2 1",
    presets: [
      { label: "[0,1,0,2,1,0,1,3,2,1,2,1] → 6", input: "0 1 0 2 1 0 1 3 2 1 2 1" },
      { label: "[2,0,1,3]", input: "2 0 1 3" },
      { label: "[4,2,0,3,2,5] → 9", input: "4 2 0 3 2 5" },
    ],
    parse(s) { return P.nums(s, { minLen: 1, maxLen: 14, min: 0, max: 9 }); },
    lines: {
      init: { ts: "const maxLeft = new Array<number>(n).fill(0);", go: "maxLeft := make([]int, n)" },
      left: { ts: "for (let i = 0; i < n; i++) maxLeft[i] = Math.max(", go: "func trapWithArrays>>for i := 0; i < n; i++" },
      right: { ts: "for (let i = n - 1; i >= 0; i--) maxRight[i] = Math.max(", go: "for i := n - 1; i >= 0; i--" },
      sum: { ts: "water += Math.min(maxLeft[i], maxRight[i]) - height[i];", go: "water += min(maxLeft[i], maxRight[i]) - height[i]" },
      ret: { ts: "function trapWithArrays>>return water;", go: "func trapWithArrays>>return water" },
    },
    trace(h) {
      const T = new G.Trace();
      const n = h.length;
      const ml = new Array(n).fill(null), mr = new Array(n).fill(null), water = new Array(n).fill(0);
      let total = 0;
      const st = (cur, phase) => ({
        h, water: water.slice(), marks: cur != null ? { [cur]: "focus" } : {},
        rows: [{ label: "maxLeft", vals: ml.slice(), role: "p1", cur: phase === "L" ? cur : -1 }, { label: "maxRight", vals: mr.slice(), role: "p2", cur: phase === "R" ? cur : -1 }],
      });
      T.add({ at: "init", state: st(null), vars: { water: total }, say: "Two helper arrays. `maxLeft[i]` is the tallest bar from the start up to `i`; `maxRight[i]` is the tallest from `i` to the end." });
      for (let i = 0; i < n; i++) {
        const prev = i > 0 ? ml[i - 1] : 0;
        ml[i] = Math.max(h[i], prev);
        T.add({ at: "left", state: st(i, "L"), flow: ["A", "B"], vars: { i, [`maxLeft[${i}]`]: ml[i] }, say: `\`maxLeft[${i}]\` = max(${h[i]}, ${prev}) = ${ml[i]}.` });
      }
      for (let i = n - 1; i >= 0; i--) {
        const prev = i < n - 1 ? mr[i + 1] : 0;
        mr[i] = Math.max(h[i], prev);
        T.add({ at: "right", state: st(i, "R"), flow: ["A", "C"], vars: { i, [`maxRight[${i}]`]: mr[i] }, say: `\`maxRight[${i}]\` = max(${h[i]}, ${prev}) = ${mr[i]}.` });
      }
      for (let i = 0; i < n; i++) {
        const lvl = Math.min(ml[i], mr[i]);
        const w = lvl - h[i];
        water[i] = w;
        total += w;
        T.add({ at: "sum", state: st(i, "S"), flow: ["B", "D", "E"], vars: { i, level: lvl, water: total }, say: `At ${i}: the level is min(${ml[i]}, ${mr[i]}) = ${lvl}, so water = ${lvl} − ${h[i]} = ${w}. Total: ${total}.` });
      }
      T.add({ at: "ret", state: st(null), vars: { water: total }, say: `Total trapped water: **${total}**. Same answer as the two-pointer version, but with two extra arrays.` });
      return T.done(total);
    },
  };

  /* =====================================================================
     Exercises: Move Zeroes, Valid Palindrome, Merge Sorted Array
     ===================================================================== */
  A.moveZeroes = {
    title: "Move Zeroes (read/write with swaps)",
    viz: "array",
    legend: ["p1:write", "p2:read", "focus:being read", "answer:in its final place"],
    varRoles: { write: "p1", read: "p2" },
    inputLabel: "Numbers",
    hint: "0 1 0 3 12",
    presets: [{ label: "[0,1,0,3,12]", input: "0 1 0 3 12" }, { label: "no zeros", input: "1 2" }, { label: "all zeros", input: "0 0 0" }],
    parse(s) { return P.nums(s, { minLen: 1, maxLen: 10, min: -99, max: 99 }); },
    lines: {
      init: { ts: "function moveZeroes>>let write = 0;", go: "func moveZeroes>>write := 0" },
      test: { ts: "if (nums[read] !== 0)", go: "if nums[read] != 0" },
      swap: { ts: "[nums[write], nums[read]] = [nums[read], nums[write]];", go: "nums[write], nums[read] = nums[read], nums[write]" },
      inc: { ts: "function moveZeroes>>write++;", go: "func moveZeroes>>write++" },
      loop: { ts: "function moveZeroes>>for (let read = 0;", go: "func moveZeroes>>for read := 0;" },
    },
    trace(a0) {
      const a = a0.slice(), ids = a.map((_, i) => i), n = a.length;
      const T = new G.Trace();
      let write = 0;
      const st = (read, mk) => ({
        rows: [{ cells: a.map((v, i) => ({ id: ids[i], v })), marks: Object.assign({}, mk), boundary: write,
          ptrs: [{ name: "write", at: write, role: "p1" }].concat(read != null && read < n ? [{ name: "read", at: read, role: "p2" }] : []),
          zones: [{ key: "nz", from: 0, to: write - 1, label: "non-zeros, in order", cls: "done" }] }],
      });
      T.add({ at: "init", state: st(0), vars: { write }, say: "Everything before `write` will be the non-zero values, in their original order." });
      for (let read = 0; read < n; read++) {
        const v = a[read];
        T.add({ at: "test", state: st(read, { [read]: "focus" }), vars: { read, write, "nums[read]": v }, say: `\`read\` looks at ${v}.`, ask: { q: `Is ${v} non-zero?`, options: ["Yes: swap it to `write`", "No: leave it for now"], answer: v !== 0 ? 0 : 1, why: v !== 0 ? "Non-zeros go to the front, in order." : "Zeros are left behind; they drift to the end as non-zeros are swapped forward." } });
        if (v !== 0) {
          [a[write], a[read]] = [a[read], a[write]];
          [ids[write], ids[read]] = [ids[read], ids[write]];
          T.add({ at: "swap", state: st(read, { [write]: "focus", [read]: "focus" }), vars: { read, write }, say: write === read ? "`write` and `read` are the same slot, so the swap changes nothing." : `Swap ${v} into slot ${write}; the zero there moves back to slot ${read}.` });
          write++;
          T.add({ at: "inc", state: st(read), vars: { read, write }, say: `\`write++\`, so \`write\` = ${write}.` });
        } else {
          T.add({ at: "loop", state: st(read + 1), vars: { read: read + 1, write }, say: "A zero: only `read` moves on." });
        }
      }
      const m = {}; for (let i = 0; i < n; i++) m[i] = "answer";
      T.add({ at: null, state: st(null, m), vars: { result: a.slice() }, say: `Done: ${G.show(a)}. Every non-zero kept its order, and the zeros ended up at the back.` });
      return T.done(a.slice());
    },
  };

  const isAlnum = (c) => /^[a-z0-9]$/i.test(c);
  A.isPalindrome = {
    title: "Valid Palindrome (opposite ends, skipping punctuation)",
    viz: "array",
    legend: ["p1:left", "p2:right", "done:skipped or matched", "bug:mismatch"],
    varRoles: { left: "p1", right: "p2" },
    inputLabel: "A phrase",
    hint: "No lemon, no melon",
    presets: [{ label: "No lemon, no melon", input: "No lemon, no melon" }, { label: "race a car", input: "race a car" }, { label: "Was it a cat I saw?", input: "Was it a cat I saw?" }],
    parse(s) {
      const t = String(s);
      if (!t.length) throw new Error("Type a phrase.");
      if (t.length > 22) throw new Error("Keep it to 22 characters so the picture stays readable.");
      return t;
    },
    lines: {
      init: { ts: "function isPalindrome>>let left = 0, right = s.length - 1;", go: "func isPalindrome>>left, right := 0, len(s)-1" },
      skipL: { ts: "if (!isAlphaNum(s[left]))", go: "if !isAlphaNum(s[left])" },
      skipR: { ts: "if (!isAlphaNum(s[right]))", go: "if !isAlphaNum(s[right])" },
      cmp: { ts: "if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;", go: "if toLower(s[left]) != toLower(s[right])" },
      fail: { ts: "if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;", go: "func isPalindrome>>return false" },
      move: { ts: "function isPalindrome>>return false;>>left++;", go: "func isPalindrome>>return false>>left++" },
      ok: { ts: "function isPalindrome>>return true;", go: "func isPalindrome>>return true" },
    },
    trace(s) {
      const T = new G.Trace();
      const n = s.length;
      let left = 0, right = n - 1;
      const settled = {};
      const st = (mk) => ({ cells: s.split("").map((v, i) => ({ id: i, v })), cellW: 34, cellH: 42, gap: 5, marks: Object.assign({}, settled, mk), ptrs: [{ name: "left", at: Math.min(left, n - 1), role: "p1" }, { name: "right", at: Math.max(right, 0), role: "p2" }] });
      T.add({ at: "init", state: st(), vars: { left, right }, say: "`left` starts at the first character and `right` at the last." });
      while (left < right) {
        if (!isAlnum(s[left])) { settled[left] = "done"; left++; T.add({ at: "skipL", state: st(), vars: { left, right }, say: `\`${s[left - 1] === " " ? "space" : s[left - 1]}\` is not a letter or digit: skip it, \`left++\`.` }); continue; }
        if (!isAlnum(s[right])) { settled[right] = "done"; right--; T.add({ at: "skipR", state: st(), vars: { left, right }, say: `\`${s[right + 1] === " " ? "space" : s[right + 1]}\` is not a letter or digit: skip it, \`right--\`.` }); continue; }
        const same = s[left].toLowerCase() === s[right].toLowerCase();
        T.add({ at: "cmp", state: st({ [left]: "focus", [right]: "focus" }), vars: { left, right }, say: `Compare \`${s[left]}\` and \`${s[right]}\`, ignoring case.`, ask: { q: `Do \`${s[left]}\` and \`${s[right]}\` match (ignoring case)?`, options: ["Yes: move both inward", "No: it's not a palindrome"], answer: same ? 0 : 1, why: same ? "They match, so this pair is fine." : "One mismatch is enough to answer false." } });
        if (!same) { T.add({ at: "fail", state: st({ [left]: "bug", [right]: "bug" }), vars: { left, right, result: false }, say: `\`${s[left]}\` ≠ \`${s[right]}\`: return \`false\`.` }); return T.done(false); }
        settled[left] = "done"; settled[right] = "done";
        left++; right--;
        T.add({ at: "move", state: st(), vars: { left, right }, say: "They match. Move both pointers inward." });
      }
      const m = {}; for (let i = 0; i < n; i++) if (isAlnum(s[i])) m[i] = "answer";
      T.add({ at: "ok", state: st(m), vars: { left, right, result: true }, say: "The pointers met without a mismatch: return `true`." });
      return T.done(true);
    },
  };

  A.mergeSorted = {
    title: "Merge Sorted Array, filling from the back",
    viz: "array",
    legend: ["p1:i (end of nums1's values)", "p2:j (end of nums2)", "focus:write", "done:spare room"],
    varRoles: { i: "p1", j: "p2", write: "focus" },
    inputLabel: "nums1 values ; nums2 values (both sorted)",
    hint: "1 2 3 ; 2 5 6",
    presets: [{ label: "[1,2,3] + [2,5,6]", input: "1 2 3 ; 2 5 6" }, { label: "nums1 empty", input: " ; 1" }, { label: "[4,5,6] + [1,2,3]", input: "4 5 6 ; 1 2 3" }],
    parse(s) {
      const [x, y] = P.parts(s, 2, 'Write nums1\'s values, then ";" and nums2, e.g. 1 2 3 ; 2 5 6');
      const a = P.nums(x, { sorted: true, allowEmpty: true, maxLen: 6, min: -99, max: 99 });
      const b = P.nums(y, { sorted: true, allowEmpty: true, maxLen: 6, min: -99, max: 99 });
      if (!a.length && !b.length) throw new Error("Give at least one number.");
      return { a, b };
    },
    lines: {
      init: { ts: "let i = m - 1, j = n - 1, write = m + n - 1;", go: "i, j, write := m-1, n-1, m+n-1" },
      cmp: { ts: "if (i >= 0 && nums1[i] > nums2[j])", go: "if i >= 0 && nums1[i] > nums2[j]" },
      take1: { ts: "nums1[write] = nums1[i];", go: "nums1[write] = nums1[i]" },
      dec1: { ts: "nums1[write] = nums1[i];>>i--;", go: "nums1[write] = nums1[i]>>i--" },
      take2: { ts: "nums1[write] = nums2[j];", go: "nums1[write] = nums2[j]" },
      dec2: { ts: "nums1[write] = nums2[j];>>j--;", go: "nums1[write] = nums2[j]>>j--" },
      wdec: { ts: "write--;", go: "write--" },
      loop: { ts: "while (j >= 0)", go: "for j >= 0" },
    },
    trace({ a, b }) {
      const T = new G.Trace();
      const m = a.length, n = b.length;
      const nums1 = a.concat(new Array(n).fill(null));
      let i = m - 1, j = n - 1, write = m + n - 1;
      const st = (mk1, mk2, fly) => {
        const r1 = {}; nums1.forEach((v, k) => { if (v === null) r1[k] = "done"; });
        return {
          labelW: 74, rowGap: 4,
          rows: [
            { label: "nums1", cells: nums1.map((v, k) => ({ id: k, v })), marks: Object.assign(r1, mk1), ptrs: [{ name: "i", at: Math.max(i, 0), role: "p1", hidden: i < 0 }, { name: "write", at: Math.max(write, 0), role: "focus", side: "above", hidden: write < 0 }] },
            { label: "nums2", cells: b.map((v, k) => ({ id: k, v })), marks: Object.assign({}, mk2), ptrs: [{ name: "j", at: Math.max(j, 0), role: "p2", hidden: j < 0 }] },
          ],
          fly,
        };
      };
      T.add({ at: "init", state: st(), vars: { i, j, write }, say: `\`nums1\` has ${n} empty slot${n === 1 ? "" : "s"} at the back. Fill them from the back: the biggest remaining value goes into \`write\` each time.` });
      while (j >= 0) {
        const takeFirst = i >= 0 && nums1[i] > b[j];
        T.add({
          at: "cmp", state: st(i >= 0 ? { [i]: "p1" } : {}, { [j]: "p2" }), vars: { i, j, write, "nums1[i]": i >= 0 ? nums1[i] : undefined, "nums2[j]": b[j] },
          say: i >= 0 ? `Compare \`nums1[i]\` = ${nums1[i]} with \`nums2[j]\` = ${b[j]}. The bigger one goes into slot ${write}.` : `\`nums1\` has no values left (\`i\` < 0), so \`nums2[j]\` = ${b[j]} goes next.`,
          ask: i >= 0 ? { q: `Which value goes into slot ${write}?`, options: [`\`nums1[i]\` = ${nums1[i]}`, `\`nums2[j]\` = ${b[j]}`], answer: takeFirst ? 0 : 1, why: takeFirst ? `${nums1[i]} is bigger.` : `${b[j]} is at least as big (ties take from nums2).` } : null,
        });
        if (takeFirst) {
          const v = nums1[i];
          nums1[write] = v;
          T.add({ at: "take1", state: st({ [write]: "focus" }, {}, i !== write ? { fromRow: 0, from: i, toRow: 0, to: write, v } : null), vars: { i, j, write }, say: `Copy ${v} from slot ${i} into slot ${write}.` });
          i--;
          T.add({ at: "dec1", state: st(), vars: { i, j, write }, say: "`i--`." });
        } else {
          const v = b[j];
          nums1[write] = v;
          T.add({ at: "take2", state: st({ [write]: "focus" }, {}, { fromRow: 1, from: j, toRow: 0, to: write, v }), vars: { i, j, write }, say: `Copy ${v} from \`nums2\` into slot ${write}.` });
          j--;
          T.add({ at: "dec2", state: st(), vars: { i, j, write }, say: "`j--`." });
        }
        write--;
        T.add({ at: "wdec", state: st(), vars: { i, j, write }, say: `\`write--\`, so \`write\` = ${write}.` });
      }
      const fin = {}; nums1.forEach((_, k) => (fin[k] = "answer"));
      T.add({ at: "loop", state: st(fin), vars: { result: nums1.slice() }, say: `\`j\` < 0, so \`nums2\` is used up. Whatever is left in \`nums1\` is already in place: ${G.show(nums1)}.` });
      return T.done(nums1.slice());
    },
  };

  /* =====================================================================
     Quizzes
     ===================================================================== */
  G.quizzes.recognize05 = {
    title: "Which tool fits?",
    intro: "Read each problem statement and pick the approach. The reason matters more than the name.",
    items: [
      { q: "Given a **sorted** array and a target, return the positions of two numbers that add up to it, using `O(1)` extra memory.", options: ["Two pointers from opposite ends", "Read/write pointers", "Hash map", "Sliding window"], answer: 0, why: "Sorted plus a pair: each comparison throws one end away for good. A hash map also works, but it needs `O(n)` memory." },
      { q: "Remove every copy of `val` from an array **in place** and return the new length. The other values must keep their order.", options: ["Opposite ends", "Read/write pointers (same direction)", "Three-zone partition", "Sort first"], answer: 1, why: "One pointer reads every item; the other writes the keepers. The finished part grows behind `write`." },
      { q: "An array holds only 0, 1 and 2. Sort it in one pass without a sort function.", options: ["Partition with three pointers (Dutch flag)", "Read/write pointers", "Binary search", "Opposite ends"], answer: 0, why: "A few categories: keep zones with `low`, `mid` and `high`, and swap each item into its zone." },
      { q: "An **unsorted** array: return the **indexes** of two numbers that add up to a target.", options: ["Sort, then opposite ends", "Hash map (lesson 04)", "Read/write pointers", "Three-way partition"], answer: 1, why: "Sorting would scramble the original indexes. A hash map finds the partner in one pass (or sort `(value, index)` pairs and accept `O(n log n)`)." },
      { q: "Is \"Was it a car or a cat I saw?\" a palindrome, ignoring case and punctuation?", options: ["Opposite ends, skipping non-letters", "Sliding window", "Read/write pointers", "Sort the letters and compare"], answer: 0, why: "Symmetry: compare the two ends and walk inward. Sorting would destroy the order that a palindrome is about." },
      { q: "Find the length of the longest **substring** with no repeated characters.", options: ["Opposite ends", "Read/write pointers", "Sliding window (lesson 06)", "Three-zone partition"], answer: 2, why: "Two indexes still move in the same direction, but now the stretch **between** them is what matters. That is a sliding window, the next lesson." },
      { q: "Merge two sorted arrays in place, where the first one has empty room at its end.", options: ["Opposite ends on one array", "Two read pointers and one write pointer, filling from the back", "Hash map", "Sliding window"], answer: 1, why: "Fill from the back: the spare room is there, so a write never overwrites a value you still need." },
    ],
  };

  G.quizzes.recap05 = {
    title: "Why is each move safe?",
    intro: "Interviewers ask \"why can you move that pointer?\". Pick the reason you would say out loud.",
    items: [
      { q: "Pair sum: `nums[left] + nums[right]` is **less** than the target. Why may `left` be thrown away forever?", options: ["`nums[right]` is the biggest partner left, so no partner can lift `nums[left]` to the target", "`left` has already been used once", "The sum might be bigger next time", "The array has no duplicates"], answer: 0, why: "Every remaining partner is `≤ nums[right]`, so every pair that uses `nums[left]` is too small." },
      { q: "Container With Most Water: why move the **shorter** line?", options: ["It limits every container that keeps it, and moving inward only makes the width smaller", "The taller line might be needed later", "Moving the shorter line always increases the area", "It's a convention; either side works"], answer: 0, why: "Any container that keeps the shorter line is narrower and no taller than it, so it can't beat the current area. Dropping the taller line can only lose." },
      { q: "Sort Colors: after swapping `nums[mid]` with `nums[high]`, why must `mid` stay put?", options: ["The item that arrived from `high` has never been checked", "`mid` must always stay behind `low`", "It saves a comparison", "The swapped-in item is always a 2"], answer: 0, why: "Everything from `mid` to `high` is the unknown zone, so whatever comes back from there must be examined before `mid` moves past it." },
      { q: "3Sum: why skip `i` when `a[i] === a[i - 1]`?", options: ["It would start exactly the same triplets again", "Equal numbers can never be in one triplet", "It keeps the sort stable", "It prevents an index error"], answer: 0, why: "The previous `i` with the same value already found every triplet that starts with it. `[0, 0, 0]` is still found, because the other skips happen only after recording." },
      { q: "Trapping Rain Water: `h[left] < h[right]`. Why can the water at `left` be settled using only `leftMax`?", options: ["There is a wall on the right at least `h[right]` tall, so the right side is not the lower wall here", "`leftMax` is always bigger than `rightMax`", "The right side never holds water", "Water only flows to the left"], answer: 0, why: "The water level is the lower of the two walls. On the right there is already a wall taller than `h[left]`, so the left wall, `leftMax`, decides." },
    ],
  };
})();

/* Lesson 06 · Sliding window — animators and quizzes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  // A window over cells: left and right pointers, the window bracket, items that already left in grey.
  function win(items, left, right, o) {
    o = o || {};
    const marks = {};
    items.forEach((_, i) => { if (i < left) marks[i] = "done"; });
    if (right >= 0 && right < items.length) marks[right] = "p2";
    if (left <= right && left < items.length) marks[left] = left === right ? "p2" : "p1";
    Object.assign(marks, o.marks || {});
    const zones = [];
    if (right >= left) zones.push({ key: "w", from: left, to: right, label: o.label || `window, length ${right - left + 1}`, cls: o.bad ? "0" : "u" });
    if (o.best) zones.push({ key: "b", from: o.best[0], to: o.best[1], label: o.bestLabel || "best", cls: "done" });
    return { cellW: o.cellW || 46, cells: G.cells(items), marks, ptrs: [{ name: "left", at: Math.min(left, items.length - 1), role: "p1", hidden: left > right && right < 0 }, { name: "right", at: Math.max(0, right), role: "p2", hidden: right < 0 }], zones, panels: o.panels, note: o.note };
  }
  const chars = (s, max) => { const t = String(s); if (!t.length || t.length > max) throw new Error(`Use 1 to ${max} characters.`); return t; };

  /* ---------------- skeletons ---------------- */
  function fixedTrace({ nums, k }) {
    const T = new G.Trace();
    if (k > nums.length) { T.add({ at: "guard", state: win(nums, 0, -1), vars: { k }, say: "`k` is bigger than the array: there is no window of that size. The TypeScript version returns `NaN`; ask the interviewer what they want." }); return T.done(null); }
    let sum = 0;
    for (let i = 0; i < k; i++) { sum += nums[i]; T.add({ at: "build", key: "w0", state: win(nums, 0, i, { label: `building, sum ${sum}` }), vars: { windowSum: sum }, say: `Build the first window: add ${nums[i]}. Sum = ${sum}.` }); }
    let best = sum, bestBox = [0, k - 1];
    T.add({ at: "best", key: "w0", state: win(nums, 0, k - 1, { label: `sum ${sum}`, best: bestBox }), vars: { windowSum: sum, best }, say: `First window: sum ${sum}. That is the best so far.` });
    for (let right = k; right < nums.length; right++) {
      const out = nums[right - k];
      sum += nums[right] - out;
      const key = `w${right - k + 1}`;
      T.add({ at: "slide", key, state: win(nums, right - k + 1, right, { label: `sum ${sum}`, best: bestBox, marks: { [right - k]: "bug" } }), vars: { windowSum: sum, best, entered: nums[right], left: out }, say: `Slide: ${nums[right]} enters, ${out} leaves. ${sum - nums[right] + out} + ${nums[right]} − ${out} = ${sum}. No re-adding.` });
      if (sum > best) { best = sum; bestBox = [right - k + 1, right]; }
      T.add({ at: "best", key, state: win(nums, right - k + 1, right, { label: `sum ${sum}`, best: bestBox }), vars: { windowSum: sum, best }, say: `best = max(best, ${sum}) = ${best}.` });
    }
    T.add({ at: "ret", state: win(nums, nums.length - k, nums.length - 1, { best: bestBox, bestLabel: `best ${best}` }), vars: { best }, say: `Return ${best}. Each step is \`O(1)\`, so \`O(n)\` in total instead of \`O(n · k)\`.` });
    return T.done(best);
  }
  const parseFixed = (s) => { const [a, k] = P.parts(s, 2, 'Numbers, then ";" and k'); const kk = P.num(k, "k"); if (!Number.isInteger(kk) || kk < 1) throw new Error("k must be a whole number of at least 1."); return { nums: P.nums(a, { minLen: 1, maxLen: 12, min: -99, max: 99 }), k: kk }; };
  const fixedLines = {
    guard: { ts: "if (k > nums.length) return NaN;", go: "func bestSumOfSizeK>>windowSum := 0" },
    build: { ts: "for (let i = 0; i < k; i++) windowSum += nums[i];", go: "windowSum += nums[i] // build the first window" },
    slide: { ts: "windowSum += nums[right] - nums[right - k];", go: "windowSum += nums[right] - nums[right-k]" },
    best: { ts: "function bestSumOfSizeK>>best = Math.max(best, windowSum);", go: "best = max(best, windowSum)" },
    ret: { ts: "function bestSumOfSizeK>>return best;", go: "func bestSumOfSizeK>>return best" },
  };
  A.fixedWindow = {
    title: "Fixed window of size k: best sum", short: "Fixed size k",
    viz: "array", legend: ["p1:left", "p2:right", "bug:the item that just left", "answer:best window (green bracket)"],
    varRoles: { windowSum: "focus", best: "answer" },
    inputLabel: "Numbers ; k", hint: "2 1 5 1 3 2 ; 3",
    presets: [{ label: "[2,1,5,1,3,2], k = 3 (the trace table)", input: "2 1 5 1 3 2 ; 3" }, { label: "negatives are fine here", input: "4 -1 -2 7 -3 5 ; 2" }],
    table: { id: "tbl-2", preset: 0, rows: ["w0", "w1", "w2", "w3"] },
    parse: parseFixed, lines: fixedLines, trace: fixedTrace,
  };
  A.varWindow = {
    title: "Variable window: grow right, shrink left", short: "Variable size",
    viz: "array", legend: ["p1:left", "p2:right", "answer:best window (green bracket)"],
    varRoles: { zeros: "focus", best: "answer" },
    inputLabel: "bits ; limit", hint: "1 0 1 1 0 0 1 ; 1",
    presets: [{ label: "[1,0,1,1,0,0,1], at most 1 zero", input: "1 0 1 1 0 0 1 ; 1" }, { label: "at most 2 zeros", input: "0 1 0 0 1 1 0 1 ; 2" }],
    parse(s) { const [a, k] = P.parts(s, 2, 'Bits, then ";" and the limit'); const lim = P.num(k, "The limit"); if (lim < 0) throw new Error("The limit must be 0 or more."); return { bits: P.nums(a, { only: [0, 1], minLen: 1, maxLen: 12 }), limit: lim }; },
    lines: {
      add: { ts: "if (bits[right] === 0) zeros++; // add the right item", go: "zeros++ // add the right item" },
      shrink: { ts: "function longestWithAtMostZeros>>if (bits[left] === 0) zeros--;", go: "func longestWithAtMostZeros>>zeros--" },
      left: { ts: "function longestWithAtMostZeros>>left++;", go: "func longestWithAtMostZeros>>left++" },
      best: { ts: "best = Math.max(best, right - left + 1); // record after the window is valid", go: "best = max(best, right-left+1) // record after the window is valid" },
    },
    trace({ bits, limit }) {
      const T = new G.Trace();
      let left = 0, zeros = 0, best = 0, bestBox = null;
      for (let right = 0; right < bits.length; right++) {
        if (bits[right] === 0) zeros++;
        const bad = zeros > limit;
        T.add({ at: "add", state: win(bits, left, right, { label: `${zeros} zero${zeros === 1 ? "" : "s"}`, bad, best: bestBox }), flow: ["A", "B", "C"], vars: { left, right, zeros, best }, say: `Grow: \`right\` = ${right}${bits[right] === 0 ? `, a zero (zeros = ${zeros})` : ""}.`, ask: { q: `${zeros} zero${zeros === 1 ? "" : "s"} in the window, limit ${limit}. Does it break the rule?`, options: ["Yes: shrink from the left", "No: record the answer"], answer: bad ? 0 : 1, why: bad ? `${zeros} > ${limit}.` : `${zeros} ≤ ${limit}.` } });
        while (zeros > limit) {
          if (bits[left] === 0) zeros--;
          T.add({ at: "shrink", state: win(bits, left, right, { label: `${zeros} zero${zeros === 1 ? "" : "s"}`, bad: zeros > limit, best: bestBox, marks: { [left]: "bug" } }), flow: ["C", "D"], vars: { left, right, zeros, best }, say: `Remove \`bits[left]\` = ${bits[left]}${bits[left] === 0 ? `: zeros = ${zeros}` : ""}.` });
          left++;
          T.add({ at: "left", state: win(bits, left, right, { label: `${zeros} zero${zeros === 1 ? "" : "s"}`, bad: zeros > limit, best: bestBox }), flow: ["D", "C"], vars: { left, right, zeros, best }, say: `\`left++\` → ${left}.` });
        }
        if (right - left + 1 > best) { best = right - left + 1; bestBox = [left, right]; }
        T.add({ at: "best", state: win(bits, left, right, { label: `${zeros} zero${zeros === 1 ? "" : "s"}`, best: bestBox }), flow: ["C", "E"], vars: { left, right, zeros, best }, say: `Valid. Length ${right - left + 1}; best = ${best}. (Longest: record after the shrink loop.)` });
      }
      return T.done(best);
    },
  };

  /* ---------------- Problem 2 ---------------- */
  function longestNoRepeat(s, bug) {
    const T = new G.Trace();
    const last = new Map();
    let left = 0, best = 0, bestBox = null;
    const items = s.split("");
    const panel = (hi) => [{ title: "lastSeen", entries: [...last.entries()], hi: hi ? [hi] : [] }];
    for (let right = 0; right < s.length; right++) {
      const ch = s[right];
      const prev = last.get(ch);
      const inside = prev !== undefined && prev >= left;
      const key = `r${right}`;
      T.add({ at: "prev", key, state: win(items, left, right, { panels: panel(prev !== undefined ? ch : null), best: bestBox, marks: prev !== undefined ? { [prev]: inside ? "bug" : "anchor" } : {} }), flow: ["A", "B"], vars: { left, right, ch, prev: prev === undefined ? "none" : prev, best },
        say: prev === undefined ? `\`${ch}\` has not been seen.` : `\`${ch}\` was last seen at ${prev}, which is ${inside ? "inside" : "**outside**"} the window (left = ${left}).`,
        ask: bug ? null : { q: prev === undefined ? `\`${ch}\` is new. Where does \`left\` go?` : `\`${ch}\` was seen at ${prev}; left = ${left}. Where does \`left\` go?`, options: ["Stay where it is", `Jump to ${prev === undefined ? "?" : prev + 1}`], answer: inside ? 1 : 0, why: inside ? `The repeat is inside the window, so the window must start after it: left = ${prev + 1}.` : prev === undefined ? "No repeat, so nothing changes." : `That copy already left the window. Jumping to ${prev + 1} would move \`left\` backward.` } });
      if (prev !== undefined) {
        const was = left;
        left = bug ? prev + 1 : Math.max(left, prev + 1);
        T.add({ at: "jump", key, state: win(items, left, right, { panels: panel(ch), best: bestBox, bad: bug && left < was }), flow: inside ? ["B", "C"] : ["B", "D"], vars: { left, right, best }, say: bug && left < was ? `The bug: \`left = prev + 1\` moves \`left\` **backward** from ${was} to ${left}, so the window now contains a repeat.` : inside ? `\`left = max(${was}, ${prev + 1})\` = ${left}.` : `\`max(${was}, ${prev + 1})\` keeps \`left\` at ${left}.` });
      }
      last.set(ch, right);
      T.add({ at: "set", key, state: win(items, left, right, { panels: panel(ch), best: bestBox }), flow: ["E"], vars: { left, right, best }, say: `\`lastSeen[${ch}]\` = ${right}.` });
      if (right - left + 1 > best) { best = right - left + 1; bestBox = [left, right]; }
      T.add({ at: "best", key, state: win(items, left, right, { panels: panel(), best: bestBox }), flow: ["E", "F"], vars: { left, right, best }, say: `Window \`${s.slice(left, right + 1)}\`, length ${right - left + 1}; best = ${best}.` });
    }
    return T.done(best);
  }
  A.longestNoRepeat = {
    title: "Longest Substring Without Repeating Characters",
    viz: "array", legend: ["p1:left", "p2:right", "anchor:last copy, already outside", "bug:a repeat inside the window"],
    varRoles: { left: "p1", right: "p2", best: "answer" },
    inputLabel: "A string", hint: "abba",
    presets: [{ label: "abba (the trace table)", input: "abba" }, { label: "abcabcbb", input: "abcabcbb" }, { label: "pwwkew", input: "pwwkew" }, { label: "bbbbb", input: "bbbbb" }],
    table: { id: "tbl-3", preset: 0, rows: ["r0", "r1", "r2", "r3"] },
    parse: (s) => chars(s, 14),
    lines: {
      prev: { ts: "const prev = lastSeen.get(ch);", go: "if prev, ok := lastSeen[ch]; ok" },
      jump: { ts: "if (prev !== undefined) left = Math.max(left, prev + 1);", go: "left = max(left, prev+1)" },
      set: { ts: "lastSeen.set(ch, right);", go: "lastSeen[ch] = right" },
      best: { ts: "function lengthOfLongestSubstring>>best = Math.max(best, right - left + 1);", go: "func lengthOfLongestSubstring>>best = max(best, right-left+1)" },
    },
    trace: (s) => longestNoRepeat(s, false),
    bugs: [{ label: "Replay the bug: no max (left moves back)", input: "abba", banner: "<b>Replaying a bug.</b> This version writes <code>left = prev + 1</code> without the <code>max</code>.", trace: (s) => longestNoRepeat(s, true) }],
  };

  /* ---------------- Problem 3 ---------------- */
  function minLenTrace({ target, nums }, brute) {
    const T = new G.Trace();
    let left = 0, sum = 0, best = Infinity, bestBox = null;
    for (let right = 0; right < nums.length; right++) {
      sum += nums[right];
      const key = `r${right}`;
      T.add({ at: "add", key, state: win(nums, left, right, { label: `sum ${sum}`, best: bestBox }), flow: ["A", "B"], vars: { left, right, sum, best: best === Infinity ? "∞" : best }, say: `Add ${nums[right]}: sum = ${sum}.`, ask: { q: `sum = ${sum}, target ${target}. Is the window valid?`, options: ["Yes: record it, then shrink", "No: grow right"], answer: sum >= target ? 0 : 1, why: sum >= target ? `${sum} ≥ ${target}.` : `${sum} < ${target}.` } });
      while (sum >= target) {
        if (right - left + 1 < best) { best = right - left + 1; bestBox = [left, right]; }
        T.add({ at: "rec", key, state: win(nums, left, right, { label: `sum ${sum}`, best: bestBox }), flow: ["B", "D"], vars: { left, right, sum, best }, say: `sum ${sum} ≥ ${target}: record length ${right - left + 1}; best = ${best}. (Shortest: record inside the loop.)` });
        sum -= nums[left];
        T.add({ at: "sub", key, state: win(nums, left, right, { label: `sum ${sum}`, best: bestBox, marks: { [left]: "bug" } }), flow: ["D", "E"], vars: { left, right, sum, best }, say: `Remove ${nums[left]}: sum = ${sum}.` });
        left++;
      }
    }
    const ans = best === Infinity ? 0 : best;
    let note = null, say = ans ? `Return ${ans}.` : "No window reached the target: return 0.";
    if (brute) {
      let truth = Infinity;
      for (let i = 0; i < nums.length; i++) { let s = 0; for (let j = i; j < nums.length; j++) { s += nums[j]; if (s >= target) { truth = Math.min(truth, j - i + 1); break; } } }
      truth = truth === Infinity ? 0 : truth;
      note = { text: truth === ans ? `Window: ${ans}. True answer: ${truth}. Lucky.` : `Window: ${ans}. True answer: ${truth}.`, cls: truth === ans ? "ok" : "bad" };
      say = truth === ans ? `The window got ${ans}, which happens to be right here.` : `The window says ${ans}, but the true shortest is ${truth}. With a negative number, shrinking can *raise* the sum, so the window's rule no longer moves in one direction. Use prefix sums instead (lesson 07).`;
    }
    T.add({ at: brute ? null : "ret", state: win(nums, Math.min(left, nums.length - 1), nums.length - 1, { best: bestBox, bestLabel: `best ${ans}`, note }), vars: { best: ans }, say });
    return T.done(ans);
  }
  A.minSubArray = {
    title: "Minimum Size Subarray Sum",
    viz: "array", legend: ["p1:left", "p2:right", "bug:the item being removed", "answer:shortest so far (green bracket)"],
    varRoles: { left: "p1", right: "p2", sum: "focus", best: "answer" },
    inputLabel: "target ; positive numbers", hint: "7 ; 2 3 1 2 4 3",
    presets: [{ label: "target 7, [2,3,1,2,4,3] (the trace table)", input: "7 ; 2 3 1 2 4 3" }, { label: "never reaches", input: "100 ; 1 2 3" }],
    table: { id: "tbl-4", preset: 0, rows: ["r0", "r1", "r2", "r3", "r4", "r5"] },
    parse(s) { const [t, a] = P.parts(s, 2, 'The target, then ";" and the numbers'); return { target: P.num(t), nums: P.nums(a, { minLen: 1, maxLen: 12, min: 1, max: 99 }) }; },
    lines: {
      add: { ts: "sum += nums[right];", go: "sum += nums[right]" },
      rec: { ts: "best = Math.min(best, right - left + 1); // record inside", go: "best = min(best, right-left+1) // record inside" },
      sub: { ts: "sum -= nums[left];", go: "sum -= nums[left]" },
      ret: { ts: "return best === Infinity ? 0 : best;", go: "func minSubArrayLen>>return best" },
    },
    trace: (x) => minLenTrace(x, false),
    bugs: [{ label: "Replay the warning: a negative number", input: "5 ; 3 -2 4 1", banner: "<b>Breaking the rule.</b> Same code, but the input has a negative number, so the window's \"sum only grows\" rule is false.", trace: (x) => minLenTrace(x, true),
      parse(s) { const [t, a] = P.parts(s, 2, 'The target, then ";" and the numbers'); return { target: P.num(t), nums: P.nums(a, { minLen: 1, maxLen: 12, min: -99, max: 99 }) }; } }],
  };
  /* ---------------- Problem 4 ---------------- */
  function kDistinct({ s, k }, bug) {
    const T = new G.Trace();
    const counts = new Map();
    let left = 0, best = 0, bestBox = null;
    const items = s.split("");
    const panel = (hi) => [{ title: "counts", entries: [...counts.entries()], hi: hi ? [hi] : [] }];
    if (k === 0) { T.add({ state: win(items, 0, -1), vars: {}, say: "k = 0: no character is allowed, so the answer is 0." }); return T.done(0); }
    for (let right = 0; right < s.length; right++) {
      counts.set(s[right], (counts.get(s[right]) || 0) + 1);
      const key = `r${right}`;
      T.add({ at: "add", key, state: win(items, left, right, { panels: panel(s[right]), best: bestBox, bad: counts.size > k, label: `${counts.size} distinct` }), vars: { left, right, distinct: counts.size, best }, say: `Add \`${s[right]}\`: ${counts.size} distinct.`, ask: bug ? null : { q: `${counts.size} distinct, k = ${k}. Shrink?`, options: ["Yes", "No"], answer: counts.size > k ? 0 : 1, why: counts.size > k ? `${counts.size} > ${k}.` : "Within the limit." } });
      while (counts.size > k) {
        const out = s[left];
        const c = counts.get(out) - 1;
        if (c === 0 && !bug) counts.delete(out); else counts.set(out, c);
        T.add({ at: c === 0 && !bug ? "del" : "dec", key, state: win(items, left, right, { panels: panel(out), best: bestBox, marks: { [left]: "bug" }, label: `${counts.size} distinct` }), vars: { left, right, distinct: counts.size, best }, say: c === 0 ? (bug ? `The bug: \`${out}\` drops to 0 but its key stays, so the map still reports ${counts.size} distinct.` : `\`${out}\` drops to 0: delete the key, so the size is truthful (${counts.size}).`) : `\`${out}\` drops to ${c}.` });
        left++;
        if (bug && left > right) break;
      }
      if (right - left + 1 > best) { best = right - left + 1; bestBox = [left, right]; }
      T.add({ at: "best", key, state: win(items, left, right, { panels: panel(), best: bestBox, label: `${counts.size} distinct` }), vars: { left, right, distinct: counts.size, best }, say: `Window \`${s.slice(left, right + 1)}\`; best = ${best}.` });
    }
    return T.done(best);
  }
  const parseKD = (s) => { const [a, k] = P.parts(s, 2, 'A string, then ";" and k'); const kk = P.num(k, "k"); if (!Number.isInteger(kk) || kk < 0) throw new Error("k must be 0 or more."); return { s: chars(a.trim(), 14), k: kk }; };
  A.kDistinct = {
    title: "Longest Substring with At Most K Distinct Characters",
    viz: "array", legend: ["p1:left", "p2:right", "bug:leaving the window", "answer:best (green bracket)"],
    varRoles: { left: "p1", right: "p2", best: "answer" },
    inputLabel: "string ; k", hint: "eceba ; 2",
    presets: [{ label: "eceba, k = 2 (the trace table)", input: "eceba ; 2" }, { label: "aaabbcccc, k = 2", input: "aaabbcccc ; 2" }],
    table: { id: "tbl-5", preset: 0, rows: ["r0", "r1", "r2", "r3", "r4"] },
    parse: parseKD,
    lines: {
      add: { ts: "counts.set(s[right], (counts.get(s[right]) ?? 0) + 1);", go: "counts[s[right]]++" },
      del: { ts: "if (c === 0) counts.delete(out);", go: "delete(counts, out)" },
      dec: { ts: "else counts.set(out, c);", go: "counts[out]--" },
      best: { ts: "function lengthOfLongestSubstringKDistinct>>best = Math.max(best, right - left + 1);", go: "func lengthOfLongestSubstringKDistinct>>best = max(best, right-left+1)" },
    },
    trace: (x) => kDistinct(x, false),
    bugs: [{ label: "Replay the bug: keep keys at zero", input: "abaccc ; 2", banner: "<b>Replaying a bug.</b> This version decrements the count but never deletes a key that reaches zero, so <code>counts.size</code> lies.", trace: (x) => kDistinct(x, true) }],
  };

  /* ---------------- Problem 5 ---------------- */
  A.charReplace = {
    title: "Longest Repeating Character Replacement",
    viz: "array", legend: ["p1:left", "p2:right", "bug:leaving the window", "answer:best (green bracket)"],
    varRoles: { maxCount: "focus", best: "answer" },
    inputLabel: "UPPERCASE string ; k", hint: "AABABBA ; 1",
    presets: [{ label: "AABABBA, k = 1 (the trace table)", input: "AABABBA ; 1" }, { label: "ABAB, k = 2", input: "ABAB ; 2" }],
    table: { id: "tbl-6", preset: 0, rows: ["r0", "r1", "r2", "r3", "r4", "r5", "r6"] },
    parse(s) { const [a, k] = P.parts(s, 2, 'An uppercase string, then ";" and k'); const t = a.trim(); if (!/^[A-Z]{1,14}$/.test(t)) throw new Error("Use 1 to 14 uppercase letters."); const kk = P.num(k, "k"); if (kk < 0) throw new Error("k must be 0 or more."); return { s: t, k: kk }; },
    lines: {
      add: { ts: "counts[idx]++;", go: "counts[s[right]-'A']++" },
      max: { ts: "maxCount = Math.max(maxCount, counts[idx]);", go: "maxCount = max(maxCount, counts[s[right]-'A'])" },
      shrink: { ts: "counts[s.charCodeAt(left) - 65]--;", go: "counts[s[left]-'A']--" },
      best: { ts: "function characterReplacement>>best = Math.max(best, right - left + 1);", go: "func characterReplacement>>best = max(best, right-left+1)" },
    },
    trace({ s, k }) {
      const T = new G.Trace();
      const counts = {};
      let left = 0, maxCount = 0, best = 0, bestBox = null;
      const items = s.split("");
      const panel = () => [{ title: "counts", entries: Object.entries(counts).filter((e) => e[1]).sort() }];
      for (let right = 0; right < s.length; right++) {
        counts[s[right]] = (counts[s[right]] || 0) + 1;
        const key = `r${right}`;
        T.add({ at: "add", key, state: win(items, left, right, { panels: panel(), best: bestBox }), vars: { left, right, maxCount, best }, say: `Add \`${s[right]}\`.` });
        maxCount = Math.max(maxCount, counts[s[right]]);
        const need = right - left + 1 - maxCount;
        T.add({ at: "max", key, state: win(items, left, right, { panels: panel(), best: bestBox, bad: need > k, label: `length ${right - left + 1} − maxCount ${maxCount} = ${need} to replace` }), vars: { left, right, maxCount, "to replace": need, best }, say: `Keep the most frequent letter (maxCount = ${maxCount}) and replace the rest: ${need} replacement${need === 1 ? "" : "s"} needed.`, ask: { q: `${need} replacements needed, k = ${k}. Shrink?`, options: ["Yes: shrink from the left", "No: the window is valid"], answer: need > k ? 0 : 1, why: need > k ? `${need} > ${k}.` : `${need} ≤ ${k}.` } });
        while (right - left + 1 - maxCount > k) {
          counts[s[left]]--;
          T.add({ at: "shrink", key, state: win(items, left, right, { panels: panel(), best: bestBox, marks: { [left]: "bug" } }), vars: { left, right, maxCount, best }, say: `Remove \`${s[left]}\` from the left. \`maxCount\` stays ${maxCount}: a stale value can never make the answer too big, because a window only beats \`best\` if some letter really reaches a higher count.` });
          left++;
        }
        if (right - left + 1 > best) { best = right - left + 1; bestBox = [left, right]; }
        T.add({ at: "best", key, state: win(items, left, right, { panels: panel(), best: bestBox }), vars: { left, right, maxCount, best }, say: `Window length ${right - left + 1}; best = ${best}.` });
      }
      return T.done(best);
    },
  };

  /* ---------------- Problem 6 ---------------- */
  A.minWindow = {
    title: "Minimum Window Substring",
    viz: "array", legend: ["p1:left", "p2:right", "anchor:a character of t", "answer:shortest so far (green bracket)"],
    varRoles: { missing: "focus", bestLen: "answer" },
    inputLabel: "s ; t", hint: "ADOBECODEBANC ; ABC",
    presets: [{ label: "ADOBECODEBANC, ABC", input: "ADOBECODEBANC ; ABC" }, { label: "aa, aa", input: "aa ; aa" }, { label: "a, aa (impossible)", input: "a ; aa" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'Write s, then ";" and t').map((x) => x.trim()); if (!a || a.length > 16) throw new Error("s: 1 to 16 characters."); if (!b || b.length > 6) throw new Error("t: 1 to 6 characters."); return { s: a, t: b }; },
    lines: {
      guard: { ts: 'if (t.length === 0 || t.length > s.length) return "";', go: "if len(t) == 0 || len(t) > len(s)" },
      add: { ts: "if (need.get(add)! > 0) missing--;", go: "missing-- // this copy fills a real gap" },
      dec: { ts: "need.set(add, need.get(add)! - 1);", go: "need[s[right]]-- // may go negative" },
      rec: { ts: "bestLen = right - left + 1;", go: "bestLen = right - left + 1" },
      out: { ts: "need.set(out, need.get(out)! + 1);", go: "need[s[left]]++" },
      lost: { ts: "if (need.get(out)! > 0) missing++;", go: "missing++ // we just lost a required character" },
      ret: { ts: 'return bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);', go: "return s[bestStart : bestStart+bestLen]" },
    },
    trace({ s, t }) {
      const T = new G.Trace();
      const items = s.split("");
      const need = new Map();
      for (const ch of t) need.set(ch, (need.get(ch) || 0) + 1);
      const tset = new Set(t);
      const tm = () => Object.fromEntries(items.map((c, i) => [i, tset.has(c) ? "anchor" : null]).filter((e) => e[1]));
      let missing = t.length, left = 0, bestStart = 0, bestLen = Infinity, bestBox = null;
      const st = (l, r, extra) => { const o = Object.assign({ cellW: 38, panels: [{ title: "need (negative = surplus)", entries: [...need.entries()] }], best: bestBox, label: missing === 0 ? "valid: has every letter of t" : `missing ${missing}` }, extra); o.marks = Object.assign(tm(), (extra || {}).marks || {}); return win(items, l, r, o); };
      if (t.length > s.length) { T.add({ at: "guard", state: st(0, -1), vars: {}, say: "`t` is longer than `s`: no window can contain it. Return `\"\"`." }); return T.done(""); }
      T.add({ state: st(0, -1), vars: { missing }, say: `\`need\` holds how many of each letter \`t\` requires; \`missing\` = ${missing} letters still absent.` });
      for (let right = 0; right < s.length; right++) {
        const c = s[right];
        if (need.has(c)) {
          const fills = need.get(c) > 0;
          if (fills) missing--;
          need.set(c, need.get(c) - 1);
          T.add({ at: fills ? "add" : "dec", state: st(left, right), flow: ["A", "B"], vars: { right, missing, bestLen: bestLen === Infinity ? "∞" : bestLen }, say: fills ? `\`${c}\` fills a real gap: missing = ${missing}.` : `\`${c}\` is a surplus copy: \`need[${c}]\` goes to ${need.get(c)}, missing stays ${missing}.`, ask: { q: `missing = ${missing}. Is the window valid?`, options: ["Yes: record it and shrink", "No: keep growing"], answer: missing === 0 ? 0 : 1, why: missing === 0 ? "Every required letter is inside." : `${missing} letter${missing === 1 ? " is" : "s are"} still absent.` } });
        } else T.add({ state: st(left, right), flow: ["A"], vars: { right, missing }, say: `\`${c}\` is not in \`t\`: nothing to count.` });
        while (missing === 0) {
          if (right - left + 1 < bestLen) { bestLen = right - left + 1; bestStart = left; bestBox = [left, right]; }
          T.add({ at: "rec", state: st(left, right), flow: ["C", "E"], vars: { left, right, missing, bestLen }, say: `Valid window \`${s.slice(left, right + 1)}\` (length ${right - left + 1}). Shortest so far: \`${s.slice(bestStart, bestStart + bestLen)}\`.` });
          const out = s[left];
          if (need.has(out)) {
            need.set(out, need.get(out) + 1);
            const lost = need.get(out) > 0;
            if (lost) missing++;
            T.add({ at: lost ? "lost" : "out", state: st(left, right, { marks: { [left]: "bug" } }), flow: ["E", "F"], vars: { left, right, missing, bestLen }, say: lost ? `\`${out}\` leaves and it was required: missing = ${missing}. The window is no longer valid.` : `\`${out}\` leaves, but it was a surplus copy: still valid.` });
          }
          left++;
        }
      }
      const ans = bestLen === Infinity ? "" : s.slice(bestStart, bestStart + bestLen);
      T.add({ at: "ret", state: st(Math.min(left, s.length - 1), s.length - 1, { bestLabel: ans ? `"${ans}"` : "none" }), vars: { answer: ans }, say: ans ? `Return \`"${ans}"\`. Each character enters and leaves the window at most once: \`O(|s| + |t|)\`.` : "No window ever contained all of `t`: return `\"\"`." });
      return T.done(ans);
    },
  };

  /* ---------------- exercises ---------------- */
  A.permInString = {
    title: "Permutation in String: a fixed window with counts",
    viz: "array", legend: ["p1:left edge", "p2:right edge"],
    varRoles: { missing: "focus" },
    inputLabel: "t ; s (lowercase)", hint: "ab ; eidbaooo",
    presets: [{ label: "ab in eidbaooo", input: "ab ; eidbaooo" }, { label: "ab in eidboaoo", input: "ab ; eidboaoo" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'Write t, then ";" and s').map((x) => x.trim()); if (!/^[a-z]{1,5}$/.test(a) || !/^[a-z]{1,14}$/.test(b)) throw new Error("t: 1 to 5 lowercase letters; s: 1 to 14."); return { t: a, s: b }; },
    lines: {
      in: { ts: "if (need[s.charCodeAt(right) - 97]-- > 0) missing--;", go: "if need[s[right]-'a'] > 0 {" },
      out: { ts: "if (left >= 0 && ++need[s.charCodeAt(left) - 97] > 0) missing++;", go: "need[s[left]-'a']++" },
      hit: { ts: "if (missing === 0) return true;", go: "func checkInclusion>>if missing == 0 {" },
      none: { ts: "function checkInclusion>>if (missing === 0) return true;>>return false;", go: "func checkInclusion>>if missing == 0 {>>return false" },
    },
    trace({ t, s }) {
      const T = new G.Trace();
      const items = s.split("");
      const need = {};
      for (const c of t) need[c] = (need[c] || 0) + 1;
      let missing = t.length;
      const st = (r) => win(items, Math.max(0, r - t.length + 1), r, { cellW: 38, panels: [{ title: "need", entries: Object.entries(need).sort() }], label: `size ${t.length}, missing ${missing}` });
      if (t.length > s.length) { T.add({ state: win(items, 0, -1), vars: {}, say: "t is longer than s: false." }); return T.done(false); }
      for (let right = 0; right < s.length; right++) {
        const c = s[right];
        if ((need[c] || 0) > 0) missing--;
        need[c] = (need[c] || 0) - 1;
        T.add({ at: "in", state: st(right), vars: { right, missing }, say: `\`${c}\` enters.` });
        const left = right - t.length;
        if (left >= 0) {
          need[s[left]]++;
          if (need[s[left]] > 0) missing++;
          T.add({ at: "out", state: st(right), vars: { right, missing }, say: `\`${s[left]}\` leaves the fixed window of size ${t.length}.` });
        }
        if (missing === 0) { T.add({ at: "hit", state: st(right), vars: { missing }, say: `missing = 0: \`${s.slice(right - t.length + 1, right + 1)}\` is a permutation of \`${t}\`. Return \`true\`.` }); return T.done(true); }
      }
      T.add({ at: "none", state: st(s.length - 1), vars: { missing }, say: "No window matched: return `false`." });
      return T.done(false);
    },
  };
  A.countBelow = {
    title: "Count subarrays with sum below k",
    viz: "array", legend: ["p1:left", "p2:right"],
    varRoles: { count: "answer", sum: "focus" },
    inputLabel: "positive numbers ; k", hint: "2 5 6 ; 10",
    presets: [{ label: "[2,5,6], k = 10", input: "2 5 6 ; 10" }, { label: "[1,1,1], k = 3", input: "1 1 1 ; 3" }],
    parse(s) { const [a, k] = P.parts(s, 2, 'Numbers, then ";" and k'); return { nums: P.nums(a, { minLen: 1, maxLen: 10, min: 1, max: 99 }), k: P.num(k, "k") }; },
    lines: { add: { ts: "function countSubarraysBelow>>sum += nums[right];", go: "func countSubarraysBelow>>sum += nums[right]" }, shrink: { ts: "function countSubarraysBelow>>sum -= nums[left];", go: "func countSubarraysBelow>>sum -= nums[left]" }, count: { ts: "count += right - left + 1;", go: "count += right - left + 1" } },
    trace({ nums, k }) {
      const T = new G.Trace();
      let left = 0, sum = 0, count = 0;
      for (let right = 0; right < nums.length; right++) {
        sum += nums[right];
        T.add({ at: "add", state: win(nums, left, right, { label: `sum ${sum}`, bad: sum >= k }), vars: { left, right, sum, count }, say: `Add ${nums[right]}: sum = ${sum}.` });
        while (sum >= k && left <= right) { sum -= nums[left]; left++; T.add({ at: "shrink", state: win(nums, left, right, { label: `sum ${sum}`, bad: sum >= k }), vars: { left, right, sum, count }, say: `sum ≥ ${k}: drop the left item. sum = ${sum}.` }); }
        count += right - left + 1;
        T.add({ at: "count", state: win(nums, left, right, { label: `${right - left + 1} subarrays end here` }), vars: { left, right, sum, count }, say: `Every subarray that ends at ${right} and starts at ${left} or later is valid: ${right - left + 1} more. count = ${count}.` });
      }
      return T.done(count);
    },
  };

  G.quizzes.window06 = {
    title: "Window or not?",
    intro: "A window needs a contiguous stretch and a rule that moves in one direction.",
    items: [
      { q: "Longest subarray with sum ≤ S, where numbers can be negative.", options: ["Not a window: prefix sums and a map or deque", "Variable window", "Fixed window", "Two pointers from both ends"], answer: 0, why: "With negatives, growing the window can lower the sum, so the rule is not one-directional." },
      { q: "Maximum average of any 5 consecutive values.", options: ["Fixed window", "Variable window", "Binary search", "Heap"], answer: 0, why: "The size is given: one item enters and one leaves at each step." },
      { q: "Longest subsequence (not contiguous) with distinct values.", options: ["Not a window: a subsequence is not contiguous", "Variable window", "Fixed window", "Sliding window with a deque"], answer: 0, why: "A window only covers contiguous parts. For distinct values in a subsequence, a set of the values is enough." },
      { q: "Shortest substring containing all of \"ABC\".", options: ["Variable window, record inside the shrink loop", "Variable window, record after the shrink loop", "Fixed window", "Two pointers from both ends"], answer: 0, why: "Shortest: while the window is still valid, record and shrink." },
      { q: "Longest substring with at most 3 distinct characters.", options: ["Variable window, record after the shrink loop", "Variable window, record inside the shrink loop", "Fixed window", "Sorting first"], answer: 0, why: "Longest: shrink until valid, then record." },
    ],
  };
})();

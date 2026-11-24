/* Lesson 23 · Greedy algorithms and NP-complete problems. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  const parseIntervals = (s, max) => {
    const t = String(s).replace(/[\[\]]/g, " ").trim().split(/[\s,]+/).filter(Boolean);
    if (!t.length) throw new Error("Type intervals like 1-3 2-4.");
    if (t.length > (max || 8)) throw new Error(`Up to ${max || 8} intervals.`);
    return t.map((x) => { const m = x.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/); if (!m || +m[1] >= +m[2]) throw new Error(`"${x}" should look like 9-10 (start < end).`); return [+m[1], +m[2]]; });
  };
  const span = (ivs) => ({ lo: Math.floor(Math.min(...ivs.map((x) => x[0]))), hi: Math.ceil(Math.max(...ivs.map((x) => x[1]))) });

  /* ---------- Problem 1: activity selection ---------- */
  const NAMES = ["Art", "English", "Math", "CS", "Music"];
  function schedTrace(ivs, byStart) {
    const Tr = new G.Trace();
    const named = ivs.length === 5 && JSON.stringify(ivs) === JSON.stringify([[9, 10], [9.5, 10.5], [10, 11], [10.5, 11.5], [11, 12]]);
    const items = ivs.map((iv, i) => ({ id: i, a: iv[0], b: iv[1], name: named ? NAMES[i] : `#${i}` }));
    const { lo, hi } = span(ivs);
    const mark = {};
    let lastEnd = -Infinity;
    const chosen = [];
    let order = items;
    const st = (cur, note) => ({ lo, hi, rows: order.map((r) => ({ id: r.id, a: r.a, b: r.b, name: r.name, m: r.id === cur ? "focus" : mark[r.id] })), lines: [{ x: lastEnd, label: `last end ${lastEnd === -Infinity ? "" : lastEnd}`, m: "p1" }], note: { text: note || `chosen: ${chosen.length}` } });
    Tr.add({ at: "sort", state: st(null, "as given"), vars: {}, say: byStart ? "This version sorts by START time." : "Sort by END time: the class that finishes first leaves the most room for the rest." });
    order = items.slice().sort(byStart ? (x, y) => x.a - y.a : (x, y) => x.b - y.b);
    Tr.add({ at: "sort", state: st(null), vars: {}, say: byStart ? "Sorted by start: the earliest-starting class goes first, however long it runs." : "Sorted by end time." });
    order.forEach((r, k) => {
      const ok = r.a >= lastEnd;
      const key = named ? "c" + r.id : "c" + k;
      Tr.add({ key, at: "check", state: st(r.id), vars: { class: r.name, start: r.a, "last end": lastEnd === -Infinity ? "−∞" : lastEnd }, say: `${r.name} ${r.a}–${r.b}: does it start at or after the last end (${lastEnd === -Infinity ? "nothing chosen yet" : lastEnd})?`, ask: { q: `${r.name} starts at ${r.a}; the last chosen class ends at ${lastEnd === -Infinity ? "−∞" : lastEnd}. Take it?`, options: ["Take it", "Skip it"], answer: ok ? 0 : 1, why: ok ? "No overlap, and it ends as early as anything left can." : "It overlaps the class already chosen." } });
      if (ok) { chosen.push([r.a, r.b]); lastEnd = r.b; mark[r.id] = "answer"; Tr.add({ key, at: "take", state: st(null), vars: { chosen: chosen.length, "last end": lastEnd }, say: `Take ${r.name}. The last end moves to ${lastEnd}.` }); }
      else { mark[r.id] = "done"; Tr.add({ key, at: "skip", state: st(null), vars: { chosen: chosen.length }, say: `Skip ${r.name}: ${r.a} < ${lastEnd}.` }); }
    });
    Tr.add({ at: "ret", state: st(null, `chosen: ${chosen.length}; removed: ${ivs.length - chosen.length}`), vars: { chosen: chosen.length }, say: byStart ? `Only ${chosen.length}: the early starter was long and blocked others. Sorting by end time does better.` : `${chosen.length} classes, the most possible. Eraseoverlap's answer is the rest: ${ivs.length - chosen.length}.` });
    return Tr.done(chosen);
  }
  A.schedule = {
    title: "Classroom scheduling: earliest end first",
    viz: "timeline", legend: ["focus:being considered", "answer:chosen", "done:skipped (overlaps)"],
    inputLabel: "intervals start-end", hint: "9-10 9.5-10.5 10-11 10.5-11.5 11-12",
    presets: [{ label: "the book's classes", input: "9-10 9.5-10.5 10-11 10.5-11.5 11-12" }, { label: "[[1,2],[2,3],[3,4],[1,3]]", input: "1-2 2-3 3-4 1-3" }, { label: "one long class", input: "1-10 2-3 4-5 6-7" }],
    parse: (s) => parseIntervals(s),
    lines: { sort: { ts: "const sorted = [...intervals].sort((a, b) => a[1] - b[1]); // by END time", go: "return sorted[i][1] < sorted[j][1] }) // by END time" }, check: { ts: "if (start >= lastEnd) { // touching at the boundary is allowed", go: "if iv[0] >= lastEnd { // touching at the boundary is allowed" }, take: { ts: "chosen.push([start, end]);", go: "chosen = append(chosen, iv)" }, skip: { ts: "if (start >= lastEnd) { // touching at the boundary is allowed", go: "if iv[0] >= lastEnd { // touching at the boundary is allowed" }, ret: { ts: "maxNonOverlapping>>return chosen;", go: "return chosen" } },
    table: { id: "tbl-2", preset: 0, rows: ["c0", "c1", "c2", "c3", "c4"] },
    trace: (x) => schedTrace(x, false),
    bugs: [{ label: "Replay the bug: sort by start time", input: "1-10 2-3 4-5 6-7", banner: "<b>Replaying a bug.</b> This version sorts by <em>start</em> time, so one long early class crowds out three short ones.", trace: (x) => schedTrace(x, true) }],
  };

  /* ---------- Problem 2: jump game ---------- */
  const jumpParse = (s) => P.nums(s, { minLen: 1, maxLen: 10, min: 0, max: 9 });
  const jrow = (nums, i, furthest, extra) => Object.assign({ cells: nums.map((v, k) => ({ id: k, v, m: k === i ? "focus" : k <= furthest ? "p1" : null })), ptrs: [{ name: "i", at: i, role: "focus", side: "above" }, { name: "furthest", at: Math.min(furthest, nums.length - 1), role: "p2", side: "below" }] }, extra || {});
  A.canJump = {
    title: "Jump Game: carry the furthest reachable index", short: "Can I reach the end?",
    viz: "array", legend: ["p1:reachable so far", "focus:i", "bug:stuck"],
    inputLabel: "jump lengths", hint: "2 3 1 1 4",
    presets: [{ label: "[2,3,1,1,4]", input: "2 3 1 1 4" }, { label: "[3,2,1,0,4]", input: "3 2 1 0 4" }, { label: "[0]", input: "0" }],
    parse: jumpParse,
    lines: { stuck: { ts: "if (i > furthest) return false;", go: "return false // we can never stand here" }, ext: { ts: "canJump(nums: number[])>>furthest = Math.max(furthest, i + nums[i]);", go: "func canJump>>furthest = max(furthest, i+nums[i])" }, reach: { ts: "if (furthest >= nums.length - 1) return true;", go: "if furthest >= len(nums)-1 {" } },
    table: { id: "tbl-3", preset: 1, rows: ["i0", "i1", "i2", "i3", "i4"] },
    trace(nums) {
      const Tr = new G.Trace();
      let furthest = 0;
      for (let i = 0; i < nums.length; i++) {
        if (i > furthest) { Tr.add({ key: "i" + i, at: "stuck", state: jrow(nums, i, furthest, { marks: { [i]: "bug" } }), vars: { i, furthest }, say: `i = ${i} is beyond furthest = ${furthest}: we can never stand here. False.` }); return Tr.done(false); }
        furthest = Math.max(furthest, i + nums[i]);
        Tr.add({ key: "i" + i, at: "ext", state: jrow(nums, i, furthest), vars: { i, "nums[i]": nums[i], furthest }, say: `From ${i} we can reach ${i + nums[i]}. furthest = ${furthest}.` });
        if (furthest >= nums.length - 1) { Tr.add({ key: "i" + i, at: "reach", state: jrow(nums, i, furthest), vars: { furthest }, say: `furthest ≥ the last index ${nums.length - 1}: true.` }); return Tr.done(true); }
      }
      return Tr.done(true);
    },
  };
  A.jump2 = {
    title: "Jump Game: carry the furthest reachable index", short: "Fewest jumps",
    viz: "array", legend: ["p1:reachable with the jumps so far", "focus:i", "anchor:current layer ends here"],
    inputLabel: "jump lengths", hint: "2 3 1 1 4",
    presets: [{ label: "[2,3,1,1,4]", input: "2 3 1 1 4" }, { label: "[2,3,0,1,4]", input: "2 3 0 1 4" }, { label: "[1,1,1,1]", input: "1 1 1 1" }],
    parse: (s) => { const a = jumpParse(s); let f = 0; for (let i = 0; i < a.length && i <= f; i++) f = Math.max(f, i + a[i]); if (f < a.length - 1) throw new Error("This one must be able to reach the end."); return a; },
    lines: { ext: { ts: "function jump(nums: number[])>>furthest = Math.max(furthest, i + nums[i]);", go: "func jump>>furthest = max(furthest, i+nums[i])" }, hop: { ts: "jumps++;", go: "jumps++" }, ret: { ts: "return jumps;", go: "return jumps" } },
    table: { id: "tbl-4", preset: 0, rows: ["i0", "i1", "i2", "i3"] },
    trace(nums) {
      const Tr = new G.Trace();
      let jumps = 0, cur = 0, furthest = 0;
      const row = (i) => ({ cells: nums.map((v, k) => ({ id: k, v, m: k === i ? "focus" : k === cur ? "anchor" : k <= furthest ? "p1" : null })), ptrs: [{ name: "i", at: i, role: "focus", side: "above" }, { name: "end", at: Math.min(cur, nums.length - 1), role: "anchor", side: "below" }], zones: [{ from: 0, to: Math.min(cur, nums.length - 1), label: `${jumps} jump${jumps === 1 ? "" : "s"}`, cls: "1" }] });
      for (let i = 0; i < nums.length - 1; i++) {
        furthest = Math.max(furthest, i + nums[i]);
        if (i === cur) { jumps++; cur = furthest; Tr.add({ key: "i" + i, at: "hop", state: row(i), vars: { i, furthest, currentEnd: cur, jumps }, say: `i = ${i} is the end of the current layer: one more jump is forced. The next layer reaches ${cur}.` }); }
        else Tr.add({ key: "i" + i, at: "ext", state: row(i), vars: { i, furthest, currentEnd: cur, jumps }, say: `Inside the layer. furthest = ${furthest}.` });
      }
      Tr.add({ at: "ret", state: row(nums.length - 1), vars: { jumps }, say: `${jumps} jump${jumps === 1 ? "" : "s"}. It is BFS by layers, in O(n) and O(1) space.` });
      return Tr.done(jumps);
    },
  };

  /* ---------- Problem 3: gas station ---------- */
  A.gas = {
    title: "Gas Station: a failed stretch rules out every start inside it",
    viz: "array", legend: ["focus:station i", "done:ruled out as a start", "answer:the candidate start"],
    inputLabel: "gas ; cost", hint: "1 2 3 4 5 ; 3 4 5 1 2",
    presets: [{ label: "the lesson's example", input: "1 2 3 4 5 ; 3 4 5 1 2" }, { label: "not enough gas", input: "2 3 4 ; 3 4 3" }, { label: "[5] ; [4]", input: "5 ; 4" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'gas, then ";" and cost'); const g = P.nums(a, { minLen: 1, maxLen: 8, min: 0, max: 99 }), c = P.nums(b, { minLen: 1, maxLen: 8, min: 0, max: 99 }); if (g.length !== c.length) throw new Error("gas and cost need the same length."); return { gas: g, cost: c }; },
    lines: { net: { ts: "tank += net;", go: "tank += net" }, reset: { ts: "start = i + 1; // so no station up to i can be the start", go: "start = i + 1 // so no station up to i can be the start" }, ret: { ts: "return total >= 0 ? start : -1;", go: "if total >= 0 {" } },
    table: { id: "tbl-5", preset: 0, rows: ["i0", "i1", "i2", "i3", "i4"] },
    trace({ gas, cost }) {
      const Tr = new G.Trace();
      let total = 0, tank = 0, start = 0;
      const nets = gas.map((g, i) => g - cost[i]);
      const st = (i) => ({ rows: [{ label: "gas − cost", cells: nets.map((v, k) => ({ id: k, v: v > 0 ? "+" + v : v, m: k === i ? "focus" : k < start ? "done" : k === start ? "answer" : null })), ptrs: [{ name: "start", at: Math.min(start, nets.length - 1), role: "p1", hidden: start >= nets.length }, ...(i != null ? [{ name: "i", at: i, role: "focus", side: "above" }] : [])] }], note: { text: `tank ${tank} · total ${total}` } });
      nets.forEach((net, i) => {
        total += net; tank += net;
        if (tank < 0) { Tr.add({ key: "i" + i, at: "reset", state: st(i), vars: { i, net, tank }, say: `Tank ${tank} < 0: we cannot get from ${start} past station ${i}. No start between ${start} and ${i} can work either (each would arrive with even less). Try ${i + 1}.` }); start = i + 1; tank = 0; }
        else Tr.add({ key: "i" + i, at: "net", state: st(i), vars: { i, net, tank }, say: `Net ${net > 0 ? "+" : ""}${net}; tank ${tank} ≥ 0, keep going.` });
      });
      const res = total >= 0 ? start : -1;
      Tr.add({ at: "ret", state: st(null), vars: { total, answer: res }, say: total >= 0 ? `Total gas covers total cost (${total} ≥ 0), so a start exists, and it must be ${start}. One pass, O(n).` : `Total ${total} < 0: no start can work. −1.` });
      return Tr.done(res);
    },
  };

  /* ---------- Problem 4: partition labels ---------- */
  A.partition = {
    title: "Partition Labels: stretch the part to each letter's last occurrence",
    viz: "array", legend: ["focus:i", "p1:current part", "answer:a finished part"],
    inputLabel: "a lowercase string", hint: "ababcbacadefegdehijhklij",
    presets: [{ label: "the LeetCode example", input: "ababcbacadefegdehijhklij" }, { label: "eccbbbbdec", input: "eccbbbbdec" }, { label: "abc", input: "abc" }],
    parse(s) { const t = String(s).trim(); if (!/^[a-z]{1,24}$/.test(t)) throw new Error("1 to 24 lowercase letters."); return t; },
    lines: { last: { ts: "for (let i = 0; i < s.length; i++) last.set(s[i], i);", go: "last[s[i]-'a'] = i" }, ext: { ts: "end = Math.max(end, last.get(s[i])!);", go: "end = max(end, last[s[i]-'a'])" }, cut: { ts: "sizes.push(end - start + 1);", go: "sizes = append(sizes, end-start+1)" } },
    table: { id: "tbl-6", preset: 0, rows: ["i0", "i1", "i2", "i3", "i4", "i5", "i6", "i7", "i8"] },
    trace(s) {
      const Tr = new G.Trace();
      const last = new Map();
      for (let i = 0; i < s.length; i++) last.set(s[i], i);
      const sizes = [];
      let start = 0, end = 0;
      const done = [];
      const st = (i) => ({ cellW: 30, gap: 4, cells: s.split("").map((c, k) => ({ id: k, v: c, m: k === i ? "focus" : done.some(([a, b]) => k >= a && k <= b) ? "answer" : k >= start && k <= end && i != null ? "p1" : null })), ptrs: i != null ? [{ name: "i", at: i, role: "focus", side: "above" }, { name: "end", at: end, role: "p2", side: "below" }] : [], zones: done.map(([a, b]) => ({ from: a, to: b, label: String(b - a + 1), cls: "1" })) });
      Tr.add({ at: "last", state: st(null), vars: { letters: last.size }, say: `First pass: remember where each letter appears for the last time (${[...last].slice(0, 6).map(([c, i]) => `${c}→${i}`).join(", ")}${last.size > 6 ? ", …" : ""}).` });
      for (let i = 0; i < s.length; i++) {
        end = Math.max(end, last.get(s[i]));
        if (i === end) { done.push([start, end]); sizes.push(end - start + 1); Tr.add({ key: "i" + i, at: "cut", state: st(i), vars: { i, end, size: end - start + 1 }, say: `i reached end = ${end}: every letter seen in this part ends inside it. Cut: size ${end - start + 1}.` }); start = i + 1; }
        else Tr.add({ key: "i" + i, at: "ext", state: st(i), vars: { i, char: s[i], end }, say: `"${s[i]}" last appears at ${last.get(s[i])}, so the part must reach at least ${end}.` });
      }
      Tr.add({ state: st(null), vars: { sizes: `[${sizes.join(", ")}]` }, say: `Sizes [${sizes.join(", ")}]: as many parts as possible. O(n).` });
      return Tr.done(sizes);
    },
  };

  /* ---------- Problem 5: task scheduler ---------- */
  A.tasks = {
    title: "Task Scheduler: the most frequent task sets the frame",
    viz: "grid", legend: ["anchor:the most frequent task(s)", "p1:other tasks", "done:idle slot (·)"],
    inputLabel: "tasks (letters) ; n", hint: "AAABBB ; 2",
    presets: [{ label: "AAABBB, n = 2", input: "AAABBB ; 2" }, { label: "AAABBB, n = 0", input: "AAABBB ; 0" }, { label: "AAAAAABCDEFG, n = 2", input: "AAAAAABCDEFG ; 2" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'tasks, then ";" and n'); const t = a.replace(/[\s,\[\]"']/g, ""); if (!/^[A-Z]{1,16}$/.test(t)) throw new Error("1 to 16 capital letters."); const n = P.num(b, "n"); if (!Number.isInteger(n) || n < 0 || n > 5) throw new Error("n must be 0..5."); return { tasks: t.split(""), n }; },
    lines: { count: { ts: "for (const t of tasks) counts.set(t, (counts.get(t) ?? 0) + 1);", go: "counts[t-'A']++" }, maxc: { ts: "const maxCount = Math.max(...counts.values());", go: "maxCount = max(maxCount, c)" }, tied: { ts: "for (const c of counts.values()) if (c === maxCount) tied++;", go: "tied++" }, frames: { ts: "const frames = (maxCount - 1) * (n + 1) + tied;", go: "frames := (maxCount-1)*(n+1) + tied" }, ret: { ts: "return Math.max(frames, tasks.length);", go: "return max(frames, len(tasks))" } },
    trace({ tasks, n }) {
      const Tr = new G.Trace();
      const counts = new Map();
      tasks.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
      const maxCount = Math.max(...counts.values());
      const tops = [...counts].filter(([, c]) => c === maxCount).map(([t]) => t);
      const tied = tops.length;
      const frames = (maxCount - 1) * (n + 1) + tied;
      // lay out maxCount rows of width n + 1: top tasks first in every row, the rest fill column by column
      const W = n + 1;
      const grid = Array.from({ length: maxCount }, () => Array(W).fill(null));
      tops.forEach((t, k) => { for (let r = 0; r < maxCount; r++) if (k < W) grid[r][k] = t; });
      const rest = [];
      [...counts].filter(([t]) => !tops.includes(t) || tops.indexOf(t) >= W).forEach(([t, c]) => { for (let j = 0; j < c; j++) rest.push(t); });
      let overflow = 0, q = 0;
      for (let c = 0; c < W && q < rest.length; c++) for (let r = 0; r < maxCount - 1 && q < rest.length; r++) if (grid[r][c] == null) grid[r][c] = rest[q++];
      overflow = rest.length - q;
      const st = (stage) => ({ cell: 34, rowLabels: grid.map((_, r) => `row ${r + 1}`), cells: grid.map((row, r) => row.map((t) => ({ v: t == null ? (r === maxCount - 1 ? "" : stage >= 2 ? "·" : "") : t, m: t == null ? (r === maxCount - 1 ? null : stage >= 2 ? "done" : null) : tops.includes(t) ? "anchor" : stage >= 1 ? "p1" : null}))), note: { text: stage >= 2 ? `frames ${frames}${overflow ? ` · ${overflow} more task${overflow > 1 ? "s" : ""} widen the rows: no idling` : ""}` : `${maxCount} rows of n + 1 = ${W} slots` } });
      Tr.add({ at: "count", state: st(0), vars: { tasks: tasks.length }, say: `Count each task: ${[...counts].map(([t, c]) => `${t}×${c}`).join(", ")}.` });
      Tr.add({ at: "maxc", state: st(0), vars: { maxCount }, say: `The most frequent task appears ${maxCount} times. Copies must be n + 1 = ${W} slots apart, so lay out ${maxCount} rows of ${W}.` });
      Tr.add({ at: "tied", state: st(0), vars: { tied }, say: `${tied} task${tied > 1 ? "s" : ""} (${tops.join(", ")}) ha${tied > 1 ? "ve" : "s"} the maximum count, so the last row holds ${tied} slot${tied > 1 ? "s" : ""}.` });
      Tr.add({ at: "frames", state: st(2), vars: { frames }, say: `Fill the other tasks into the gaps. Frame length = (${maxCount} − 1) × ${W} + ${tied} = ${frames}. Empty gaps are idle time.` });
      const res = Math.max(frames, tasks.length);
      Tr.add({ at: "ret", state: st(2), vars: { answer: res }, say: res === frames ? `Answer ${res}: the frame, idles included.` : `There are more tasks (${tasks.length}) than the frame: no idling is needed at all. Answer ${res}.` });
      return Tr.done(res);
    },
  };

  /* ---------- Problem 6: greedy set cover ---------- */
  A.setCover = {
    title: "Set cover: take the set with the most new coverage",
    viz: "grid", legend: ["focus:best gain this round", "answer:chosen", "done:already covered"],
    inputLabel: "universe ; name: items ; name: items …", hint: "1 2 3 4 5 6 ; T: 1 2 4 5 ; O1: 1 2 3 ; O2: 4 5 6",
    presets: [{ label: "the book's radio stations", input: "mt wa or id nv ut ca az ; kone: id nv ut ; ktwo: wa id mt ; kthree: or nv ca ; kfour: nv ut ; kfive: ca az" }, { label: "the trap: greedy uses 3, best is 2", input: "1 2 3 4 5 6 ; T: 1 2 4 5 ; O1: 1 2 3 ; O2: 4 5 6" }],
    parse(s) {
      const parts = String(s).split(";").map((x) => x.trim()).filter(Boolean);
      if (parts.length < 2) throw new Error('The universe, then ";" and at least one set like A: x y.');
      const universe = parts[0].split(/\s+/);
      const sets = parts.slice(1).map((p) => { const m = p.match(/^(\w+)\s*:\s*(.*)$/); if (!m) throw new Error(`"${p}" should look like A: x y.`); return [m[1], m[2].trim() ? m[2].trim().split(/\s+/) : []]; });
      if (universe.length > 9 || sets.length > 6) throw new Error("Up to 9 items and 6 sets.");
      return { universe, sets };
    },
    lines: { gain: { ts: "for (const item of covers) if (uncovered.has(item)) gain++;", go: "if uncovered[item] {" }, push: { ts: "chosen.push(bestName);", go: "chosen = append(chosen, sets[bestIdx].name)" }, none: { ts: "if (bestName === null) return null;", go: "return nil, false // some item cannot be covered by any set" }, ret: { ts: "greedySetCover>>return chosen;", go: "return chosen, true" } },
    trace({ universe, sets }) {
      const Tr = new G.Trace();
      const unc = new Set(universe);
      const chosen = [];
      const st = (best, gains) => ({ cell: 34, labelW: 84, colLabels: universe, rowLabels: sets.map(([nm]) => nm + (gains ? ` +${gains[nm]}` : "")), cells: sets.map(([nm, items]) => universe.map((u) => ({ v: items.includes(u) ? "✓" : "", m: chosen.includes(nm) && items.includes(u) ? "answer" : items.includes(u) && !unc.has(u) ? "done" : nm === best && items.includes(u) ? "focus" : null }))), note: { text: `chosen: ${chosen.join(", ") || "—"} · uncovered: ${[...unc].join(" ") || "none"}` } });
      while (unc.size) {
        let bestName = null, bestGain = 0;
        const gains = {};
        for (const [nm, items] of sets) { let g = 0; for (const it of new Set(items)) if (unc.has(it)) g++; gains[nm] = g; if (g > bestGain) { bestGain = g; bestName = nm; } }
        if (bestName === null) { Tr.add({ at: "none", state: st(null, gains), vars: {}, say: `No set covers ${[...unc].join(", ")}: impossible, return null.` }); return Tr.done(null); }
        Tr.add({ at: "gain", state: st(bestName, gains), vars: { best: bestName, gain: bestGain }, say: `Count new coverage per set (the + numbers). ${bestName} covers the most uncovered items: ${bestGain}.` });
        chosen.push(bestName);
        for (const it of sets.find(([nm]) => nm === bestName)[1]) unc.delete(it);
        Tr.add({ at: "push", state: st(null), vars: { chosen: chosen.length }, say: `Take ${bestName}.${unc.size ? ` Still uncovered: ${[...unc].join(", ")}.` : " Everything is covered."}` });
      }
      Tr.add({ at: "ret", state: st(null), vars: { sets: chosen.length }, say: `${chosen.length} sets. Greedy runs in polynomial time and is close to optimal (within a factor of about ln n), but not always optimal.` });
      return Tr.done(chosen);
    },
  };

  /* ---------- 0/1 knapsack: greedy versus every subset ---------- */
  A.knapsack = {
    title: "Knapsack: greedy by value versus trying every subset",
    viz: "grid", legend: ["anchor:greedy's pick", "answer:the best subset", "bug:too heavy"],
    inputLabel: "items name:weight:value ; capacity", hint: "guitar:1:1500 stereo:4:3000 laptop:3:2000 ; 4",
    presets: [{ label: "the book's thief", input: "guitar:1:1500 stereo:4:3000 laptop:3:2000 ; 4" }, { label: "greedy happens to win", input: "a:2:30 b:2:20 c:3:10 ; 4" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'items, then ";" and the capacity'); const items = a.trim().split(/\s+/).map((x) => { const m = x.match(/^(\w+):(\d+):(\d+)$/); if (!m) throw new Error(`"${x}" should look like name:weight:value.`); return { name: m[1], weight: +m[2], value: +m[3] }; }); if (items.length > 4) throw new Error("Up to 4 items (16 subsets)."); const cap = P.num(b, "capacity"); if (!Number.isInteger(cap) || cap < 0 || cap > 50) throw new Error("capacity 0..50."); return { items, cap }; },
    lines: { greedy: { ts: "total += item.value;", go: "total += item.value" }, brute: { ts: "if (w <= capacity) best = Math.max(best, v);", go: "best = max(best, v)" } },
    trace({ items, cap }) {
      const Tr = new G.Trace();
      // greedy by value (stable sort, like the TS code)
      let total = 0, room = cap;
      const gPick = new Set();
      [...items].sort((x, y) => y.value - x.value).forEach((it) => { if (it.weight <= room) { total += it.value; room -= it.weight; gPick.add(it.name); } });
      const n = items.length;
      let best = 0, bestMask = 0;
      const rows = [];
      for (let mask = 0; mask < 1 << n; mask++) { let w = 0, v = 0; for (let i = 0; i < n; i++) if (mask & (1 << i)) { w += items[i].weight; v += items[i].value; } rows.push({ mask, w, v }); if (w <= cap && v > best) { best = v; bestMask = mask; } }
      const gMask = items.reduce((m, it, i) => (gPick.has(it.name) ? m | (1 << i) : m), 0);
      const st = (upto, showBest) => ({ cell: 40, colLabels: [...items.map((it) => it.name.slice(0, 6)), "weight", "value"], cells: rows.slice(0, upto).map((r) => [...items.map((_, i) => ({ v: r.mask & (1 << i) ? "✓" : "" })), { v: r.w, m: r.w > cap ? "bug" : null }, { v: r.v }].map((c) => Object.assign(c, { m: c.m || (showBest && r.mask === bestMask ? "answer" : r.mask === gMask ? "anchor" : null) }))), note: { text: showBest ? `greedy ${total} · best ${best}` : `capacity ${cap}` } });
      Tr.add({ at: "greedy", state: st(0), vars: { capacity: cap }, say: `Greedy by value: take the most valuable item that still fits, again and again. It takes ${[...gPick].join(", ") || "nothing"}: ${total}.` });
      for (let k = 1; k <= rows.length; k++) Tr.add({ at: "brute", state: st(k), vars: { subsets: k, of: rows.length }, say: k === 1 ? `Now try every subset: ${rows.length} of them (2^${n}).` : rows[k - 1].w > cap ? `Subset ${k}: weight ${rows[k - 1].w} > ${cap}, it does not fit.` : `Subset ${k}: weight ${rows[k - 1].w}, value ${rows[k - 1].v}.` });
      Tr.add({ at: "brute", state: st(rows.length, true), vars: { greedy: total, best }, say: best > total ? `The best subset is worth ${best}; greedy got ${total}. For 0/1 knapsack greedy fails. Trying every subset is exact but 2^n; dynamic programming (lesson 26) is the practical exact method.` : `Here greedy matches the best (${best}), but that is luck, not a guarantee.` });
      return Tr.done({ greedy: total, best });
    },
  };

  G.quizzes.greedy23 = {
    title: "Greedy and NP-complete",
    items: [
      { q: "Maximum non-overlapping intervals: sort by…", options: ["end time", "start time", "length", "the number of overlaps"], answer: 0, why: "Finishing first leaves the most room for what comes after." },
      { q: "Coins {1, 3, 4}, amount 6. Greedy (largest first) gives…", options: ["4 + 1 + 1: 3 coins, but 3 + 3 uses 2", "3 + 3", "4 + 2", "6"], answer: 0, why: "A tiny counterexample is the fastest test of a greedy idea." },
      { q: "Gas Station: the tank goes negative at station i. Next candidate start?", options: ["i + 1", "start + 1", "0", "i"], answer: 0, why: "Every start up to i arrives at i + 1 with even less fuel." },
      { q: "Why is fractional knapsack greedy-solvable but 0/1 is not?", options: ["Fractions let you fill the bag exactly by value per weight; whole items can leave wasted room", "Fractional has fewer items", "0/1 has negative weights", "They are the same problem"], answer: 0, why: "With fractions, the best value-per-weight always wins the next unit of room." },
      { q: "Someone solves TSP for 1,000 cities in a second. First question?", options: ["Is it exact or approximate, and how close is it guaranteed to be?", "Which language?", "Is it recursive?", "Does it use a heap?"], answer: 0, why: "No known exact algorithm is polynomial; fast answers are heuristics or approximations." },
    ],
  };
})();

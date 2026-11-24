/* Lesson 04 · Hash tables — animators and quizzes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  const words = (s, max) => { const w = String(s).split(/[\s,]+/).filter(Boolean); if (!w.length || w.length > max) throw new Error(`Give 1 to ${max} words.`); return w; };
  const parseOps = (allowed, max) => (s) => {
    const ops = String(s).split(",").map((x) => x.trim()).filter(Boolean).map((x) => x.split(/\s+/));
    if (!ops.length || ops.length > max) throw new Error(`Give 1 to ${max} operations separated by commas.`);
    ops.forEach((o) => { if (!allowed.includes(o[0])) throw new Error(`Unknown operation "${o[0]}". Use: ${allowed.join(", ")}.`); o.slice(1).forEach((v) => { if (!Number.isFinite(Number(v))) throw new Error(`"${v}" is not a number.`); }); });
    return ops.map(([op, ...v]) => ({ op, v: v.map(Number) }));
  };

  /* ---------------- buckets renderer: slots with chains ---------------- */
  G.viz.buckets = function (scene, st) {
    const SW = 70, H = 30, rowH = 38, CW = 50;
    st.buckets.forEach((chain, s) => {
      const y = 10 + s * rowH;
      G.drawCell(scene, `slot${s}`, 10, y, SW, H, `slot ${s}`, st.hiSlot === s ? "focus" : null, "kv-key");
      chain.forEach((k, j) => {
        const x = 10 + SW + 24 + j * (CW + 22);
        G.drawLine(scene, `bl${s}:${j}`, x - 22, y + H / 2, x, y + H / 2, "edge");
        G.drawCell(scene, `bk${k}`, x, y, CW, H, k, (st.marks && st.marks[k]) || null);
      });
    });
    const maxChain = Math.max(1, ...st.buckets.map((c) => c.length));
    let h = 10 + st.buckets.length * rowH;
    if (st.note) { G.drawText(scene, "note", 10, h + 10, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 26; }
    return { x: 0, y: 0, w: Math.max(420, 10 + SW + 24 + maxChain * (CW + 22) + 10), h };
  };
  A.hashSet = {
    title: "Inside a hash table: slots, chains and resizing",
    viz: "buckets",
    legend: ["focus:the slot the key hashes to", "answer:found", "bug:not there"],
    varRoles: { "load factor": "focus" },
    inputLabel: "Operations", hint: "add 1, add 5, add 9, add 2, add 6, contains 9, contains 3, remove 9, contains 9",
    presets: [
      { label: "collisions, then a resize", input: "add 1, add 5, add 9, add 2, add 6, contains 9, contains 3, remove 9, contains 9" },
      { label: "many keys", input: "add 3, add 11, add 19, add 4, add 12, add 7, add 15, add 8, contains 12" },
    ],
    parse: parseOps(["add", "remove", "contains"], 14),
    lines: {
      slot: { ts: "return ((key % n) + n) % n;", go: "return ((key % n) + n) % n" },
      addCheck: { ts: "if (this.contains(key)) return;", go: "if h.Contains(key) {" },
      push: { ts: "this.buckets[this.slot(key)].push(key);", go: "func (h *MyHashSet) Add>>h.buckets[s] = append(h.buckets[s], key)" },
      resizeCheck: { ts: "if (this.count / this.buckets.length > 0.75) this.resize();", go: "if float64(h.count)/float64(len(h.buckets)) > 0.75" },
      resize: { ts: "this.buckets = Array.from({ length: old.length * 2 }, () => []);", go: "h.buckets = make([][]int, len(old)*2)" },
      contains: { ts: "return this.buckets[this.slot(key)].includes(key);", go: "func (h *MyHashSet) Contains>>if k == key" },
      remove: { ts: "chain.splice(i, 1);", go: "h.buckets[s] = append(chain[:i], chain[i+1:]...)" },
    },
    trace(ops) {
      const T = new G.Trace();
      let buckets = Array.from({ length: 4 }, () => []);
      let count = 0;
      const slot = (k) => ((k % buckets.length) + buckets.length) % buckets.length;
      const st = (hiSlot, marks, note) => ({ buckets: buckets.map((c) => c.slice()), hiSlot, marks, note });
      const lf = () => +(count / buckets.length).toFixed(2);
      T.add({ state: st(), vars: { slots: 4, items: 0, "load factor": 0 }, say: "Four empty slots. The hash function here is `key mod slots`." });
      ops.forEach(({ op, v: [k] }) => {
        const s = slot(k);
        T.add({ at: "slot", state: st(s), vars: { key: k, slot: s, "load factor": lf() }, say: `${op}(${k}): ${k} mod ${buckets.length} = ${s}, so go straight to slot ${s}.` });
        if (op === "contains") {
          const hit = buckets[s].includes(k);
          T.add({ at: "contains", state: st(s, { [k]: hit ? "answer" : null }, { text: hit ? `contains(${k}) → true` : `contains(${k}) → false`, cls: hit ? "ok" : "bad" }), vars: { key: k, "chain length": buckets[s].length }, say: hit ? `Walk the chain in slot ${s}: found ${k}.` : `Walk the chain in slot ${s} (${buckets[s].length} item${buckets[s].length === 1 ? "" : "s"}): ${k} is not there.` });
        } else if (op === "remove") {
          const i = buckets[s].indexOf(k);
          if (i >= 0) { buckets[s].splice(i, 1); count--; }
          T.add({ at: "remove", state: st(s), vars: { items: count, "load factor": lf() }, say: i >= 0 ? `Remove ${k} from slot ${s}'s chain.` : `${k} is not in the set; nothing to remove.` });
        } else {
          if (buckets[s].includes(k)) { T.add({ at: "addCheck", state: st(s, { [k]: "answer" }), vars: { key: k }, say: `${k} is already there: a set keeps one copy.` }); return; }
          const collide = buckets[s].length > 0;
          buckets[s].push(k); count++;
          T.add({ at: "push", state: st(s, { [k]: collide ? "focus" : "answer" }), vars: { items: count, slots: buckets.length, "load factor": lf() }, say: collide ? `Collision: slot ${s} already holds ${buckets[s].slice(0, -1).join(", ")}. Chain ${k} after it.` : `Slot ${s} was empty: store ${k} there.` });
          if (count / buckets.length > 0.75) {
            T.add({ at: "resizeCheck", state: st(null), vars: { items: count, slots: buckets.length, "load factor": lf() }, say: `Load factor ${count}/${buckets.length} = ${lf()} is above 0.75: chains would get long. Resize.` });
            const old = buckets;
            buckets = Array.from({ length: old.length * 2 }, () => []);
            old.forEach((c) => c.forEach((key) => buckets[slot(key)].push(key)));
            T.add({ at: "resize", state: st(null), vars: { items: count, slots: buckets.length, "load factor": lf() }, say: `Double to ${buckets.length} slots and re-insert every key with the new \`mod ${buckets.length}\`. That one step is \`O(n)\`, but it is rare: inserts stay amortized \`O(1)\`.` });
          }
        }
      });
      return T.done(buckets.map((c) => c.slice()));
    },
  };

  /* ---------------- templates ---------------- */
  A.frequencyOf = {
    title: "Templates: count, and seen-before",
    short: "Frequency count",
    viz: "array",
    legend: ["focus:being counted"],
    inputLabel: "Items", hint: "a b a c b a",
    presets: [{ label: "a b a", input: "a b a" }, { label: "a b a c b a", input: "a b a c b a" }],
    parse: (s) => words(s, 10),
    lines: { loop: { ts: "for (const item of items) freq.set(item, (freq.get(item) ?? 0) + 1);", go: "freq[item]++" }, ret: { ts: "return freq;", go: "return freq" } },
    trace(items) {
      const T = new G.Trace();
      const freq = new Map();
      const st = (i) => ({ cells: G.cells(items), marks: i != null ? { [i]: "focus" } : {}, panels: [{ title: "freq: item → count", entries: [...freq.entries()], hi: i != null ? [items[i]] : [] }] });
      items.forEach((x, i) => { freq.set(x, (freq.get(x) || 0) + 1); T.add({ at: "loop", state: st(i), vars: { item: x, count: freq.get(x) }, say: `Count \`${x}\`: now ${freq.get(x)}.${freq.get(x) === 1 ? " A missing key starts from 0." : ""}` }); });
      T.add({ at: "ret", state: st(null), vars: { distinct: freq.size }, say: `One pass, \`O(n)\` time, \`O(k)\` memory for ${freq.size} distinct items.` });
      return T.done([...freq.entries()]);
    },
  };
  A.hasDuplicate = {
    title: "Templates: count, and seen-before",
    short: "Seen before? (a set)",
    viz: "array",
    legend: ["focus:being checked", "bug:the duplicate"],
    inputLabel: "Numbers", hint: "1 2 3 1",
    presets: [{ label: "[1,2,3,1]", input: "1 2 3 1" }, { label: "[1,2,3]", input: "1 2 3" }],
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 10, min: -99, max: 99 }),
    lines: { has: { ts: "if (seen.has(x)) return true;", go: "if _, ok := seen[x]; ok" }, add: { ts: "seen.add(x);", go: "seen[x] = struct{}{}" }, none: { ts: "function hasDuplicate>>return false;", go: "func hasDuplicate>>return false" } },
    trace(nums) {
      const T = new G.Trace();
      const seen = [];
      const st = (i, m) => ({ cells: G.cells(nums), marks: i != null ? { [i]: m || "focus" } : {}, panels: [{ title: "seen", entries: seen.map((x) => [x]), hi: i != null ? [nums[i]] : [] }] });
      for (let i = 0; i < nums.length; i++) {
        const dup = seen.includes(nums[i]);
        T.add({ at: "has", state: st(i, dup ? "bug" : "focus"), vars: { x: nums[i] }, say: dup ? `${nums[i]} is already in the set: return \`true\`.` : `Have I seen ${nums[i]}? No.`, ask: { q: `Is ${nums[i]} in the set?`, options: ["Yes: a duplicate", "No: add it"], answer: dup ? 0 : 1, why: dup ? "It was added earlier." : "Not yet." } });
        if (dup) return T.done(true);
        seen.push(nums[i]);
        T.add({ at: "add", state: st(i), vars: { x: nums[i] }, say: `Add ${nums[i]} to the set.` });
      }
      T.add({ at: "none", state: st(null), vars: {}, say: "Every value was new: return `false`." });
      return T.done(false);
    },
  };

  /* ---------------- Problem 1 · Two Sum ---------------- */
  A.twoSum = {
    title: "Two Sum: look up the partner",
    viz: "array",
    legend: ["focus:current number", "anchor:partner found", "answer:the pair"],
    varRoles: { i: "focus" },
    inputLabel: "Numbers ; target", hint: "2 7 11 15 ; 9",
    presets: [{ label: "[2,7,11,15] → 9 (the trace table)", input: "2 7 11 15 ; 9" }, { label: "[3,3] → 6", input: "3 3 ; 6" }, { label: "[1,2] → 7", input: "1 2 ; 7" }, { label: "longer", input: "8 -2 5 11 3 6 ; 9" }],
    table: { id: "tbl-2", preset: 0, rows: ["i0", "i1"] },
    parse(s) { const [a, t] = P.parts(s, 2, 'Numbers, then ";" and the target'); return { nums: P.nums(a, { minLen: 1, maxLen: 10, min: -99, max: 99 }), target: P.num(t) }; },
    lines: {
      look: { ts: "const partner = indexOf.get(target - nums[i]);", go: "if j, ok := indexOf[target-x]; ok" },
      found: { ts: "if (partner !== undefined) return [partner, i];", go: "return []int{j, i}" },
      store: { ts: "indexOf.set(nums[i], i);", go: "indexOf[x] = i" },
      none: { ts: "function twoSum>>return [];", go: "func twoSum>>return []int{}" },
    },
    trace({ nums, target }) {
      const T = new G.Trace();
      const m = new Map();
      const st = (i, mk, hi) => ({ cells: G.cells(nums), marks: Object.assign(i != null ? { [i]: "focus" } : {}, mk), ptrs: i != null ? [{ name: "i", at: i, role: "focus" }] : [], panels: [{ title: "map: value → index", entries: [...m.entries()], hi: hi != null ? [hi] : [] }] });
      for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        const j = m.get(need);
        T.add({ at: "look", key: `i${i}`, state: st(i, {}, m.has(need) ? need : null), flow: ["A", "B", "C"], vars: { i, x: nums[i], need }, say: `x = ${nums[i]}, so need = ${target} − ${nums[i]} = ${need}. Is ${need} in the map?`, ask: { q: `Is ${need} in the map?`, options: ["Yes: return the pair", "No: store x and move on"], answer: j !== undefined ? 0 : 1, why: j !== undefined ? `It was stored at index ${j}.` : "Not among the earlier numbers." } });
        if (j !== undefined) { T.add({ at: "found", key: `i${i}`, state: st(i, { [j]: "answer", [i]: "answer" }, need), flow: ["C", "D"], vars: { answer: [j, i] }, say: `Yes, at index ${j}: return \`[${j}, ${i}]\`.` }); return T.done([j, i]); }
        m.set(nums[i], i);
        T.add({ at: "store", key: `i${i}`, state: st(i, {}, nums[i]), flow: ["C", "E"], vars: { i, stored: `${nums[i]} → ${i}` }, say: `No. Store ${nums[i]} → ${i} for later numbers.` });
      }
      T.add({ at: "none", state: st(null), vars: { answer: [] }, say: "No pair found: return `[]`." });
      return T.done([]);
    },
  };

  /* ---------------- Problem 2 · Valid Anagram ---------------- */
  A.isAnagram = {
    title: "Valid Anagram: count up, count down",
    viz: "array",
    legend: ["focus:current letter", "bug:count would go below zero"],
    inputLabel: "s ; t", hint: "aab ; aba",
    presets: [{ label: "aab / aba (the trace table)", input: "aab ; aba" }, { label: "anagram / nagaram", input: "anagram ; nagaram" }, { label: "rat / car", input: "rat ; car" }],
    table: { id: "tbl-3", preset: 0, rows: ["start", "s0", "s1", "s2", "t0", "t1", "t2"] },
    parse(s) { const [a, b] = P.parts(s, 2, 'Write s, then ";" and t').map((x) => x.trim()); if (a.length > 12 || b.length > 12) throw new Error("Keep each word to 12 characters."); return { s: a, t: b }; },
    lines: {
      len: { ts: "if (s.length !== t.length) return false;", go: "if len(s) != len(t)" },
      up: { ts: "for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);", go: "counts[ch]++" },
      check: { ts: "if (left === 0) return false;", go: "if counts[ch] == 0" },
      down: { ts: "counts.set(ch, left - 1);", go: "counts[ch]--" },
      ret: { ts: "function isAnagram>>return true;", go: "func isAnagram>>return true" },
    },
    trace({ s, t }) {
      const T = new G.Trace();
      const counts = new Map();
      const st = (row, i, mk) => ({ labelW: 40, rows: [{ label: "s", cells: G.cells(s.split("")), marks: row === 0 ? { [i]: mk || "focus" } : {} }, { label: "t", cells: G.cells(t.split("")), marks: row === 1 ? { [i]: mk || "focus" } : {} }], panels: [{ title: "counts", entries: [...counts.entries()], hi: row === 0 ? [s[i]] : row === 1 ? [t[i]] : [] }] });
      T.add({ at: "len", key: "start", state: st(-1), vars: { "s length": s.length, "t length": t.length }, say: s.length !== t.length ? "Different lengths can never be anagrams: return `false`." : "Same length. Count the letters of `s` up." });
      if (s.length !== t.length) return T.done(false);
      for (let i = 0; i < s.length; i++) { counts.set(s[i], (counts.get(s[i]) || 0) + 1); T.add({ at: "up", key: `s${i}`, state: st(0, i), vars: { ch: s[i], count: counts.get(s[i]) }, say: `\`${s[i]}\` +1 → ${counts.get(s[i])}.` }); }
      for (let i = 0; i < t.length; i++) {
        const left = counts.get(t[i]) || 0;
        if (left === 0) { T.add({ at: "check", key: `t${i}`, state: st(1, i, "bug"), vars: { ch: t[i], count: 0 }, say: `\`${t[i]}\` has no count left: \`t\` has more \`${t[i]}\`s than \`s\`. Return \`false\` early.` }); return T.done(false); }
        counts.set(t[i], left - 1);
        T.add({ at: "down", key: `t${i}`, state: st(1, i), vars: { ch: t[i], count: left - 1 }, say: `\`${t[i]}\` −1 → ${left - 1}.` });
      }
      T.add({ at: "ret", state: st(-1), vars: {}, say: "Every count is back at zero: an anagram. `O(n)` time, `O(k)` space for k distinct letters." });
      return T.done(true);
    },
  };

  /* ---------------- Problem 3 · Group Anagrams ---------------- */
  const DEFAULT_WORDS = "eat tea tan ate nat bat";
  A.groupAnagrams = {
    title: "Group Anagrams: one signature per group",
    viz: "array",
    legend: ["focus:current word", "anchor:its group"],
    inputLabel: "Words", hint: DEFAULT_WORDS,
    presets: [{ label: "eat tea tan ate nat bat", input: DEFAULT_WORDS }, { label: "listen silent enlist google", input: "listen silent enlist google" }],
    parse: (s) => { const w = words(s, 8); if (w.some((x) => !/^[a-z]+$/.test(x) || x.length > 8)) throw new Error("Lowercase words of up to 8 letters."); return w; },
    lines: {
      key: { ts: 'const key = [...word].sort().join("");', go: "key[word[i]-'a']++" },
      push: { ts: "if (bucket) bucket.push(word);", go: "groups[key] = append(groups[key], word)" },
      set: { ts: "else groups.set(key, [word]);", go: "order = append(order, key)" },
      ret: { ts: "return [...groups.values()];", go: "for _, key := range order {" },
    },
    trace(ws) {
      const T = new G.Trace();
      const groups = new Map();
      const isDefault = ws.join(" ") === DEFAULT_WORDS;
      const st = (i, hi) => ({ cellW: 58, cells: G.cells(ws), marks: i != null ? { [i]: "focus" } : {}, panels: [{ title: "groups: signature → words", entries: [...groups.entries()].map(([k, v]) => [k, v.join(", ")]), hi: hi ? [hi] : [], valW: 150 }] });
      ws.forEach((w, i) => {
        const key = [...w].sort().join("");
        const g = [...groups.keys()].indexOf(key);
        const kIdx = (g < 0 ? groups.size : g) + 1;
        const flow = isDefault ? [`W${i + 1}`, `K${kIdx}`, `G${kIdx}`] : [];
        T.add({ at: "key", state: st(i, groups.has(key) ? key : null), flow, vars: { word: w, signature: key }, say: `Sort the letters of \`${w}\`: signature \`${key}\`.`, ask: { q: `Does \`${key}\` already have a group?`, options: ["Yes: add the word to it", "No: start a new group"], answer: groups.has(key) ? 0 : 1, why: groups.has(key) ? "An earlier word had the same letters." : "No earlier word had these letters." } });
        if (groups.has(key)) { groups.get(key).push(w); T.add({ at: "push", state: st(i, key), flow, vars: { word: w, signature: key }, say: `Add \`${w}\` to the \`${key}\` group.` }); }
        else { groups.set(key, [w]); T.add({ at: "set", state: st(i, key), flow, vars: { word: w, signature: key }, say: `New group \`${key}\` → [${w}].` }); }
      });
      T.add({ at: "ret", state: st(null), vars: { groups: groups.size }, say: `${groups.size} groups. Sorted keys cost \`O(L log L)\` per word; a 26-count key (the Go version) costs \`O(L)\`.` });
      return T.done([...groups.values()]);
    },
  };

  /* ---------------- Problem 4 · Intersection ---------------- */
  A.intersection = {
    title: "Intersection of Two Arrays",
    viz: "array",
    legend: ["focus:current value of b", "answer:reported", "done:repeat, already reported"],
    inputLabel: "a ; b", hint: "4 9 5 ; 9 4 9 8 4",
    presets: [{ label: "[1,2,2,1] and [2,2]", input: "1 2 2 1 ; 2 2" }, { label: "[4,9,5] and [9,4,9,8,4]", input: "4 9 5 ; 9 4 9 8 4" }],
    parse(s) { const [x, y] = P.parts(s, 2, 'Array a, then ";" and array b'); return { a: P.nums(x, { minLen: 1, maxLen: 8, min: -99, max: 99 }), b: P.nums(y, { minLen: 1, maxLen: 8, min: -99, max: 99 }) }; },
    lines: {
      init: { ts: "const pending = new Set(a);", go: "pending[x] = struct{}{}" },
      check: { ts: "if (pending.has(x)) {", go: "if _, ok := pending[x]; ok" },
      push: { ts: "result.push(x);", go: "result = append(result, x)" },
      del: { ts: "pending.delete(x); // report each value only once", go: "delete(pending, x) // report each value only once" },
      ret: { ts: "function intersection>>return result;", go: "func intersection>>return result" },
    },
    trace({ a, b }) {
      const T = new G.Trace();
      const pending = [...new Set(a)];
      const result = [];
      const marks = {};
      const st = (j) => ({ labelW: 40, rows: [{ label: "a", cells: G.cells(a) }, { label: "b", cells: G.cells(b), marks: Object.assign({}, marks, j != null ? { [j]: "focus" } : {}) }], panels: [{ title: "pending", entries: pending.map((x) => [x]), hi: j != null ? [b[j]] : [], empty: "(empty)" }, { title: "result", entries: result.map((x) => [x]), empty: "(empty)" }] });
      T.add({ at: "init", state: st(null), vars: {}, say: "Put `a` in a set. Duplicates collapse to one entry." });
      b.forEach((x, j) => {
        const hit = pending.includes(x);
        T.add({ at: "check", state: st(j), vars: { x }, say: `Is ${x} still pending?`, ask: { q: `Is ${x} in the pending set?`, options: ["Yes: report it", "No: skip"], answer: hit ? 0 : 1, why: hit ? "It is in a and has not been reported." : "Either it is not in a, or it was already reported and removed." } });
        if (hit) {
          result.push(x); marks[j] = "answer";
          T.add({ at: "push", state: st(j), vars: { x, result: result.slice() }, say: `Report ${x}.` });
          pending.splice(pending.indexOf(x), 1);
          T.add({ at: "del", state: st(j), vars: { x }, say: `Remove ${x} from the set so a repeat in b is not reported twice.` });
        } else marks[j] = "done";
      });
      T.add({ at: "ret", state: st(null), vars: { result: result.slice() }, say: `Return ${G.show(result)}. \`O(a + b)\` time, \`O(a)\` space.` });
      return T.done(result);
    },
  };

  /* ---------------- Problem 5 · Longest Consecutive Sequence ---------------- */
  A.longestConsecutive = {
    title: "Longest Consecutive Sequence",
    viz: "array",
    legend: ["focus:candidate x", "done:skipped, not a run start", "answer:the run being counted"],
    varRoles: { best: "answer" },
    inputLabel: "Numbers", hint: "100 4 200 1 3 2",
    presets: [{ label: "[100,4,200,1,3,2] (the trace table)", input: "100 4 200 1 3 2" }, { label: "[0,3,7,2,5,8,4,6,0,1] → 9", input: "0 3 7 2 5 8 4 6 0 1" }],
    table: { id: "tbl-4", preset: 0, rows: ["x100", "x4", "x200", "x1", "x3", "x2"] },
    parse: (s) => P.nums(s, { allowEmpty: true, maxLen: 12, min: -99, max: 999 }),
    lines: {
      skip: { ts: "if (all.has(x - 1)) continue;", go: "if _, ok := all[x-1]; ok" },
      start: { ts: "let cur = x;", go: "cur := x" },
      walk: { ts: "while (all.has(cur + 1)) cur++;", go: "func longestConsecutive>>cur++" },
      best: { ts: "best = Math.max(best, cur - x + 1);", go: "best = max(best, cur-x+1)" },
      ret: { ts: "function longestConsecutive>>return best;", go: "func longestConsecutive>>return best" },
    },
    trace(nums) {
      const T = new G.Trace();
      const all = [...new Set(nums)];
      const has = (v) => all.includes(v);
      let best = 0, visits = 0;
      const skipped = {};
      const st = (i, run, mk) => ({ cellW: 50, labelW: 60, rows: [{ label: "the set", cells: G.cells(all), marks: Object.assign({}, skipped, i != null ? { [i]: "focus" } : {}, mk) }, { label: "run", cells: (run || []).map((v, k) => ({ id: "r" + k, v })), marks: Object.fromEntries((run || []).map((_, k) => [k, "answer"])) }] });
      if (!all.length) { T.add({ at: "ret", state: st(null), vars: { best: 0 }, say: "Empty input: the answer is 0." }); return T.done(0); }
      all.forEach((x, i) => {
        visits++;
        const mid = has(x - 1);
        T.add({ at: "skip", key: `x${x}`, state: st(i), flow: ["A", "B"], vars: { x, best, visits }, say: `Is ${x - 1} in the set?`, ask: { q: `${x - 1} ${mid ? "is" : "is not"} in the set. What do we do with ${x}?`, options: ["Skip it: it is in the middle of a run", "Start counting a run from it"], answer: mid ? 0 : 1, why: mid ? `${x} has a left neighbor, so its run is counted from an earlier start.` : `${x} has no left neighbor: it starts a run.` } });
        if (mid) { skipped[i] = "done"; T.add({ at: "skip", key: `x${x}`, state: st(i), flow: ["B", "C"], vars: { x, best, visits }, say: `${x} is in the middle of a run: skip.` }); return; }
        let cur = x;
        const run = [x];
        const runMarks = () => Object.fromEntries(run.map((v) => [all.indexOf(v), "answer"]));
        T.add({ at: "start", key: `x${x}`, state: st(i, run.slice(), runMarks()), flow: ["B", "D"], vars: { x, cur, best, visits }, say: `${x} starts a run. Count upward.` });
        while (has(cur + 1)) { cur++; visits++; run.push(cur); T.add({ at: "walk", key: `x${x}`, state: st(i, run.slice(), runMarks()), flow: ["E", "F"], vars: { x, cur, best, visits }, say: `${cur} is in the set: the run grows to ${run.length}.` }); }
        best = Math.max(best, cur - x + 1);
        T.add({ at: "best", key: `x${x}`, state: st(i, run.slice(), runMarks()), flow: ["E", "G"], vars: { x, cur, length: cur - x + 1, best, visits }, say: `${cur + 1} is not in the set. Run length ${cur - x + 1}; best = ${best}.` });
      });
      T.add({ at: "ret", state: st(null), vars: { best, visits, "2n": 2 * all.length }, say: `Best run: ${best}. Only ${visits} visits for ${all.length} numbers, at most twice each, so \`O(n)\`. (Go iterates its map in random order, but the answer is the same.)` });
      return T.done(best);
    },
  };

  /* ---------------- Problem 6 · LRU Cache ---------------- */
  A.lruCache = {
    title: "LRU Cache: a map plus recency order",
    viz: "array",
    legend: ["focus:just used (most recent)", "bug:evicted (least recent)", "answer:get hit"],
    inputLabel: "capacity ; operations", hint: "2 ; put 1 1, put 2 2, get 1, put 3 3, get 2, put 4 4, get 1, get 3, get 4",
    presets: [{ label: "the lesson's example (the trace table)", input: "2 ; put 1 1, put 2 2, get 1, put 3 3, get 2, put 4 4, get 1, get 3, get 4" }, { label: "capacity 3", input: "3 ; put 1 10, put 2 20, put 3 30, get 1, put 4 40, get 2, get 3" }],
    table: { id: "tbl-5", preset: 0, rows: ["op0", "op1", "op2", "op3", "op4", "op5"] },
    parse(s) { const [c, o] = P.parts(s, 2, 'Capacity, then ";" and operations'); const cap = P.num(c, "Capacity"); if (!Number.isInteger(cap) || cap < 1 || cap > 5) throw new Error("Capacity from 1 to 5."); const ops = parseOps(["put", "get"], 14)(o); ops.forEach((x) => { if (x.op === "put" && x.v.length !== 2) throw new Error("put needs a key and a value, like put 1 1."); if (x.op === "get" && x.v.length !== 1) throw new Error("get needs a key, like get 1."); }); return { cap, ops }; },
    lines: {
      get: { ts: "const value = this.store.get(key);", go: "node, ok := c.nodes[key]" },
      miss: { ts: "if (value === undefined) return -1;", go: "return -1" },
      refresh: { ts: "this.store.delete(key); // refresh: remove then re-insert at the end", go: "func (c *LRUCache) Get>>c.order.MoveToFront(node)" },
      update: { ts: "if (this.store.has(key)) this.store.delete(key);", go: "func (c *LRUCache) Put>>c.order.MoveToFront(node)" },
      insert: { ts: "put(key: number, value: number): void {>>this.store.set(key, value);", go: "c.nodes[key] = c.order.PushFront(&lruEntry{key, value})" },
      full: { ts: "if (this.store.size > this.capacity) {", go: "if c.order.Len() > c.capacity" },
      evict: { ts: "this.store.delete(oldest);", go: "delete(c.nodes, oldest.Value.(*lruEntry).key)" },
    },
    trace({ cap, ops }) {
      const T = new G.Trace();
      let order = []; // most recent first
      const val = new Map();
      const st = (mk, out) => ({ labelW: 120, rows: [{ label: "most recent →", cells: order.map((k) => ({ id: k, v: `${k}:${val.get(k)}` })), marks: mk || {}, zones: order.length ? [{ key: "o", from: 0, to: order.length - 1, label: `${order.length} of ${cap} slots, least recent on the right`, cls: "soft" }] : [] }], minW: 120 + cap * 58 + 80, panels: [{ title: "map", entries: [...val.keys()].sort((a, b) => a - b).map((k) => [k]), empty: "(empty)" }], note: out ? { text: out, cls: "ok" } : null });
      ops.forEach(({ op, v }, n) => {
        const key = `op${n}`;
        if (op === "get") {
          const k = v[0];
          if (!val.has(k)) { T.add({ at: "miss", key, state: st({}, `get(${k}) → -1`), vars: { returned: -1 }, say: `get(${k}): not in the map. Return −1.` }); return; }
          order = [k].concat(order.filter((x) => x !== k));
          T.add({ at: "refresh", key, state: st({ 0: "answer" }, `get(${k}) → ${val.get(k)}`), vars: { returned: val.get(k) }, say: `get(${k}): found in \`O(1)\` through the map. Move it to the front: it is now the most recent.` });
        } else {
          const [k, x] = v;
          const had = val.has(k);
          val.set(k, x);
          order = [k].concat(order.filter((y) => y !== k));
          T.add({ at: had ? "update" : "insert", key, state: st({ 0: "focus" }), vars: { size: order.length, capacity: cap }, say: had ? `put(${k}, ${x}): update and move to the front.` : `put(${k}, ${x}): new key, insert at the front.`, ask: !had ? { q: `After inserting, there are ${order.length} keys and the capacity is ${cap}. Evict?`, options: ["Yes: drop the least recent", "No: it still fits"], answer: order.length > cap ? 0 : 1, why: order.length > cap ? `${order.length} > ${cap}.` : "Still within capacity." } : null });
          if (order.length > cap) {
            const old = order[order.length - 1];
            T.add({ at: "full", key, state: st({ [order.length - 1]: "bug" }), vars: { size: order.length, capacity: cap }, say: `Over capacity. The least recent key is ${old}, at the back.` });
            order.pop(); val.delete(old);
            T.add({ at: "evict", key, state: st({ 0: "focus" }), vars: { size: order.length, evicted: old }, say: `Evict ${old} from the list and the map. Both steps are \`O(1)\`.` });
          }
        }
      });
      return T.done(order.slice());
    },
  };

  /* ---------------- exercises ---------------- */
  A.firstUnique = {
    title: "First non-repeating character, in two passes",
    viz: "array",
    legend: ["focus:current character", "answer:the first one seen once"],
    inputLabel: "A word", hint: "loveleetcode",
    presets: [{ label: "leetcode", input: "leetcode" }, { label: "loveleetcode", input: "loveleetcode" }, { label: "aabb", input: "aabb" }],
    parse(s) { const t = String(s).trim(); if (!t || t.length > 14) throw new Error("1 to 14 characters."); return t; },
    lines: { count: { ts: "for (const ch of s) counts.set(ch,", go: "counts[s[i]]++ // pass 1" }, check: { ts: "if (counts.get(s[i]) === 1) return i;", go: "if counts[s[i]] == 1" }, none: { ts: "function firstUniqueChar>>return -1;", go: "func firstUniqueChar>>return -1" } },
    trace(s) {
      const T = new G.Trace();
      const counts = new Map();
      const st = (i, m) => ({ cellW: 40, cells: G.cells(s.split("")), marks: i != null ? { [i]: m || "focus" } : {}, panels: [{ title: "counts", entries: [...counts.entries()], hi: i != null ? [s[i]] : [] }] });
      for (let i = 0; i < s.length; i++) { counts.set(s[i], (counts.get(s[i]) || 0) + 1); T.add({ at: "count", state: st(i), vars: { pass: 1 }, say: `Pass 1: count \`${s[i]}\`.` }); }
      for (let i = 0; i < s.length; i++) {
        const c = counts.get(s[i]);
        T.add({ at: "check", state: st(i, c === 1 ? "answer" : "focus"), vars: { pass: 2, i, count: c }, say: c === 1 ? `Pass 2: \`${s[i]}\` appears once. Return ${i}.` : `Pass 2: \`${s[i]}\` appears ${c} times. Keep going.` });
        if (c === 1) return T.done(i);
      }
      T.add({ at: "none", state: st(null), vars: {}, say: "Every character repeats: return −1." });
      return T.done(-1);
    },
  };
  A.isomorphic = {
    title: "Isomorphic Strings: two maps",
    viz: "array",
    legend: ["focus:current pair", "bug:breaks the one-to-one rule"],
    inputLabel: "s ; t", hint: "egg ; add",
    presets: [{ label: "egg / add", input: "egg ; add" }, { label: "foo / bar", input: "foo ; bar" }, { label: "badc / baba", input: "badc ; baba" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'Write s, then ";" and t').map((x) => x.trim()); if (!a || a.length > 10 || b.length > 10) throw new Error("1 to 10 characters each."); return { s: a, t: b }; },
    lines: { len: { ts: "function isIsomorphic>>if (s.length !== t.length) return false;", go: "func isIsomorphic>>if len(s) != len(t)" }, c1: { ts: "if (sToT.has(a) && sToT.get(a) !== b) return false;", go: "if v, ok := sToT[a]; ok && v != b" }, c2: { ts: "if (tToS.has(b) && tToS.get(b) !== a) return false;", go: "if v, ok := tToS[b]; ok && v != a" }, set: { ts: "sToT.set(a, b);", go: "sToT[a] = b" }, ok: { ts: "function isIsomorphic>>return true;", go: "func isIsomorphic>>return true" } },
    trace({ s, t }) {
      const T = new G.Trace();
      const st1 = new Map(), ts1 = new Map();
      const st = (i, m) => ({ labelW: 40, rows: [{ label: "s", cells: G.cells(s.split("")), marks: i != null ? { [i]: m || "focus" } : {} }, { label: "t", cells: G.cells(t.split("")), marks: i != null && i < t.length ? { [i]: m || "focus" } : {} }], panels: [{ title: "s → t", entries: [...st1.entries()] }, { title: "t → s", entries: [...ts1.entries()] }] });
      if (s.length !== t.length) { T.add({ at: "len", state: st(null), vars: {}, say: "Different lengths: return `false`." }); return T.done(false); }
      for (let i = 0; i < s.length; i++) {
        const a = s[i], b = t[i];
        if (st1.has(a) && st1.get(a) !== b) { T.add({ at: "c1", state: st(i, "bug"), vars: { a, b }, say: `\`${a}\` already maps to \`${st1.get(a)}\`, not \`${b}\`: return \`false\`.` }); return T.done(false); }
        if (ts1.has(b) && ts1.get(b) !== a) { T.add({ at: "c2", state: st(i, "bug"), vars: { a, b }, say: `\`${b}\` is already taken by \`${ts1.get(b)}\`. Without this second map, two letters could share \`${b}\`. Return \`false\`.` }); return T.done(false); }
        st1.set(a, b); ts1.set(b, a);
        T.add({ at: "set", state: st(i), vars: { a, b }, say: `\`${a}\` ↔ \`${b}\`: consistent in both directions.` });
      }
      T.add({ at: "ok", state: st(null), vars: {}, say: "Every pair is consistent both ways: return `true`." });
      return T.done(true);
    },
  };

  /* ---------------- quiz ---------------- */
  G.quizzes.hash04 = {
    title: "Is it a hash-table problem?",
    intro: "Look for \"have I seen…\", \"count…\", \"group by…\", \"find a partner…\".",
    items: [
      { q: "Return the first character in a string that appears exactly once.", options: ["Frequency map, two passes", "Two pointers", "Binary search", "Sorting the string"], answer: 0, why: "Count everything first, then find the first character with count 1. Sorting would destroy the order." },
      { q: "Given a list of emails, group the ones that belong to the same person after normalization.", options: ["Map from a canonical key to a list", "Sliding window", "Heap", "Recursion"], answer: 0, why: "\"Treat these as the same if…\": pick a canonical form and use it as the key." },
      { q: "A nested loop finds, for each item, a partner with `a[i] + a[j] === k`.", options: ["Replace the inner loop with a lookup", "Add a third loop", "Sort and binary search is the only fix", "Use recursion"], answer: 0, why: "Ask \"can I look the partner up instead?\" That turns `O(n²)` into `O(n)` with `O(n)` memory." },
      { q: "In TypeScript, `if (map.get(k))` is used to test whether `k` is present. When is it wrong?", options: ["When the stored value is 0 (or another falsy value)", "When k is a string", "When the map is large", "Never"], answer: 0, why: "Test presence with `map.has(k)` or `map.get(k) !== undefined`." },
      { q: "Why is a hash-map lookup only `O(1)` on **average**?", options: ["Many keys can collide in one slot and form a long chain", "Hashing a key is always `O(n)`", "Maps are sorted internally", "Because of garbage collection"], answer: 0, why: "With a good hash function chains stay short; resizing keeps the load factor low." },
    ],
  };
})();

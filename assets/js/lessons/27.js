/* Lesson 27 · Bit manipulation — every number drawn as a row of bits. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  // a number as W bit cells, most significant on the left; negatives show W-bit two's complement
  const bitsOf = (v, W) => Array.from({ length: W }, (_, k) => ((v >> (W - 1 - k)) & 1));
  const bin = (v, W) => bitsOf(v, W).join("");
  const brow = (label, v, W, mk, key) => ({ label: `${label}`, cells: bitsOf(v, W).map((b, k) => ({ id: (key || label) + ":" + k, v: b, m: (mk && mk[W - 1 - k]) || (b ? "p1" : null) })) });
  const widthFor = (...vals) => Math.max(3, ...vals.map((v) => (v <= 0 ? 1 : Math.floor(Math.log2(v)) + 1)));
  const bview = (rows, W, note) => ({ cellW: 34, cellH: 38, gap: 4, labelW: 120, indices: false, rows, note: note ? { text: note } : undefined, colLabels: null });

  /* ---------- Problem 1: number of 1 bits, power of two ---------- */
  A.popcount = {
    title: "Number of 1 Bits: n & (n − 1) clears the lowest 1", short: "Count the 1 bits",
    viz: "array", legend: ["p1:a 1 bit", "bug:the lowest 1, about to be cleared"],
    inputLabel: "a non-negative number", hint: "11",
    presets: [{ label: "11 = 1011", input: "11" }, { label: "128", input: "128" }, { label: "44 = 101100", input: "44" }],
    parse(s) { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 0 || n > 4095) throw new Error("A whole number from 0 to 4095."); return n; },
    lines: { clear: { ts: "n &= n - 1; // clears the lowest 1 bit", go: "n &= n - 1 // clears the lowest 1 bit" }, count: { ts: "count++;", go: "count++" }, ret: { ts: "hammingWeight>>return count;", go: "func hammingWeight>>return count" } },
    table: { id: "tbl-4", preset: 0, rows: ["s1", "s2", "s3"] },
    trace(n) {
      const Tr = new G.Trace();
      const W = widthFor(n);
      let count = 0, step = 0;
      Tr.add({ at: "clear", state: bview([brow(`n = ${n}`, n, W, {}, "n")], W), vars: { n }, say: `n = ${n} = ${bin(n, W)} in binary. Each round removes exactly one 1, so the loop runs once per 1 bit.` });
      while (n !== 0) {
        const low = Math.log2(n & -n);
        const m = n - 1;
        Tr.add({ key: "s" + (step + 1), at: "clear", state: bview([brow(`n = ${n}`, n, W, { [low]: "bug" }, "n"), brow(`n − 1 = ${m}`, m, W, {}, "m")], W), vars: { n, "n − 1": m }, say: `n − 1 flips the lowest 1 (bit ${low}) to 0 and every 0 below it to 1. ANDing with n keeps the bits above and wipes the rest.` });
        n &= n - 1; count++; step++;
        Tr.add({ key: "s" + step, at: "count", state: bview([brow(`n = ${n}`, n, W, {}, "n")], W), vars: { n, count }, say: `n & (n − 1) = ${bin(n, W)}. count = ${count}.` });
      }
      Tr.add({ at: "ret", state: bview([brow("n = 0", 0, W, {}, "n")], W), vars: { count }, say: `n is 0: ${count} one bit${count === 1 ? "" : "s"}.` });
      return Tr.done(count);
    },
  };
  A.pow2 = {
    title: "Number of 1 Bits: n & (n − 1) clears the lowest 1", short: "Power of two?",
    viz: "array", legend: ["p1:a 1 bit"],
    inputLabel: "a number", hint: "16",
    presets: [{ label: "16", input: "16" }, { label: "18", input: "18" }, { label: "0", input: "0" }],
    parse(s) { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < -64 || n > 4095) throw new Error("A whole number from −64 to 4095."); return n; },
    lines: { test: { ts: "return n > 0 && (n & (n - 1)) === 0; // exactly one bit set", go: "return n > 0 && n&(n-1) == 0 // exactly one bit set" } },
    trace(n) {
      const Tr = new G.Trace();
      const W = n > 0 ? widthFor(n) : 8;
      const r = n > 0 && (n & (n - 1)) === 0;
      Tr.add({ at: "test", state: bview([brow(`n = ${n}`, n, W, {}, "n"), brow(`n − 1`, n - 1, W, {}, "m"), brow("n & (n − 1)", n & (n - 1), W, {}, "x")], W), vars: { n, "n & (n − 1)": n & (n - 1), result: r }, say: n <= 0 ? `${n} is not positive: false (0 & −1 is 0, which is why n > 0 is needed).` : r ? `One bit set, so clearing it leaves 0: a power of two.` : `More than one bit set: clearing the lowest leaves something. Not a power of two.` });
      return Tr.done(r);
    },
  };

  /* ---------- Problem 2: counting bits ---------- */
  A.countBits = {
    title: "Counting Bits: bits[i] = bits[i >> 1] + (i & 1)",
    viz: "array", legend: ["focus:bits[i]", "anchor:bits[i >> 1] it reuses"],
    inputLabel: "n", hint: "5",
    presets: [{ label: "n = 5", input: "5" }, { label: "n = 10", input: "10" }],
    parse(s) { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < 0 || n > 15) throw new Error("n from 0 to 15."); return n; },
    lines: { fill: { ts: "for (let i = 1; i <= n; i++) bits[i] = bits[i >> 1] + (i & 1);", go: "bitCount[i] = bitCount[i>>1] + (i & 1) // reuse the answer for i / 2" }, ret: { ts: "return bits;", go: "return bitCount" } },
    table: { id: "tbl-5", preset: 0, rows: ["i0", "i1", "i2", "i3", "i4", "i5"] },
    trace(n) {
      const Tr = new G.Trace();
      const bits = Array(n + 1).fill(null); bits[0] = 0;
      const W = widthFor(n);
      const st = (i) => ({ cellW: 34, gap: 4, labelW: 90, rows: [i != null ? brow(`i = ${i}`, i, W, { 0: "focus" }, "i") : brow("i", 0, W, {}, "i"), ...(i ? [brow(`i >> 1 = ${i >> 1}`, i >> 1, W, {}, "h")] : []), { label: "bits", cells: bits.map((b, k) => ({ id: "b" + k, v: b === null ? "" : b, m: k === i ? "focus" : i && k === i >> 1 ? "anchor" : null })) }] });
      Tr.add({ key: "i0", at: "fill", state: st(0), vars: {}, say: "bits[0] = 0." });
      for (let i = 1; i <= n; i++) { bits[i] = bits[i >> 1] + (i & 1); Tr.add({ key: "i" + i, at: "fill", state: st(i), vars: { i, "bits[i >> 1]": bits[i >> 1], "i & 1": i & 1, "bits[i]": bits[i] }, say: `${i} = ${bin(i, W)}. Shifting right drops the last bit, giving ${i >> 1}, already counted (${bits[i >> 1]}). Add the dropped bit (${i & 1}): ${bits[i]}.` }); }
      Tr.add({ at: "ret", state: st(null), vars: {}, say: `[${bits.join(", ")}] in O(n): each answer reuses a smaller one.` });
      return Tr.done(bits);
    },
  };

  /* ---------- Problem 3: XOR tricks ---------- */
  const xorRows = (nums, acc, W, i, label) => [{ label: "nums", cells: nums.map((v, k) => ({ id: "n" + k, v, m: k === i ? "focus" : k < i ? "done" : null })) }, brow(`${label} = ${acc}`, acc, W, {}, "acc")];
  A.single = {
    title: "XOR tricks: pairs cancel", short: "Single Number",
    viz: "array", legend: ["focus:x", "done:already XORed in", "p1:a 1 bit of the running XOR"],
    inputLabel: "numbers (all paired but one)", hint: "4 1 2 1 2",
    presets: [{ label: "[4,1,2,1,2]", input: "4 1 2 1 2" }, { label: "[2,2,1]", input: "2 2 1" }],
    parse(s) { const a = P.nums(s, { minLen: 1, maxLen: 9, min: 0, max: 63 }); const c = new Map(); a.forEach((x) => c.set(x, (c.get(x) || 0) + 1)); if ([...c.values()].filter((v) => v === 1).length !== 1 || [...c.values()].some((v) => v > 2)) throw new Error("Every number must appear exactly twice except one."); return a; },
    lines: { xor: { ts: "for (const x of nums) result ^= x; // pairs cancel, leaving the single number", go: "result ^= x // pairs cancel, leaving the single number" }, ret: { ts: "singleNumber>>return result;", go: "func singleNumber>>return result" } },
    trace(nums) {
      const Tr = new G.Trace();
      const W = widthFor(...nums);
      let r = 0;
      nums.forEach((x, i) => { r ^= x; Tr.add({ at: "xor", state: bview(xorRows(nums, r, W, i, "result").concat([brow(`x = ${x}`, x, W, {}, "x")]), W), vars: { x, result: r }, say: `result ^= ${x}. XOR flips the bits where x has a 1. A number XORed twice cancels out: x ^ x = 0.` }); });
      Tr.add({ at: "ret", state: bview(xorRows(nums, r, W, nums.length, "result"), W), vars: { answer: r }, say: `Every pair cancelled; ${r} is left. O(n) time, O(1) memory.` });
      return Tr.done(r);
    },
  };
  A.missing = {
    title: "XOR tricks: pairs cancel", short: "Missing Number",
    viz: "array", legend: ["focus:i and nums[i]", "done:already XORed in"],
    inputLabel: "0..n with one missing", hint: "3 0 1",
    presets: [{ label: "[3,0,1]", input: "3 0 1" }, { label: "[9,6,4,2,3,5,7,0,1]", input: "9 6 4 2 3 5 7 0 1" }],
    parse(s) { const a = P.nums(s, { minLen: 1, maxLen: 10, min: 0, max: 10 }); if (new Set(a).size !== a.length || a.some((x) => x > a.length)) throw new Error(`Distinct numbers from 0 to ${a.length}, one missing.`); return a; },
    lines: { init: { ts: "let result = nums.length;", go: "result := len(nums) // include the index n" }, xor: { ts: "for (let i = 0; i < nums.length; i++) result ^= i ^ nums[i];", go: "result ^= i ^ x // every present number cancels with its index" }, ret: { ts: "missingNumber>>return result;", go: "func missingNumber>>return result" } },
    trace(nums) {
      const Tr = new G.Trace();
      const W = widthFor(nums.length);
      let r = nums.length;
      Tr.add({ at: "init", state: bview(xorRows(nums, r, W, -1, "result"), W), vars: { result: r }, say: `Start with n = ${nums.length}: the one index that has no slot in the array.` });
      nums.forEach((x, i) => { r ^= i ^ x; Tr.add({ at: "xor", state: bview(xorRows(nums, r, W, i, "result"), W), vars: { i, "nums[i]": x, result: r }, say: `XOR in the index ${i} and the value ${x}. Every number that is present appears once as a value and once as an index, so it cancels.` }); });
      Tr.add({ at: "ret", state: bview(xorRows(nums, r, W, nums.length, "result"), W), vars: { answer: r }, say: `Only the missing number appeared once: ${r}.` });
      return Tr.done(r);
    },
  };
  A.single3 = {
    title: "XOR tricks: pairs cancel", short: "Single Number III",
    viz: "array", legend: ["bug:the lowest differing bit", "p1:group with that bit set", "p2:group with it clear"],
    inputLabel: "numbers (all paired but two)", hint: "1 2 1 3 2 5",
    presets: [{ label: "[1,2,1,3,2,5]", input: "1 2 1 3 2 5" }, { label: "[4,6,4,7]", input: "4 6 4 7" }],
    parse(s) { const a = P.nums(s, { minLen: 2, maxLen: 10, min: 0, max: 63 }); const c = new Map(); a.forEach((x) => c.set(x, (c.get(x) || 0) + 1)); if ([...c.values()].filter((v) => v === 1).length !== 2 || [...c.values()].some((v) => v > 2)) throw new Error("Every number must appear twice except exactly two."); return a; },
    lines: { all: { ts: "for (const x of nums) xor ^= x; // = a ^ b", go: "xor ^= x // = a ^ b" }, low: { ts: "const low = xor & -xor; // a bit where a and b differ", go: "low := xor & -xor // a bit where a and b differ" }, split: { ts: "if (x & low) a ^= x; // group with the bit set", go: "a ^= x // group with the bit set" }, ret: { ts: "return [a, b].sort((p, q) => p - q);", go: "return []int{a, b}" } },
    trace(nums) {
      const Tr = new G.Trace();
      const W = widthFor(...nums);
      let x = 0; nums.forEach((v) => (x ^= v));
      Tr.add({ at: "all", state: bview([{ label: "nums", cells: nums.map((v, k) => ({ id: "n" + k, v })) }, brow(`xor = ${x}`, x, W, {}, "acc")], W), vars: { xor: x }, say: `XOR everything: the pairs cancel and xor = a ^ b = ${x}. Its 1 bits are where a and b differ.` });
      const low = x & -x, lb = Math.log2(low);
      Tr.add({ at: "low", state: bview([brow(`xor = ${x}`, x, W, { [lb]: "bug" }, "acc"), brow(`low = ${low}`, low, W, { [lb]: "bug" }, "low")], W), vars: { low }, say: `xor & −xor keeps only the lowest 1: bit ${lb}. a has it and b does not (or the other way round).` });
      let a = 0, b = 0;
      nums.forEach((v) => { if (v & low) a ^= v; else b ^= v; });
      Tr.add({ at: "split", state: bview([{ label: "nums", cells: nums.map((v, k) => ({ id: "n" + k, v, m: v & low ? "p1" : "p2" })) }, brow(`group 1 → ${a}`, a, W, {}, "ga"), brow(`group 2 → ${b}`, b, W, {}, "gb")], W), vars: { a, b }, say: `Split by that bit. Each pair lands in one group and cancels there, so each group XORs down to one of the two singles: ${a} and ${b}.` });
      const r = [a, b].sort((p, q) => p - q);
      Tr.add({ at: "ret", state: bview([{ label: "answer", cells: r.map((v, k) => ({ id: "r" + k, v, m: "answer" })) }], W), vars: { answer: `[${r.join(", ")}]` }, say: `[${r.join(", ")}].` });
      return Tr.done(r);
    },
  };

  /* ---------- Problem 4: add without + ---------- */
  A.getSum = {
    title: "Sum of Two Integers: XOR adds, AND-shift carries",
    viz: "array", legend: ["p1:a 1 bit", "focus:carry bits"],
    inputLabel: "a ; b", hint: "3 ; 5",
    presets: [{ label: "3 + 5", input: "3 ; 5" }, { label: "−2 + 3", input: "-2 ; 3" }, { label: "20 + −30", input: "20 ; -30" }],
    parse(s) { const [x, y] = P.parts(s, 2, "a ; b"); const a = P.num(x, "a"), b = P.num(y, "b"); if (![a, b].every((v) => Number.isInteger(v) && v >= -100 && v <= 100)) throw new Error("Whole numbers from −100 to 100."); return { a, b }; },
    lines: { carry: { ts: "const carry = (a & b) << 1;", go: "carry := (x & y) << 1" }, xor: { ts: "a = a ^ b; // add without the carries", go: "x ^= y                // add without the carries" }, next: { ts: "b = carry; // now add the carries", go: "y = carry             // now add the carries" }, ret: { ts: "getSum(a: number, b: number)>>return a;", go: "return int(x)" } },
    table: { id: "tbl-6", preset: 0, rows: ["r1", "r2", "r3", "r4"] },
    trace({ a, b }) {
      const Tr = new G.Trace();
      const W = a < 0 || b < 0 ? 10 : Math.max(4, widthFor(Math.abs(a) + Math.abs(b)) + 1);
      let round = 0;
      const st = (c) => bview([brow(`a = ${a}`, a, W, {}, "a"), brow(`b = ${b}`, b, W, {}, "b"), ...(c != null ? [{ ...brow(`carry = ${c}`, c, W, {}, "c"), cells: bitsOf(c, W).map((bit, k) => ({ id: "c:" + k, v: bit, m: bit ? "focus" : null })) }] : [])], W, a < 0 || b < 0 ? `showing the low ${W} bits of 32-bit two's complement` : undefined);
      Tr.add({ at: "carry", state: st(null), vars: { a, b }, say: "Binary addition without +: XOR adds each column ignoring carries; AND finds columns where both are 1, and shifting left moves those carries to the next column." });
      while (b !== 0) {
        round++;
        const c = (a & b) << 1;
        Tr.add({ key: "r" + round, at: "carry", state: st(c), vars: { round, carry: c }, say: `Round ${round}: carry = (a & b) << 1 = ${c}.` });
        a = a ^ b;
        b = c;
        Tr.add({ key: "r" + round, at: "next", state: st(null), vars: { a, b }, say: `a = a ^ b = ${a}; b = carry = ${b}.${b ? " Repeat while there are carries." : ""}` });
      }
      Tr.add({ at: "ret", state: st(null), vars: { answer: a }, say: `No carries left: the sum is ${a}. At most 32 rounds, since each round pushes the carry one place left.` });
      return Tr.done(a);
    },
  };

  /* ---------- Problem 5: subsets as masks ---------- */
  A.masks = {
    title: "Bitmask subsets: bit i means \"take nums[i]\"", short: "All subsets",
    viz: "array", legend: ["p1:bit set", "answer:taken"],
    inputLabel: "up to 4 numbers", hint: "1 2 3",
    presets: [{ label: "[1,2,3]", input: "1 2 3" }, { label: "[a 4-item set] 5 6 7 8", input: "5 6 7 8" }],
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 4, min: -99, max: 99 }),
    lines: { take: { ts: "for (let i = 0; i < n; i++) if (mask & (1 << i)) subset.push(nums[i]);", go: "subset = append(subset, nums[i]) // bit i = \"take nums[i]\"" }, ret: { ts: "subsetsByMask>>return result;", go: "func subsetsByMask>>return result" } },
    table: { id: "tbl-7", preset: 0, rows: ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7"] },
    trace(nums) {
      const Tr = new G.Trace();
      const n = nums.length;
      const result = [];
      for (let mask = 0; mask < 1 << n; mask++) {
        const sub = []; for (let i = 0; i < n; i++) if (mask & (1 << i)) sub.push(nums[i]);
        result.push(sub);
        Tr.add({ key: "m" + mask, at: "take", state: bview([brow(`mask ${mask}`, mask, n, {}, "m"), { label: "nums (bit i)", cells: nums.map((v, i) => ({ id: "v" + i, v, m: mask & (1 << i) ? "answer" : null })).reverse() }], n, `subset [${sub.join(", ")}]`), vars: { mask, binary: bin(mask, n) }, say: `mask ${mask} = ${bin(mask, n)}: take the items whose bit is 1 → [${sub.join(", ")}]. (Bit 0 is on the right.)` });
      }
      Tr.add({ at: "ret", state: bview([], n, `${result.length} subsets`), vars: { subsets: result.length }, say: `Counting from 0 to 2ⁿ − 1 lists every subset exactly once: ${result.length} of them.` });
      return Tr.done(result);
    },
  };
  A.submasks = {
    title: "Bitmask subsets: bit i means \"take nums[i]\"", short: "Submasks of a mask",
    viz: "array", legend: ["p1:bit set"],
    inputLabel: "a mask (number)", hint: "13",
    presets: [{ label: "0b101 = 5", input: "5" }, { label: "0b1101 = 13", input: "13" }],
    parse(s) { const m = P.num(s, "mask"); if (!Number.isInteger(m) || m < 0 || m > 255) throw new Error("A mask from 0 to 255."); return m; },
    lines: { step: { ts: "for (let sub = mask; sub > 0; sub = (sub - 1) & mask) subs.push(sub);", go: "for sub := mask; sub > 0; sub = (sub - 1) & mask {" }, ret: { ts: "return subs;", go: "return subs" } },
    trace(mask) {
      const Tr = new G.Trace();
      const W = widthFor(mask);
      const subs = [];
      for (let sub = mask; sub > 0; sub = (sub - 1) & mask) { subs.push(sub); Tr.add({ at: "step", state: bview([brow(`mask ${mask}`, mask, W, {}, "m"), brow(`sub ${sub}`, sub, W, {}, "s")], W), vars: { sub, binary: bin(sub, W) }, say: `sub = ${bin(sub, W)}. Next: (sub − 1) & mask: subtracting 1 borrows, and the AND throws away any bit outside the mask.` }); }
      Tr.add({ at: "ret", state: bview([brow(`mask ${mask}`, mask, W, {}, "m")], W), vars: { count: subs.length }, say: `${subs.length} non-empty submasks, largest to smallest, skipping every number that is not a submask.` });
      return Tr.done(subs);
    },
  };

  /* ---------- Problem 6: maximum XOR with a bit trie ---------- */
  A.maxXor = {
    title: "Maximum XOR: a trie of bits, greedily take the opposite bit",
    viz: "tree", legend: ["p1:path of the number inserted / queried", "answer:took the opposite bit (a 1 in the XOR)", "bug:forced to take the same bit (a 0)"],
    inputLabel: "numbers (0..63)", hint: "3 10 5 25 2 8",
    presets: [{ label: "[3,10,5,25,2,8]", input: "3 10 5 25 2 8" }, { label: "[2,4]", input: "2 4" }],
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 6, min: 0, max: 63 }),
    lines: { ins: { ts: "trie[node][b] = trie.length - 1;", go: "trie[node][b] = len(trie) - 1" }, opp: { ts: "xor |= 1 << bit;", go: "xor |= 1 << bit" }, same: { ts: "node = trie[node][b]; // forced to take the same bit: a 0 here", go: "node = trie[node][b] // forced to take the same bit: a 0 here" }, best: { ts: "best = Math.max(best, xor);", go: "best = max(best, xor)" } },
    trace(nums) {
      const Tr = new G.Trace();
      const B = widthFor(...nums) - 1; // the code uses bits 30..0; above B every number has 0s, a single shared chain
      const trie = [[-1, -1]], par = [null], lab = ["·"];
      const st = (mk, note) => ({ colW: 40, rowH: 50, nodes: trie.map((_, i) => ({ id: i, label: lab[i], parent: par[i], m: (mk && mk[i]) || null })), note: { text: note || "" } });
      for (const num of nums) {
        let node = 0; const path = { 0: "p1" };
        for (let bit = B; bit >= 0; bit--) { const b = (num >> bit) & 1; if (trie[node][b] === -1) { trie.push([-1, -1]); par.push(node); lab.push(String(b)); trie[node][b] = trie.length - 1; } node = trie[node][b]; path[node] = "p1"; }
        Tr.add({ at: "ins", state: st(path, `inserted ${num} = ${bin(num, B + 1)}`), vars: { num, binary: bin(num, B + 1) }, say: `Insert ${num} = ${bin(num, B + 1)}, highest bit first. (The code walks bits 30..0; the higher bits are all 0 here, so they would only add one shared chain on top.)` });
      }
      let best = 0, bestNum = null;
      for (const num of nums) {
        let node = 0, xor = 0; const mk = { 0: "p1" };
        for (let bit = B; bit >= 0; bit--) { const b = (num >> bit) & 1, want = 1 - b; if (trie[node][want] !== -1) { xor |= 1 << bit; node = trie[node][want]; mk[node] = "answer"; } else { node = trie[node][b]; mk[node] = "bug"; } }
        if (xor > best) { best = xor; bestNum = num; }
        Tr.add({ at: xor >= best ? "opp" : "same", state: st(mk, `${num} = ${bin(num, B + 1)} → best partner gives ${xor} = ${bin(xor, B + 1)}`), vars: { num, xor, best }, say: `Query ${num}: at each bit prefer the opposite bit (green), since a 1 high up beats anything below. Red where no opposite exists. XOR ${xor}.` });
      }
      Tr.add({ at: "best", state: st({}, `maximum XOR ${best}`), vars: { answer: best }, say: `The best over all numbers is ${best}${bestNum != null ? ` (found from ${bestNum})` : ""}. O(n × 31).` });
      return Tr.done(best);
    },
  };

  G.quizzes.bit27 = {
    title: "Bits",
    items: [
      { q: "What does x & (x − 1) do?", options: ["Clears the lowest 1 bit", "Keeps only the lowest 1 bit", "Flips every bit", "Doubles x"], answer: 0, why: "x & −x keeps only the lowest 1 bit." },
      { q: "x ^ x equals…", options: ["0", "x", "2x", "−1"], answer: 0, why: "That is why pairs cancel in Single Number." },
      { q: "In JavaScript, 1 << 31 is…", options: ["negative (−2147483648)", "2147483648", "0", "an error"], answer: 0, why: "Bit operators work on 32-bit signed integers." },
      { q: "Is x & 1 === 0 the same as (x & 1) === 0?", options: ["No: === binds tighter, so it is x & (1 === 0)", "Yes", "Only in Go", "Only for even x"], answer: 0, why: "Always parenthesize bit tests." },
      { q: "How many subsets does a 20-element set have, and how do you list them?", options: ["2²⁰; count a mask from 0 to 2²⁰ − 1", "20²; two loops", "20!; permutations", "40; each element in or out"], answer: 0, why: "Bit i of the mask says whether element i is in." },
    ],
  };
})();

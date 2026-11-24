/* Lesson 25 · Dynamic programming in one dimension. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  const show = (v) => (v === Infinity ? "∞" : v === undefined || v === null ? "" : String(v));
  const row = (label, vals, marks, extra) => Object.assign({ label, cells: vals.map((v, i) => ({ id: label + i, v: show(v), m: (marks && marks[i]) || null })) }, extra || {});
  const parseN = (s, lo, hi) => { const n = P.num(s, "n"); if (!Number.isInteger(n) || n < lo || n > hi) throw new Error(`n must be from ${lo} to ${hi}.`); return n; };

  /* ---------- Problem 1: climbing stairs, four ways ---------- */
  const climbLines = {
    naive: { ts: "return climbNaive(n - 1) + climbNaive(n - 2);", go: "return climbNaive(n-1) + climbNaive(n-2)" },
    base: { ts: "climbNaive(n: number)>>if (n <= 2) return n;", go: "func climbNaive>>return n" },
    hit: { ts: "if (saved !== undefined) return saved;", go: "if v, ok := memo[n]; ok {" },
    store: { ts: "memo.set(n, result);", go: "memo[n] = climbMemo(n-1, memo) + climbMemo(n-2, memo)" },
    mbase: { ts: "climbMemo(n: number, memo = new Map<number, number>())>>if (n <= 2) return n;", go: "func climbMemo>>return n" },
    fill: { ts: "for (let i = 3; i <= n; i++) ways[i] = ways[i - 1] + ways[i - 2];", go: "ways[i] = ways[i-1] + ways[i-2]" },
    tbase: { ts: "ways[2] = 2;", go: "ways[1], ways[2] = 1, 2" },
    roll: { ts: "for (let i = 3; i <= n; i++) [prev2, prev1] = [prev1, prev1 + prev2];", go: "climbStairs>>prev2, prev1 = prev1, prev1+prev2" },
  };
  function callTree(n, memo) {
    const Tr = new G.Trace();
    const nodes = [];
    const stack = [];
    const known = new Map();
    let id = 0, calls = 0;
    const counts = new Map();
    const st = (cur) => ({ colW: 46, rowH: 58, nodes: nodes.map((x) => ({ id: x.id, label: `f${x.n}`, parent: x.parent, m: x.id === cur ? "focus" : x.m, sub: x.ret != null ? String(x.ret) : null })), stack: stack.map((x) => `f(${x})`) });
    function f(k, parent) {
      const me = { id: id++, n: k, parent, m: null, ret: null };
      nodes.push(me); calls++;
      counts.set(k, (counts.get(k) || 0) + 1);
      if (!memo && counts.get(k) > 1 && k > 2) me.m = "bug";
      stack.push(k);
      if (k <= 2) { me.ret = k; me.m = "anchor"; Tr.add({ at: memo ? "mbase" : "base", state: st(me.id), vars: { n: k, calls }, say: `f(${k}) is a base case: ${k} way${k > 1 ? "s" : ""}.` }); stack.pop(); return k; }
      if (memo && known.has(k)) { me.ret = known.get(k); me.m = "answer"; Tr.add({ at: "hit", state: st(me.id), vars: { n: k, calls }, say: `f(${k}) is already in the memo: ${known.get(k)}. No new calls below it.` }); stack.pop(); return me.ret; }
      Tr.add({ at: memo ? "store" : "naive", state: st(me.id), vars: { n: k, calls }, say: memo ? `f(${k}): not in the memo yet. Ask f(${k - 1}) and f(${k - 2}).` : counts.get(k) > 1 ? `f(${k}) again! This whole subtree is recomputed from scratch.` : `f(${k}) = f(${k - 1}) + f(${k - 2}).` });
      const r = f(k - 1, me.id) + f(k - 2, me.id);
      me.ret = r;
      if (memo) known.set(k, r);
      Tr.add({ at: memo ? "store" : "naive", state: st(me.id), vars: { n: k, result: r, calls }, say: memo ? `f(${k}) = ${r}. Save it in the memo.` : `f(${k}) = ${r}.` });
      stack.pop();
      return r;
    }
    const r = f(n, null);
    Tr.add({ state: st(null), vars: { answer: r, calls }, say: memo ? `${calls} calls: each n is computed once. O(n).` : `${calls} calls for n = ${n}; red nodes are repeated work. The count grows like the Fibonacci numbers: O(2ⁿ).` });
    return Tr.done(r);
  }
  A.climbNaive = { title: "Climbing Stairs: from exponential recursion to two variables", short: "Plain recursion", viz: "tree", legend: ["anchor:base case", "bug:computed again", "focus:current call"], inputLabel: "n (stairs)", hint: "5", presets: [{ label: "n = 5", input: "5" }, { label: "n = 6", input: "6" }], parse: (s) => parseN(s, 1, 6), lines: climbLines, trace: (n) => callTree(n, false) };
  A.climbMemo = { title: "Climbing Stairs: from exponential recursion to two variables", short: "Memo (top-down)", viz: "tree", legend: ["anchor:base case", "answer:memo hit", "focus:current call"], inputLabel: "n (stairs)", hint: "6", presets: [{ label: "n = 5", input: "5" }, { label: "n = 7", input: "7" }], parse: (s) => parseN(s, 1, 9), lines: climbLines, trace: (n) => callTree(n, true) };
  A.climbTable = {
    title: "Climbing Stairs: from exponential recursion to two variables", short: "Table (bottom-up)", viz: "array", legend: ["anchor:the two cells it reads", "focus:cell being filled"],
    inputLabel: "n (stairs)", hint: "5", presets: [{ label: "n = 5", input: "5" }, { label: "n = 10", input: "10" }], parse: (s) => parseN(s, 1, 12), lines: climbLines,
    table: { id: "tbl-4", preset: 0, rows: ["w1", "w2", "w3", "w4", "w5"] },
    trace(n) {
      const Tr = new G.Trace();
      if (n <= 2) { Tr.add({ at: "tbase", state: row("ways", [null, 1, 2].slice(0, n + 1)), vars: { n }, say: `n ≤ 2: the answer is n.` }); return Tr.done(n); }
      const ways = Array(n + 1).fill(null);
      ways[1] = 1; ways[2] = 2;
      const st = (mk) => ({ rows: [row("ways", ways, mk)], indices: true });
      Tr.add({ key: "w1", at: "tbase", state: st({ 1: "answer" }), vars: {}, say: "ways[1] = 1: one step." });
      Tr.add({ key: "w2", at: "tbase", state: st({ 2: "answer" }), vars: {}, say: "ways[2] = 2: 1+1 or 2." });
      for (let i = 3; i <= n; i++) {
        ways[i] = ways[i - 1] + ways[i - 2];
        Tr.add({ key: "w" + i, at: "fill", state: st({ [i]: "focus", [i - 1]: "anchor", [i - 2]: "anchor" }), vars: { i, "ways[i]": ways[i] }, say: `The last move into step ${i} is 1 or 2 stairs: ways[${i}] = ways[${i - 1}] + ways[${i - 2}] = ${ways[i - 1]} + ${ways[i - 2]} = ${ways[i]}.` });
      }
      Tr.add({ state: st({ [n]: "answer" }), vars: { answer: ways[n] }, say: `Answer ways[${n}] = ${ways[n]}. Each cell needs only the two before it…` });
      return Tr.done(ways[n]);
    },
  };
  A.climbRoll = {
    title: "Climbing Stairs: from exponential recursion to two variables", short: "Two variables", viz: "array", legend: ["anchor:prev2", "p1:prev1"],
    inputLabel: "n (stairs)", hint: "5", presets: [{ label: "n = 5", input: "5" }, { label: "n = 45", input: "45" }], parse: (s) => parseN(s, 1, 45), lines: climbLines,
    trace(n) {
      const Tr = new G.Trace();
      if (n <= 2) { Tr.add({ at: "roll", state: { rows: [row("answer", [n])] }, vars: { n }, say: `n ≤ 2: the answer is n.` }); return Tr.done(n); }
      let prev2 = 1, prev1 = 2;
      const st = (i) => ({ rows: [{ label: "", cells: [{ id: "a", v: prev2, m: "anchor" }, { id: "b", v: prev1, m: "p1" }], ptrs: [{ name: `ways[${i - 2}]`, at: 0, role: "anchor" }, { name: `ways[${i - 1}]`, at: 1, role: "p1" }] }] });
      Tr.add({ at: "roll", state: st(3), vars: { prev2, prev1 }, say: "Keep only the last two values: prev2 = ways[1] = 1, prev1 = ways[2] = 2." });
      for (let i = 3; i <= n; i++) { [prev2, prev1] = [prev1, prev1 + prev2]; if (i <= 8 || i === n) Tr.add({ at: "roll", state: st(i + 1), vars: { i, prev1 }, say: `Step ${i}: slide the window. ways[${i}] = ${prev1}.` }); }
      Tr.add({ state: st(n + 1), vars: { answer: prev1 }, say: `Answer ${prev1}, with O(1) memory.` });
      return Tr.done(prev1);
    },
  };

  /* ---------- Problem 2: house robber ---------- */
  A.rob = {
    title: "House Robber: rob this house on top of best[i−2], or skip it",
    viz: "array", legend: ["focus:this house", "anchor:best[i−2] and best[i−1]", "answer:robbed in the best plan"],
    inputLabel: "money in each house", hint: "2 7 9 3 1",
    presets: [{ label: "[2,7,9,3,1]", input: "2 7 9 3 1" }, { label: "[1,2,3,1]", input: "1 2 3 1" }, { label: "[2,1,1,2]", input: "2 1 1 2" }],
    parse: (s) => P.nums(s, { allowEmpty: true, maxLen: 10, min: 0, max: 99 }),
    lines: { loop: { ts: "const newBest = Math.max(take, skip + money);", go: "newBest := max(take, skip+money)" }, ret: { ts: "rob(nums: number[])>>return take;", go: "func rob>>return take" } },
    table: { id: "tbl-5", preset: 0, rows: ["h0", "h1", "h2", "h3", "h4", "h5"] },
    trace(nums) {
      const Tr = new G.Trace();
      const best = [0];
      const st = (i, picked) => ({ rows: [row("money", nums, Object.assign({}, i != null ? { [i]: "focus" } : {}, picked || {})), row("best", best, i != null ? { [i]: "anchor", [i + 1]: "focus", ...(i >= 1 ? { [i - 1]: "anchor" } : {}) } : {})] });
      Tr.add({ key: "h0", at: "loop", state: st(null), vars: { skip: 0, take: 0 }, say: "best[i] = the most money from the first i houses. best[0] = 0 (no houses)." });
      let skip = 0, take = 0;
      nums.forEach((m, i) => {
        const nb = Math.max(take, skip + m);
        const robbed = skip + m > take;
        best.push(nb);
        Tr.add({ key: "h" + (i + 1), at: "loop", state: st(i), vars: { "skip (best[i−1])": take, "rob (best[i−2] + money)": skip + m, best: nb }, say: robbed ? `House ${i} (${m}): robbing it gives ${skip} + ${m} = ${skip + m}, more than skipping (${take}). best = ${nb}.` : `House ${i} (${m}): skipping keeps ${take} ≥ ${skip} + ${m} = ${skip + m}. best = ${nb}.`, ask: { q: `House ${i} has ${m}. Skip it (keep ${take}) or rob it (${skip} + ${m})?`, options: ["Rob it", "Skip it"], answer: robbed ? 0 : 1, why: "Take the larger of the two." } });
        skip = take; take = nb;
      });
      // walk back to show which houses the best plan robs
      const picked = {};
      for (let i = nums.length; i >= 1;) { if (best[i] === best[i - 1]) i--; else { picked[i - 1] = "answer"; i -= 2; } }
      Tr.add({ at: "ret", state: st(null, picked), vars: { answer: take }, say: `Answer ${take}. Walking back through best shows one plan: houses ${Object.keys(picked).reverse().join(", ") || "none"}. O(n) time, O(1) memory with two variables.` });
      return Tr.done(take);
    },
  };

  /* ---------- Problem 3: coin change ---------- */
  A.coinChange = {
    title: "Coin Change: fewest coins, and number of combinations", short: "Fewest coins",
    viz: "array", legend: ["focus:amount being filled", "anchor:amount − coin it builds on", "answer:the answer"],
    inputLabel: "coins ; amount", hint: "1 3 4 ; 6",
    presets: [{ label: "[1,3,4] ; 6 (greedy fails)", input: "1 3 4 ; 6" }, { label: "[1,2,5] ; 11", input: "1 2 5 ; 11" }, { label: "[2] ; 3", input: "2 ; 3" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'coins, then ";" and the amount'); const coins = P.nums(a, { minLen: 1, maxLen: 5, min: 1, max: 20 }); const amount = P.num(b, "amount"); if (!Number.isInteger(amount) || amount < 0 || amount > 14) throw new Error("amount 0..14 so the row fits."); return { coins, amount }; },
    lines: { base: { ts: "fewest[0] = 0; // zero coins make amount 0", go: "fewest := make([]int, amount+1)" }, relax: { ts: "if (coin <= a && fewest[a - coin] + 1 < fewest[a]) fewest[a] = fewest[a - coin] + 1;", go: "fewest[a] = fewest[a-coin] + 1" }, ret: { ts: "return fewest[amount] === Infinity ? -1 : fewest[amount];", go: "if fewest[amount] >= unreachable {" } },
    table: { id: "tbl-6", preset: 0, rows: ["a0", "a1", "a2", "a3", "a4", "a5", "a6"] },
    trace({ coins, amount }) {
      const Tr = new G.Trace();
      const f = Array(amount + 1).fill(Infinity);
      f[0] = 0;
      const st = (a, from) => ({ rows: [row("fewest", f, Object.assign({}, a != null ? { [a]: "focus" } : {}, ...(from || []).map((x) => ({ [x]: "anchor" }))))], indices: true });
      Tr.add({ key: "a0", at: "base", state: st(0), vars: {}, say: "fewest[a] = the fewest coins that make amount a. fewest[0] = 0; the rest start at ∞ (not reachable yet)." });
      for (let a = 1; a <= amount; a++) {
        const opts = [];
        for (const c of coins) if (c <= a) { opts.push(`coin ${c}: 1 + f[${a - c}] = ${show(f[a - c] + 1)}`); if (f[a - c] + 1 < f[a]) f[a] = f[a - c] + 1; }
        Tr.add({ key: "a" + a, at: "relax", state: st(a, coins.filter((c) => c <= a).map((c) => a - c)), vars: { a, "fewest[a]": show(f[a]) }, say: opts.length ? `Amount ${a}: the last coin is one of the coins. ${opts.join("; ")}. Best: ${show(f[a])}.` : `Amount ${a}: every coin is too big. Unreachable.` });
      }
      const res = f[amount] === Infinity ? -1 : f[amount];
      Tr.add({ at: "ret", state: st(null, []), vars: { answer: res }, say: res === -1 ? `Amount ${amount} is unreachable: −1.` : `Answer fewest[${amount}] = ${res}. O(amount × coins).` });
      return Tr.done(res);
    },
  };
  A.change = {
    title: "Coin Change: fewest coins, and number of combinations", short: "Count combinations",
    viz: "array", legend: ["focus:amount being updated", "anchor:amount − coin"],
    inputLabel: "coins ; amount", hint: "1 2 5 ; 5",
    presets: [{ label: "[1,2,5] ; 5", input: "1 2 5 ; 5" }, { label: "[2] ; 3", input: "2 ; 3" }],
    parse: (s) => A.coinChange.parse(s),
    lines: { base: { ts: "ways[0] = 1; // one way to make 0: use no coins", go: "ways[0] = 1 // one way to make 0: use no coins" }, add: { ts: "for (let a = coin; a <= amount; a++) ways[a] += ways[a - coin];", go: "ways[a] += ways[a-coin]" }, ret: { ts: "return ways[amount];", go: "return ways[amount]" } },
    trace({ coins, amount }) {
      const Tr = new G.Trace();
      const w = Array(amount + 1).fill(0);
      w[0] = 1;
      const used = [];
      const st = (a, from) => ({ rows: [row(`coins ${used.join(",") || "–"}`, w, Object.assign({}, a != null ? { [a]: "focus" } : {}, from != null ? { [from]: "anchor" } : {}))], indices: true, labelW: 110 });
      Tr.add({ at: "base", state: st(0), vars: {}, say: "ways[0] = 1 (use no coins). Coins go in the OUTER loop, so each combination is built in one fixed coin order and counted once." });
      for (const c of coins) {
        used.push(c);
        for (let a = c; a <= amount; a++) { w[a] += w[a - c]; if (amount <= 8 || a === amount) Tr.add({ at: "add", state: st(a, a - c), vars: { coin: c, a, "ways[a]": w[a] }, say: `With coin ${c} allowed: ways[${a}] += ways[${a - c}] → ${w[a]}.` }); }
      }
      Tr.add({ at: "ret", state: st(amount), vars: { answer: w[amount] }, say: `${w[amount]} combination${w[amount] === 1 ? "" : "s"}. With amounts in the outer loop instead, you would count orderings (permutations).` });
      return Tr.done(w[amount]);
    },
  };

  /* ---------- Problem 4: LIS ---------- */
  A.lisQuad = {
    title: "Longest Increasing Subsequence: O(n²) table, then O(n log n) tails", short: "len[i] table, O(n²)",
    viz: "array", legend: ["focus:i", "anchor:an earlier smaller value it can extend", "answer:the best length"],
    inputLabel: "numbers", hint: "10 9 2 5 3 7 101 18",
    presets: [{ label: "[10,9,2,5,3,7,101,18]", input: "10 9 2 5 3 7 101 18" }, { label: "[0,1,0,3,2,3]", input: "0 1 0 3 2 3" }, { label: "[7,7,7,7]", input: "7 7 7 7" }],
    parse: (s) => P.nums(s, { allowEmpty: true, maxLen: 10, min: -99, max: 999 }),
    lines: { ext: { ts: "if (nums[j] < nums[i]) len[i] = Math.max(len[i], len[j] + 1);", go: "length[i] = max(length[i], length[j]+1)" }, best: { ts: "lengthOfLISQuadratic>>best = Math.max(best, len[i]);", go: "best = max(best, length[i])" } },
    table: { id: "tbl-8", preset: 0, rows: ["i0", "i1", "i2", "i3", "i4", "i5", "i6", "i7"] },
    trace(nums) {
      const Tr = new G.Trace();
      const len = nums.map(() => null);
      let best = 0;
      for (let i = 0; i < nums.length; i++) {
        len[i] = 1;
        const from = {};
        for (let j = 0; j < i; j++) if (nums[j] < nums[i]) { from[j] = "anchor"; len[i] = Math.max(len[i], len[j] + 1); }
        best = Math.max(best, len[i]);
        Tr.add({ key: "i" + i, at: "ext", state: { rows: [row("nums", nums, Object.assign({ [i]: "focus" }, from)), row("len", len, { [i]: "focus" })] }, vars: { i, "len[i]": len[i], best }, say: Object.keys(from).length ? `${nums[i]} can follow ${Object.keys(from).map((j) => `${nums[j]} (len ${len[j]})`).join(", ")}. Take the longest + 1: len = ${len[i]}.` : `No earlier value is smaller than ${nums[i]}: len = 1.` });
      }
      Tr.add({ at: "best", state: { rows: [row("nums", nums), row("len", len, Object.fromEntries(len.map((l, k) => [k, l === best ? "answer" : null])))] }, vars: { answer: best }, say: `The best can end anywhere: take the max of len, ${best}. O(n²).` });
      return Tr.done(best);
    },
  };
  A.lisTails = {
    title: "Longest Increasing Subsequence: O(n²) table, then O(n log n) tails", short: "tails + binary search",
    viz: "array", legend: ["focus:where x goes (lower bound)", "answer:appended: a longer subsequence"],
    inputLabel: "numbers", hint: "10 9 2 5 3 7 101 18",
    presets: [{ label: "[10,9,2,5,3,7,101,18]", input: "10 9 2 5 3 7 101 18" }, { label: "[0,1,0,3,2,3]", input: "0 1 0 3 2 3" }],
    parse: (s) => P.nums(s, { allowEmpty: true, maxLen: 10, min: -99, max: 999 }),
    lines: { place: { ts: "tails[lo] = x; // replaces a larger tail, or appends when lo === tails.length", go: "tails[pos] = x // a smaller end for an existing length" }, app: { ts: "tails[lo] = x; // replaces a larger tail, or appends when lo === tails.length", go: "tails = append(tails, x) // a longer subsequence now exists" }, ret: { ts: "return tails.length;", go: "return len(tails)" } },
    table: { id: "tbl-9", preset: 0, rows: ["x0", "x1", "x2", "x3", "x4", "x5", "x6", "x7"] },
    trace(nums) {
      const Tr = new G.Trace();
      const tails = [];
      nums.forEach((x, k) => {
        let lo = 0, hi = tails.length;
        while (lo < hi) { const mid = lo + ((hi - lo) >> 1); if (tails[mid] >= x) hi = mid; else lo = mid + 1; }
        const app = lo === tails.length;
        const old = tails[lo];
        tails[lo] = x;
        Tr.add({ key: "x" + k, at: app ? "app" : "place", state: { rows: [row("nums", nums, { [k]: "focus" }), row("tails", tails, { [lo]: app ? "answer" : "focus" })] }, vars: { x, position: lo, length: tails.length }, say: app ? `${x} is bigger than every tail: append. An increasing subsequence of length ${tails.length} now exists.` : `${x} replaces ${old} at position ${lo}: a length-${lo + 1} subsequence can now end lower, which leaves more room later.` });
      });
      Tr.add({ at: "ret", state: { rows: [row("nums", nums), row("tails", tails)] }, vars: { answer: tails.length }, say: `Length ${tails.length}. tails itself is not necessarily a real subsequence; only its length is the answer. O(n log n).` });
      return Tr.done(tails.length);
    },
  };

  /* ---------- Problem 5: word break ---------- */
  A.wordBreak = {
    title: "Word Break: can[i] = some word ends at i after a splittable prefix",
    viz: "array", legend: ["focus:i", "p1:the last word tried", "answer:can[i] is true"],
    inputLabel: "string ; words", hint: "leetcode ; leet code",
    presets: [{ label: "leetcode", input: "leetcode ; leet code" }, { label: "applepenapple", input: "applepenapple ; apple pen" }, { label: "catsandog", input: "catsandog ; cats dog sand and cat" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'the string, then ";" and the words'); const str = a.trim(); if (!/^[a-z]{0,14}$/.test(str)) throw new Error("Up to 14 lowercase letters."); const words = b.trim().split(/\s+/).filter(Boolean); if (!words.length || words.length > 6 || words.some((w) => !/^[a-z]{1,8}$/.test(w))) throw new Error("1 to 6 lowercase words."); return { s: str, words }; },
    lines: { base: { ts: "can[0] = true; // the empty prefix is splittable", go: "can[0] = true // the empty prefix is splittable" }, found: { ts: "can[i] = true; // found one valid last word", go: "can[i] = true // found one valid last word" }, none: { ts: "for (let j = Math.max(0, i - maxLen); j < i; j++) {", go: "for j := max(0, i-maxLen); j < i; j++ {" }, ret: { ts: "return can[s.length];", go: "return can[len(s)]" } },
    table: { id: "tbl-10", preset: 0, rows: ["c0", "c1", "c4", "c5", "c8"] },
    trace({ s, words }) {
      const Tr = new G.Trace();
      const W = new Set(words);
      const maxLen = Math.max(0, ...words.map((w) => w.length));
      const can = Array(s.length + 1).fill(false);
      can[0] = true;
      const keyOf = (i) => (i === 0 ? "c0" : i < 4 ? "c1" : i === 4 ? "c4" : i < 8 ? "c5" : "c" + i);
      const st = (i, j) => ({ cellW: 34, gap: 4, rows: [{ label: "s", cells: s.split("").map((c, k) => ({ id: "s" + k, v: c, m: j != null && k >= j && k < i ? "p1" : null })) }, row("can", can.map((b) => (b ? "T" : "F")), Object.assign(Object.fromEntries(can.map((b, k) => [k, b ? "answer" : null])), i != null ? { [i]: "focus" } : {}))] });
      Tr.add({ key: "c0", at: "base", state: st(null), vars: {}, say: "can[i] means: the first i letters split into dictionary words. can[0] = true (the empty prefix)." });
      for (let i = 1; i <= s.length; i++) {
        let hit = null;
        for (let j = Math.max(0, i - maxLen); j < i; j++) if (can[j] && W.has(s.slice(j, i))) { hit = j; can[i] = true; break; }
        Tr.add({ key: keyOf(i), at: hit != null ? "found" : "none", state: st(i, hit), vars: { i, prefix: `"${s.slice(0, i)}"`, "can[i]": can[i] }, say: hit != null ? `"${s.slice(hit, i)}" is a word and can[${hit}] is true: can[${i}] = true.` : `No split j makes can[j] true with s[j..${i}) a word: can[${i}] = false.` });
      }
      Tr.add({ at: "ret", state: st(null), vars: { answer: can[s.length] }, say: `Answer can[${s.length}] = ${can[s.length]}. O(n × maxLen) checks.` });
      return Tr.done(can[s.length]);
    },
  };

  /* ---------- Problem 6: maximum subarray and product ---------- */
  A.kadane = {
    title: "Maximum Subarray and Product: extend or start fresh", short: "Max sum (Kadane)",
    viz: "array", legend: ["focus:x", "p1:the best subarray ending here", "answer:the best so far"],
    inputLabel: "numbers", hint: "-2 1 -3 4 -1 2 1 -5 4",
    presets: [{ label: "the LeetCode example", input: "-2 1 -3 4 -1 2 1 -5 4" }, { label: "all negative", input: "-3 -1 -2" }],
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 10, min: -99, max: 99 }),
    lines: { init: { ts: "let endingHere = nums[0];", go: "endingHere, best := nums[0], nums[0]" }, step: { ts: "endingHere = Math.max(nums[i], endingHere + nums[i]); // extend, or start fresh", go: "endingHere = max(x, endingHere+x) // extend, or start fresh" }, best: { ts: "maxSubArray>>best = Math.max(best, endingHere);", go: "best = max(best, endingHere)" } },
    table: { id: "tbl-11", preset: 0, rows: ["x0", "x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8"] },
    trace(nums) {
      const Tr = new G.Trace();
      let eh = nums[0], best = nums[0], start = 0, bs = 0, be = 0;
      const st = (i) => ({ rows: [{ label: "nums", cells: nums.map((v, k) => ({ id: "n" + k, v, m: k === i ? "focus" : k >= start && k <= i ? "p1" : null })), zones: [{ from: bs, to: be, label: `best ${best}`, cls: "1" }] }] });
      Tr.add({ key: "x0", at: "init", state: st(0), vars: { endingHere: eh, best }, say: `Start: the best subarray ending at index 0 is just ${nums[0]}.` });
      for (let i = 1; i < nums.length; i++) {
        const x = nums[i], ext = eh + x;
        if (x > ext) start = i;
        eh = Math.max(x, ext);
        if (eh > best) { best = eh; bs = start; be = i; }
        Tr.add({ key: "x" + i, at: "step", state: st(i), vars: { x, endingHere: eh, best }, say: x > ext ? `Extending gives ${ext}, worse than ${x} alone: start fresh at ${x}.` : `Extend: ${ext - x} + ${x} = ${ext}.${eh === best && be === i ? " A new best." : ""}`, ask: { q: `The best sum ending just before is ${ext - x}. Now x = ${x}. Extend or start fresh?`, options: ["Extend", "Start fresh"], answer: x > ext ? 1 : 0, why: `Compare ${ext - x} + ${x} = ${ext} with ${x} alone.` } });
      }
      Tr.add({ at: "best", state: st(-1), vars: { answer: best }, say: `Answer ${best}. One pass, O(1) memory.` });
      return Tr.done(best);
    },
  };
  A.maxProd = {
    title: "Maximum Subarray and Product: extend or start fresh", short: "Max product",
    viz: "array", legend: ["focus:x", "p1:curMax", "p2:curMin"],
    inputLabel: "numbers", hint: "2 3 -2 4",
    presets: [{ label: "[2,3,-2,4]", input: "2 3 -2 4" }, { label: "[-2,3,-4]", input: "-2 3 -4" }, { label: "[-2,0,-1]", input: "-2 0 -1" }],
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 10, min: -9, max: 9 }),
    lines: { flip: { ts: "if (x < 0) [curMax, curMin] = [curMin, curMax];", go: "curMax, curMin = curMin, curMax // a negative flips big and small" }, step: { ts: "curMax = Math.max(x, curMax * x);", go: "curMax = max(x, curMax*x)" }, best: { ts: "maxProduct>>best = Math.max(best, curMax);", go: "best = max(best, curMax)" } },
    trace(nums) {
      const Tr = new G.Trace();
      let cmax = nums[0], cmin = nums[0], best = nums[0];
      const st = (i) => ({ rows: [row("nums", nums, { [i]: "focus" }), { label: "", cells: [{ id: "mx", v: cmax, m: "p1" }, { id: "mn", v: cmin, m: "p2" }, { id: "bs", v: best, m: "answer" }], ptrs: [{ name: "curMax", at: 0, role: "p1" }, { name: "curMin", at: 1, role: "p2" }, { name: "best", at: 2, role: "focus" }] }] });
      Tr.add({ at: "step", state: st(0), vars: { curMax: cmax, curMin: cmin, best }, say: "Track both the largest and the smallest product ending here: a negative number can turn the smallest into the largest." });
      for (let i = 1; i < nums.length; i++) {
        const x = nums[i];
        if (x < 0) { [cmax, cmin] = [cmin, cmax]; Tr.add({ at: "flip", state: st(i), vars: { x }, say: `x = ${x} is negative: swap curMax and curMin before multiplying.` }); }
        cmax = Math.max(x, cmax * x); cmin = Math.min(x, cmin * x); best = Math.max(best, cmax);
        Tr.add({ at: "step", state: st(i), vars: { x, curMax: cmax, curMin: cmin, best }, say: `curMax = max(${x}, previous × ${x}) = ${cmax}; curMin = ${cmin}. best = ${best}.` });
      }
      Tr.add({ at: "best", state: st(nums.length - 1), vars: { answer: best }, say: `Answer ${best}.` });
      return Tr.done(best);
    },
  };

  G.quizzes.dp25 = {
    title: "One-dimensional DP",
    items: [
      { q: "What is the first thing to write down for a DP solution?", options: ["What dp[i] means, in one sentence", "The loop", "The base case", "The complexity"], answer: 0, why: "Every other step follows from the state sentence." },
      { q: "Base case for \"number of ways to make amount 0\"?", options: ["1", "0", "∞", "−1"], answer: 0, why: "Exactly one way: use no coins." },
      { q: "Coin Change II puts coins in the outer loop. Amounts outside instead would count…", options: ["permutations (orders) instead of combinations", "the fewest coins", "the same thing", "only one coin type"], answer: 0, why: "1+2 and 2+1 would be counted separately." },
      { q: "LIS: why take the max over all len[i] instead of len[n−1]?", options: ["The best subsequence can end anywhere", "len[n−1] is always 1", "To handle duplicates", "For speed"], answer: 0, why: "The last element may not be in the best subsequence." },
      { q: "Maximum product subarray tracks curMin because…", options: ["a negative x turns the smallest product into the largest", "zero resets everything", "it is needed for the sum", "to detect overflow"], answer: 0, why: "(−6) × (−4) = 24." },
    ],
  };
})();

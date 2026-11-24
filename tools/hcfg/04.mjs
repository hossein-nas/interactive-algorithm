export const added = "added-04.md";
export const expose = "(globalThis as any).MyHashSet = MyHashSet; (globalThis as any).LRUCache = LRUCache;\n";
export function specs({ A, R, rnd, arr, sorted }) {
  const P = (k) => (s) => A[k].parse(s);
  const word = (n, abc) => Array.from({ length: n }, () => abc[rnd(0, abc.length - 1)]).join("");
  return {
    hashSet: { gen: () => Array.from({ length: rnd(1, 14) }, () => `${["add", "add", "remove", "contains"][rnd(0, 3)]} ${rnd(-12, 30)}`).join(", "), want: (s) => { const h = new R.MyHashSet(); P("hashSet")(s).forEach(({ op, v: [k] }) => (op === "add" ? h.add(k) : op === "remove" ? h.remove(k) : h.contains(k))); return h.buckets; } },
    frequencyOf: { gen: () => Array.from({ length: rnd(1, 10) }, () => "abc"[rnd(0, 2)]).join(" "), want: (s) => [...R.frequencyOf(P("frequencyOf")(s)).entries()] },
    hasDuplicate: { gen: () => arr(rnd(1, 10), 0, 12).join(" "), want: (s) => R.hasDuplicate(P("hasDuplicate")(s)), askNext: [null, ["add"]] },
    twoSum: { gen: () => { const a = arr(rnd(1, 10), -20, 20); return `${a.join(" ")} ; ${rnd(0, 1) && a.length > 1 ? a[rnd(0, a.length - 1)] + a[rnd(0, a.length - 1)] : rnd(-40, 40)}`; }, want: (s) => { const { nums, target } = P("twoSum")(s); return R.twoSum(nums, target); }, askNext: [["found"], ["store"]] },
    isAnagram: { gen: () => `${word(rnd(0, 8), "abc")} ; ${word(rnd(0, 8), "abc")}`, want: (s) => { const { s: a, t } = P("isAnagram")(s); return R.isAnagram(a, t); } },
    groupAnagrams: { gen: () => Array.from({ length: rnd(1, 8) }, () => word(rnd(1, 4), "abt")).join(" "), want: (s) => R.groupAnagrams(P("groupAnagrams")(s)), askNext: [["push"], ["set"]] },
    intersection: { gen: () => `${arr(rnd(1, 8), 0, 8).join(" ")} ; ${arr(rnd(1, 8), 0, 8).join(" ")}`, want: (s) => { const { a, b } = P("intersection")(s); return R.intersection(a, b); }, askNext: [["push"], null] },
    longestConsecutive: { gen: () => arr(rnd(0, 12), -5, 15).join(" ") || "[]", want: (s) => R.longestConsecutive(P("longestConsecutive")(s)), askNext: [["skip"], ["start"]] },
    lruCache: { gen: () => `${rnd(1, 4)} ; ` + Array.from({ length: rnd(1, 14) }, () => (rnd(0, 1) ? `put ${rnd(1, 6)} ${rnd(0, 99)}` : `get ${rnd(1, 6)}`)).join(", "), want: (s) => { const { cap, ops } = P("lruCache")(s); const c = new R.LRUCache(cap); ops.forEach((o) => (o.op === "put" ? c.put(o.v[0], o.v[1]) : c.get(o.v[0]))); return [...c.store.keys()].reverse(); }, askNext: [["full"], null] },
    firstUnique: { gen: () => word(rnd(1, 14), "abcd"), want: (s) => R.firstUniqueChar(s.trim()) },
    isomorphic: { gen: () => `${word(rnd(1, 8), "abc")} ; ${word(rnd(1, 8), "xyz")}`, want: (s) => { const { s: a, t } = P("isomorphic")(s); return R.isIsomorphic(a, t); } },
  };
}

export const expose = "(globalThis as any).Trie = Trie; (globalThis as any).WordDictionary = WordDictionary;\n";
export function specs({ A, R, rnd }) {
  const word = (alpha, lo, hi) => Array.from({ length: rnd(lo, hi) }, () => alpha[rnd(0, alpha.length - 1)]).join("");
  const words = (n, alpha, lo, hi) => Array.from({ length: n }, () => word(alpha, lo, hi));
  return {
    trieOps: { gen: () => `${words(rnd(1, 7), "abt", 1, 4).join(" ")} ; ${Array.from({ length: rnd(1, 6) }, () => word("abt", 1, 4) + (rnd(0, 1) ? "*" : "")).join(" ")}`,
      want: (s) => { const { words, queries } = A.trieOps.parse(s); const t = new R.Trie(); words.forEach((w) => t.insert(w)); return queries.map((q) => (q.endsWith("*") ? t.startsWith(q.slice(0, -1)) : t.search(q))); }, askNext: { 0: ["search"], 1: ["search"] } },
    lcp: { gen: () => { const p = word("ab", 0, 3); return Array.from({ length: rnd(1, 5) }, () => p + word("abc", rnd(0, 1) ? 0 : 1, 3)).filter(Boolean).join(" ") || "a"; }, want: (s) => R.longestCommonPrefixTrie(A.lcp.parse(s)) },
    replaceWords: { gen: () => `${words(rnd(1, 5), "abc", 1, 3).join(" ")} ; ${words(rnd(1, 7), "abc", 1, 6).join(" ")}`, want: (s) => { const { roots, words } = A.replaceWords.parse(s); return R.replaceWords(roots, words.join(" ")); } },
    wildcard: { gen: () => `${words(rnd(1, 6), "abc", 1, 3).join(" ")} ; ${words(rnd(1, 5), "abc..", 1, 3).join(" ")}`, want: (s) => { const { words, pats } = A.wildcard.parse(s); const d = new R.WordDictionary(); words.forEach((w) => d.addWord(w)); return pats.map((p) => d.search(p)); } },
    wordSearch2: { gen: () => { const r = rnd(1, 4), c = rnd(1, 4); return `${Array.from({ length: r }, () => word("abcd", c, c)).join(" | ")} ; ${words(rnd(1, 5), "abcd", 1, 5).join(" ")}`; }, want: (s) => { const { board, words } = A.wordSearch2.parse(s); return R.findWords(board.map((r) => r.slice()), words); } },
  };
}

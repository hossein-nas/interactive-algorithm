export const added = "added-06.md";
export function specs({ A, R, rnd, arr }) {
  const P = (k) => (s) => A[k].parse(s);
  const word = (n, abc) => Array.from({ length: n }, () => abc[rnd(0, abc.length - 1)]).join("");
  return {
    fixedWindow: { gen: () => `${arr(rnd(1, 12), -20, 20).join(" ")} ; ${rnd(1, 13)}`, want: (s) => { const { nums, k } = P("fixedWindow")(s); return R.bestSumOfSizeK(nums, k); } },
    varWindow: { gen: () => `${arr(rnd(1, 12), 0, 1).join(" ")} ; ${rnd(0, 3)}`, want: (s) => { const { bits, limit } = P("varWindow")(s); return R.longestWithAtMostZeros(bits, limit); }, askNext: [["shrink"], ["best"]] },
    longestNoRepeat: { gen: () => word(rnd(1, 14), "abcd"), want: (s) => R.lengthOfLongestSubstring(s), askNext: [["jump", "set"], ["jump"]] },
    minSubArray: { gen: () => `${rnd(1, 40)} ; ${arr(rnd(1, 12), 1, 9).join(" ")}`, want: (s) => { const { target, nums } = P("minSubArray")(s); return R.minSubArrayLen(target, nums); }, askNext: [["rec"], ["add", "ret"]] },
    kDistinct: { gen: () => `${word(rnd(1, 14), "abcd")} ; ${rnd(0, 4)}`, want: (s) => { const { s: x, k } = P("kDistinct")(s); return R.lengthOfLongestSubstringKDistinct(x, k); }, askNext: [["del", "dec"], ["best"]] },
    charReplace: { gen: () => `${word(rnd(1, 14), "ABC")} ; ${rnd(0, 3)}`, want: (s) => { const { s: x, k } = P("charReplace")(s); return R.characterReplacement(x, k); }, askNext: [["shrink"], ["best"]] },
    minWindow: { gen: () => `${word(rnd(1, 16), "ABCD")} ; ${word(rnd(1, 4), "ABC")}`, want: (s) => { const { s: x, t } = P("minWindow")(s); return R.minWindow(x, t); }, askNext: [["rec"], null] },
    permInString: { gen: () => `${word(rnd(1, 4), "abc")} ; ${word(rnd(1, 14), "abc")}`, want: (s) => { const { t, s: x } = P("permInString")(s); return R.checkInclusion(t, x); } },
    countBelow: { gen: () => `${arr(rnd(1, 10), 1, 9).join(" ")} ; ${rnd(1, 30)}`, want: (s) => { const { nums, k } = P("countBelow")(s); return R.countSubarraysBelow(nums, k); } },
  };
}
export function extra({ A, R, check }) {
  const bugRes = (key, i) => { const s = A[key], b = s.bugs[i]; return b.trace((b.parse || s.parse)(b.input)).result; };
  check(bugRes("longestNoRepeat", 0) !== R.lengthOfLongestSubstring("abba"), "abba bug shows no wrong answer");
  check(bugRes("kDistinct", 0) !== R.lengthOfLongestSubstringKDistinct("abaccc", 2), "keys-at-zero bug shows no wrong answer");
  check(bugRes("minSubArray", 0) === 3, "negative-number replay should give the window's answer 3 (true answer 2)");
}

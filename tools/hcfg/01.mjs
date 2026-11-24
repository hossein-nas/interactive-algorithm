export function specs({ A, R, rnd, arr }) {
  const gen = () => { const a = arr(rnd(1, 10), -20, 20); const t = rnd(0, 1) && a.length > 1 ? a[rnd(0, a.length - 1)] + a[rnd(0, a.length - 1)] : rnd(-40, 40); return `${a.join(" ")} ; ${t}`; };
  const parse = (s) => A.twoSumThink.parse(s);
  return {
    twoSumThink: { gen, want: (s) => { const { nums, target } = parse(s); return R.twoSumDemo(nums, target); }, askNext: [["found"], ["store"]] },
    twoSumBrute: { gen, ok: (s, r) => { const { nums, target } = parse(s); const ref = R.twoSumDemo(nums, target); return r.length === 0 ? ref.length === 0 : r[0] < r[1] && nums[r[0]] + nums[r[1]] === target; } },
  };
}

export function specs({ A, R, rnd, arr }) {
  return {
    schedule: { gen: () => Array.from({ length: rnd(1, 8) }, () => { const a = rnd(0, 12); return `${a}-${a + rnd(1, 5)}`; }).join(" "), want: (s) => R.maxNonOverlapping(A.schedule.parse(s)), askNext: { 0: ["take"], 1: ["skip"] } },
    canJump: { gen: () => arr(rnd(1, 10), 0, 3).join(" "), want: (s) => R.canJump(A.canJump.parse(s)) },
    jump2: { gen: () => { for (;;) { const a = arr(rnd(1, 10), 0, 4); try { A.jump2.parse(a.join(" ")); return a.join(" "); } catch (e) {} } }, want: (s) => R.jump(A.jump2.parse(s)) },
    gas: { gen: () => { const n = rnd(1, 8); return `${arr(n, 0, 6).join(" ")} ; ${arr(n, 0, 6).join(" ")}`; }, want: (s) => { const x = A.gas.parse(s); return R.canCompleteCircuit(x.gas, x.cost); } },
    partition: { gen: () => Array.from({ length: rnd(1, 24) }, () => "abcdefg"[rnd(0, 6)]).join(""), want: (s) => R.partitionLabels(A.partition.parse(s)) },
    tasks: { gen: () => `${Array.from({ length: rnd(1, 16) }, () => "ABCD"[rnd(0, 3)]).join("")} ; ${rnd(0, 5)}`, want: (s) => { const x = A.tasks.parse(s); return R.leastInterval(x.tasks, x.n); } },
    setCover: { gen: () => { const U = ["a", "b", "c", "d", "e", "f"].slice(0, rnd(1, 6)); const sets = Array.from({ length: rnd(1, 5) }, (_, i) => `S${i}: ${U.filter(() => rnd(0, 1)).join(" ")}`); return `${U.join(" ")} ; ${sets.join(" ; ")}`; }, want: (s) => { const x = A.setCover.parse(s); return R.greedySetCover(x.universe, new Map(x.sets.map(([n, it]) => [n, new Set(it)]))); } },
    knapsack: { gen: () => `${Array.from({ length: rnd(1, 4) }, (_, i) => `i${i}:${rnd(1, 6)}:${rnd(1, 50)}`).join(" ")} ; ${rnd(0, 10)}`, want: (s) => { const x = A.knapsack.parse(s); return { greedy: R.greedyByValue(x.items, x.cap), best: R.bestByBruteForce(x.items, x.cap) }; } },
  };
}

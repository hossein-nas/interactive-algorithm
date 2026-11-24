export function specs({ A, R, rnd }) {
  const ivl = (n, lo, hi, maxLen) => Array.from({ length: n }, () => { const a = rnd(lo, hi); return [a, a + rnd(0, maxLen)]; });
  const fmt = (l) => l.map(([a, b]) => `${a}-${b}`).join(" ");
  const disjoint = (n) => { const out = []; let x = rnd(0, 3); for (let i = 0; i < n; i++) { const a = x, b = a + rnd(0, 4); out.push([a, b]); x = b + rnd(1, 3); } return out; };
  return {
    merge: { gen: () => fmt(ivl(rnd(1, 8), 0, 20, 6)), want: (s) => R.mergeIntervals(A.merge.parse(s)), askNext: { 0: ["grow"], 1: ["push"] } },
    insert: { gen: () => { const nw = ivl(1, 0, 25, 8)[0]; return `${fmt(disjoint(rnd(0, 6)))} ; ${nw[0]}-${nw[1]}`; }, want: (s) => { const x = A.insert.parse(s); return R.insertInterval(x.list, x.nw); } },
    intersect: { gen: () => `${fmt(disjoint(rnd(0, 5)))} ; ${fmt(disjoint(rnd(0, 5)))}`, want: (s) => { const x = A.intersect.parse(s); return R.intervalIntersection(x.A, x.B); } },
    arrows: { gen: () => fmt(ivl(rnd(0, 8), 0, 20, 6)), want: (s) => R.findMinArrowShots(A.arrows.parse(s)) },
    attend: { gen: () => fmt(ivl(rnd(1, 6), 0, 20, 6).map(([a, b]) => [a, b + 1])), want: (s) => R.canAttendMeetings(A.attend.parse(s)) },
    sweepRooms: { gen: () => fmt(ivl(rnd(1, 7), 0, 20, 6).map(([a, b]) => [a, b + 1])), want: (s) => R.minMeetingRoomsSweep(A.sweepRooms.parse(s)) },
    skyline: { gen: () => Array.from({ length: rnd(1, 6) }, () => { const l = rnd(0, 15); return `${l}-${l + rnd(1, 8)}-${rnd(1, 9)}`; }).join(" "), want: (s) => R.getSkyline(A.skyline.parse(s)) },
  };
}

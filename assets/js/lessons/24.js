/* Lesson 24 · Intervals — merge, insert, intersect, arrows, the sweep line and the skyline. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  const parseIv = (s, o) => {
    o = o || {};
    const t = String(s).replace(/[\[\]]/g, " ").trim().split(/[\s,]+/).filter(Boolean);
    if (!t.length && !o.allowEmpty) throw new Error("Type intervals like 1-3 2-6.");
    if (t.length > (o.max || 8)) throw new Error(`Up to ${o.max || 8} intervals.`);
    return t.map((x) => { const m = x.match(/^(-?\d+)-(-?\d+)$/); if (!m || +m[1] > +m[2] || (o.strict && +m[1] === +m[2])) throw new Error(`"${x}" should look like 1-3 (start ≤ end).`); if (Math.abs(+m[1]) > 99 || Math.abs(+m[2]) > 99) throw new Error("Keep numbers within ±99."); return [+m[1], +m[2]]; });
  };
  const bounds = (...lists) => { const all = lists.flat(); if (!all.length) return { lo: 0, hi: 10 }; return { lo: Math.min(...all.map((x) => x[0])), hi: Math.max(...all.map((x) => x[1])) }; };
  const ivs = (l) => l.map(([a, b]) => `[${a},${b}]`).join(" ");

  /* ---------- Problem 1: merge ---------- */
  function mergeTrace(input, noMax) {
    const Tr = new G.Trace();
    const items = input.map((iv, i) => ({ id: "in" + i, a: iv[0], b: iv[1] }));
    const { lo, hi } = bounds(input);
    const merged = [];
    let order = items, cur = null;
    const done = new Set();
    const st = (hot, note) => ({ lo, hi, rows: order.map((r) => ({ id: r.id, a: r.a, b: r.b, name: "", m: r.id === cur ? "focus" : done.has(r.id) ? "done" : null })).concat(merged.map((m, k) => ({ id: "out" + k, a: m[0], b: m[1], name: k ? "" : "result", m: k === hot ? (noMax ? "bug" : "answer") : "p1" }))), note: { text: note || `result: ${ivs(merged)}` } });
    if (!input.length) { Tr.add({ at: "sort", state: st(), vars: {}, say: "No intervals: return []." }); return Tr.done([]); }
    order = items.slice().sort((x, y) => x.a - y.a);
    Tr.add({ at: "sort", state: st(null, "sorted by start"), vars: {}, say: "Sort by start. Now any interval that overlaps the current group must come right after it." });
    merged.push([order[0].a, order[0].b]); done.add(order[0].id);
    Tr.add({ key: "m0", at: "first", state: st(0), vars: { first: `[${order[0].a},${order[0].b}]` }, say: `Start the result with a copy of [${order[0].a},${order[0].b}].` });
    for (let i = 1; i < order.length; i++) {
      const r = order[i];
      cur = r.id;
      const last = merged[merged.length - 1];
      const ov = r.a <= last[1];
      Tr.add({ key: "m" + i, at: "ext", state: st(null), vars: { cur: `[${r.a},${r.b}]`, last: `[${last[0]},${last[1]}]` }, say: `[${r.a},${r.b}]: does it start before the last group ends (${r.a} ≤ ${last[1]})?`, ask: { q: `[${r.a},${r.b}] after a group ending at ${last[1]}. What happens?`, options: [`Extend the group's end to max(${last[1]}, ${r.b})`, "Start a new group"], answer: ov ? 0 : 1, why: ov ? `${r.a} ≤ ${last[1]}: they overlap. Use max, in case it is contained.` : `${r.a} > ${last[1]}: there is a gap.` } });
      if (ov) { last[1] = noMax ? r.b : Math.max(last[1], r.b); done.add(r.id); cur = null; Tr.add({ key: "m" + i, at: "grow", state: st(merged.length - 1), vars: { last: `[${last[0]},${last[1]}]` }, say: noMax ? `This version sets the end to ${r.b} without max, so the group shrinks.` : `Overlap: the group's end becomes max(…, ${r.b}) = ${last[1]}.` }); }
      else { merged.push([r.a, r.b]); done.add(r.id); cur = null; Tr.add({ key: "m" + i, at: "push", state: st(merged.length - 1), vars: { groups: merged.length }, say: `Gap: [${r.a},${r.b}] starts a new group.` }); }
    }
    Tr.add({ at: "ret", state: st(null), vars: { result: ivs(merged) }, say: noMax ? `Result ${ivs(merged)}: part of the first interval was lost.` : `Result ${ivs(merged)}. O(n log n) for the sort, then one pass.` });
    return Tr.done(merged);
  }
  A.merge = {
    title: "Merge Intervals: sort by start, then extend or start a group",
    viz: "timeline", legend: ["focus:current interval", "done:absorbed", "p1:result group", "answer:just changed"],
    inputLabel: "intervals start-end", hint: "1-3 2-6 8-10 15-18",
    presets: [{ label: "[[1,3],[2,6],[8,10],[15,18]]", input: "1-3 2-6 8-10 15-18" }, { label: "touching [1,4],[4,5]", input: "1-4 4-5" }, { label: "one contains the rest", input: "1-10 2-3 4-5" }],
    parse: (s) => parseIv(s),
    lines: { sort: { ts: "const sorted = [...intervals].sort((a, b) => a[0] - b[0]); // by start", go: "return sorted[i][0] < sorted[j][0] }) // by start" }, first: { ts: "const merged: number[][] = [[...sorted[0]]];", go: "merged := [][]int{{sorted[0][0], sorted[0][1]}}" }, ext: { ts: "if (start <= last[1]) last[1] = Math.max(last[1], end); // overlap: extend", go: "if iv[0] <= last[1] {" }, grow: { ts: "if (start <= last[1]) last[1] = Math.max(last[1], end); // overlap: extend", go: "last[1] = max(last[1], iv[1]) // overlap: extend" }, push: { ts: "else merged.push([start, end]); // gap: a new group", go: "merged = append(merged, []int{iv[0], iv[1]}) // gap: a new group" }, ret: { ts: "mergeIntervals>>return merged;", go: "func mergeIntervals>>return merged" } },
    table: { id: "tbl-2", preset: 0, rows: ["m0", "m1", "m2", "m3"] },
    trace: (x) => mergeTrace(x, false),
    bugs: [{ label: "Replay the bug: no max when extending", input: "1-10 2-3 4-5", banner: "<b>Replaying a bug.</b> This version writes <code>last[1] = end</code> instead of <code>max(last[1], end)</code>.", trace: (x) => mergeTrace(x, true) }],
  };

  /* ---------- Problem 2: insert ---------- */
  A.insert = {
    title: "Insert Interval: before, overlapping, after",
    viz: "timeline", legend: ["p2:the new interval", "focus:current", "p1:copied to the result", "done:absorbed into the new one"],
    inputLabel: "sorted intervals ; new interval", hint: "1-2 3-5 6-7 8-10 12-16 ; 4-8",
    presets: [{ label: "the LeetCode example", input: "1-2 3-5 6-7 8-10 12-16 ; 4-8" }, { label: "[[1,3],[6,9]] + [2,5]", input: "1-3 6-9 ; 2-5" }, { label: "no overlap", input: "1-5 ; 6-8" }],
    parse(s) {
      const [a, b] = P.parts(s, 2, 'Intervals, then ";" and the new one');
      const list = parseIv(a, { allowEmpty: true }), nw = parseIv(b, { max: 1 });
      if (nw.length !== 1) throw new Error("Give exactly one new interval.");
      for (let i = 1; i < list.length; i++) if (list[i][0] <= list[i - 1][1]) throw new Error("The list must be sorted and non-overlapping.");
      return { list, nw: nw[0] };
    },
    lines: { before: { ts: "while (i < intervals.length && intervals[i][1] < start) result.push(intervals[i++]);", go: "insertInterval>>result = append(result, intervals[i])" }, absorb: { ts: "end = Math.max(end, intervals[i][1]);", go: "end = max(end, intervals[i][1])" }, add: { ts: "result.push([start, end]);", go: "result = append(result, []int{start, end})" }, after: { ts: "while (i < intervals.length) result.push(intervals[i++]);", go: "result = append(result, []int{start, end})>>result = append(result, intervals[i])" } },
    table: { id: "tbl-3", preset: 0, rows: ["i0", "i1", "i2", "i3", "add", "i4"] },
    trace({ list, nw }) {
      const Tr = new G.Trace();
      const { lo, hi } = bounds(list, [nw]);
      let [start, end] = nw;
      const result = [];
      const mk = {};
      let cur = null;
      const st = (note) => ({ lo, hi, rows: list.map(([a, b], k) => ({ id: "l" + k, a, b, name: k ? "" : "list", m: k === cur ? "focus" : mk[k] })).concat([{ id: "nw", a: start, b: end, name: "new", m: "p2" }]), note: { text: note || `result: ${ivs(result)}` } });
      Tr.add({ at: "before", state: st(), vars: { new: `[${start},${end}]` }, say: "The list is already sorted, so one linear pass in three phases is enough." });
      let i = 0;
      while (i < list.length && list[i][1] < start) { cur = i; result.push(list[i]); mk[i] = "p1"; Tr.add({ key: "i" + i, at: "before", state: st(), vars: { i }, say: `[${list[i]}] ends at ${list[i][1]} < ${start}: entirely before. Copy it.` }); i++; }
      while (i < list.length && list[i][0] <= end) { cur = i; start = Math.min(start, list[i][0]); end = Math.max(end, list[i][1]); mk[i] = "done"; Tr.add({ key: "i" + i, at: "absorb", state: st(), vars: { i, new: `[${start},${end}]` }, say: `[${list[i]}] starts at ${list[i][0]} ≤ ${end}: it overlaps. Absorb it: the new interval becomes [${start},${end}].` }); i++; }
      cur = null; result.push([start, end]);
      Tr.add({ key: "add", at: "add", state: st(), vars: { added: `[${start},${end}]` }, say: `Add the grown interval [${start},${end}].` });
      while (i < list.length) { cur = i; result.push(list[i]); mk[i] = "p1"; Tr.add({ key: "i" + i, at: "after", state: st(), vars: { i }, say: `[${list[i]}] is entirely after: copy it.` }); i++; }
      cur = null;
      Tr.add({ state: st(), vars: { result: ivs(result) }, say: `Result ${ivs(result)}. O(n), no sort needed.` });
      return Tr.done(result);
    },
  };

  /* ---------- Problem 3: intersections ---------- */
  A.intersect = {
    title: "Interval List Intersections: two pointers, drop the one that ends first",
    viz: "timeline", legend: ["p1:A[i]", "p2:B[j]", "answer:recorded overlap", "done:finished"],
    inputLabel: "A ; B (each sorted, disjoint)", hint: "0-2 5-10 13-23 24-25 ; 1-5 8-12 15-24 25-26",
    presets: [{ label: "the LeetCode example", input: "0-2 5-10 13-23 24-25 ; 1-5 8-12 15-24 25-26" }, { label: "[[1,7]] and [[3,10]]", input: "1-7 ; 3-10" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'A, then ";" and B'); const A1 = parseIv(a, { allowEmpty: true, max: 5 }), B1 = parseIv(b, { allowEmpty: true, max: 5 }); [A1, B1].forEach((L) => { for (let i = 1; i < L.length; i++) if (L[i][0] <= L[i - 1][1]) throw new Error("Each list must be sorted and disjoint."); }); return { A: A1, B: B1 }; },
    lines: { rec: { ts: "if (lo <= hi) result.push([lo, hi]);", go: "result = append(result, []int{lo, hi})" }, advA: { ts: "if (A[i][1] < B[j][1]) i++;", go: "i++ // drop the one that ends first" }, advB: { ts: "intervalIntersection>>else j++;", go: "j++" } },
    table: { id: "tbl-4", preset: 0, rows: ["k0", "k1", "k2", "k3"] },
    trace({ A: LA, B: LB }) {
      const Tr = new G.Trace();
      const { lo: L0, hi: H0 } = bounds(LA, LB);
      const result = [];
      let i = 0, j = 0;
      const st = (hot) => ({ lo: L0, hi: H0, rows: LA.map(([a, b], k) => ({ id: "a" + k, a, b, name: k ? "" : "A", m: k === i ? "p1" : k < i ? "done" : null })).concat(LB.map(([a, b], k) => ({ id: "b" + k, a, b, name: k ? "" : "B", m: k === j ? "p2" : k < j ? "done" : null }))).concat(result.map(([a, b], k) => ({ id: "r" + k, a, b, name: k ? "" : "both", m: k === hot ? "answer" : "anchor" }))), note: { text: `result: ${ivs(result)}` } });
      let step = 0;
      while (i < LA.length && j < LB.length) {
        const lo = Math.max(LA[i][0], LB[j][0]), hi = Math.min(LA[i][1], LB[j][1]);
        const key = "k" + step++;
        if (lo <= hi) result.push([lo, hi]);
        Tr.add({ key, at: "rec", state: st(lo <= hi ? result.length - 1 : null), vars: { "A[i]": `[${LA[i]}]`, "B[j]": `[${LB[j]}]`, lo, hi }, say: lo <= hi ? `lo = max of starts = ${lo}, hi = min of ends = ${hi}. lo ≤ hi: they share [${lo},${hi}].` : `lo = ${lo} > hi = ${hi}: no overlap.` });
        const a = LA[i][1] < LB[j][1];
        if (a) i++; else j++;
        Tr.add({ key, at: a ? "advA" : "advB", state: st(null), vars: { i, j }, say: a ? `A's interval ends first (${LA[i - 1][1]} < ${LB[j][1]}): it cannot meet anything later in B. Move i.` : `B's interval ends first (or they tie): move j.` });
      }
      Tr.add({ state: st(null), vars: { result: ivs(result) }, say: `Result ${ivs(result)}. O(m + n).` });
      return Tr.done(result);
    },
  };

  /* ---------- Problem 4: arrows ---------- */
  A.arrows = {
    title: "Minimum Arrows: sort by end, shoot at the end",
    viz: "timeline", legend: ["focus:current balloon", "answer:burst by an arrow", "p2:new arrow needed"],
    inputLabel: "balloons start-end", hint: "10-16 2-8 1-6 7-12",
    presets: [{ label: "[[10,16],[2,8],[1,6],[7,12]]", input: "10-16 2-8 1-6 7-12" }, { label: "four apart", input: "1-2 3-4 5-6 7-8" }, { label: "touching", input: "1-2 2-3 3-4 4-5" }],
    parse: (s) => parseIv(s, { allowEmpty: true }),
    lines: { sort: { ts: "const sorted = [...points].sort((a, b) => a[1] - b[1]); // by END", go: "return sorted[i][1] < sorted[j][1] }) // by END" }, burst: { ts: "if (start > arrowAt) { // this balloon is out of reach of the current arrow", go: "if p[0] > arrowAt { // this balloon is out of reach of the current arrow" }, new: { ts: "arrows++;", go: "arrows++" }, ret: { ts: "return arrows;", go: "return arrows" } },
    table: { id: "tbl-5", preset: 0, rows: ["b0", "b1", "b2", "b3"] },
    trace(pts) {
      const Tr = new G.Trace();
      if (!pts.length) { Tr.add({ at: "ret", state: { lo: 0, hi: 10, rows: [] }, vars: {}, say: "No balloons: 0 arrows." }); return Tr.done(0); }
      const { lo, hi } = bounds(pts);
      let order = pts.map((p, i) => ({ id: i, a: p[0], b: p[1] }));
      const mk = {};
      let arrows = 0, arrowAt = null;
      const shots = [];
      const st = (cur) => ({ lo, hi, rows: order.map((r) => ({ id: r.id, a: r.a, b: r.b, m: r.id === cur ? "focus" : mk[r.id] })), lines: shots.map((x, k) => ({ x, label: `arrow ${k + 1}`, m: k === shots.length - 1 ? "focus" : "p1" })), note: { text: `arrows: ${arrows}` } });
      order = order.slice().sort((x, y) => x.b - y.b);
      Tr.add({ at: "sort", state: st(null), vars: {}, say: "Sort by end. The first arrow goes at the earliest end: as far right as possible while still hitting that balloon." });
      arrows = 1; arrowAt = order[0].b; shots.push(arrowAt);
      order.forEach((r, k) => {
        const key = "b" + k;
        if (r.a > arrowAt) { arrows++; arrowAt = r.b; shots.push(arrowAt); mk[r.id] = "answer"; Tr.add({ key, at: "new", state: st(r.id), vars: { arrows, arrowAt }, say: `[${r.a},${r.b}] starts after the arrow at ${shots[shots.length - 2]}: it needs a new arrow, shot at its end ${r.b}.` }); }
        else { mk[r.id] = "answer"; Tr.add({ key, at: "burst", state: st(r.id), vars: { arrows, arrowAt }, say: `[${r.a},${r.b}] starts at ${r.a} ≤ ${arrowAt}: the arrow at ${arrowAt} bursts it.` }); }
      });
      Tr.add({ at: "ret", state: st(null), vars: { arrows }, say: `${arrows} arrow${arrows === 1 ? "" : "s"}.` });
      return Tr.done(arrows);
    },
  };

  /* ---------- Problem 5: meeting rooms with a sweep ---------- */
  A.attend = {
    title: "Meeting rooms with a sweep line", short: "Can one person attend all?",
    viz: "timeline", legend: ["focus:compared pair", "bug:overlap found"],
    inputLabel: "meetings start-end", hint: "0-30 5-10 15-20",
    presets: [{ label: "[[0,30],[5,10],[15,20]]", input: "0-30 5-10 15-20" }, { label: "[[7,10],[2,4]]", input: "7-10 2-4" }],
    parse: (s) => parseIv(s, { strict: true }),
    lines: { chk: { ts: "if (sorted[i][0] < sorted[i - 1][1]) return false;", go: "return false // starts before the previous one ends" }, ok: { ts: "canAttendMeetings>>return true;", go: "func canAttendMeetings>>return true" } },
    trace(ms) {
      const Tr = new G.Trace();
      const { lo, hi } = bounds(ms);
      const order = ms.map((m, i) => ({ id: i, a: m[0], b: m[1] })).sort((x, y) => x.a - y.a);
      const st = (i, bad) => ({ lo, hi, rows: order.map((r, k) => ({ id: r.id, a: r.a, b: r.b, m: k === i || k === i - 1 ? (bad ? "bug" : "focus") : null })) });
      for (let i = 1; i < order.length; i++) {
        const bad = order[i].a < order[i - 1].b;
        Tr.add({ at: "chk", state: st(i, bad), vars: { prev: `[${order[i - 1].a},${order[i - 1].b}]`, cur: `[${order[i].a},${order[i].b}]` }, say: bad ? `[${order[i].a},${order[i].b}] starts before [${order[i - 1].a},${order[i - 1].b}] ends: overlap. False.` : `[${order[i].a},${order[i].b}] starts after the previous one ends: fine.` });
        if (bad) return Tr.done(false);
      }
      Tr.add({ at: "ok", state: st(-5), vars: {}, say: "Sorted by start, no neighbors overlap: true." });
      return Tr.done(true);
    },
  };
  A.sweepRooms = {
    title: "Meeting rooms with a sweep line", short: "How many rooms? (two sorted lists)",
    viz: "array", legend: ["p1:next start", "p2:earliest unfinished end"],
    inputLabel: "meetings start-end", hint: "0-30 5-10 15-20",
    presets: [{ label: "[[0,30],[5,10],[15,20]]", input: "0-30 5-10 15-20" }, { label: "[[1,5],[2,6],[3,7]]", input: "1-5 2-6 3-7" }, { label: "back to back", input: "1-3 3-5 5-7" }],
    parse: (s) => parseIv(s, { strict: true }),
    lines: { reuse: { ts: "if (ends[e] <= s) e++;", go: "e++ // a meeting has finished: reuse its room" }, open: { ts: "else rooms++;", go: "rooms++ // everyone is still busy: open a new room" }, ret: { ts: "minMeetingRoomsSweep>>return rooms;", go: "func minMeetingRoomsSweep>>return rooms" } },
    trace(ms) {
      const Tr = new G.Trace();
      const starts = ms.map((m) => m[0]).sort((a, b) => a - b), ends = ms.map((m) => m[1]).sort((a, b) => a - b);
      let rooms = 0, e = 0;
      const st = (k) => ({ cellW: 44, rows: [{ label: "starts", cells: starts.map((v, i) => ({ id: "s" + i, v, m: i === k ? "p1" : i < k ? "done" : null })), ptrs: k < starts.length ? [{ name: "s", at: k, role: "p1", side: "above" }] : [] }, { label: "ends", cells: ends.map((v, i) => ({ id: "e" + i, v, m: i === e ? "p2" : i < e ? "done" : null })), ptrs: e < ends.length ? [{ name: "e", at: e, role: "p2" }] : [] }], note: { text: `rooms opened: ${rooms}` } });
      starts.forEach((s, k) => {
        if (ends[e] <= s) { e++; Tr.add({ at: "reuse", state: st(k), vars: { s, "freed at": ends[e - 1], rooms }, say: `A meeting ended at ${ends[e - 1]} ≤ ${s}: reuse that room. e moves on.` }); }
        else { rooms++; Tr.add({ at: "open", state: st(k), vars: { s, "earliest end": ends[e], rooms }, say: `Start ${s}, but the earliest end is ${ends[e]} > ${s}: every room is busy. Open room ${rooms}.` }); }
      });
      Tr.add({ at: "ret", state: st(starts.length), vars: { rooms }, say: `${rooms} room${rooms === 1 ? "" : "s"}. Only the order of starts and ends matters, not which start goes with which end.` });
      return Tr.done(rooms);
    },
  };

  /* ---------- Problem 6: skyline ---------- */
  function skyViz(scene, st) {
    const W = 520, H = 170, X0 = 30, Y0 = 16;
    const sx = (x) => X0 + ((x - st.lo) / (st.hi - st.lo || 1)) * W, sy = (h) => Y0 + H - (h / (st.maxH || 1)) * H;
    st.buildings.forEach(([l, r, h], k) => {
      const g = scene.el(`sk${k}`, "rect", "back");
      G.attr(g, { x: sx(l), y: sy(h), width: sx(r) - sx(l), height: sy(0) - sy(h), class: "sky-b" + (st.bm && st.bm[k] ? " m-" + st.bm[k] : "") });
    });
    G.drawLine(scene, "sk-ground", sx(st.lo), sy(0), sx(st.hi), sy(0), "edge");
    const pts = st.skyline;
    let d = "";
    if (pts.length) { d = `M${sx(pts[0][0])},${sy(0)}`; let prevH = 0; pts.forEach(([x, h], i) => { d += ` L${sx(x)},${sy(prevH)} L${sx(x)},${sy(h)}`; prevH = h; if (i === pts.length - 1 && h !== 0) d += ` L${sx(st.hi)},${sy(h)}`; }); }
    G.attr(scene.el("sk-line", "path", "front"), { d, class: "sky-line" });
    pts.forEach(([x, h], i) => { const c = scene.el(`skp${i}`, "circle", "front"); G.attr(c, { cx: sx(x), cy: sy(h), r: 4.5, class: "sky-pt" }); });
    if (st.x != null) { G.drawLine(scene, "sk-sweep", sx(st.x), Y0 - 6, sx(st.x), sy(0) + 6, "tl-line m-focus", "front"); G.drawText(scene, "sk-sx", sx(st.x), sy(0) + 16, `x = ${st.x}`, "lbl tl-ltext m-focus", "middle", "front"); }
    let h = sy(0) + 30, w = X0 + W + 20;
    if (st.note) { G.drawText(scene, "note", X0, h + 4, st.note.text, "result-t"); h += 26; }
    if (st.panels) { const p = G.drawPanels(scene, st.panels, w + 8, 8); w = p.w; h = Math.max(h, p.h); }
    return { x: 0, y: 0, w, h };
  }
  A.skyline = {
    title: "The Skyline: sweep the events, track the tallest active building",
    viz: skyViz, legend: ["focus:building that starts or ends here", "answer:skyline key point"],
    inputLabel: "buildings left-right-height", hint: "2-9-10 3-7-15 5-12-12 15-20-10 19-24-8",
    presets: [{ label: "the LeetCode example", input: "2-9-10 3-7-15 5-12-12 15-20-10 19-24-8" }, { label: "two touching, same height", input: "0-2-3 2-5-3" }, { label: "three on one footprint", input: "1-2-1 1-2-2 1-2-3" }],
    parse(s) { const t = String(s).replace(/[\[\]]/g, " ").trim().split(/[\s,]+/).filter(Boolean); if (!t.length || t.length > 6) throw new Error("1 to 6 buildings."); return t.map((x) => { const m = x.match(/^(\d+)-(\d+)-(\d+)$/); if (!m || +m[1] >= +m[2] || +m[3] < 1 || +m[2] > 99 || +m[3] > 99) throw new Error(`"${x}" should look like 2-9-10 (left < right, height ≥ 1).`); return [+m[1], +m[2], +m[3]]; }); },
    lines: { start: { ts: "if (signedHeight < 0) heights.push(-signedHeight);", go: "heights.Push(-signed) // a building starts" }, end: { ts: "else pendingRemoval.set(signedHeight,", go: "pendingRemoval[signed]++ // a building ends" }, lazy: { ts: "const top = heights.pop(); // the top height belongs to a building that already ended", go: "pendingRemoval[top]--" }, out: { ts: "skyline.push([x, current]);", go: "skyline = append(skyline, []int{x, current})" }, same: { ts: "const current = heights.peek();", go: "current := heights.Peek()" } },
    table: { id: "tbl-6", preset: 0, rows: ["e0", "e1", "e2", "e3", "e4", "e5"] },
    trace(bs) {
      const Tr = new G.Trace();
      // the lesson's MaxHeap, reproduced so lazy deletion happens the same way
      const H = [];
      const push = (x) => { H.push(x); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (H[p] >= H[i]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
      const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = 2 * i + 2; let b = i; if (l < H.length && H[l] > H[b]) b = l; if (r < H.length && H[r] > H[b]) b = r; if (b === i) break; [H[b], H[i]] = [H[i], H[b]]; i = b; } } return top; };
      const ev = [];
      bs.forEach(([l, r, h], k) => { ev.push([l, -h, k]); ev.push([r, h, k]); });
      ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      push(0);
      const pend = new Map();
      const sky = [];
      let prev = 0;
      const lo = Math.min(...bs.map((b) => b[0])), hi = Math.max(...bs.map((b) => b[1])), maxH = Math.max(...bs.map((b) => b[2]));
      const active = new Set();
      const st = (x, k) => ({ lo, hi, maxH, buildings: bs, bm: Object.assign(Object.fromEntries([...active].map((a) => [a, "p1"])), k != null ? { [k]: "focus" } : {}), skyline: sky.slice(), x, panels: [{ title: "heap (lazy)", keyW: 70, entries: [[H.slice().sort((a, b) => b - a).join(" ")]] }, { title: "to drop", keyW: 40, valW: 30, entries: [...pend].filter(([, c]) => c > 0) }], note: { text: `key points: ${sky.map(([a, b]) => `[${a},${b}]`).join(" ") || "—"}` } });
      Tr.add({ at: "same", state: st(null, null), vars: { events: ev.length }, say: "Each building gives two events: a start (stored as −h) and an end (+h). Sort by x; at the same x, starts come first and taller starts first. The heap starts with the ground, 0." });
      ev.forEach(([x, sh, k], e) => {
        const key = "e" + e;
        if (sh < 0) { push(-sh); active.add(k); Tr.add({ key, at: "start", state: st(x, k), vars: { x, starts: -sh }, say: `x = ${x}: a building of height ${-sh} starts. Push ${-sh}.` }); }
        else {
          pend.set(sh, (pend.get(sh) || 0) + 1); active.delete(k);
          Tr.add({ key, at: "end", state: st(x, k), vars: { x, ends: sh }, say: `x = ${x}: a building of height ${sh} ends. Removing it from the middle of a heap is slow, so just note "drop one ${sh}" for later.` });
        }
        let dropped = [];
        while (H.length && (pend.get(H[0]) || 0) > 0) { const t = pop(); pend.set(t, pend.get(t) - 1); dropped.push(t); }
        if (dropped.length) Tr.add({ key, at: "lazy", state: st(x, null), vars: { dropped: dropped.join(", ") }, say: `The top of the heap (${dropped.join(", then ")}) belongs to a building that ended: pop it now. Only the top has to be correct.` });
        const cur = H[0];
        if (cur !== prev) { sky.push([x, cur]); prev = cur; Tr.add({ key, at: "out", state: st(x, null), vars: { x, height: cur }, say: `The tallest active height is now ${cur}: the outline changes. Key point [${x},${cur}].` }); }
        else Tr.add({ key, at: "same", state: st(x, null), vars: { x, height: cur }, say: `The tallest active height is still ${cur}: no key point.` });
      });
      Tr.add({ state: st(null, null), vars: { points: sky.length }, say: `Skyline ${sky.map(([a, b]) => `[${a},${b}]`).join(" ")}. O(n log n).` });
      return Tr.done(sky);
    },
  };

  G.quizzes.iv24 = {
    title: "Intervals",
    items: [
      { q: "When do [a1, b1] and [a2, b2] overlap (touching counts)?", options: ["a1 ≤ b2 and a2 ≤ b1", "a1 < a2", "b1 = b2", "a1 ≤ a2 and b1 ≤ b2"], answer: 0, why: "Each starts before the other ends." },
      { q: "Merge Intervals: why max(last[1], end) instead of end?", options: ["The new interval may be inside the last group", "To sort them", "To handle negatives", "It is only for speed"], answer: 0, why: "[1,10] then [2,3] must stay [1,10]." },
      { q: "Insert Interval on an already sorted list costs…", options: ["O(n): three linear phases", "O(n log n)", "O(log n)", "O(n²)"], answer: 0, why: "No sort needed; one pass." },
      { q: "Minimum meeting rooms with sorted starts and ends: why can you sort them separately?", options: ["Only how many meetings are running at each moment matters, not which ones", "Meetings never overlap", "Ends are always sorted", "It is a trick that only works sometimes"], answer: 0, why: "At each start, ask whether any meeting has ended yet." },
      { q: "Skyline: why lazy deletion?", options: ["Removing an arbitrary value from a heap is slow; only the top must be accurate", "To save memory", "Because heights are sorted", "To handle negative heights"], answer: 0, why: "Pop ended heights only when they reach the top." },
    ],
  };
})();

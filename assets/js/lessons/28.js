/* Lesson 28 · k-nearest neighbors, Bloom filters and inverted indexes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  /* scatter: st = { pts: [{id, x, y, label?, cls?, m?}], q?: {x, y, label}, links?: [ids], ring?: radius in data units around q,
     xr: [lo, hi], yr: [lo, hi], xLabel, yLabel, panels?, note? } */
  function scatter(scene, st) {
    const W = 380, H = 260, X0 = 46, Y0 = 14;
    const [x0, x1] = st.xr, [y0, y1] = st.yr;
    const sx = (x) => X0 + ((x - x0) / (x1 - x0 || 1)) * W, sy = (y) => Y0 + H - ((y - y0) / (y1 - y0 || 1)) * H;
    G.drawLine(scene, "sc-ax", X0, Y0 + H, X0 + W, Y0 + H, "edge"); G.drawLine(scene, "sc-ay", X0, Y0, X0, Y0 + H, "edge");
    G.drawText(scene, "sc-xl", X0 + W / 2, Y0 + H + 22, st.xLabel || "", "lbl", "middle");
    G.drawText(scene, "sc-yl", 8, Y0 + 6, st.yLabel || "", "lbl");
    [0, 0.5, 1].forEach((t, k) => { const xv = x0 + t * (x1 - x0), yv = y0 + t * (y1 - y0); G.drawText(scene, `sc-xt${k}`, sx(xv), Y0 + H + 10, +xv.toFixed(2), "idx", "middle"); G.drawText(scene, `sc-yt${k}`, X0 - 6, sy(yv), +yv.toFixed(2), "idx", "end"); });
    const byId = Object.fromEntries(st.pts.map((p) => [p.id, p]));
    if (st.q) {
      (st.links || []).forEach((id, k) => { const p = byId[id]; if (p) G.drawLine(scene, `sc-l${k}`, sx(st.q.x), sy(st.q.y), sx(p.x), sy(p.y), "edge g-edge e-hot", "back"); });
      if (st.ringPx) { const c = scene.el("sc-ring", "circle", "back"); G.attr(c, { cx: sx(st.q.x), cy: sy(st.q.y), r: st.ringPx, class: "sc-ring" }); }
    }
    st.pts.forEach((p) => {
      const c = scene.el(`sc-p${p.id}`, "circle", "mid");
      G.attr(c, { cx: sx(p.x), cy: sy(p.y), r: p.m ? 8 : 6.5, class: "sc-pt " + (p.cls || "") + (p.m ? " m-" + p.m : "") });
      if (p.label != null) G.drawText(scene, `sc-t${p.id}`, sx(p.x) + 10, sy(p.y) - 9, p.label, "lbl sc-lab");
    });
    if (st.q) { const q = scene.el("sc-q", "path", "front"); const cx = sx(st.q.x), cy = sy(st.q.y); G.attr(q, { d: `M${cx},${cy - 10} L${cx + 9},${cy + 7} L${cx - 9},${cy + 7} Z`, class: "sc-q" }); G.drawText(scene, "sc-qt", cx + 12, cy + 4, st.q.label || "?", "lbl sc-qlab", "start", "front"); }
    let w = X0 + W + 16, h = Y0 + H + 34;
    if (st.note) { G.drawText(scene, "note", X0, h + 4, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 26; }
    if (st.panels) { const p = G.drawPanels(scene, st.panels, w + 10, 8); w = p.w; h = Math.max(h, p.h); }
    return { x: 0, y: 0, w, h };
  }

  const pairs = (s, max) => { const t = String(s).replace(/[\[\]]/g, " ").trim().split(/\s+/).filter(Boolean); if (!t.length || t.length > max) throw new Error(`1 to ${max} points like 1,3.`); return t.map((x) => { const m = x.match(/^(-?\d+),(-?\d+)$/); if (!m || Math.abs(+m[1]) > 20 || Math.abs(+m[2]) > 20) throw new Error(`"${x}" should look like 3,-1 (each within ±20).`); return [+m[1], +m[2]]; }); };
  const sq = (p) => p[0] * p[0] + p[1] * p[1];
  // the lesson's euclidean(): sqrt of the summed squares (Math.hypot can round differently and flip ties)
  const euclid = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return Math.sqrt(s); };

  /* ---------- Problem 1: k closest points ---------- */
  A.kClosest = {
    title: "K Closest Points: a max-heap of the k best, worst on top",
    viz: scatter, legend: ["p1:in the heap (the k best so far)", "anchor:top of the heap: the worst of them", "focus:the point being considered", "done:rejected"],
    inputLabel: "points x,y ; k", hint: "3,3 5,-1 -2,4 ; 2",
    presets: [{ label: "[[3,3],[5,-1],[-2,4]], k=2", input: "3,3 5,-1 -2,4 ; 2" }, { label: "eight points, k=3", input: "1,1 -4,2 3,-3 0,5 -1,-1 6,0 2,2 -3,-4 ; 3" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'points, then ";" and k'); const pts = pairs(a, 9); const k = P.num(b, "k"); if (!Number.isInteger(k) || k < 1 || k > pts.length) throw new Error(`k from 1 to ${pts.length}.`); return { pts, k }; },
    lines: { push: { ts: "heap.push(p);", go: "heap = append(heap, p)" }, beat: { ts: "heap[0] = p; // the new point beats the current worst", go: "heap[0] = p // the new point beats the current worst" }, skip: { ts: "} else if (squaredDistance(p) < squaredDistance(heap[0])) {", go: "siftDown(0)" }, ret: { ts: "kClosest(points: number[][], k: number)>>return heap;", go: "func kClosest>>return heap" } },
    trace({ pts, k }) {
      const Tr = new G.Trace();
      const heap = [];
      const worse = (i, j) => sq(heap[i]) > sq(heap[j]);
      const swap = (i, j) => { [heap[i], heap[j]] = [heap[j], heap[i]]; };
      const up = (i) => { while (i > 0 && worse(i, (i - 1) >> 1)) { swap(i, (i - 1) >> 1); i = (i - 1) >> 1; } };
      const down = (i) => { for (;;) { const l = 2 * i + 1, r = 2 * i + 2; let b = i; if (l < heap.length && worse(l, b)) b = l; if (r < heap.length && worse(r, b)) b = r; if (b === i) return; swap(i, b); i = b; } };
      const ids = new Map(pts.map((p, i) => [p, i]));
      const rejected = new Set();
      const ext = Math.max(5, ...pts.flat().map(Math.abs)) + 1;
      const st = (cur) => ({ xr: [-ext, ext], yr: [-ext, ext], xLabel: "x", yLabel: "y", q: { x: 0, y: 0, label: "origin" }, links: heap.map((p) => ids.get(p)), pts: pts.map((p, i) => ({ id: i, x: p[0], y: p[1], label: `${p[0]},${p[1]} · d²=${sq(p)}`, m: i === cur ? "focus" : heap[0] === p ? "anchor" : heap.includes(p) ? "p1" : rejected.has(i) ? "done" : null })), panels: [{ title: "max-heap (d²)", keyW: 70, entries: heap.map((p) => [`${p[0]},${p[1]}`, sq(p)]), mark: heap.length ? { [`${heap[0][0]},${heap[0][1]}`]: "anchor" } : {} }] });
      pts.forEach((p, i) => {
        if (heap.length < k) { heap.push(p); up(heap.length - 1); Tr.add({ at: "push", state: st(i), vars: { point: `${p}`, "d²": sq(p) }, say: `Fewer than k = ${k} kept: push (${p}) with d² = ${sq(p)}. (Squared distance keeps the order and skips the square root.)` }); }
        else if (sq(p) < sq(heap[0])) { const out = heap[0]; rejected.add(ids.get(out)); heap[0] = p; down(0); Tr.add({ at: "beat", state: st(i), vars: { point: `${p}`, "d²": sq(p), evicted: `${out}` }, say: `(${p}) with d² = ${sq(p)} beats the worst kept point (${out}, d² = ${sq(out)}): replace the top and sift down.` }); }
        else { rejected.add(i); Tr.add({ at: "skip", state: st(i), vars: { point: `${p}`, "d²": sq(p) }, say: `(${p}) with d² = ${sq(p)} is no closer than the worst kept (${sq(heap[0])}): ignore it.` }); }
      });
      Tr.add({ at: "ret", state: st(null), vars: { k }, say: `The heap holds the ${k} closest. O(n log k) time, O(k) memory.` });
      return Tr.done(heap.map((p) => p.slice()).sort((a, b) => sq(a) - sq(b) || a[0] - b[0] || a[1] - b[1]));
    },
  };

  /* ---------- Problem 2: classifier ---------- */
  const FRUITS = [[7.0, 0.3, "orange"], [7.5, 0.35, "orange"], [8.0, 0.32, "orange"], [7.2, 0.28, "orange"], [11.0, 0.6, "grapefruit"], [12.0, 0.65, "grapefruit"], [10.5, 0.7, "grapefruit"], [11.5, 0.62, "grapefruit"]];
  function classifyTrace({ q, k }, normalize) {
    const Tr = new G.Trace();
    const d = 2;
    const min = [Infinity, Infinity], max = [-Infinity, -Infinity];
    FRUITS.forEach((f) => { for (let i = 0; i < d; i++) { min[i] = Math.min(min[i], f[i]); max[i] = Math.max(max[i], f[i]); } });
    const prep = (v) => (normalize ? v.map((x, i) => (max[i] === min[i] ? 0 : (x - min[i]) / (max[i] - min[i]))) : v.slice());
    const qq = prep(q);
    const all = FRUITS.map((f, i) => { const v = prep([f[0], f[1]]); return { i, label: f[2], v, dist: euclid(v, qq) }; });
    const nearest = all.slice().sort((a, b) => a.dist - b.dist).slice(0, k);
    const pv = FRUITS.map((f) => prep([f[0], f[1]]));
    const xs = pv.map((p) => p[0]).concat(qq[0]), ys = pv.map((p) => p[1]).concat(qq[1]);
    const pad = (lo, hi) => { const s = (hi - lo) * 0.08 || 0.1; return [lo - s, hi + s]; };
    // raw units: draw with equal scales on both axes, so the picture shows what the distance really sees
    let xr = pad(Math.min(...xs), Math.max(...xs)), yr = pad(Math.min(...ys), Math.max(...ys));
    if (!normalize) { const span = xr[1] - xr[0], mid = (yr[0] + yr[1]) / 2; yr = [mid - span * 0.68, mid + span * 0.68]; }
    const st = (links, note) => ({ xr, yr, xLabel: normalize ? "size (scaled 0–1)" : "size (cm)", yLabel: normalize ? "redness (scaled)" : "redness (0–1, same scale as cm)", q: { x: qq[0], y: qq[1], label: `? ${q[0]}, ${q[1]}` }, links, pts: FRUITS.map((f, i) => ({ id: i, x: pv[i][0], y: pv[i][1], cls: f[2] === "orange" ? "c-orange" : "c-grape", m: links.includes(i) ? "focus" : null })), panels: [{ title: "nearest", keyW: 90, valW: 50, entries: nearest.slice(0, links.length).map((n) => [FRUITS[n.i][2] + " " + n.i, n.dist.toFixed(2)]) }], note: note ? { text: note } : undefined });
    Tr.add({ at: normalize ? "scale" : "dist", state: st([]), vars: { k, normalized: normalize }, say: normalize ? "Rescale each feature to 0–1 using the training data's min and max, so size and color count equally." : "Raw units: size spans several centimeters, redness only 0.4. On equal scales the points squash into a line: size decides everything." });
    nearest.forEach((n, j) => Tr.add({ at: "near", state: st(nearest.slice(0, j + 1).map((x) => x.i)), vars: { neighbor: j + 1, label: n.label, distance: n.dist.toFixed(3) }, say: `Neighbor ${j + 1}: a ${n.label} at distance ${n.dist.toFixed(3)}.` }));
    const votes = new Map();
    nearest.forEach((n) => votes.set(n.label, (votes.get(n.label) || 0) + 1));
    const winner = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
    Tr.add({ at: "vote", state: st(nearest.map((x) => x.i), `vote: ${[...votes].map(([l, c]) => `${l} ${c}`).join(", ")} → ${winner}`), vars: { answer: winner }, say: `Majority vote of the ${k} neighbors: ${winner}.` });
    return Tr.done(winner);
  }
  const fruitParse = (s) => { const [a, b] = P.parts(s, 2, 'size,redness then ";" and k'); const m = a.trim().match(/^(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/); if (!m || +m[1] > 20 || +m[2] > 1) throw new Error("Type size,redness like 9.0,0.69 (redness 0..1)."); const k = P.num(b, "k"); if (!Number.isInteger(k) || k < 1 || k > 8) throw new Error("k from 1 to 8."); return { q: [+m[1], +m[2]], k }; };
  const fruitLines = { scale: { ts: "const prep = (v: number[]): number[] => (normalize ? scale(v, min, max) : v);", go: "return scale(v, minV, maxV)" }, dist: { ts: ".map((item) => ({ label: item.label, dist: euclidean(prep(item.features), q) }))", go: "sort.Slice(all, func(i, j int) bool { return all[i].dist < all[j].dist })" }, near: { ts: ".slice(0, k); // the k closest neighbors", go: "sort.Slice(all, func(i, j int) bool { return all[i].dist < all[j].dist })" }, vote: { ts: "return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];", go: "return bestLabel // the majority label" } };
  A.classifyNorm = { title: "k-NN classifier: orange or grapefruit?", short: "Normalized", viz: scatter, legend: ["focus:one of the k nearest"], inputLabel: "size,redness ; k", hint: "9.0,0.69 ; 3", presets: [{ label: "9.0, 0.69 ; k=3", input: "9.0,0.69 ; 3" }, { label: "7.8, 0.33 ; k=3", input: "7.8,0.33 ; 3" }], parse: fruitParse, lines: fruitLines, trace: (x) => classifyTrace(x, true) };
  A.classifyRaw = { title: "k-NN classifier: orange or grapefruit?", short: "Raw units (the pitfall)", viz: scatter, legend: ["focus:one of the k nearest"], inputLabel: "size,redness ; k", hint: "9.0,0.69 ; 3", presets: [{ label: "9.0, 0.69 ; k=3", input: "9.0,0.69 ; 3" }], parse: fruitParse, lines: fruitLines, trace: (x) => classifyTrace(x, false) };

  /* ---------- Problem 3: regression and recommendations ---------- */
  const BAKERY = [[5, 0, 1, 300], [3, 1, 1, 225], [1, 1, 0, 75], [4, 0, 1, 200], [4, 1, 0, 150], [2, 0, 0, 50]];
  A.regress = {
    title: "k-NN regression: average the neighbors' values", short: "Bakery loaves",
    viz: "array", legend: ["focus:one of the k nearest days", "done:farther away"],
    inputLabel: "weather weekend game ; k", hint: "4 1 0 ; 3",
    presets: [{ label: "4, 1, 0 ; k=3", input: "4 1 0 ; 3" }, { label: "5, 1, 1 ; k=2", input: "5 1 1 ; 2" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'three features, then ";" and k'); const q = P.nums(a, { minLen: 3, maxLen: 3, min: 0, max: 5 }); const k = P.num(b, "k"); if (!Number.isInteger(k) || k < 1 || k > 6) throw new Error("k from 1 to 6."); return { q, k }; },
    lines: { dist: { ts: ".map((h) => ({ value: h.value, dist: euclidean(h.features, query) }))", go: "sort.Slice(all, func(i, j int) bool { return all[i].dist < all[j].dist })" }, avg: { ts: "return nearest.reduce((sum, n) => sum + n.value, 0) / nearest.length;", go: "sum += n.value" } },
    trace({ q, k }) {
      const Tr = new G.Trace();
      const all = BAKERY.map((d, i) => ({ i, value: d[3], dist: euclid(d.slice(0, 3), q) }));
      const order = all.slice().sort((a, b) => a.dist - b.dist);
      const near = new Set(order.slice(0, k).map((x) => x.i));
      const st = (show) => ({ cellW: 64, labelW: 96, rows: [{ label: "features", cells: BAKERY.map((d, i) => ({ id: "f" + i, v: d.slice(0, 3).join(" "), m: show && near.has(i) ? "focus" : show ? "done" : null })) }, { label: "loaves", cells: BAKERY.map((d, i) => ({ id: "v" + i, v: d[3], m: show && near.has(i) ? "focus" : null })) }, { label: "distance", cells: all.map((x) => ({ id: "d" + x.i, v: x.dist.toFixed(2) })) }] });
      Tr.add({ at: "dist", state: st(false), vars: { query: q.join(" ") }, say: `Measure how similar each past day is to tomorrow (${q.join(", ")}): Euclidean distance over weather, weekend and big game.` });
      const avg = order.slice(0, k).reduce((s, x) => s + x.value, 0) / k;
      Tr.add({ at: "avg", state: st(true), vars: { k, prediction: +avg.toFixed(2) }, say: `The ${k} closest days sold ${order.slice(0, k).map((x) => x.value).join(", ")}. Predict their average: ${+avg.toFixed(2)} loaves.` });
      return Tr.done(avg);
    },
  };
  A.similar = {
    title: "k-NN regression: average the neighbors' values", short: "Most similar user",
    viz: "array", legend: ["answer:the closest user"],
    inputLabel: "Priyanka's 5 ratings", hint: "3 4 4 1 4",
    presets: [{ label: "Priyanka [3,4,4,1,4]", input: "3 4 4 1 4" }, { label: "an action fan", input: "1 5 1 4 2" }],
    parse: (s) => P.nums(s, { minLen: 5, maxLen: 5, min: 1, max: 5 }),
    lines: { loop: { ts: "const d = euclidean(target, ratings);", go: "bestDist, bestName = d, names[i]" }, ret: { ts: "mostSimilarUser>>return bestName;", go: "return bestName" } },
    trace(q) {
      const Tr = new G.Trace();
      const people = [["Justin", [4, 3, 5, 1, 5]], ["Morpheus", [2, 5, 1, 3, 1]]];
      let best = "", bd = Infinity;
      const ds = people.map(([, r]) => euclid(q, r));
      people.forEach(([n], i) => { if (ds[i] < bd) { bd = ds[i]; best = n; } });
      const st = (done) => ({ cellW: 40, labelW: 110, rows: [{ label: "you", cells: q.map((v, i) => ({ id: "q" + i, v })) }].concat(people.map(([n, r], i) => ({ label: `${n} (${ds[i].toFixed(2)})`, cells: r.map((v, j) => ({ id: n + j, v, m: done && n === best ? "answer" : null })) }))) });
      Tr.add({ at: "loop", state: st(false), vars: Object.fromEntries(people.map(([n], i) => [n, ds[i].toFixed(2)])), say: "Distance between rating vectors: the smaller, the more similar the taste." });
      Tr.add({ at: "ret", state: st(true), vars: { answer: best }, say: `${best} is closest: recommend what ${best} liked.` });
      return Tr.done(best);
    },
  };

  /* ---------- Problem 4: Bloom filter ---------- */
  function fnv1a(text, seed) { let h = (seed === undefined ? 2166136261 : seed) >>> 0; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  A.bloom = {
    title: "A Bloom filter: k bits per item, \"maybe\" or \"definitely not\"",
    viz: "array", legend: ["p1:bit set", "focus:this item's k positions", "bug:a 0 among them: definitely not"],
    inputLabel: "m ; k ; words to add ; words to query", hint: "24 ; 3 ; cat dog fish ; cat bird",
    presets: [{ label: "m=24, k=3", input: "24 ; 3 ; cat dog fish ; cat bird cow" }, { label: "a crowded filter (m=10)", input: "10 ; 3 ; a b c d e ; f g h" }],
    parse(s) { const [a, b, c, d] = P.parts(s, 4, "m ; k ; add ; query"); const m = P.num(a, "m"), k = P.num(b, "k"); if (!Number.isInteger(m) || m < 4 || m > 32) throw new Error("m from 4 to 32."); if (!Number.isInteger(k) || k < 1 || k > 5) throw new Error("k from 1 to 5."); const w = (x) => x.trim().split(/\s+/).filter(Boolean); const add = w(c), qs = w(d); if (add.length > 8 || qs.length > 6) throw new Error("Up to 8 words to add and 6 to query."); return { m, k, add, qs }; },
    lines: { pos: { ts: "for (let i = 0; i < this.k; i++) out.push((h1 + i * h2) % this.m); // double hashing", go: "for i := uint64(0); i < b.k; i++ {" }, add: { ts: "for (const p of this.positions(item)) this.bits[p] = 1;", go: "b.bits[p] = true" }, query: { ts: "return this.positions(item).every((p) => this.bits[p] === 1);", go: "return false // any 0 means \"definitely not\"" } },
    trace({ m, k, add, qs }) {
      const Tr = new G.Trace();
      const bits = Array(m).fill(0);
      const pos = (item) => { const h1 = fnv1a(item), h2 = (fnv1a(item, 0x9747b28c) | 1) >>> 0; const out = []; for (let i = 0; i < k; i++) out.push((h1 + i * h2) % m); return out; };
      const st = (ps, bad) => ({ cellW: 30, gap: 3, rows: [{ label: "bits", cells: bits.map((b, i) => ({ id: "b" + i, v: b, m: ps && ps.includes(i) ? (bad && !b ? "bug" : "focus") : b ? "p1" : null })) }], note: { text: `${bits.reduce((a, b) => a + b, 0)} of ${m} bits set` } });
      add.forEach((w) => { const ps = pos(w); ps.forEach((p) => (bits[p] = 1)); Tr.add({ at: "add", state: st(ps), vars: { add: w, positions: ps.join(", ") }, say: `add("${w}"): ${k} hash functions give positions ${ps.join(", ")}. Set those bits.` }); });
      const out = [];
      qs.forEach((w) => {
        const ps = pos(w), r = ps.every((p) => bits[p] === 1);
        out.push(r);
        Tr.add({ at: "query", state: st(ps, true), vars: { query: w, positions: ps.join(", "), result: r ? "maybe" : "no" }, say: r ? (add.includes(w) ? `"${w}": all ${k} bits are 1: "probably present" (and it was added).` : `"${w}": all ${k} bits happen to be 1 although "${w}" was never added: a false positive.`) : `"${w}": at least one of its bits is 0 (red). It was definitely never added: no false negatives.` });
      });
      return Tr.done(out);
    },
  };

  /* ---------- Problem 5: inverted index ---------- */
  A.inverted = {
    title: "An inverted index: word → sorted list of documents",
    viz: "array", legend: ["p1:pointer into the first list", "p2:pointer into the second list", "answer:in both"],
    inputLabel: "documents separated by | ; query", hint: "the quick brown fox | the lazy dog | quick brown dogs and the fox ; quick fox",
    presets: [{ label: "the lesson's three documents", input: "the quick brown fox | the lazy dog | quick brown dogs and the fox ; quick fox" }, { label: "query: the", input: "the quick brown fox | the lazy dog | quick brown dogs and the fox ; the" }, { label: "dog vs dogs", input: "the quick brown fox | the lazy dog | quick brown dogs and the fox ; quick dog" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'documents, then ";" and the query'); const docs = a.split("|").map((d) => d.trim()).filter(Boolean); if (!docs.length || docs.length > 6) throw new Error("1 to 6 documents."); const q = b.trim(); if (!q) throw new Error("Type a query."); return { docs, q }; },
    lines: { build: { ts: "if (list) list.push(id); // ids arrive in increasing order, so the list stays sorted", go: "ix.index[word] = append(ix.index[word], id)" }, short: { ts: "lists.sort((a, b) => a.length - b.length); // start with the shortest list", go: "return len(lists[i]) < len(lists[j]) }) // start with the shortest list" }, both: { ts: "out.push(a[i]);", go: "out = append(out, a[i])" }, adv: { ts: "} else if (a[i] < b[j]) i++;", go: "func intersectSorted>>i++" }, none: { ts: "if (lists.some((l) => l.length === 0)) return [];", go: "return []int{}" } },
    trace({ docs, q }) {
      const Tr = new G.Trace();
      const index = new Map();
      docs.forEach((d, k) => { for (const w of new Set(d.toLowerCase().split(/\s+/))) { if (!index.has(w)) index.set(w, []); index.get(w).push(k + 1); } });
      const words = q.toLowerCase().split(/\s+/);
      const panel = (hi) => [{ title: "index", keyW: 60, valW: 70, entries: [...index].map(([w, l]) => [w, l.join(",")]), hi }];
      Tr.add({ at: "build", state: { rows: [{ label: "docs", cells: docs.map((d, k) => ({ id: "d" + k, v: k + 1 })) }], panels: panel(words) }, vars: { words: index.size }, say: "Index every document: each word maps to the ids of the documents containing it. Ids are added in order, so each list is sorted for free." });
      const lists = words.map((w) => index.get(w) || []);
      if (lists.some((l) => !l.length)) { Tr.add({ at: "none", state: { rows: lists.map((l, k) => ({ label: words[k], cells: l.length ? l.map((v, j) => ({ id: `l${k}:${j}`, v })) : [{ id: `l${k}:x`, v: "∅", m: "bug" }] })), panels: panel(words) }, vars: {}, say: `"${words[lists.findIndex((l) => !l.length)]}" appears in no document: the AND is empty.` }); return Tr.done([]); }
      const order = words.map((w, k) => ({ w, l: lists[k] })).sort((a, b) => a.l.length - b.l.length);
      Tr.add({ at: "short", state: { rows: order.map((o, k) => ({ label: o.w, cells: o.l.map((v, j) => ({ id: `o${k}:${j}`, v })) })), panels: panel(words) }, vars: {}, say: "Start from the shortest list: the result can never be longer than it." });
      let acc = order[0].l, accName = order[0].w;
      for (let t = 1; t < order.length; t++) {
        const b = order[t].l, out = [];
        let i = 0, j = 0;
        const st = () => ({ rows: [{ label: accName, cells: acc.map((v, k) => ({ id: `a:${v}`, v, m: out.includes(v) ? "answer" : k === i ? "p1" : null })), ptrs: i < acc.length ? [{ name: "i", at: i, role: "p1" }] : [] }, { label: order[t].w, cells: b.map((v, k) => ({ id: `b${t}:${k}`, v, m: out.includes(v) ? "answer" : k === j ? "p2" : null })), ptrs: j < b.length ? [{ name: "j", at: j, role: "p2" }] : [] }], panels: panel(words) });
        while (i < acc.length && j < b.length) {
          if (acc[i] === b[j]) { out.push(acc[i]); Tr.add({ at: "both", state: st(), vars: { doc: acc[i] }, say: `Both lists have document ${acc[i]}: keep it, move both pointers.` }); i++; j++; }
          else if (acc[i] < b[j]) { Tr.add({ at: "adv", state: st(), vars: { [accName]: acc[i], [order[t].w]: b[j] }, say: `${acc[i]} < ${b[j]}: document ${acc[i]} cannot be in the other list later (it is sorted). Move i.` }); i++; }
          else { Tr.add({ at: "adv", state: st(), vars: { [accName]: acc[i], [order[t].w]: b[j] }, say: `${b[j]} < ${acc[i]}: move j.` }); j++; }
        }
        acc = out; accName = `${accName} AND ${order[t].w}`;
      }
      Tr.add({ state: { rows: [{ label: "result", cells: acc.length ? acc.map((v) => ({ id: "r" + v, v, m: "answer" })) : [{ id: "r-", v: "∅" }] }], panels: panel(words) }, vars: { result: `[${acc.join(", ")}]` }, say: `Documents [${acc.join(", ")}] contain every query word. Merging sorted lists costs their total length, like the merge step of merge sort.` });
      return Tr.done(acc);
    },
  };

  G.quizzes.knn28 = {
    title: "k-NN and beyond",
    items: [
      { q: "One feature ranges 0–10,000, another 0–1. Without normalizing, k-NN…", options: ["ignores the small feature in practice", "weights them equally", "fails to run", "becomes exact"], answer: 0, why: "Distances are dominated by the feature with the biggest scale." },
      { q: "Two classes, k = 4. The risk?", options: ["Ties (2 to 2): prefer an odd k or a tie-break", "Too slow", "Overfitting to one point", "None"], answer: 0, why: "Odd k avoids ties with two classes." },
      { q: "A Bloom filter answers \"not present\". Can that be wrong?", options: ["No: a 0 bit proves it was never added", "Yes, sometimes", "Only when the filter is full", "Only with k = 1"], answer: 0, why: "False positives are possible; false negatives are not." },
      { q: "K closest points with a heap: which heap, and what size?", options: ["A max-heap of size k, worst kept point on top", "A min-heap of all points", "A max-heap of all points", "A min-heap of size k"], answer: 0, why: "The top is the point to evict when a closer one arrives." },
      { q: "Near-duplicate search over a billion documents: exact k-NN or LSH?", options: ["LSH: similar items hash to the same buckets, so you compare only a few", "Exact k-NN: it is always better", "A Bloom filter", "Binary search"], answer: 0, why: "Exact search compares against everything; LSH trades a little accuracy for huge speed." },
    ],
  };
})();

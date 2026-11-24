/* Algorithm guide v3 — shared drawing pieces and extra renderers: map panels, call trees, grids, heaps.
   Loaded after array.js. All renderers return {x, y, w, h} like G.viz.array. */
(function () {
  "use strict";
  const G = window.Guide;

  /* one value box (same look as array cells) */
  G.drawCell = function (scene, key, x, y, w, h, v, mark, cls, layer) {
    const g = scene.el(key, "g", layer || "mid");
    if (g.__fresh) { G.svgEl("rect", { rx: 7 }, g); G.svgEl("text", {}, g); }
    G.attr(g.children[0], { width: w, height: h });
    G.attr(g.children[1], { x: w / 2, y: h / 2 });
    g.setAttribute("class", "cell" + (mark ? " m-" + mark : "") + (cls ? " " + cls : ""));
    const s = v == null ? "" : String(v);
    G.setText(g.children[1], s);
    g.children[1].style.fontSize = s.length > 6 ? "11px" : s.length > 4 ? "12.5px" : s.length > 2 ? "14.5px" : "";
    G.place(g, x, y);
    return g;
  };
  G.drawText = function (scene, key, x, y, text, cls, anchor, layer) {
    const t = scene.el(key, "text", layer || "back");
    G.attr(t, { x, y, class: cls || "lbl", "text-anchor": anchor || "start", "dominant-baseline": "central" });
    G.setText(t, text);
    return t;
  };
  G.drawLine = function (scene, key, x1, y1, x2, y2, cls, layer) {
    const l = scene.el(key, "line", layer || "back");
    G.attr(l, { x1, y1, x2, y2, class: cls || "edge" });
    return l;
  };

  /* key -> value panels: [{title, entries: [[k, v], ...], hi?: [k], mark?: {k: mark}, keyW?, valW?}] */
  G.drawPanels = function (scene, panels, x0, y0) {
    let x = x0, maxY = y0;
    panels.forEach((p, pi) => {
      const kw = p.keyW || 58, vw = p.valW || (p.entries.some((e) => e.length > 1) ? 58 : 0), h = 26, gap = 4;
      G.drawText(scene, `pt${pi}`, x, y0 + 8, p.title, "lbl panel-title");
      let y = y0 + 22;
      if (!p.entries.length) { G.drawText(scene, `pe${pi}`, x, y + 13, p.empty || "(empty)", "lbl"); y += h + gap; }
      p.entries.forEach((e) => {
        const k = e[0];
        const mark = (p.mark && p.mark[k]) || (p.hi && p.hi.includes(k) ? "focus" : null);
        G.drawCell(scene, `pk${pi}:${k}`, x, y, kw, h, k, mark, "kv-key");
        if (vw) G.drawCell(scene, `pv${pi}:${k}`, x + kw + 3, y, vw, h, G.show(e[1]).replace(/^"|"$/g, ""), mark, "kv-val");
        y += h + gap;
      });
      maxY = Math.max(maxY, y);
      x += kw + (vw ? vw + 3 : 0) + 28;
    });
    return { w: x, h: maxY };
  };

  /* call tree / any rooted tree:
     st = { nodes: [{id, label, parent, m, sub}], stack?: [labels], colW?, title? } */
  G.viz.tree = function (scene, st) {
    const nodes = st.nodes || [];
    const kids = new Map(), byId = new Map();
    nodes.forEach((n) => { byId.set(n.id, n); kids.set(n.id, []); });
    const roots = [];
    nodes.forEach((n) => (n.parent == null || !byId.has(n.parent) ? roots.push(n) : kids.get(n.parent).push(n)));
    const colW = st.colW || Math.max(58, 12 + 8 * Math.max(4, ...nodes.map((n) => String(n.label).length))), rowH = st.rowH || 72;
    const NW = colW - 8, NH = 30;
    let leaf = 0;
    const pos = new Map();
    const place = (n, d) => {
      const ch = kids.get(n.id);
      let x;
      if (!ch.length) x = leaf++ * colW;
      else { const xs = ch.map((c) => place(c, d + 1)); x = (xs[0] + xs[xs.length - 1]) / 2; }
      pos.set(n.id, { x, y: d * rowH });
      return x;
    };
    roots.forEach((r) => place(r, 0));
    const left0 = st.stack ? 150 : 12, top0 = 10;
    let maxD = 0;
    nodes.forEach((n) => {
      const p = pos.get(n.id);
      maxD = Math.max(maxD, p.y);
      const x = left0 + p.x, y = top0 + p.y;
      if (n.parent != null && pos.has(n.parent)) {
        const q = pos.get(n.parent);
        // edges start below the returned value printed under each box
        G.drawLine(scene, `te${n.id}`, left0 + q.x + NW / 2, top0 + q.y + NH + 17, x + NW / 2, y, "edge" + (n.m === "ghost" ? " ghost" : ""));
      }
      G.drawCell(scene, `tn${n.id}`, x, y, NW, NH, n.label, n.m, "tnode");
      if (n.sub != null) G.drawText(scene, `ts${n.id}`, x + NW / 2, y + NH + 9, n.sub, "lbl tsub", "middle", "front");
    });
    let w = left0 + Math.max(1, leaf) * colW, h = top0 + maxD + NH + 22;
    if (st.stack) {
      G.drawText(scene, "stk-t", 8, 10, "call stack (top first)", "lbl panel-title");
      const items = st.stack.slice().reverse();
      items.forEach((s, i) => G.drawCell(scene, `stk:${st.stack.length - 1 - i}`, 8, 24 + i * 30, 124, 26, s, i === 0 ? "focus" : null, "kv-key"));
      h = Math.max(h, 30 + items.length * 30);
    }
    if (st.note) { G.drawText(scene, "note", left0, h + 6, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 24; }
    return { x: 0, y: 0, w, h };
  };

  /* grid: st = { cells: [[{v, m}]], rowLabels?, colLabels?, cell?, note? } */
  G.viz.grid = function (scene, st) {
    const C = st.cell || 34, gap = 3;
    const rows = st.cells.length, cols = rows ? st.cells[0].length : 0;
    const left0 = st.rowLabels ? (st.labelW || 44) : 6, top0 = st.colLabels ? 22 : 6;
    if (st.colLabels) st.colLabels.forEach((t, c) => G.drawText(scene, `gc${c}`, left0 + c * (C + gap) + C / 2, 10, t, "idx", "middle"));
    st.cells.forEach((row, r) => {
      if (st.rowLabels) G.drawText(scene, `gr${r}`, left0 - 8, top0 + r * (C + gap) + C / 2, st.rowLabels[r], "row-label", "end");
      row.forEach((cell, c) => G.drawCell(scene, `g${r}:${c}`, left0 + c * (C + gap), top0 + r * (C + gap), C, C, cell.v, cell.m, cell.cls));
    });
    let h = top0 + rows * (C + gap) + 4;
    if (st.note) { G.drawText(scene, "note", left0, h + 12, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 26; }
    const pw = st.panels ? G.drawPanels(scene, st.panels, left0 + cols * (C + gap) + 24, top0) : null;
    return { x: 0, y: 0, w: Math.max(left0 + cols * (C + gap) + 6, pw ? pw.w : 0), h: Math.max(h, pw ? pw.h : 0) };
  };

  /* heap: an array drawn twice, as a tree and as a row. st = { items: [{id, v}], marks?: {index: mark}, note?, panels? } */
  G.viz.heap = function (scene, st) {
    const items = st.items || [];
    const n = items.length;
    const levels = Math.max(1, Math.ceil(Math.log2(n + 1)));
    const NW = 44, NH = 34, rowH = 62;
    const W = Math.max(5, 2 ** (levels - 1)) * (NW + 12);
    const xy = (i) => { const d = Math.floor(Math.log2(i + 1)), slot = i - (2 ** d - 1), span = W / 2 ** d; return { x: 10 + span * slot + span / 2 - NW / 2, y: 8 + d * rowH }; };
    for (let i = 1; i < n; i++) { const a = xy(Math.floor((i - 1) / 2)), b = xy(i); G.drawLine(scene, `he${i}`, a.x + NW / 2, a.y + NH, b.x + NW / 2, b.y, "edge"); }
    items.forEach((it, i) => {
      const p = xy(i), m = st.marks && st.marks[i];
      G.drawCell(scene, `ht${it.id}`, p.x, p.y, NW, NH, it.v, m, "tnode");
      G.drawText(scene, `hi${i}`, p.x + NW / 2, p.y - 6, i, "idx", "middle");
    });
    const ay = 8 + levels * rowH + 18, CW = 42;
    G.drawText(scene, "harr", 10, ay - 10, "the same heap as an array", "lbl");
    items.forEach((it, i) => {
      G.drawCell(scene, `ha${it.id}`, 10 + i * (CW + 5), ay, CW, 36, it.v, st.marks && st.marks[i]);
      G.drawText(scene, `hai${i}`, 10 + i * (CW + 5) + CW / 2, ay + 48, i, "idx", "middle");
    });
    let h = ay + 60;
    if (st.note) { G.drawText(scene, "note", 10, h + 6, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 26; }
    let w = Math.max(W + 20, 20 + n * (CW + 5));
    if (st.panels) { const p = G.drawPanels(scene, st.panels, w + 10, 8); w = p.w; h = Math.max(h, p.h); }
    return { x: 0, y: 0, w, h };
  };

  /* linked list: st = { nodes: [{id, v, c, r, m}], next: {id: targetId | null}, ptrs: [{name, id, role}], hot?: [ids whose arrow just changed], note } */
  G.viz.list = function (scene, st) {
    const NW = 46, NH = 34, GX = 38, RH = 104, X0 = 24, Y0 = 46;
    const pos = {};
    st.nodes.forEach((n) => { pos[n.id] = { x: X0 + n.c * (NW + GX), y: Y0 + (n.r || 0) * RH }; });
    let maxX = 0, maxY = 0;
    st.nodes.forEach((n) => {
      const p = pos[n.id];
      G.drawCell(scene, `ln${n.id}`, p.x, p.y, NW, NH, n.v, n.m, n.cls);
      maxX = Math.max(maxX, p.x + NW); maxY = Math.max(maxY, p.y + NH);
      const to = st.next[n.id];
      const path = scene.el(`la${n.id}`, "path", "back"), head = scene.el(`lh${n.id}`, "path", "back");
      const hot = st.hot && st.hot.includes(n.id) ? " hot" : "";
      path.setAttribute("class", "arrow" + hot); head.setAttribute("class", "arrowhead" + hot);
      const nul = scene.el(`lz${n.id}`, "text", "back");
      if (to == null || !pos[to]) {
        G.attr(path, { d: `M${p.x + NW},${p.y + NH / 2} L${p.x + NW + 14},${p.y + NH / 2}` });
        G.attr(head, { d: "" });
        G.attr(nul, { x: p.x + NW + 18, y: p.y + NH / 2, class: "lbl lnull", "dominant-baseline": "central" });
        G.setText(nul, to === undefined ? "" : "∅");
        maxX = Math.max(maxX, p.x + NW + 34);
        return;
      }
      G.setText(nul, "");
      const q = pos[to];
      let d, ex, ey, ang;
      if (q.y === p.y && q.x > p.x) { ex = q.x - 2; ey = q.y + NH / 2; d = `M${p.x + NW},${p.y + NH / 2} L${ex},${ey}`; ang = 0; }
      else {
        const tx = q.x + NW / 2, sx = p.x + NW / 2;
        if (q.y === p.y) { // same row, pointing backward: loop underneath
          const sy = p.y + NH; ex = tx; ey = q.y + NH + 2;
          const dip = sy + 34 + Math.abs(tx - sx) * 0.08;
          d = `M${sx},${sy} C${sx},${dip} ${tx},${dip} ${ex},${ey}`; ang = -Math.PI / 2; maxY = Math.max(maxY, dip + 6);
        } else if (q.y > p.y) { // target in a lower row
          const sy = p.y + NH; ex = tx; ey = q.y - 2; const mid = (sy + ey) / 2;
          d = `M${sx},${sy} C${sx},${mid} ${tx},${mid} ${ex},${ey}`; ang = Math.PI / 2;
        } else { // target in a higher row
          const sy = p.y; ex = tx; ey = q.y + NH + 2; const mid = (sy + ey) / 2;
          d = `M${sx},${sy} C${sx},${mid} ${tx},${mid} ${ex},${ey}`; ang = -Math.PI / 2;
        }
      }
      G.attr(path, { d });
      const a = 7, l = (t) => [ex - Math.cos(ang + t) * a, ey - Math.sin(ang + t) * a];
      const [x1, y1] = l(0.5), [x2, y2] = l(-0.5);
      G.attr(head, { d: `M${ex},${ey} L${x1},${y1} L${x2},${y2} Z` });
    });
    const used = {};
    (st.ptrs || []).forEach((pt) => {
      const p = pos[pt.id];
      const t = scene.el(`lp${pt.name}`, "text", "front");
      if (!p) { t.style.opacity = "0"; return; }
      const lane = (used[pt.id] = (used[pt.id] || 0) + 1) - 1;
      G.attr(t, { class: `lptr r-${pt.role || "p1"}`, "text-anchor": "middle" });
      t.style.opacity = "1";
      t.style.transform = `translate(${p.x + NW / 2}px, ${p.y - 8 - lane * 14}px)`;
      G.setText(t, pt.name);
    });
    let h = maxY + 16;
    if (st.note) { G.drawText(scene, "note", X0, h + 6, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 24; }
    return { x: 0, y: 0, w: maxX + 30, h };
  };

  /* binary tree laid out by in-order position:
     st = { nodes: {id: {v, l, r}}, root, marks: {id: mark}, sub: {id: text}, ptrs: [{name, id, role}], panels, note, rows } */
  G.btreeFromLevel = function (vals) {
    const nodes = {};
    if (!vals.length || vals[0] == null) return { nodes, root: null };
    let id = 0;
    const mk = (v) => { const n = id++; nodes[n] = { v, l: null, r: null }; return n; };
    const root = mk(vals[0]);
    const q = [root];
    let h = 0, i = 1;
    while (h < q.length && i < vals.length) {
      const n = q[h++];
      if (vals[i] != null) { nodes[n].l = mk(vals[i]); q.push(nodes[n].l); }
      i++;
      if (i < vals.length) { if (vals[i] != null) { nodes[n].r = mk(vals[i]); q.push(nodes[n].r); } i++; }
    }
    return { nodes, root };
  };
  G.viz.btree = function (scene, st) {
    const NW = 40, NH = 32, CW = 44, RH = 62, X0 = 14, Y0 = 26;
    const pos = {};
    let k = 0, maxD = 0;
    // st.roots (optional) draws a forest, e.g. mid-rotation when a node is briefly held only by a variable
    const lay = (n, d) => { if (n == null || !st.nodes[n] || pos[n]) return; lay(st.nodes[n].l, d + 1); pos[n] = { x: X0 + k++ * CW, y: Y0 + d * RH }; maxD = Math.max(maxD, d); lay(st.nodes[n].r, d + 1); };
    (st.roots || [st.root]).forEach((r) => lay(r, 0));
    Object.keys(pos).forEach((id) => {
      const n = st.nodes[id], p = pos[id];
      [n.l, n.r].forEach((c, side) => { const e = scene.el(`be${id}:${side}`, "line", "back"); if (c != null && pos[c]) { G.attr(e, { x1: p.x + NW / 2, y1: p.y + NH, x2: pos[c].x + NW / 2, y2: pos[c].y, class: "edge" }); e.style.opacity = "1"; } else e.style.opacity = "0"; });
      G.drawCell(scene, `bn${id}`, p.x, p.y, NW, NH, n.v, st.marks && st.marks[id], "tnode");
      const sub = scene.el(`bs${id}`, "text", "front");
      G.attr(sub, { x: p.x + NW / 2, y: p.y + NH + 11, class: "lbl tsub", "text-anchor": "middle" });
      G.setText(sub, st.sub && st.sub[id] != null ? st.sub[id] : "");
    });
    const used = {};
    (st.ptrs || []).forEach((pt) => {
      const t = scene.el(`bp${pt.name}`, "text", "front");
      const p = pos[pt.id];
      if (!p) { t.style.opacity = "0"; return; }
      const lane = (used[pt.id] = (used[pt.id] || 0) + 1) - 1;
      G.attr(t, { class: `lptr r-${pt.role || "p1"}`, "text-anchor": "middle" });
      t.style.opacity = "1";
      t.style.transform = `translate(${p.x + NW / 2}px, ${p.y - 6 - lane * 13}px)`;
      G.setText(t, pt.name);
    });
    let w = X0 + Math.max(1, k) * CW + 10, h = Y0 + maxD * RH + NH + 24;
    if (st.note) { G.drawText(scene, "note", X0, h + 4, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 24; }
    if (st.panels) { const pw = G.drawPanels(scene, st.panels, w + 16, 10); w = pw.w; h = Math.max(h, pw.h); }
    return { x: 0, y: 0, w, h };
  };
})();

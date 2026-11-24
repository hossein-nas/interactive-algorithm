/* Algorithm guide v3 — graph renderer for lessons 19-22 (BFS/DFS, topological sort, union-find, shortest paths).
   st = {
     nodes: [{id, label?, m?, sub?}],
     edges: [{a, b, m?, w?}]          m: "hot" | "tree" | "answer" | "dim" | "bug"; w: a weight label
     directed?: bool,
     layout?: "layers" (default: columns by BFS distance from st.root) | {id: [col, row]} (explicit grid slots),
     root?: id, strip?: {title, items: [labels], mark?: {index: mark}}, panels?, note?
   } */
(function () {
  "use strict";
  const G = window.Guide;
  const NW = 40, NH = 32, CW = 92, X0 = 16, Y0 = 16;
  let RH = 62; // taller rows when edges carry weight labels, so labels clear the distance text

  function layers(st) {
    const adj = new Map(st.nodes.map((n) => [n.id, []]));
    st.edges.forEach((e) => { if (adj.has(e.a) && adj.has(e.b)) { adj.get(e.a).push(e.b); adj.get(e.b).push(e.a); } });
    const col = new Map();
    const cols = [];
    let base = 0;
    const order = st.root != null && adj.has(st.root) ? [st.root].concat(st.nodes.map((n) => n.id).filter((id) => id !== st.root)) : st.nodes.map((n) => n.id);
    order.forEach((s) => {
      if (col.has(s)) return;
      const q = [s];
      col.set(s, base);
      let deepest = base;
      for (let h = 0; h < q.length; h++) {
        const u = q[h], c = col.get(u);
        (cols[c] = cols[c] || []).push(u);
        deepest = Math.max(deepest, c);
        adj.get(u).forEach((v) => { if (!col.has(v)) { col.set(v, c + 1); q.push(v); } });
      }
      base = deepest + 1;
    });
    const tall = Math.max(1, ...cols.map((c) => (c ? c.length : 0)));
    const pos = {};
    cols.forEach((ids, c) => (ids || []).forEach((id, i) => (pos[id] = { x: X0 + c * CW, y: Y0 + (i + (tall - ids.length) / 2) * RH })));
    return pos;
  }

  G.viz.graph = function (scene, st) {
    RH = st.edges.some((e) => e.w != null) ? 86 : 62;
    const pos = st.layout && typeof st.layout === "object" ? Object.fromEntries(Object.entries(st.layout).map(([id, [c, r]]) => [id, { x: X0 + c * CW, y: Y0 + r * RH }])) : layers(st);
    let maxX = 0, maxY = 0;
    const subOf = Object.fromEntries(st.nodes.map((n) => [n.id, n.sub != null && n.sub !== ""]));
    // edges first, trimmed to the box borders, with an arrowhead when directed
    st.edges.forEach((e) => {
      const p = pos[e.a], q = pos[e.b];
      const key = `ge${e.a}>${e.b}`;
      if (!p || !q) return;
      // a node with a label underneath counts as a taller box, so edges stop clear of the label
      const hA = NH + (subOf[e.a] ? 15 : 0), hB = NH + (subOf[e.b] ? 15 : 0);
      const cx1 = p.x + NW / 2, cy1 = p.y + hA / 2, cx2 = q.x + NW / 2, cy2 = q.y + hB / 2;
      const dx = cx2 - cx1, dy = cy2 - cy1, len = Math.hypot(dx, dy) || 1;
      const trim = (ux, uy, hh) => { const tx = Math.abs(ux) > 1e-6 ? (NW / 2 + 2) / Math.abs(ux) : Infinity, ty = Math.abs(uy) > 1e-6 ? (hh / 2 + 2) / Math.abs(uy) : Infinity; return Math.min(tx, ty); };
      const ux = dx / len, uy = dy / len, t1 = trim(ux, uy, hA), t2 = trim(ux, uy, hB);
      const x1 = cx1 + ux * t1, y1 = cy1 + uy * t1, x2 = cx2 - ux * t2, y2 = cy2 - uy * t2;
      const cls = "edge g-edge" + (e.m ? " e-" + e.m : "");
      G.drawLine(scene, key, x1, y1, x2, y2, cls);
      if (st.directed) {
        const head = scene.el(key + "h", "path", "back");
        const a = 8, ang = Math.atan2(uy, ux), l = (s) => [x2 - Math.cos(ang + s) * a, y2 - Math.sin(ang + s) * a];
        const [hx1, hy1] = l(0.45), [hx2, hy2] = l(-0.45);
        G.attr(head, { d: `M${x2},${y2} L${hx1},${hy1} L${hx2},${hy2} Z`, class: "g-head" + (e.m ? " e-" + e.m : "") });
      }
      if (e.w != null) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const bg = scene.el(key + "wb", "rect", "back");
        const s = String(e.w);
        G.attr(bg, { x: mx - (s.length * 4 + 5), y: my - 9, width: s.length * 8 + 10, height: 18, rx: 5, class: "g-wbg" });
        G.drawText(scene, key + "w", mx, my, s, "g-w" + (e.m ? " e-" + e.m : ""), "middle");
      }
    });
    st.nodes.forEach((n) => {
      const p = pos[n.id];
      if (!p) return;
      G.drawCell(scene, `gn${n.id}`, p.x, p.y, NW, NH, n.label != null ? n.label : n.id, n.m, "tnode");
      const sub = scene.el(`gs${n.id}`, "text", "front");
      G.attr(sub, { x: p.x + NW / 2, y: p.y + NH + 11, class: "lbl tsub", "text-anchor": "middle" });
      G.setText(sub, n.sub != null ? n.sub : "");
      maxX = Math.max(maxX, p.x + NW); maxY = Math.max(maxY, p.y + NH + (n.sub != null ? 16 : 0));
    });
    let h = maxY + 10, w = maxX + 16;
    if (st.strip) {
      const y = h + 16;
      G.drawText(scene, "gst", X0, y, st.strip.title, "lbl panel-title");
      const items = st.strip.items || [];
      if (!items.length) G.drawText(scene, "gse", X0 + 8, y + 28, "(empty)", "lbl");
      items.forEach((it, i) => G.drawCell(scene, `gsi${i}`, X0 + i * 44, y + 14, 40, 30, it, st.strip.mark && st.strip.mark[i]));
      w = Math.max(w, X0 + items.length * 44 + 10);
      h = y + 52;
    }
    if (st.note) { G.drawText(scene, "note", X0, h + 8, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 28; }
    if (st.panels) { const pw = G.drawPanels(scene, st.panels, w + 18, 10); w = pw.w; h = Math.max(h, pw.h); }
    return { x: 0, y: 0, w, h };
  };
})();

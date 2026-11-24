/* Algorithm guide v3 — array / string renderer.
   state: { rows: [row], note?: {text, cls} }  or a single row object.
   row:   { label?, cells: [{id, v, m?, cls?}], marks?: {index: mark}, ptrs?: [{name, at, role, side?}],
            zones?: [{from, to, label, cls}], boundary?: index, boundaryLabel?, fly?: {from, to, v} }
   marks: p1 | p2 | focus | anchor | done | answer | bug | ghost.  roles: p1 | p2 | focus | anchor. */
(function () {
  "use strict";
  const G = window.Guide;
  const LANE = 15;

  function drawPtr(scene, key, x, yEdge, lane, p, above) {
    const g = scene.el(key, "g", "front");
    if (g.__fresh) {
      G.svgEl("path", { class: "stem" }, g);
      G.svgEl("path", { class: "tip" }, g);
      G.svgEl("text", {}, g);
    }
    g.setAttribute("class", `ptr r-${p.role || "p1"}`);
    // pointers sharing a cell share one arrow; extra names stack under the first label
    const [stem, tip, t] = g.children;
    stem.style.opacity = tip.style.opacity = lane ? "0" : "1";
    if (above) {
      G.attr(stem, { d: "M0,-12 L0,-6" });
      G.attr(tip, { d: "M-5,-8 L0,-1 L5,-8 Z" });
      G.attr(t, { y: -17 - lane * 15 });
    } else {
      G.attr(stem, { d: "M0,12 L0,6" });
      G.attr(tip, { d: "M-5,8 L0,1 L5,8 Z" });
      G.attr(t, { y: 25 + lane * 15 });
    }
    G.setText(t, p.name);
    G.place(g, x, yEdge);
    g.style.opacity = p.hidden ? "0" : "1";
  }

  G.viz.array = function (scene, st, ctx) {
    const rows = st.rows || [st];
    const W = st.cellW || 50, H = st.cellH || 48, GAP = st.gap != null ? st.gap : 8;
    const hasLabels = rows.some((r) => r.label);
    const left0 = hasLabels ? (st.labelW || 86) : 14;
    const X = (i) => left0 + i * (W + GAP);
    let y = 6;
    let maxRight = 0, minLeft = 0;
    const rowY = [];
    rows.forEach((row, ri) => {
      const cells = row.cells || [];
      const ptrs = row.ptrs || [];
      const above = ptrs.filter((p) => p.side === "above");
      const below = ptrs.filter((p) => p.side !== "above");
      const lanes = (list) => {
        const used = {};
        return list.map((p) => { const k = p.hidden ? "h" + p.name : p.at; used[k] = used[k] == null ? 0 : used[k] + 1; return used[k]; });
      };
      const la = lanes(above), lb = lanes(below);
      const topPad = above.length ? 24 + (above.length - 1) * LANE : 0;
      const idxH = st.indices === false ? 0 : 16;
      const cy = y + topPad + idxH;
      if (row.label) {
        const t = scene.el(`rl${ri}`, "text", "back");
        G.attr(t, { x: left0 - 14, y: cy + H / 2, class: "row-label" });
        G.setText(t, row.label);
      }
      cells.forEach((c, i) => {
        const key = `c${ri}:${c.id != null ? c.id : i}`;
        const g = scene.el(key, "g", "mid");
        if (g.__fresh) {
          G.svgEl("rect", { width: W, height: H, rx: 7 }, g);
          G.svgEl("text", { x: W / 2, y: H / 2 }, g);
        }
        const m = (row.marks && row.marks[i]) || c.m;
        g.setAttribute("class", "cell" + (m ? " m-" + m : "") + (c.cls ? " " + c.cls : ""));
        G.place(g, X(i), cy);
        const v = c.v === " " ? "␣" : c.v == null ? "" : c.v;
        G.setText(g.children[1], v);
        g.children[1].style.fontSize = String(v).length > 3 ? "13px" : String(v).length > 2 ? "15px" : "";
        if (st.indices !== false) {
          const it = scene.el(`ix${ri}:${i}`, "text", "back");
          G.attr(it, { x: X(i) + W / 2, y: cy - 6, class: "idx", "text-anchor": "middle" });
          G.setText(it, i);
        }
      });
      maxRight = Math.max(maxRight, X(cells.length) - GAP);
      if (row.boundary != null) {
        const b = scene.el(`bd${ri}`, "g", "front");
        if (b.__fresh) { G.svgEl("line", { class: "boundary", x1: 0, x2: 0, y1: -8, y2: H + 8 }, b); G.svgEl("text", { class: "lbl", y: -12, "text-anchor": "middle" }, b); }
        G.place(b, X(row.boundary) - GAP / 2, cy);
        G.setText(b.children[1], row.boundaryLabel || "");
      }
      // pointers
      above.forEach((p, k) => { drawPtr(scene, `pa${ri}:${p.name}`, X(p.at) + W / 2, cy - (idxH ? idxH - 2 : 0), la[k], p, true); minLeft = Math.min(minLeft, X(p.at) - 4); maxRight = Math.max(maxRight, X(p.at) + W); });
      below.forEach((p, k) => { drawPtr(scene, `pb${ri}:${p.name}`, X(p.at) + W / 2, cy + H, lb[k], p, false); minLeft = Math.min(minLeft, X(p.at) - 4); maxRight = Math.max(maxRight, X(p.at) + W); });
      const ptrH = below.length ? 32 + (Math.max(0, ...lb)) * LANE : 6;
      const reserved = below.length ? 32 + (below.length - 1) * LANE : 6;
      let zy = cy + H + Math.max(ptrH, reserved);
      // zones (brackets under ranges)
      (row.zones || []).forEach((z, zi) => {
        const g = scene.el(`z${ri}:${z.key || zi}`, "g", "back");
        if (g.__fresh) { G.svgEl("path", {}, g); G.svgEl("text", {}, g); }
        g.setAttribute("class", `zone z-${z.cls || "soft"}`);
        const empty = z.to < z.from;
        const x1 = X(z.from) + 2, x2 = X(Math.max(z.from, z.to)) + W - 2;
        G.attr(g.children[0], { d: `M${x1},0 L${x1},6 L${x2},6 L${x2},0` });
        G.attr(g.children[1], { x: (x1 + x2) / 2, y: 22 });
        G.setText(g.children[1], z.label || "");
        g.style.opacity = empty ? "0" : "1";
        G.place(g, 0, zy);
      });
      if ((row.zones || []).length) zy += 32;
      rowY[ri] = cy;
      y = zy + (st.rowGap != null ? st.rowGap : 10);
    });
    // a value travelling from one cell to another (possibly across rows)
    if (st.fly && !G.reducedMotion()) {
      const f = st.fly;
      const g = scene.el(`fly:${scene.flyN++}`, "g", "top");
      G.svgEl("rect", { width: W, height: H, rx: 7 }, g);
      G.svgEl("text", { x: W / 2, y: H / 2 }, g);
      g.setAttribute("class", "cell m-focus fly");
      G.setText(g.children[1], f.v);
      G.place(g, X(f.from), rowY[f.fromRow || 0]);
      scene.defer(() => { G.place(g, X(f.to), rowY[f.toRow || 0]); g.style.opacity = "0"; });
    }
    if (st.panels) { const pw = G.drawPanels(scene, st.panels, maxRight + 30, 6); maxRight = pw.w; y = Math.max(y, pw.h + 6); }
    if (st.note) {
      const t = scene.el("note", "text", "top");
      G.attr(t, { x: left0, y: y + 8, class: "result-t" + (st.note.cls ? " " + st.note.cls : "") });
      G.setText(t, st.note.text);
      y += 26;
    }
    return { x: Math.min(0, minLeft - 6), y: 0, w: Math.max(maxRight + 16, st.minW || 0), h: y + 4 };
  };

  /* helpers for traces */
  G.cells = (arr, ids) => arr.map((v, i) => ({ id: ids ? ids[i] : i, v }));
})();

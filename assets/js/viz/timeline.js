/* Algorithm guide v3 — interval timeline for lessons 23-24.
   st = { lo, hi, rows: [{id, a, b, label?, m?}], lines?: [{x, label?, m?}], note?, panels?, width? }
   Each row is a bar on its own lane, in the order given (so re-sorting makes bars glide).
   m: focus | answer | done | bug | p1 | p2 | anchor. lines: vertical markers such as "last end". */
(function () {
  "use strict";
  const G = window.Guide;
  const X0 = 64, LANE = 32, BH = 22, TOP = 26;

  G.viz.timeline = function (scene, st) {
    const W = st.width || 520;
    const lo = st.lo, hi = st.hi > st.lo ? st.hi : st.lo + 1;
    const sx = (x) => X0 + ((x - lo) / (hi - lo)) * W;
    const rows = st.rows || [];
    // axis with readable ticks
    const span = hi - lo, raw = span / 10, mag = 10 ** Math.floor(Math.log10(raw || 1));
    const step = [1, 2, 5, 10].map((k) => k * mag).find((k) => span / k <= 12) || mag * 10;
    const axisY = TOP + rows.length * LANE + 6;
    G.drawLine(scene, "tl-axis", sx(lo), axisY, sx(hi), axisY, "edge");
    let k = 0;
    for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step, k++) {
      G.drawLine(scene, `tl-tk${k}`, sx(t), axisY, sx(t), axisY + 5, "edge");
      G.drawText(scene, `tl-tl${k}`, sx(t), axisY + 16, +t.toFixed(2), "idx", "middle");
    }
    rows.forEach((r, i) => {
      const y = TOP + i * LANE;
      const g = scene.el(`tl-b${r.id}`, "g", "mid");
      if (g.__fresh) { G.svgEl("rect", { rx: 6 }, g); G.svgEl("text", {}, g); }
      const w = Math.max(4, sx(r.b) - sx(r.a));
      G.attr(g.children[0], { width: w, height: BH });
      G.attr(g.children[1], { x: w / 2, y: BH / 2 + 1, "text-anchor": "middle", "dominant-baseline": "central" });
      G.setText(g.children[1], r.label != null ? r.label : `${r.a}–${r.b}`);
      g.setAttribute("class", "tl-bar" + (r.m ? " m-" + r.m : ""));
      G.place(g, sx(r.a), y);
      G.drawText(scene, `tl-n${r.id}`, X0 - 10, y + BH / 2, r.name != null ? r.name : "", "row-label", "end");
    });
    (st.lines || []).forEach((ln, i) => {
      const x = sx(Math.max(lo, Math.min(hi, ln.x)));
      const l = G.drawLine(scene, `tl-ln${i}`, x, TOP - 14, x, axisY, "tl-line" + (ln.m ? " m-" + ln.m : ""), "front");
      l.style.opacity = ln.x === -Infinity || ln.x === Infinity ? "0" : "1";
      const t = G.drawText(scene, `tl-lt${i}`, x, TOP - 18, ln.label || "", "lbl tl-ltext" + (ln.m ? " m-" + ln.m : ""), "middle", "front");
      t.style.opacity = l.style.opacity;
    });
    let h = axisY + 28, w = X0 + W + 24;
    if (st.note) { G.drawText(scene, "note", X0, h + 6, st.note.text, "result-t" + (st.note.cls ? " " + st.note.cls : "")); h += 28; }
    if (st.panels) { const p = G.drawPanels(scene, st.panels, w + 8, 10); w = p.w; h = Math.max(h, p.h); }
    return { x: 0, y: 0, w, h };
  };
})();

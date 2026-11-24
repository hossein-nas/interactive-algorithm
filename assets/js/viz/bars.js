/* Algorithm guide v3 — bars renderer (heights, water, containers, a line of people).
   state: { h: [..], marks?: {i: mark}, ptrs?: [{name, at, role}], water?: [..], area?: {l, r, level}, best?: {l, r, level},
            levels?: [{key, role, from, to, v, label}], rows?: [{label, vals, role, cur}], people?: bool, unit?: "ft",
            maxH?, note?: {text, cls} } */
(function () {
  "use strict";
  const G = window.Guide;
  const LANE = 21;

  G.viz.bars = function (scene, st) {
    const h = st.h || [];
    const n = h.length;
    const people = !!st.people;
    const BW = st.bw || (people ? 46 : 34), GAP = st.gap != null ? st.gap : people ? 22 : 6;
    const maxH = Math.max(1, st.maxH || 0, ...h, ...(st.levels || []).map((l) => l.v || 0));
    const U = st.u || Math.min(people ? 22 : 34, 180 / maxH);
    const sideLabels = (st.levels && st.levels.length) || (st.rows && st.rows.length);
    const left0 = sideLabels ? 84 : 24;
    const top = people ? 46 : 26;
    const base = top + maxH * U;
    const X = (i) => left0 + i * (BW + GAP);
    const fmt = (v) => (st.unit ? `${v} ${st.unit}` : String(v));

    const axis = scene.el("axis", "line", "back");
    G.attr(axis, { class: "axis", x1: left0 - 10, x2: X(n) - GAP + 10, y1: base, y2: base });

    // container area (Problem 5) and best-so-far outline
    const box = (key, cls, a) => {
      const r = scene.el(key, "rect", cls === "best" ? "front" : "back");
      r.setAttribute("class", cls);
      if (!a) { r.style.opacity = "0"; return; }
      const x1 = X(a.l) + BW / 2, x2 = X(a.r) + BW / 2;
      Object.assign(r.style, { x: x1 + "px", width: Math.max(0, x2 - x1) + "px", y: base - a.level * U + "px", height: a.level * U + "px", opacity: "" });
    };
    box("area", "area", st.area);
    box("best", "best", st.best);

    for (let i = 0; i < n; i++) {
      const m = st.marks && st.marks[i];
      const x = X(i);
      // water above the bar (Problem 6)
      if (st.water) {
        const w = st.water[i] || 0;
        const wr = scene.el(`w${i}`, "rect", "back");
        wr.setAttribute("class", "water");
        Object.assign(wr.style, { x: x + "px", width: BW + "px", y: base - (h[i] + w) * U + "px", height: w * U + "px", opacity: w ? "1" : "0" });
      }
      if (people) {
        const g = scene.el(`pp${i}`, "g", "mid");
        if (g.__fresh) {
          G.svgEl("rect", { class: "bar", rx: 10 }, g);
          G.svgEl("circle", { r: 11 }, g);
          G.svgEl("text", { class: "lbl", "text-anchor": "middle" }, g);
        }
        g.setAttribute("class", "person" + (m ? " m-" + m : ""));
        const [body, head, t] = g.children;
        const bh = Math.max(0, h[i] * U - 24);
        body.setAttribute("class", "bar" + (m ? " m-" + m : ""));
        Object.assign(body.style, { x: x + 6 + "px", width: BW - 12 + "px", y: base - bh + "px", height: bh + "px" });
        G.attr(head, { cx: x + BW / 2, cy: base - bh - 13 });
        G.attr(t, { x: x + BW / 2, y: base - bh - 32 });
        G.setText(t, fmt(h[i]));
      } else {
        const r = scene.el(`b${i}`, "rect", "mid");
        r.setAttribute("class", "bar" + (m ? " m-" + m : ""));
        Object.assign(r.style, { x: x + "px", width: BW + "px", y: base - h[i] * U + "px", height: Math.max(0.0001, h[i] * U) + "px" });
        const t = scene.el(`bv${i}`, "text", "front");
        G.attr(t, { x: x + BW / 2, y: base - h[i] * U - 6, class: "lbl", "text-anchor": "middle" });
        G.setText(t, h[i]);
      }
      const it = scene.el(`bi${i}`, "text", "back");
      G.attr(it, { x: x + BW / 2, y: base + 15, class: "idx", "text-anchor": "middle" });
      G.setText(it, i);
    }

    // running-maximum lines (leftMax / rightMax)
    (st.levels || []).forEach((lv) => {
      const ln = scene.el(`lv:${lv.key}`, "line", "front");
      const tx = scene.el(`lvt:${lv.key}`, "text", "front");
      const show = lv.to >= lv.from && lv.v > 0;
      ln.setAttribute("class", `level ${lv.role}`);
      tx.setAttribute("class", `level-t ${lv.role}`);
      const x1 = X(lv.from) - 3, x2 = X(lv.to) + BW + 3, y = base - lv.v * U;
      G.attr(ln, { x1, x2, y1: y, y2: y });
      // labels sit in the margins so they never cover the bar values
      G.attr(tx, { x: lv.role === "p2" ? X(n) - GAP + 8 : left0 - 8, y: y + 4, "text-anchor": lv.role === "p2" ? "start" : "end" });
      G.setText(tx, lv.label || "");
      ln.style.opacity = tx.style.opacity = show ? "1" : "0";
    });

    // value rows under the bars (e.g. maxLeft / maxRight arrays)
    let y = base + 24;
    (st.rows || []).forEach((row, ri) => {
      const lab = scene.el(`rowl${ri}`, "text", "back");
      G.attr(lab, { x: left0 - 12, y: y + 10, class: "row-label" });
      G.setText(lab, row.label);
      for (let i = 0; i < n; i++) {
        const t = scene.el(`row${ri}:${i}`, "text", "front");
        const v = row.vals[i];
        G.attr(t, { x: X(i) + BW / 2, y: y + 10, "text-anchor": "middle", "dominant-baseline": "central", class: "rowv" });
        t.style.fontSize = "14px";
        t.style.fill = i === row.cur ? `var(--${row.role === "p2" ? "plum" : row.role === "focus" ? "amber" : "blue"})` : v == null ? "var(--ink-faint)" : "var(--ink)";
        t.style.fontWeight = i === row.cur ? "700" : "400";
        G.setText(t, v == null ? "·" : v);
      }
      y += 26;
    });

    // pointers under the index labels
    const ptrs = st.ptrs || [];
    const used = {};
    const py = y + (st.rows && st.rows.length ? 2 : 0);
    ptrs.forEach((p) => {
      const lane = (used[p.at] = used[p.at] == null ? 0 : used[p.at] + 1);
      const g = scene.el(`bp:${p.name}`, "g", "front");
      if (g.__fresh) { G.svgEl("path", { class: "stem" }, g); G.svgEl("path", { class: "tip" }, g); G.svgEl("text", {}, g); }
      g.setAttribute("class", `ptr r-${p.role || "p1"}`);
      g.children[0].style.opacity = g.children[1].style.opacity = lane ? "0" : "1";
      G.attr(g.children[0], { d: "M0,12 L0,6" });
      G.attr(g.children[1], { d: "M-5,8 L0,1 L5,8 Z" });
      G.attr(g.children[2], { y: 25 + lane * 15 });
      G.setText(g.children[2], p.name);
      G.place(g, X(p.at) + BW / 2, py);
      g.style.opacity = p.hidden ? "0" : "1";
    });
    y = py + (ptrs.length ? 32 + Math.max(0, ptrs.length - 1) * 15 : 0);
    if (st.note) {
      const t = scene.el("note", "text", "top");
      G.attr(t, { x: left0 - 10, y: y + 12, class: "result-t" + (st.note.cls ? " " + st.note.cls : "") });
      G.setText(t, st.note.text);
      y += 28;
    }
    return { x: 0, y: 0, w: X(n) - GAP + (sideLabels ? 84 : 24), h: y + 4 };
  };
})();

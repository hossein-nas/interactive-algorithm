/* Algorithm guide v3 — Mermaid diagrams: theme-aware rendering, walkthrough, enlarge, and node lighting for animators. */
(function () {
  "use strict";
  const G = window.Guide;
  const D = (G.diagrams = {});
  let seq = 0;
  let queue = Promise.resolve();

  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function config() {
    const v = (n) => cssVar("--" + n);
    const dark = G.theme() === "dark";
    return {
      startOnLoad: false,
      theme: "base",
      securityLevel: "strict",
      fontFamily: '"Source Sans 3", system-ui, sans-serif',
      flowchart: { htmlLabels: true, curve: "basis", padding: 12, nodeSpacing: 34, rankSpacing: 44, useMaxWidth: true },
      sequence: { useMaxWidth: true, mirrorActors: false },
      gantt: { useMaxWidth: true },
      themeVariables: {
        darkMode: dark,
        fontFamily: '"Source Sans 3", system-ui, sans-serif',
        fontSize: "15px",
        background: v("sheet"),
        mainBkg: v("page"), primaryColor: v("page"), primaryTextColor: v("ink"), primaryBorderColor: v("ink-soft"),
        secondaryColor: v("sheet-2"), secondaryTextColor: v("ink"), secondaryBorderColor: v("ink-soft"),
        tertiaryColor: v("sheet"), tertiaryTextColor: v("ink"), tertiaryBorderColor: v("rule"),
        nodeBorder: v("ink-soft"), lineColor: v("ink-soft"), textColor: v("ink"), titleColor: v("ink"),
        clusterBkg: v("sheet-2"), clusterBorder: v("rule"), edgeLabelBackground: v("sheet"),
        noteBkgColor: v("hl"), noteTextColor: v("ink"), noteBorderColor: v("amber"),
        actorBkg: v("page"), actorBorder: v("ink-soft"), actorTextColor: v("ink"), actorLineColor: v("ink-faint"),
        signalColor: v("ink-soft"), signalTextColor: v("ink"), labelBoxBkgColor: v("sheet-2"), labelBoxBorderColor: v("rule"), labelTextColor: v("ink"),
        loopTextColor: v("ink"), activationBkgColor: v("blue-wash"), activationBorderColor: v("blue"),
        sectionBkgColor: v("sheet-2"), altSectionBkgColor: v("sheet"), sectionBkgColor2: v("sheet-2"),
        taskBkgColor: v("blue-wash"), taskBorderColor: v("blue"), taskTextColor: v("ink"), taskTextOutsideColor: v("ink"), taskTextLightColor: v("ink"),
        activeTaskBkgColor: v("hl"), activeTaskBorderColor: v("amber"), gridColor: v("rule"), todayLineColor: v("amber"),
        cScale0: v("blue-wash"), cScale1: v("plum-wash"), cScale2: v("green-wash"), cScale3: v("hl"), cScale4: v("anchor-wash"),
        cScaleLabel0: v("ink"), cScaleLabel1: v("ink"), cScaleLabel2: v("ink"), cScaleLabel3: v("ink"), cScaleLabel4: v("ink"),
      },
    };
  }

  /* ---------- parse rendered SVG into node / edge maps ---------- */
  function indexSvg(fig) {
    const body = fig.querySelector(".dg-body");
    const nodes = new Map();
    body.querySelectorAll("g.node").forEach((g) => {
      const m = (g.id || "").match(/flowchart-(.+)-\d+$/);
      if (m) nodes.set(m[1], g);
    });
    const keys = [...nodes.keys()].sort((a, b) => b.length - a.length);
    const edges = [];
    const labels = [...body.querySelectorAll(".edgeLabels .edgeLabel")];
    body.querySelectorAll("path.flowchart-link").forEach((p, i) => {
      const m = (p.id || "").match(/L_(.+)_(\d+)$/);
      if (!m) return;
      const mid = m[1];
      let from = null, to = null;
      for (const k of keys) {
        if (mid.startsWith(k + "_")) { const rest = mid.slice(k.length + 1); if (nodes.has(rest)) { from = k; to = rest; break; } }
      }
      edges.push({ from, to, path: p, label: labels[i] || null });
    });
    fig._nodes = nodes;
    fig._edges = edges;
  }

  function kindOf(src) { return (src.trim().split(/\s+/)[0] || "").toLowerCase(); }

  // Mermaid 11 reads labels as Markdown, so "1. Restate" or "- item" at the start of a label line
  // becomes an "unsupported list". A zero-width space after the marker keeps the text identical on screen.
  function protect(src) {
    return src
      .replace(/(\["|\{"|\("|\[\("|\(\["|<br\/?>)(\s*)(\d+)\.(\s)/g, "$1$2$3.​$4")
      .replace(/(\["|\{"|\("|\[\("|\(\["|<br\/?>)(\s*)([-*+>#])(\s)/g, "$1$2​$3$4");
  }
  D.protect = protect;

  function render(fig) {
    const src = protect(fig._src);
    const body = fig.querySelector(".dg-body");
    queue = queue.then(async () => {
      if (!window.mermaid) { body.innerHTML = '<div class="dg-error">Mermaid did not load.</div>'; return; }
      try {
        window.mermaid.initialize(config());
        const id = "dg" + ++seq;
        const { svg } = await window.mermaid.render(id, src);
        body.innerHTML = svg;
        const s = body.querySelector("svg");
        if (s) { s.removeAttribute("height"); s.style.maxWidth = s.style.maxWidth || "100%"; }
        // inside an animator stage: keep the text near full size and let the row scroll sideways
        if (s && fig.closest(".stage")) {
          const vb = s.viewBox && s.viewBox.baseVal;
          if (vb && vb.width) {
            const k = Math.min(1, 380 / vb.height);
            Object.assign(s.style, { width: Math.round(vb.width * k) + "px", height: Math.round(vb.height * k) + "px", maxWidth: "none" });
            s.removeAttribute("width");
          }
        }
        indexSvg(fig);
        fig.dataset.rendered = "1";
        if (fig._links) wireLinks(fig);
        if (fig._lit) D.light(fig, fig._lit);
        if (fig._walkIdx != null) paintWalk(fig);
      } catch (e) {
        body.innerHTML = `<div class="dg-error">Diagram error: ${G.esc(e.message || e)}</div>`;
        G.testFail(`mermaid ${fig.id}: ${e.message || e}`);
        // Mermaid leaves its scratch container ("d" + render id) behind after an error.
        document.querySelectorAll("body > [id^='ddg']").forEach((n) => n.remove());
      }
    });
    return queue;
  }
  D.render = render;
  D.idle = () => queue;

  function wireLinks(fig) {
    for (const [key, href] of Object.entries(fig._links)) {
      const g = fig._nodes.get(key);
      if (!g) continue;
      g.classList.add("is-click");
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "link");
      const go = () => { location.href = href; };
      g.addEventListener("click", go);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    }
  }

  /* ---------- lighting (used by walkthrough and by animators) ---------- */
  D.light = function (fig, keys) {
    fig._lit = keys;
    if (!fig._nodes) return;
    const body = fig.querySelector(".dg-body");
    body.querySelectorAll(".is-lit").forEach((n) => n.classList.remove("is-lit"));
    (keys || []).forEach((k, i) => {
      const n = fig._nodes.get(k);
      if (n) n.classList.add("is-lit");
      if (i > 0) fig._edges.forEach((e) => { if (e.from === keys[i - 1] && e.to === k) e.path.classList.add("is-lit"); });
    });
    // in a scrolling stage map, bring the newest lit box into view
    const last = keys && keys.length && fig._nodes.get(keys[keys.length - 1]);
    if (last && fig.closest(".stage") && body.scrollWidth > body.clientWidth + 4) {
      const br = body.getBoundingClientRect(), nr = last.getBoundingClientRect();
      if (nr.width) body.scrollTo({ left: body.scrollLeft + (nr.left + nr.width / 2) - (br.left + br.width / 2), behavior: G.reducedMotion() ? "auto" : "smooth" });
    }
  };

  /* ---------- walkthrough ---------- */
  function walkSteps(fig) {
    if (fig._walk) return fig._walk;
    return [...fig._nodes.keys()].map((k) => ({ n: [k] }));
  }
  function paintWalk(fig) {
    const steps = walkSteps(fig);
    const i = fig._walkIdx;
    const seen = new Set();
    for (let k = 0; k <= i; k++) (steps[k].n || []).forEach((x) => seen.add(x));
    fig._nodes.forEach((g, key) => g.classList.toggle("is-seen", seen.has(key)));
    fig._edges.forEach((e) => {
      const on = seen.has(e.from) && seen.has(e.to);
      e.path.classList.toggle("is-seen", on);
      if (e.label) e.label.classList.toggle("is-seen", on);
    });
    const cur = steps[i].n || [];
    const prev = new Set();
    for (let k = 0; k < i; k++) (steps[k].n || []).forEach((x) => prev.add(x));
    D.light(fig, []);
    cur.forEach((k) => { const n = fig._nodes.get(k); if (n) n.classList.add("is-lit"); });
    fig._edges.forEach((e) => { if (cur.includes(e.to) && (prev.has(e.from) || cur.includes(e.from)) && e.from !== e.to) e.path.classList.add("is-lit"); });
    const say = fig.querySelector(".dg-tools .say");
    const label = (k) => { const n = fig._nodes.get(k); return n ? n.textContent.trim().replace(/\s+/g, " ") : k; };
    say.innerHTML = `<span class="step-no">${i + 1}/${steps.length}</span>` + (steps[i].say ? G.fmt(steps[i].say) : G.esc(cur.map(label).join(" · ")));
    fig.querySelector('[data-a="prev"]').disabled = i === 0;
    fig.querySelector('[data-a="next"]').disabled = i === steps.length - 1;
  }
  function startWalk(fig) {
    if (!fig._nodes || !fig._nodes.size) return;
    fig._walkIdx = 0;
    fig.classList.add("is-walking");
    fig.querySelectorAll(".walk-only").forEach((b) => (b.hidden = false));
    fig.querySelector('[data-a="walk"]').hidden = true;
    paintWalk(fig);
  }
  function stopWalk(fig) {
    fig._walkIdx = null;
    fig.classList.remove("is-walking");
    fig.querySelectorAll(".walk-only").forEach((b) => (b.hidden = true));
    fig.querySelector('[data-a="walk"]').hidden = false;
    fig.querySelector(".dg-tools .say").innerHTML = fig._hint || "";
    D.light(fig, []);
    fig._nodes && fig._nodes.forEach((g) => g.classList.remove("is-seen"));
    fig._edges && fig._edges.forEach((e) => { e.path.classList.remove("is-seen"); e.label && e.label.classList.remove("is-seen"); });
  }

  const ICONS = {
    walk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4l12 8-12 8z"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  };

  function setup(fig, opts) {
    if (fig._setup) return;
    fig._setup = true;
    const pre = fig.querySelector("pre.mermaid-src");
    fig._src = pre ? pre.textContent : "";
    const walk = fig.querySelector('script[type="application/json"].walk');
    if (walk) { try { fig._walk = JSON.parse(walk.textContent); } catch (e) { G.testFail(`walk JSON ${fig.id}`); } }
    const links = fig.querySelector('script[type="application/json"].links');
    if (links) { try { fig._links = JSON.parse(links.textContent); } catch (e) { G.testFail(`links JSON ${fig.id}`); } }
    const body = G.h("div", { class: "dg-body" });
    fig.insertBefore(body, fig.querySelector("figcaption"));
    const kind = kindOf(fig._src);
    if (!(opts && opts.bare)) {
      const tools = G.h("div", { class: "dg-tools" });
      const canWalk = kind === "flowchart" || kind === "graph";
      fig._hint = canWalk ? '<span style="color:var(--ink-faint)">Walk through it one box at a time.</span>' : "";
      tools.innerHTML = (canWalk ? `<button class="dg-btn" data-a="walk">${ICONS.walk}Walk through</button>
        <button class="dg-btn walk-only" data-a="prev" hidden>Back</button><button class="dg-btn walk-only" data-a="next" hidden>Next</button>
        <button class="dg-btn walk-only" data-a="stop" hidden>Show all</button>` : "") +
        `<span class="say">${fig._hint}</span><button class="dg-btn" data-a="zoom">${ICONS.zoom}Enlarge</button>`;
      fig.insertBefore(tools, fig.querySelector("figcaption"));
      tools.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const a = b.dataset.a;
        if (a === "walk") startWalk(fig);
        else if (a === "stop") stopWalk(fig);
        else if (a === "next" && fig._walkIdx < walkSteps(fig).length - 1) { fig._walkIdx++; paintWalk(fig); }
        else if (a === "prev" && fig._walkIdx > 0) { fig._walkIdx--; paintWalk(fig); }
        else if (a === "zoom") enlarge(fig);
      });
    }
  }
  D.setup = setup;

  function enlarge(fig) {
    let dlg = document.querySelector("dialog.dg-zoom");
    if (!dlg) {
      dlg = G.h("dialog", { class: "dg-zoom" });
      dlg.innerHTML = '<div class="zoom-head"><b>Diagram</b><button class="btn ghost" data-a="close">Close</button></div><div class="zoom-body"></div>';
      dlg.querySelector('[data-a="close"]').addEventListener("click", () => dlg.close());
      dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
      document.body.appendChild(dlg);
    }
    const svg = fig.querySelector(".dg-body svg");
    if (!svg) return;
    const zb = dlg.querySelector(".zoom-body");
    zb.innerHTML = "";
    const c = svg.cloneNode(true);
    c.style.maxWidth = "none";
    zb.appendChild(c);
    dlg.showModal();
  }

  // Create a fresh diagram figure from Mermaid source (used inside animator stages).
  D.fromSource = function (src, opts) {
    const fig = G.h("figure", { class: "diagram" });
    const pre = G.h("pre", { class: "mermaid-src" });
    pre.textContent = src;
    fig.appendChild(pre);
    setup(fig, opts);
    return fig;
  };

  /* ---------- boot: lazy render as diagrams approach the viewport ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const figs = [...document.querySelectorAll("figure.diagram")].filter((f) => !f.closest(".stage"));
    figs.forEach((f) => setup(f));
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting && !en.target._queued) { en.target._queued = true; render(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "800px 0px" });
    figs.forEach((f) => (G.selftest ? (f._queued = true, render(f)) : io.observe(f)));
    G.on("theme", () => {
      document.querySelectorAll("figure.diagram").forEach((f) => { if (f.dataset.rendered) render(f); });
    });
  });
})();

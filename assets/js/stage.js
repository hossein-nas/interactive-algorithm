/* Algorithm guide v3 — stage: the step-through animator engine.
   An animator spec (registered in Guide.animators) turns an input into frames; the stage renders one frame at a time.
   Frame: { state, at, say, vars, ask?, flow?, key? }  — `at` names a code line in spec.lines. */
(function () {
  "use strict";
  const G = window.Guide;
  const NS = "http://www.w3.org/2000/svg";

  /* ---------- keyed SVG scene: elements persist across frames so CSS transitions animate changes ---------- */
  class Scene {
    constructor(svg) {
      this.svg = svg;
      this.map = new Map();
      this.layers = {};
      ["bg", "back", "mid", "front", "top"].forEach((name) => {
        const g = document.createElementNS(NS, "g");
        g.setAttribute("class", "layer-" + name);
        svg.appendChild(g);
        this.layers[name] = g;
      });
      this.fresh = [];
      this.flyN = 0;
    }
    begin() { this.seen = new Set(); this.fresh = []; }
    el(key, tag, layer) {
      let n = this.map.get(key);
      if (!n || n.tagName !== tag) {
        if (n) n.remove();
        n = document.createElementNS(NS, tag);
        n.classList.add("no-tr");
        this.layers[layer || "mid"].appendChild(n);
        this.map.set(key, n);
        n.__fresh = true;
        this.fresh.push(n);
      } else n.__fresh = false;
      this.seen.add(key);
      return n;
    }
    end() {
      for (const [k, n] of this.map) if (!this.seen.has(k)) { n.remove(); this.map.delete(k); }
      const fresh = this.fresh;
      if (fresh.length) requestAnimationFrame(() => requestAnimationFrame(() => fresh.forEach((n) => n.classList.remove("no-tr"))));
      // deferred moves (e.g. a value flying from one cell to another)
      const later = this.later || [];
      this.later = [];
      if (later.length) requestAnimationFrame(() => requestAnimationFrame(() => later.forEach((f) => f())));
    }
    defer(fn) { (this.later = this.later || []).push(fn); }
    clear() { for (const n of this.map.values()) n.remove(); this.map.clear(); }
  }
  G.Scene = Scene;
  G.attr = (n, o) => { for (const k in o) { if (o[k] == null) n.removeAttribute(k); else if (n.getAttribute(k) !== String(o[k])) n.setAttribute(k, o[k]); } return n; };
  G.place = (n, x, y) => { const t = `translate(${x}px, ${y}px)`; if (n.style.transform !== t) n.style.transform = t; return n; };
  G.setText = (n, t) => { t = t == null ? "" : String(t); if (n.textContent !== t) n.textContent = t; return n; };
  G.svgEl = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); if (attrs) G.attr(n, attrs); if (parent) parent.appendChild(n); return n; };

  /* ---------- helpers for writing traces ---------- */
  G.Trace = class {
    constructor() { this.frames = []; }
    add(f) { this.frames.push(f); return f; }
    done(result) { if (!this.frames.length) this.add({ state: {}, say: "Nothing to show." }); return { frames: this.frames, result }; }
  };
  G.copy = (x) => (typeof structuredClone === "function" ? structuredClone(x) : JSON.parse(JSON.stringify(x)));
  G.parse = {
    nums(s, o) {
      o = o || {};
      const t = String(s).replace(/[\[\]{}(),]/g, " ").trim();
      if (!t) { if (o.allowEmpty) return []; throw new Error("Type some numbers, separated by spaces or commas."); }
      const a = t.split(/\s+/).map((x) => Number(x.replace(/[−–]/g, "-")));
      if (a.some((x) => !Number.isFinite(x))) throw new Error("Only numbers, please (for example: 2 7 11 15).");
      if (o.ints !== false && a.some((x) => !Number.isInteger(x))) throw new Error("Whole numbers only.");
      if (o.minLen && a.length < o.minLen) throw new Error(`Give at least ${o.minLen} numbers.`);
      if (o.maxLen && a.length > o.maxLen) throw new Error(`Keep it to ${o.maxLen} numbers so the picture stays readable.`);
      if (o.min != null && a.some((x) => x < o.min)) throw new Error(`Numbers must be at least ${o.min}.`);
      if (o.max != null && a.some((x) => x > o.max)) throw new Error(`Numbers must be at most ${o.max}.`);
      if (o.only && a.some((x) => !o.only.includes(x))) throw new Error(`Only these values are allowed: ${o.only.join(", ")}.`);
      if (o.sorted && a.some((x, i) => i && a[i - 1] > x)) throw new Error("This one needs a sorted array (smallest first).");
      return a;
    },
    num(s, name) {
      const v = Number(String(s).trim().replace(/[−–]/g, "-"));
      if (!String(s).trim() || !Number.isFinite(v)) throw new Error(`${name || "The target"} must be a number.`);
      return v;
    },
    parts(s, n, hint) {
      const p = String(s).split(";");
      if (p.length !== n) throw new Error(hint || `Use ${n} parts separated by ";".`);
      return p;
    },
  };
  G.show = function show(v) {
    if (Array.isArray(v)) return "[" + v.map(show).join(", ") + "]";
    if (typeof v === "string") return `"${v}"`;
    if (v === null) return "null";
    if (v === undefined) return "—";
    return String(v);
  };

  const ICON = {
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
    fwd: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  };
  const INK_NAMES = { p1: "left", p2: "right", focus: "looking at", anchor: "fixed", done: "discarded", answer: "answer", bug: "bug", water: "water" };

  /* ---------- the stage ---------- */
  class Stage {
    constructor(root) {
      this.root = root;
      this.keys = root.dataset.anim.split(",").map((s) => s.trim());
      this.specs = this.keys.map((k) => {
        const s = G.animators[k];
        if (!s) throw new Error(`animator "${k}" is not registered`);
        return s;
      });
      const codeIds = (root.dataset.code || "").split(",").map((s) => s.trim()).filter(Boolean);
      const flowIds = (root.dataset.flow || "").split(",").map((s) => s.trim());
      const clones = {};
      this.codeEls = this.specs.map((s, i) => {
        if (s.noCodeBlock) return null;
        const id = s.code || codeIds[i] || codeIds[0];
        const orig = id ? document.getElementById(id) : null;
        if (!orig || root.dataset.clone == null) return orig;
        // data-clone: leave the code where it is (e.g. above an answer) and give the stage its own copy
        if (!clones[id]) {
          const c = orig.cloneNode(true);
          c.removeAttribute("id");
          c.querySelector(".code-head")?.remove();
          delete c.dataset.built;
          const op = orig.querySelectorAll(":scope > pre"), cp = c.querySelectorAll(":scope > pre");
          cp.forEach((p, k) => { p._lines = op[k]._lines; });
          G.buildCodeTabs(c);
          clones[id] = c;
        }
        return clones[id];
      });
      this.flowFigs = this.specs.map((s, i) => {
        const id = s.flow || flowIds[i] || (this.specs.length === 1 ? flowIds[0] : "");
        if (!id) return null;
        const src = document.querySelector(`#${id} pre.mermaid-src`);
        if (!src) return null;
        // the stage copy runs left-to-right so it stays legible in a wide, short row
        const text = this.root.dataset.flowDir === "keep" ? src.textContent : src.textContent.replace(/^(\s*)(flowchart|graph)\s+(TD|TB)\b/m, "$1$2 LR");
        return G.diagrams.fromSource(text, { bare: true });
      });
      this.v = 0;
      this.bug = -1;
      this.predict = G.store.get("predict", false);
      this.speed = G.store.get("speed", 1);
      this.score = { right: 0, total: 0 };
      this.playing = false;
      this.build();
      this.setVariant(0);
    }
    get spec() { return this.specs[this.v]; }
    get codeEl() { return this.codeEls[this.v]; }

    build() {
      const r = this.root;
      r.setAttribute("tabindex", "0");
      r.setAttribute("role", "group");
      r.setAttribute("aria-label", (r.dataset.title || this.specs[0].title) + ", step-by-step animation. Space plays or pauses, arrow keys step.");
      const multi = this.specs.length > 1;
      r.innerHTML = `
        <div class="stage-head">
          <span class="stage-title"></span>
          ${multi ? `<div class="stage-variants" role="group" aria-label="Versions">${this.specs.map((s, i) => `<button data-v="${i}">${G.esc(s.short || s.title)}</button>`).join("")}</div>` : ""}
          <div class="inks"></div>
          <label class="toggle" title="Pause at each decision and guess the next move"><input type="checkbox" class="predict"> Predict the next move</label>
          <span class="score" hidden></span>
        </div>
        <div class="bug-banner"></div>
        <div class="stage-body">
          <div class="stage-main">
            <div class="stage-viz"><svg class="viz" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div>
            <div class="stage-say" aria-live="polite"></div>
            <div class="stage-vars"></div>
            <div class="ask" hidden></div>
            <div class="stage-controls">
              <button class="ctl" data-c="reset" aria-label="Back to the start">${ICON.reset}</button>
              <button class="ctl" data-c="back" aria-label="Step back">${ICON.back}</button>
              <button class="ctl play" data-c="play" aria-label="Play">${ICON.play}</button>
              <button class="ctl" data-c="fwd" aria-label="Step forward">${ICON.fwd}</button>
              <input class="scrub" type="range" min="0" max="0" value="0" aria-label="Scrub through the steps">
              <select class="speed" aria-label="Speed"><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select>
            </div>
          </div>
          <div class="stage-side"><div class="code-slot"></div></div>
        </div>
        <div class="flow"><div class="flow-label">Decision map: the branch being taken right now lights up</div><div class="flow-slot"></div></div>
        <div class="stage-input">
          <label for="${r.id || "st"}-in">Try your own input</label>
          <input type="text" id="${r.id || "st"}-in" spellcheck="false" autocomplete="off">
          <button class="btn" data-c="run">Run</button>
          <div class="presets"></div>
          <div class="err" hidden></div>
        </div>`;
      this.svg = r.querySelector("svg.viz");
      this.scene = new Scene(this.svg);
      this.$ = (sel) => r.querySelector(sel);
      // adopt code blocks (once each)
      const slot = this.$(".code-slot");
      this.codeEls.forEach((ct) => { if (ct && ct.parentNode !== slot) slot.appendChild(ct); });
      const fslot = this.$(".flow-slot");
      this.flowFigs.forEach((f) => { if (f) fslot.appendChild(f); });
      if (!this.codeEls.some(Boolean)) r.classList.add("no-side");

      r.querySelectorAll(".stage-variants button").forEach((b) => b.addEventListener("click", () => this.setVariant(+b.dataset.v)));
      const pr = this.$(".predict");
      pr.checked = this.predict;
      pr.addEventListener("change", () => { this.predict = pr.checked; G.store.set("predict", this.predict); this.$(".score").hidden = !this.predict; this.render(); });
      this.$(".score").hidden = !this.predict;
      const sp = this.$(".speed");
      sp.value = String(this.speed);
      sp.addEventListener("change", () => { this.speed = +sp.value; G.store.set("speed", this.speed); });
      r.querySelector(".stage-controls").addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const c = b.dataset.c;
        if (c === "reset") { this.stop(); this.go(0); }
        else if (c === "back") { this.stop(); this.go(this.idx - 1); }
        else if (c === "fwd") { this.stop(); this.next(); }
        else if (c === "play") this.playing ? this.stop() : this.play();
      });
      const scrub = this.$(".scrub");
      scrub.addEventListener("input", () => { this.stop(); this.go(+scrub.value); });
      const inp = this.$(".stage-input input");
      this.$('[data-c="run"]').addEventListener("click", () => this.run(inp.value));
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); this.run(inp.value); } });
      r.addEventListener("keydown", (e) => {
        const t = e.target;
        if (t.matches("input, textarea, select")) return;
        if (e.key === " " && !t.matches("button")) { e.preventDefault(); this.playing ? this.stop() : this.play(); }
        else if (e.key === "ArrowRight") { e.preventDefault(); this.stop(); this.next(); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); this.stop(); this.go(this.idx - 1); }
        else if (e.key === "Home") { e.preventDefault(); this.stop(); this.go(0); }
      });
      G.on("lang", () => this.paintCode());
      G.on("progress", () => {});
    }

    setVariant(v) {
      this.stop();
      this.v = v;
      this.bug = -1;
      this.root.classList.remove("bug-mode");
      const s = this.spec;
      this.root.querySelectorAll(".stage-variants button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.v === v)));
      this.$(".stage-title").textContent = this.root.dataset.title || s.title;
      this.svg.setAttribute("aria-label", s.title + " animation");
      this.$(".inks").innerHTML = (s.legend || []).map((x) => {
        const [k, name] = x.split(":");
        return `<span class="ink ${k}"><i></i>${G.esc(name || INK_NAMES[k] || k)}</span>`;
      }).join("");
      // show only this variant's code and flow
      const slot = this.$(".code-slot");
      [...slot.children].forEach((c) => (c.hidden = c !== this.codeEl));
      if (!this.codeEl) {
        let nc = slot.querySelector(".no-code");
        if (!nc) { nc = G.h("div", { class: "no-code" }); slot.appendChild(nc); }
        nc.hidden = false;
        nc.innerHTML = G.fmt(s.noCode || "This picture has no code of its own; it shows the idea.");
      }
      const fslot = this.$(".flow-slot");
      const fig = this.flowFigs[v];
      [...fslot.children].forEach((c) => (c.hidden = c !== fig));
      this.$(".flow").hidden = !fig;
      if (fig && !fig._queued) { fig._queued = true; G.diagrams.render(fig); }
      this.lineCache = {};
      this.paintPresets();
      const first = (s.presets && s.presets[0] && s.presets[0].input) || "";
      this.$(".stage-input input").value = first;
      this.$(".stage-input input").placeholder = s.hint || "";
      this.$(".stage-input label").textContent = s.inputLabel || "Try your own input";
      this.run(first);
    }

    paintPresets() {
      const s = this.spec;
      const box = this.$(".presets");
      box.innerHTML = (s.presets || []).map((p, i) => `<button class="chip" data-p="${i}" title="${G.esc(p.input)}">${G.esc(p.label || p.input)}</button>`).join("") +
        (s.bugs || []).map((b, i) => `<button class="chip bug" data-b="${i}">${G.esc(b.label)}</button>`).join("");
      box.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => {
        const p = s.presets[+b.dataset.p];
        this.$(".stage-input input").value = p.input;
        this.run(p.input);
      }));
      box.querySelectorAll("[data-b]").forEach((b) => b.addEventListener("click", () => this.toggleBug(+b.dataset.b)));
    }

    toggleBug(i) {
      this.stop();
      const s = this.spec;
      if (this.bug === i) {
        this.bug = -1;
        this.root.classList.remove("bug-mode");
      } else {
        this.bug = i;
        this.root.classList.add("bug-mode");
        this.$(".bug-banner").innerHTML = s.bugs[i].banner || "";
        if (s.bugs[i].input != null) this.$(".stage-input input").value = s.bugs[i].input;
      }
      this.$(".presets").querySelectorAll("[data-b]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.b === this.bug)));
      this.run(this.$(".stage-input input").value);
    }

    run(str) {
      const s = this.spec;
      const inp = this.$(".stage-input input");
      const err = this.$(".stage-input .err");
      let input;
      const parser = this.bug >= 0 && s.bugs[this.bug].parse ? s.bugs[this.bug].parse : s.parse;
      try { input = parser ? parser(str) : str; }
      catch (e) { inp.classList.add("is-bad"); err.hidden = false; err.textContent = e.message; return false; }
      inp.classList.remove("is-bad");
      err.hidden = true;
      this.stop();
      this.inputStr = str;
      let tr;
      try { tr = this.bug >= 0 ? s.bugs[this.bug].trace(input) : s.trace(input); }
      catch (e) { err.hidden = false; err.textContent = "Could not run: " + e.message; G.testFail(`${this.keys[this.v]} trace: ${e.message}`); return false; }
      this.frames = tr.frames;
      this.result = tr.result;
      this.answered = new Map();
      this.scene.clear();
      this.dims = null;
      const scrub = this.$(".scrub");
      scrub.max = String(this.frames.length - 1);
      this.$(".presets").querySelectorAll("[data-p]").forEach((b) => {
        const p = s.presets[+b.dataset.p];
        b.setAttribute("aria-pressed", String(norm(p.input) === norm(str)));
      });
      this.tableOn = !!(s.table && this.bug < 0 && s.presets[s.table.preset] && norm(s.presets[s.table.preset].input) === norm(str));
      this.clearTable();
      this.idx = 0;
      this.render();
      return true;
    }

    go(i) {
      if (!this.frames) return;
      this.idx = Math.max(0, Math.min(this.frames.length - 1, i));
      this.render();
    }
    blocked() {
      const f = this.frames[this.idx];
      return this.predict && this.bug < 0 && f.ask && !this.answered.has(this.idx);
    }
    next() {
      if (this.idx >= this.frames.length - 1) { this.stop(); return false; }
      if (this.blocked()) { this.resumeAfter = this.playing; this.stop(); this.render(); this.$(".ask button")?.focus({ preventScroll: true }); return false; }
      this.idx++;
      this.render();
      return true;
    }
    play() {
      if (this.idx >= this.frames.length - 1) this.go(0);
      this.playing = true;
      this.paintPlay();
      const tick = () => {
        if (!this.playing) return;
        this.timer = setTimeout(() => {
          if (!this.playing) return;
          if (this.next() && this.idx < this.frames.length - 1) tick();
          else if (!this.blocked()) this.stop();
        }, 1300 / this.speed);
      };
      tick();
    }
    stop() { this.playing = false; clearTimeout(this.timer); this.paintPlay(); }
    paintPlay() {
      const b = this.$('[data-c="play"]');
      if (!b) return;
      b.innerHTML = this.playing ? ICON.pause : ICON.play;
      b.setAttribute("aria-label", this.playing ? "Pause" : "Play");
    }

    clearTable() {
      document.querySelectorAll(`#${this.spec.table ? this.spec.table.id : "__none"} tr.is-lit`).forEach((t) => t.classList.remove("is-lit"));
    }

    render() {
      const s = this.spec;
      const f = this.frames[this.idx];
      const prev = this.frames[this.idx - 1];
      // picture
      const viz = typeof s.viz === "function" ? s.viz : G.viz[s.viz];
      this.scene.begin();
      const d = viz(this.scene, f.state || {}, { spec: s, frame: f, idx: this.idx }) || { w: 600, h: 200 };
      this.scene.end();
      const x0 = d.x || 0, y0 = d.y || 0;
      if (!this.dims) this.dims = { x: x0, y: y0, w: d.w, h: d.h };
      else { this.dims.x = Math.min(this.dims.x, x0); this.dims.y = Math.min(this.dims.y, y0); this.dims.w = Math.max(this.dims.w, d.w); this.dims.h = Math.max(this.dims.h, d.h); }
      G.attr(this.svg, { viewBox: `${this.dims.x} ${this.dims.y} ${this.dims.w - this.dims.x} ${this.dims.h - this.dims.y}` });
      this.svg.style.maxWidth = Math.round((this.dims.w - this.dims.x) * (s.zoom || 1.35)) + "px";
      // narration
      this.$(".stage-say").innerHTML = `<span class="step-no">${this.idx + 1}/${this.frames.length}</span>` + G.fmt(f.say);
      // variables
      const vars = f.vars || {};
      const pv = (prev && prev.vars) || {};
      const roles = s.varRoles || {};
      this.$(".stage-vars").innerHTML = Object.keys(vars).map((k) => {
        const changed = prev && JSON.stringify(vars[k]) !== JSON.stringify(pv[k]);
        return `<span class="var${changed ? " changed" : ""}${roles[k] ? " role-" + roles[k] : ""}"><b>${G.esc(k)}</b> = ${G.esc(G.show(vars[k]))}</span>`;
      }).join("");
      // code, flow, table
      this.paintCode();
      const fig = this.flowFigs[this.v];
      if (fig) G.diagrams.light(fig, this.bug >= 0 ? [] : f.flow ? [].concat(f.flow) : []);
      if (s.table && this.tableOn) {
        this.clearTable();
        const ri = f.key != null ? s.table.rows.indexOf(f.key) : -1;
        if (ri >= 0) {
          const tr = document.querySelectorAll(`#${s.table.id} tbody tr`)[ri];
          if (tr) tr.classList.add("is-lit");
        }
      }
      // controls
      this.$('[data-c="back"]').disabled = this.idx === 0;
      this.$('[data-c="reset"]').disabled = this.idx === 0;
      this.$('[data-c="fwd"]').disabled = this.idx >= this.frames.length - 1;
      this.$(".scrub").value = String(this.idx);
      this.paintAsk();
    }

    paintCode() {
      const ct = this.codeEl;
      if (!ct || !this.frames) return;
      const f = this.frames[this.idx];
      // an animator whose code exists in one language only shows that language
      if (this.spec.codeLang && G.codeShown(ct) !== this.spec.codeLang) G.showLang(ct, this.spec.codeLang);
      if (this.bug >= 0 || !f.at || !this.spec.lines || !this.spec.lines[f.at]) { G.markLine(ct, null); return; }
      const lang = G.codeShown(ct);
      const ck = f.at + "|" + lang;
      if (!(ck in this.lineCache)) {
        try { this.lineCache[ck] = G.resolveLine(ct, lang, this.spec.lines[f.at][lang]); }
        catch (e) { this.lineCache[ck] = null; G.testFail(`${this.keys[this.v]}: ${e.message}`); }
      }
      G.markLine(ct, this.lineCache[ck]);
    }

    paintAsk() {
      const box = this.$(".ask");
      const f = this.frames[this.idx];
      if (!(this.predict && this.bug < 0 && f.ask)) { box.hidden = true; return; }
      box.hidden = false;
      const a = f.ask;
      const chosen = this.answered.get(this.idx);
      box.innerHTML = `<p>${G.fmt(a.q || "What happens next?")}</p><div class="opts">` +
        a.options.map((o, i) => `<button data-i="${i}" class="${chosen == null ? "" : i === a.answer ? "right" : i === chosen ? "wrong" : ""}"${chosen != null ? " disabled" : ""}>${G.fmt(o)}</button>`).join("") + `</div>` +
        (chosen != null ? `<div class="why">${chosen === a.answer ? "<b>Right.</b> " : "<b>Not quite.</b> "}${G.fmt(a.why || (this.frames[this.idx + 1] || {}).say || "")}</div><div class="quiz-nav"><button class="btn" data-a="cont">Continue</button></div>` : "");
      box.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => {
        const i = +b.dataset.i;
        this.answered.set(this.idx, i);
        this.score.total++;
        if (i === a.answer) this.score.right++;
        const sc = this.$(".score");
        sc.textContent = `Predictions ${this.score.right}/${this.score.total}`;
        this.paintAsk();
        box.querySelector('[data-a="cont"]')?.focus({ preventScroll: true });
      }));
      const cont = box.querySelector('[data-a="cont"]');
      if (cont) cont.addEventListener("click", () => { const resume = this.resumeAfter; this.resumeAfter = false; this.next(); if (resume) this.play(); else this.root.focus({ preventScroll: true }); });
    }

    /* In ?selftest mode: run every preset and bug, render every frame, resolve every code line. */
    selftest() {
      let frames = 0;
      this.specs.forEach((s, v) => {
        this.setVariant(v);
        const runs = (s.presets || []).map((p) => ({ input: p.input, bug: -1 })).concat((s.bugs || []).map((b, i) => ({ input: b.input != null ? b.input : s.presets[0].input, bug: i })));
        runs.forEach((r) => {
          this.bug = r.bug;
          if (!this.run(r.input)) { G.testFail(`${this.keys[v]}: preset did not run: ${r.input}`); return; }
          this.frames.forEach((f, i) => {
            frames++;
            try { this.go(i); } catch (e) { G.testFail(`${this.keys[v]} frame ${i}: ${e.message}`); }
            if (f.at && s.lines && !s.lines[f.at]) G.testFail(`${this.keys[v]}: unknown line key "${f.at}"`);
            if (f.at && s.lines && s.lines[f.at] && this.codeEl && r.bug < 0) {
              ["ts", "go"].forEach((lang) => {
                const spec = s.lines[f.at][lang];
                if (spec == null) return;
                try { G.resolveLine(this.codeEl, lang, spec); } catch (e) { G.testFail(`${this.keys[v]}: ${e.message}`); }
              });
            }
            if (f.ask && !(f.ask.answer >= 0 && f.ask.answer < f.ask.options.length)) G.testFail(`${this.keys[v]} frame ${i}: bad ask answer`);
          });
        });
        this.bug = -1;
        this.root.classList.remove("bug-mode");
      });
      this.setVariant(0);
      return frames;
    }
  }
  const norm = (s) => String(s).replace(/\s+/g, " ").trim();
  G.Stage = Stage;

  document.addEventListener("DOMContentLoaded", () => {
    const stages = [];
    document.querySelectorAll(".stage[data-anim]").forEach((el) => {
      try { stages.push(new Stage(el)); }
      catch (e) { console.error(e); G.testFail(`stage ${el.dataset.anim}: ${e.message}`); el.innerHTML = `<div class="dg-error">${G.esc(e.message)}</div>`; }
    });
    G.stages = stages;
    const byId = (id) => stages.find((s) => s.root.id === id);
    // buttons outside a stage that replay a bug, and links that open a stage on a given version
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-bug]");
      if (b && !b.closest(".stage")) {
        const [id, k] = b.dataset.bug.split(":");
        const st = byId(id);
        if (!st) return;
        if (!(st.spec.bugs && st.spec.bugs[+k])) st.setVariant(0);
        if (st.bug !== +k) st.toggleBug(+k);
        st.root.scrollIntoView({ behavior: G.reducedMotion() ? "auto" : "smooth", block: "start" });
        st.root.focus({ preventScroll: true });
        return;
      }
      const a = e.target.closest("a[data-variant]");
      if (a) { const st = byId(a.getAttribute("href").slice(1)); if (st) st.setVariant(+a.dataset.variant); }
    });
    if (G.selftest) {
      setTimeout(async () => {
        let frames = 0;
        stages.forEach((st) => { try { frames += st.selftest(); } catch (e) { G.testFail(`selftest ${st.keys}: ${e.message}`); } });
        if (G.quiz && G.quiz.selftest) G.quiz.selftest();
        await new Promise((r) => setTimeout(r, 300));
        if (G.diagrams && G.diagrams.idle) await G.diagrams.idle();
        const figs = document.querySelectorAll("figure.diagram");
        const bad = [...figs].filter((f) => !f.querySelector(".dg-body svg"));
        bad.forEach((f) => G.testFail(`diagram not rendered: ${f.id || "(in stage)"}`));
        const rep = G.h("pre", { id: "selftest-report" });
        rep.textContent = `SELFTEST ${G.testLog.length ? "FAILED" : "OK"} stages=${stages.length} frames=${frames} diagrams=${figs.length}\n` + G.testLog.join("\n");
        document.body.appendChild(rep);
      }, 50);
    }
  });
})();

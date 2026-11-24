/* Algorithm guide v3 — core: registry, storage, events, theme, code language, rails, code blocks. */
(function () {
  "use strict";
  // Prism must not auto-run; we highlight code ourselves.
  window.Prism = window.Prism || { manual: true };
  const G = (window.Guide = window.Guide || {});
  G.animators = G.animators || {};
  G.quizzes = G.quizzes || {};
  G.viz = G.viz || {};
  G.selftest = /[?&]selftest\b/.test(location.search);
  const root = document.documentElement;
  G.root = root.getAttribute("data-root") || "";

  /* ---------- lesson registry ---------- */
  const L = (id, slug, title, short, group, stars) => ({ id, file: `${id}-${slug}.html`, title, short, group, stars });
  G.LESSONS = [
    L("00", "start-here-and-study-plan", "Start here and study plan", "Start here", "Start", 0),
    L("01", "interview-process", "The interview process", "Interview process", "Foundations", 3),
    L("02", "big-o-and-complexity", "Big O and complexity", "Big O", "Foundations", 3),
    L("03", "language-toolkit-typescript-and-go", "Language toolkit: TypeScript and Go", "TS and Go toolkit", "Foundations", 3),
    L("04", "hash-tables-map-set", "Hash tables: map and set", "Hash tables", "Core patterns", 3),
    L("05", "two-pointers", "Two pointers", "Two pointers", "Core patterns", 3),
    L("06", "sliding-window", "Sliding window", "Sliding window", "Core patterns", 3),
    L("07", "prefix-sums", "Prefix sums", "Prefix sums", "Core patterns", 3),
    L("08", "binary-search", "Binary search", "Binary search", "Core patterns", 3),
    L("09", "sorting-and-divide-and-conquer", "Sorting and divide and conquer", "Sorting, D&C", "Recursion family", 2),
    L("10", "recursion-and-call-stack", "Recursion and the call stack", "Recursion", "Recursion family", 3),
    L("11", "backtracking", "Backtracking", "Backtracking", "Recursion family", 3),
    L("12", "linked-lists", "Linked lists", "Linked lists", "Data structures", 3),
    L("13", "stacks-and-monotonic-stack", "Stacks and the monotonic stack", "Stacks", "Data structures", 3),
    L("14", "queues-and-monotonic-deque", "Queues and the monotonic deque", "Queues, deques", "Data structures", 2),
    L("15", "trees-and-bst", "Trees and binary search trees", "Trees and BST", "Data structures", 3),
    L("16", "balanced-trees", "Balanced trees", "Balanced trees", "Data structures", 2),
    L("17", "heaps-and-priority-queues", "Heaps and priority queues", "Heaps", "Data structures", 3),
    L("18", "tries", "Tries", "Tries", "Data structures", 2),
    L("19", "graphs-bfs-dfs-and-grids", "Graphs: BFS, DFS and grids", "BFS, DFS, grids", "Graph family", 3),
    L("20", "topological-sort", "Topological sort", "Topological sort", "Graph family", 3),
    L("21", "union-find", "Union-find", "Union-find", "Graph family", 2),
    L("22", "shortest-paths-dijkstra-bellman-ford", "Shortest paths: Dijkstra and Bellman-Ford", "Shortest paths", "Graph family", 3),
    L("23", "greedy-and-np-complete", "Greedy and NP-complete", "Greedy", "Strategies", 3),
    L("24", "intervals", "Intervals", "Intervals", "Strategies", 3),
    L("25", "dp-one-dimensional", "Dynamic programming, one dimension", "DP 1D", "Strategies", 3),
    L("26", "dp-two-dimensional", "Dynamic programming, two dimensions", "DP 2D", "Strategies", 3),
    L("27", "bit-manipulation", "Bit manipulation", "Bits", "Extras", 2),
    L("28", "knn-and-where-to-go-next", "k-NN and where to go next", "k-NN, next steps", "Extras", 1),
    L("29", "pattern-chooser-mocks-and-v2-map", "Pattern chooser, mocks and the v2 map", "Pattern chooser", "Extras", 3),
  ];
  // Lessons whose interactive page exists. Grows batch by batch.
  G.BUILT = new Set(["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29"]);
  G.lessonById = (id) => G.LESSONS.find((l) => l.id === id);
  G.lessonHref = (id) => `${G.root}lessons/${G.lessonById(id).file}`;
  G.currentLesson = root.getAttribute("data-lesson") || null;

  /* ---------- storage (Chrome shares file:// storage across pages) ---------- */
  G.store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("algov3:" + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem("algov3:" + key, JSON.stringify(val)); return true; } catch (e) { return false; }
    },
  };

  /* ---------- events ---------- */
  const handlers = {};
  G.on = (evt, fn) => { (handlers[evt] = handlers[evt] || []).push(fn); };
  G.emit = (evt, data) => { (handlers[evt] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); };

  /* ---------- small helpers ---------- */
  G.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // narration markup: `code`, **bold**, _em_
  G.fmt = (s) => G.esc(s == null ? "" : s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|\s)_([^_]+)_(?=\s|[.,;:!?)]|$)/g, "$1<em>$2</em>");
  G.h = (tag, attrs, html) => {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    if (html != null) n.innerHTML = html;
    return n;
  };
  G.reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  G.today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  G.ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  G.addDays = (ymd, n) => { const [y, m, d] = ymd.split("-").map(Number); return G.ymd(new Date(y, m - 1, d + n)); };
  let toastTimer;
  G.toast = (msg) => {
    let t = document.querySelector(".toast");
    if (!t) { t = G.h("div", { class: "toast", role: "status", "aria-live": "polite" }); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("is-on"), 2200);
  };

  const ICON = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  };
  G.ICON = ICON;

  /* ---------- theme ---------- */
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  G.theme = () => root.getAttribute("data-theme") || (mq.matches ? "dark" : "light");
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    G.store.set("theme", t);
    paintThemeBtn();
    G.emit("theme", t);
  }
  mq.addEventListener("change", () => { if (!root.getAttribute("data-theme")) { paintThemeBtn(); G.emit("theme", G.theme()); } });
  function paintThemeBtn() {
    const b = document.getElementById("theme-btn");
    if (!b) return;
    const dark = G.theme() === "dark";
    b.innerHTML = (dark ? ICON.sun : ICON.moon) + `<span>${dark ? "Light" : "Dark"}</span>`;
    b.setAttribute("aria-label", dark ? "Switch to light paper theme" : "Switch to dark slate theme");
  }

  /* ---------- code language ---------- */
  G.lang = () => G.store.get("lang", "ts");
  function setLang(l) {
    G.store.set("lang", l);
    root.setAttribute("data-code-lang", l);
    document.querySelectorAll("#lang-seg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === l)));
    document.querySelectorAll(".code-tabs").forEach((ct) => showLang(ct, l));
    G.emit("lang", l);
  }
  G.setLang = setLang;

  /* ---------- top bar ---------- */
  function buildTopbar() {
    const bar = document.querySelector(".topbar");
    if (!bar) return;
    const les = G.currentLesson && G.lessonById(G.currentLesson);
    bar.innerHTML = `
      <button class="icon-btn menu-btn" id="menu-btn" aria-label="Show the lesson list" aria-expanded="false">${ICON.menu}</button>
      <a class="brand" href="${G.root}index.html">Algorithm guide <small>v3</small></a>
      ${les ? `<span class="here">${les.id} · ${G.esc(les.title)}</span>` : ""}
      <span class="spacer"></span>
      <div class="seg" id="lang-seg" role="group" aria-label="Code language">
        <button data-l="ts" aria-pressed="false"><span class="long">TypeScript</span><span class="short">TS</span></button><button data-l="go" aria-pressed="false">Go</button>
      </div>
      <button class="icon-btn" id="theme-btn"></button>`;
    bar.querySelector("#theme-btn").addEventListener("click", () => setTheme(G.theme() === "dark" ? "light" : "dark"));
    bar.querySelectorAll("#lang-seg button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.l)));
    const mb = bar.querySelector("#menu-btn");
    mb.addEventListener("click", () => {
      const open = !document.body.classList.contains("rail-open");
      document.body.classList.toggle("rail-open", open);
      mb.setAttribute("aria-expanded", String(open));
    });
    const bd = G.h("div", { class: "backdrop" });
    bd.addEventListener("click", () => { document.body.classList.remove("rail-open"); mb.setAttribute("aria-expanded", "false"); });
    document.body.appendChild(bd);
    paintThemeBtn();
  }

  /* ---------- left rail: all lessons ---------- */
  G.renderRail = function () {
    const rail = document.querySelector(".rail-left");
    if (!rail) return;
    const groups = [];
    G.LESSONS.forEach((l) => { let g = groups.find((x) => x.name === l.group); if (!g) groups.push((g = { name: l.group, items: [] })); g.items.push(l); });
    const stat = (id) => (G.progress ? G.progress.lessonState(id) : "none");
    rail.innerHTML = `<h2>Lessons</h2>` + groups.map((g) => `
      <div class="rail-group"><span>${G.esc(g.name)}</span><ol>` + g.items.map((l) => {
        const st = stat(l.id);
        const mark = st === "done" ? '<span class="st done" title="All problems solved">✓</span>' : st === "doing" ? '<span class="st doing" title="In progress">●</span>' : '<span class="st"></span>';
        if (!G.BUILT.has(l.id)) return `<li><span class="rail-lesson is-soon" title="Interactive page not built yet"><span class="n">${l.id}</span><span>${G.esc(l.short)}</span><span class="soon">soon</span></span></li>`;
        const cur = l.id === G.currentLesson ? ' aria-current="page"' : "";
        return `<li><a class="rail-lesson" href="${G.lessonHref(l.id)}"${cur}><span class="n">${l.id}</span><span>${G.esc(l.short)}</span>${mark}</a></li>`;
      }).join("") + `</ol></div>`).join("");
  };

  /* ---------- right rail: on this page ---------- */
  function buildToc() {
    const toc = document.querySelector(".rail-right");
    const art = document.querySelector(".lesson");
    if (!toc || !art) return;
    const heads = [...art.querySelectorAll("section.sec > h2, section.problem > h3, .exercise > h3")];
    if (!heads.length) return;
    heads.forEach((h) => { if (!h.id) h.id = (h.closest("section, .exercise").id || "") + "-h"; });
    const shortText = (h) => h.textContent.replace(/^\d+\.\s*/, "").replace(/\s*\((LeetCode|like LeetCode)[^)]*\)\s*$/, "").replace(/^Problem (\w+) · /, "$1 · ");
    toc.innerHTML = `<h2>On this page</h2><nav class="toc">` + heads.map((h) =>
      `<a href="#${h.closest("section, .exercise").id}" class="lvl${h.tagName === "H2" ? 2 : 3}" data-for="${h.closest("section, .exercise").id}">${G.esc(shortText(h))}</a>`).join("") + `</nav>`;
    const links = [...toc.querySelectorAll("a")];
    const targets = links.map((a) => document.getElementById(a.dataset.for)).filter(Boolean);
    const io = new IntersectionObserver(() => {
      let best = null;
      for (const t of targets) { const r = t.getBoundingClientRect(); if (r.top < window.innerHeight * 0.35) best = t; }
      links.forEach((a) => a.classList.toggle("is-active", best && a.dataset.for === best.id));
    }, { rootMargin: "0px 0px -60% 0px", threshold: [0, 1] });
    targets.forEach((t) => io.observe(t));
    window.addEventListener("scroll", () => {
      let best = null;
      for (const t of targets) { const r = t.getBoundingClientRect(); if (r.top < window.innerHeight * 0.35) best = t; }
      links.forEach((a) => a.classList.toggle("is-active", !!best && a.dataset.for === best.id));
    }, { passive: true });
  }

  /* ---------- code blocks: highlight, split into lines, tabs ---------- */
  // Split highlighted HTML into lines while keeping open <span> tags balanced across line breaks.
  function splitHighlighted(htmlStr) {
    const out = [];
    let line = "";
    const stack = [];
    const re = /(<span[^>]*>)|(<\/span>)|([^<]+)/g;
    let m;
    while ((m = re.exec(htmlStr))) {
      if (m[1]) { stack.push(m[1]); line += m[1]; }
      else if (m[2]) { stack.pop(); line += m[2]; }
      else {
        const parts = m[3].split("\n");
        parts.forEach((p, i) => {
          if (i > 0) {
            line += "</span>".repeat(stack.length);
            out.push(line);
            line = stack.join("");
          }
          line += p;
        });
      }
    }
    out.push(line);
    return out;
  }
  G.highlightPre = function (pre) {
    if (pre.dataset.ready) return;
    const code = pre.querySelector("code") || pre;
    const lang = (code.className.match(/language-(\w+)/) || [])[1];
    const text = code.textContent.replace(/\n$/, "");
    pre._lines = text.split("\n");
    let html;
    const P = window.Prism;
    const grammar = lang && P && P.languages && P.languages[lang === "ts" ? "typescript" : lang];
    html = grammar ? P.highlight(text, grammar, lang) : G.esc(text);
    const lines = splitHighlighted(html);
    code.innerHTML = lines.map((l, i) => `<span class="ln" data-n="${i + 1}">${l || " "}</span>`).join("");
    pre.dataset.ready = "1";
  };
  function showLang(ct, l) {
    const pres = [...ct.querySelectorAll(":scope > pre")];
    if (!pres.length) return;
    const has = pres.some((p) => p.dataset.lang === l);
    const show = has ? l : pres[0].dataset.lang;
    pres.forEach((p) => p.classList.toggle("is-shown", p.dataset.lang === show));
    ct.querySelectorAll(".code-head .tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.l === show)));
    ct.dataset.shown = show;
  }
  G.showLang = showLang;
  G.codeShown = (ct) => ct.dataset.shown;
  const LANG_NAME = { ts: "TypeScript", go: "Go", bash: "Shell", text: "Text" };
  G.buildCodeTabs = function (ct) {
    if (ct.dataset.built) return;
    const pres = [...ct.querySelectorAll(":scope > pre")];
    pres.forEach((p) => G.highlightPre(p));
    const cap = pres.map((p) => p.dataset.caption).find(Boolean) || ct.dataset.caption || "";
    const head = G.h("div", { class: "code-head" });
    head.innerHTML = `<div class="tabs" role="tablist">` + pres.map((p) => `<button role="tab" data-l="${p.dataset.lang}" aria-selected="false">${LANG_NAME[p.dataset.lang] || p.dataset.lang}</button>`).join("") +
      `</div><span class="cap">${G.esc(cap)}</span><button class="copy" type="button">Copy</button>`;
    ct.insertBefore(head, ct.firstChild);
    head.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.l)));
    head.querySelector(".copy").addEventListener("click", async () => {
      const p = ct.querySelector(":scope > pre.is-shown");
      try { await navigator.clipboard.writeText(p._lines.join("\n")); G.toast("Code copied"); }
      catch (e) { G.toast("Copy is blocked here; select the code instead"); }
    });
    ct.dataset.built = "1";
    showLang(ct, G.lang());
  };
  // Mark one line (1-based) as current in the shown pre; scroll inside the pre only.
  G.markLine = function (ct, n) {
    ct.querySelectorAll(".ln.is-current").forEach((x) => x.classList.remove("is-current"));
    if (!n) return;
    const pre = ct.querySelector(":scope > pre.is-shown");
    if (!pre) return;
    const ln = pre.querySelector(`.ln[data-n="${n}"]`);
    if (!ln) return;
    ln.classList.add("is-current");
    const top = ln.offsetTop, bottom = top + ln.offsetHeight;
    if (top < pre.scrollTop + 24 || bottom > pre.scrollTop + pre.clientHeight - 24) {
      pre.scrollTo({ top: Math.max(0, top - pre.clientHeight / 2.5), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  };
  // Resolve "anchor>>needle" (or "needle") to a 1-based line number in a code-tabs block for a language.
  G.resolveLine = function (ct, lang, spec) {
    const pre = [...ct.querySelectorAll(":scope > pre")].find((p) => p.dataset.lang === lang);
    if (!pre || spec == null) return null;
    if (typeof spec === "number") return spec;
    const lines = pre._lines || pre.textContent.split("\n");
    const parts = spec.split(">>");
    let from = 0;
    for (let k = 0; k < parts.length; k++) {
      const idx = lines.findIndex((l, i) => i >= from && l.includes(parts[k]));
      if (idx < 0) throw new Error(`line not found: "${spec}" (${lang})`);
      from = idx;
    }
    return from + 1;
  };

  /* ---------- previous / next ---------- */
  function buildPager() {
    const pg = document.querySelector(".pager[data-auto]");
    if (!pg || !G.currentLesson) return;
    const i = G.LESSONS.findIndex((l) => l.id === G.currentLesson);
    const cell = (l, cls, label) => {
      if (!l) return `<span class="${cls}" style="visibility:hidden"></span>`;
      const t = `<small>${label}</small>${l.id} · ${G.esc(l.title)}`;
      return G.BUILT.has(l.id) ? `<a class="${cls}" href="${G.lessonHref(l.id)}">${t}</a>` : `<span class="${cls}">${t}<small>Interactive page comes in a later batch</small></span>`;
    };
    pg.innerHTML = cell(G.LESSONS[i - 1], "prev", "Previous") + cell(G.LESSONS[i + 1], "next", "Next");
  }

  /* ---------- selftest reporting ---------- */
  G.testLog = [];
  G.testFail = (msg) => { G.testLog.push("FAIL " + msg); };

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    root.setAttribute("data-code-lang", G.lang());
    buildTopbar();
    G.renderRail();
    document.querySelectorAll(".code-tabs").forEach((ct) => G.buildCodeTabs(ct));
    document.querySelectorAll("pre.plain").forEach((p) => G.highlightPre(p));
    setLang(G.lang());
    buildToc();
    buildPager();
    // links to lessons whose interactive page is not built yet: explain instead of opening a missing file
    document.querySelectorAll('.lesson a[href]').forEach((a) => {
      const m = (a.getAttribute("href") || "").match(/(?:^|\/)(\d\d)-[\w-]+\.html/);
      if (m && !G.BUILT.has(m[1])) {
        a.classList.add("soon-link");
        a.title = "This lesson's interactive page comes in a later batch";
        a.addEventListener("click", (e) => { e.preventDefault(); G.toast(`Lesson ${m[1]} is coming in a later batch`); });
      }
    });
    G.on("progress", () => G.renderRail());
  });
})();

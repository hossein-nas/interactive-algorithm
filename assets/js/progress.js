/* Algorithm guide v3 — progress: problem status, mistake log with 3/7-day redo dates, export/import. */
(function () {
  "use strict";
  const G = window.Guide;
  const KEY = "progress";
  const blank = () => ({ v: 1, items: {}, lessons: {}, quizzes: {}, log: [], last: null });
  let data = G.store.get(KEY, null) || blank();
  if (!data.v) data = blank();
  const save = () => { G.store.set(KEY, data); G.emit("progress", data); };

  const P = (G.progress = {
    data: () => data,
    status: (id) => (data.items[id] && data.items[id].s) || "none",
    setStatus(id, s, title) {
      data.items[id] = { s, t: title || (data.items[id] && data.items[id].t) || id, at: G.ymd(G.today()) };
      save();
    },
    registerLesson(lessonId, items) {
      const l = (data.lessons[lessonId] = data.lessons[lessonId] || {});
      l.items = items.map((x) => x.id);
      l.titles = Object.fromEntries(items.map((x) => [x.id, x.title]));
      l.visited = G.ymd(G.today());
      data.last = lessonId;
      save();
    },
    lessonCounts(lessonId) {
      const l = data.lessons[lessonId];
      if (!l || !l.items) return { total: 0, solved: 0, redo: 0 };
      let solved = 0, redo = 0;
      l.items.forEach((id) => { const s = P.status(id); if (s === "solved") solved++; else if (s === "redo") redo++; });
      return { total: l.items.length, solved, redo };
    },
    lessonState(lessonId) {
      const c = P.lessonCounts(lessonId);
      if (!c.total) return data.lessons[lessonId] ? "doing" : "none";
      if (c.solved === c.total) return "done";
      return c.solved || c.redo || data.lessons[lessonId] ? "doing" : "none";
    },
    addLog(entry) {
      const today = G.ymd(G.today());
      const e = Object.assign({ id: "m" + Date.now().toString(36), date: today, pattern: "", wrong: "", done: [false, false] }, entry);
      e.redo = [G.addDays(e.date, 3), G.addDays(e.date, 7)];
      data.log.unshift(e);
      save();
      return e;
    },
    updateLog(id, patch) { const e = data.log.find((x) => x.id === id); if (e) { Object.assign(e, patch); save(); } },
    removeLog(id) { data.log = data.log.filter((x) => x.id !== id); save(); },
    latestLogFor(item) { return data.log.find((x) => x.item === item); },
    due() {
      const today = G.ymd(G.today());
      const out = [];
      data.log.forEach((e) => e.redo.forEach((d, k) => { if (!e.done[k] && d <= today) out.push({ e, k, d }); }));
      return out.sort((a, b) => (a.d < b.d ? -1 : 1));
    },
    quizBest(id, score, of) {
      const q = data.quizzes[id];
      if (!q || score > q.best) { data.quizzes[id] = { best: score, of, at: G.ymd(G.today()) }; save(); }
    },
    exportFile() {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = G.h("a", { href: URL.createObjectURL(blob), download: `algorithm-guide-progress-${G.ymd(G.today())}.json` });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
    importFile(file) {
      return file.text().then((txt) => {
        const d = JSON.parse(txt);
        if (!d || d.v !== 1 || typeof d.items !== "object" || !Array.isArray(d.log)) throw new Error("This file is not a progress export from this guide.");
        data = Object.assign(blank(), d);
        save();
      });
    },
  });

  /* ---------- per-problem status control on lesson pages ---------- */
  function mountStatus(sec, lessonId, pattern) {
    const h = sec.querySelector(":scope > h3");
    if (!h) return null;
    const id = `${lessonId}/${sec.id}`;
    const title = h.textContent.replace(/\s*\((LeetCode|like LeetCode)[^)]*\)\s*$/, "").trim();
    const wrap = G.h("div", { class: "status" });
    wrap.innerHTML = `<span>My status</span><div class="seg" role="group" aria-label="Status for ${G.esc(title)}">
      <button data-v="none">Not started</button><button data-v="solved">Solved</button><button data-v="redo">Needs redo</button></div>`;
    const form = G.h("form", { class: "redo-form", hidden: "" });
    form.innerHTML = `<label>Pattern<input name="pattern" value="${G.esc(pattern)}"></label>
      <label>What I got wrong<textarea name="wrong" rows="2" placeholder="For example: moved mid after swapping with high"></textarea></label>
      <div class="row"><span style="flex:1;font-size:.82rem;color:var(--ink-soft)" class="dates"></span><button type="button" class="btn ghost" data-a="close">Close</button><button type="submit" class="btn">Save note</button></div>`;
    h.after(wrap);
    wrap.after(form);
    const paint = () => {
      const s = P.status(id);
      wrap.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === s)));
    };
    wrap.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      const v = b.dataset.v;
      const was = P.status(id);
      P.setStatus(id, v, title);
      paint();
      if (v === "redo") {
        let e = P.latestLogFor(id);
        if (!e || was !== "redo") e = P.addLog({ item: id, title, lesson: lessonId, pattern });
        form.dataset.log = e.id;
        form.wrong.value = e.wrong || "";
        form.querySelector(".dates").textContent = `Redo on ${e.redo[0]} and ${e.redo[1]}`;
        form.hidden = false;
        form.wrong.focus();
      } else {
        form.hidden = true;
        if (v === "solved") G.toast("Marked as solved");
      }
    }));
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      P.updateLog(form.dataset.log, { pattern: form.pattern.value.trim(), wrong: form.wrong.value.trim() });
      form.hidden = true;
      G.toast("Saved to your redo log");
    });
    form.querySelector('[data-a="close"]').addEventListener("click", () => { form.hidden = true; });
    paint();
    return { id, title };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const lessonId = G.currentLesson;
    if (!lessonId) return;
    const pattern = document.documentElement.getAttribute("data-pattern") || G.lessonById(lessonId).title;
    const items = [];
    document.querySelectorAll(".lesson section.problem, .lesson .exercise[data-track]").forEach((sec) => {
      const it = mountStatus(sec, lessonId, pattern);
      if (it) items.push(it);
    });
    P.registerLesson(lessonId, items);
  });
})();

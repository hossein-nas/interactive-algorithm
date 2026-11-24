/* Algorithm guide v3 — quizzes: one question at a time, instant feedback with the reason, best score saved.
   Markup: <div class="quiz" data-quiz="key"></div>; data: Guide.quizzes[key] = {title, intro?, items: [{q, options, answer, why}]} */
(function () {
  "use strict";
  const G = window.Guide;

  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

  class Quiz {
    constructor(el, key) {
      this.el = el;
      this.key = key;
      this.data = G.quizzes[key];
      if (!this.data) throw new Error(`quiz "${key}" is not registered`);
      this.id = `${G.currentLesson || "home"}/${key}`;
      this.start(false);
    }
    start(shuffled) {
      this.items = shuffled ? shuffle(this.data.items) : this.data.items.slice();
      this.i = 0;
      this.right = 0;
      this.picked = null;
      this.paint();
    }
    paint() {
      const d = this.data;
      const best = G.progress && G.progress.data().quizzes[this.id];
      const head = `<div class="quiz-head"><b>${G.esc(d.title)}</b><span>${this.i < this.items.length ? `${this.i + 1} of ${this.items.length}` : "done"}${best ? ` · best ${best.best}/${best.of}` : ""}</span></div>`;
      if (this.i >= this.items.length) {
        const n = this.items.length;
        G.progress && G.progress.quizBest(this.id, this.right, n);
        const msg = this.right === n ? "Every one right. This pattern is yours." : this.right >= n * 0.7 ? "Solid. Re-read the reasons for the ones you missed." : "Worth another pass: read the explanations, then try again.";
        this.el.innerHTML = head + `<div class="quiz-body quiz-done"><div class="big">${this.right} / ${n}</div><p>${msg}</p><div class="quiz-nav" style="justify-content:flex-start"><button class="btn" data-a="again">Try again, shuffled</button></div></div>`;
        this.el.querySelector('[data-a="again"]').addEventListener("click", () => this.start(true));
        return;
      }
      const it = this.items[this.i];
      const p = this.picked;
      this.el.innerHTML = head + `<div class="quiz-body">${this.i === 0 && d.intro ? `<p style="color:var(--ink-soft);margin-top:0">${G.fmt(d.intro)}</p>` : ""}
        <p class="quiz-q">${G.fmt(it.q)}</p>
        <div class="quiz-opts">${it.options.map((o, k) => `<button data-k="${k}"${p != null ? " disabled" : ""} class="${p == null ? "" : k === it.answer ? "right" : k === p ? "wrong" : ""}">${G.fmt(o)}</button>`).join("")}</div>
        ${p != null ? `<div class="quiz-why${p === it.answer ? "" : " was-wrong"}"><b>${p === it.answer ? "Right." : "Not quite."}</b> ${G.fmt(it.why || "")}</div>
        <div class="quiz-nav"><button class="btn" data-a="next">${this.i === this.items.length - 1 ? "See my score" : "Next question"}</button></div>` : ""}
      </div>`;
      this.el.querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => {
        this.picked = +b.dataset.k;
        if (this.picked === it.answer) this.right++;
        this.paint();
        this.el.querySelector('[data-a="next"]').focus({ preventScroll: true });
      }));
      const nx = this.el.querySelector('[data-a="next"]');
      if (nx) nx.addEventListener("click", () => { this.i++; this.picked = null; this.paint(); this.el.querySelector(".quiz-opts button, [data-a=again]")?.focus({ preventScroll: true }); });
    }
  }

  G.quiz = {
    list: [],
    selftest() {
      G.quiz.list.forEach((q) => {
        q.data.items.forEach((it, k) => {
          if (!(it.answer >= 0 && it.answer < it.options.length)) G.testFail(`quiz ${q.key} item ${k}: answer out of range`);
          if (!it.why) G.testFail(`quiz ${q.key} item ${k}: no explanation`);
        });
      });
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".quiz[data-quiz]").forEach((el) => {
      try { G.quiz.list.push(new Quiz(el, el.dataset.quiz)); }
      catch (e) { G.testFail(e.message); el.innerHTML = `<div class="dg-error">${G.esc(e.message)}</div>`; }
    });
  });
})();

/* Algorithm guide v3 — a practice round timer with phases.
   Markup: <div class="round-timer" data-phases='[["Understand",5,"Read, restate, ask questions"], ...]'></div> */
(function () {
  "use strict";
  const G = window.Guide;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  function mount(el) {
    const phases = JSON.parse(el.dataset.phases).map(([name, min, what]) => ({ name, sec: min * 60, what }));
    const total = phases.reduce((a, p) => a + p.sec, 0);
    let elapsed = 0, running = false, last = 0, raf = 0;
    el.innerHTML = `
      <div class="rt-top"><div class="rt-clock" aria-live="off">0:00</div><div class="rt-now"><b></b><span></span></div>
      <div class="rt-btns"><button class="btn" data-a="go">Start</button><button class="btn ghost" data-a="reset">Reset</button></div></div>
      <div class="rt-bar">${phases.map((p, i) => `<div class="rt-seg" style="flex:${p.sec}" data-i="${i}"><i></i><span>${G.esc(p.name)} · ${p.sec / 60} min</span></div>`).join("")}</div>
      <p class="rt-note">${G.esc(el.dataset.note || "Say everything out loud. When a phase runs out, move on and say what you would do with more time.")}</p>`;
    const clock = el.querySelector(".rt-clock"), now = el.querySelector(".rt-now"), go = el.querySelector('[data-a="go"]');
    function paint() {
      let t = elapsed, i = 0;
      while (i < phases.length - 1 && t >= phases[i].sec) { t -= phases[i].sec; i++; }
      const over = elapsed >= total;
      clock.textContent = `${fmt(elapsed)} / ${fmt(total)}`;
      now.querySelector("b").textContent = over ? "Time is up" : phases[i].name;
      now.querySelector("span").textContent = over ? "Stop, then grade yourself honestly." : `${phases[i].what} (${fmt(Math.max(0, phases[i].sec - t))} left in this phase)`;
      let acc = 0;
      el.querySelectorAll(".rt-seg").forEach((seg, k) => {
        const p = phases[k], fill = Math.max(0, Math.min(1, (elapsed - acc) / p.sec));
        seg.querySelector("i").style.width = fill * 100 + "%";
        seg.classList.toggle("is-now", !over && k === i);
        acc += p.sec;
      });
    }
    function tick(ts) {
      if (!running) return;
      elapsed = Math.min(total, elapsed + (ts - last) / 1000);
      last = ts;
      paint();
      if (elapsed >= total) { running = false; go.textContent = "Start"; return; }
      raf = requestAnimationFrame(tick);
    }
    go.addEventListener("click", () => {
      running = !running;
      go.textContent = running ? "Pause" : "Resume";
      if (running) { if (elapsed >= total) elapsed = 0; last = performance.now(); raf = requestAnimationFrame(tick); }
      else cancelAnimationFrame(raf);
    });
    el.querySelector('[data-a="reset"]').addEventListener("click", () => { running = false; cancelAnimationFrame(raf); elapsed = 0; go.textContent = "Start"; paint(); });
    paint();
  }
  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll(".round-timer[data-phases]").forEach(mount));
})();

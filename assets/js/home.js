/* Algorithm guide v3 — home page: today's plan, redo queue, lesson progress, redo log, progress file. */
(function () {
  "use strict";
  const G = window.Guide;
  const P = () => G.progress;

  /* ---------- study plans, from "00 Start here", section 4 ---------- */
  // 4 weeks × 6 study days; the 7th day of each week is the 15-minute weekly review.
  const PLAN4 = [
    { t: "Files 01, 02, 03. Practice the seven-step routine on Two Sum aloud.", l: ["01", "02", "03"] },
    { t: "File 04 (hash maps). Problems 1 to 4; skim 5 and 6.", l: ["04"] },
    { t: "File 05 (two pointers).", l: ["05"] },
    { t: "File 06 (sliding window).", l: ["06"] },
    { t: "File 07 (prefix sums).", l: ["07"] },
    { t: "File 08 (binary search). Weekend: redo two problems from each file from memory.", l: ["08"] },
    { t: "File 09 (sorting, divide and conquer) and file 10 (recursion).", l: ["09", "10"] },
    { t: "File 11 (backtracking).", l: ["11"] },
    { t: "File 12 (linked lists). Then 13 (stacks).", l: ["12", "13"] },
    { t: "File 14 (queues) and file 15 (trees).", l: ["14", "15"] },
    { t: "File 17 (heaps) and file 18 (tries). Skim 16 (balanced trees) as concepts.", l: ["17", "18", "16"] },
    { t: "Mock 1 (see file 29) + review of week 2 mistakes.", l: ["29"] },
    { t: "File 19 (BFS, DFS, grids).", l: ["19"] },
    { t: "Files 20 (topological sort) and 21 (union-find).", l: ["20", "21"] },
    { t: "File 22 (shortest paths).", l: ["22"] },
    { t: "File 23 (greedy, NP-complete).", l: ["23"] },
    { t: "File 24 (intervals).", l: ["24"] },
    { t: "Mock 2 + redo the hardest problem from each of files 19 to 24.", l: ["29"] },
    { t: "File 25 (DP, 1D).", l: ["25"] },
    { t: "Finish 25's exercises; start file 26 (DP, 2D): knapsack and LCS.", l: ["25", "26"] },
    { t: "File 26: edit distance, palindromic subsequence, regex.", l: ["26"] },
    { t: "File 27 (bit manipulation) and skim file 28.", l: ["27", "28"] },
    { t: "File 29: pattern chooser, then Mock 3 from the file.", l: ["29"] },
    { t: "Full timed mock: pick 3 problems you have not seen (see the practice list in file 29, Part 4).", l: ["29"] },
  ];
  // 2 weeks, one block per day, no rest day.
  const PLAN2 = [
    { t: "Files 01 to 03.", l: ["01", "02", "03"] }, { t: "Files 04 and 05.", l: ["04", "05"] }, { t: "Files 06 and 07.", l: ["06", "07"] },
    { t: "Files 08 and 10.", l: ["08", "10"] }, { t: "Files 11 and 12.", l: ["11", "12"] }, { t: "Files 13 and 15.", l: ["13", "15"] },
    { t: "File 17.", l: ["17"] }, { t: "File 19.", l: ["19"] }, { t: "Files 20 and 22.", l: ["20", "22"] }, { t: "Files 23 and 24.", l: ["23", "24"] },
    { t: "File 25.", l: ["25"] }, { t: "File 26.", l: ["26"] }, { t: "File 29 with all three mocks.", l: ["29"] },
    { t: "Review weak spots, then files 21 and 18.", l: ["21", "18"] },
  ];
  const daysBetween = (a, b) => { const [y1, m1, d1] = a.split("-").map(Number), [y2, m2, d2] = b.split("-").map(Number); return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5); };
  function planDay(plan) {
    const d = daysBetween(plan.start, G.ymd(G.today()));
    if (d < 0) return { msg: `Your plan starts on ${plan.start}.` };
    if (plan.kind === "2w") {
      if (d >= PLAN2.length) return { msg: "Your 2-week plan is finished. Keep redoing what is due below, and run timed mocks." };
      return { label: `Day ${d + 1} of 14`, day: PLAN2[d] };
    }
    const w = Math.floor(d / 7), dow = d % 7;
    if (w >= 4) return { msg: "Your 4-week plan is finished. Keep redoing what is due below, and run timed mocks." };
    if (dow === 6) return { label: `Week ${w + 1}, review day`, day: { t: "Weekly review, 15 minutes: go through your redo log, and redo each wrong problem that is due.", l: [] } };
    return { label: `Week ${w + 1}, day ${dow + 1}`, day: PLAN4[w * 6 + dow] };
  }

  const link = (id, extra) => {
    const l = G.lessonById(id);
    if (!l) return G.esc(id);
    return G.BUILT.has(id) ? `<a href="${G.lessonHref(id)}${extra || ""}">${l.id} ${G.esc(l.short)}</a>` : `<span title="Interactive page comes in a later batch">${l.id} ${G.esc(l.short)}</span>`;
  };

  /* ---------- today ---------- */
  function renderToday() {
    const box = document.getElementById("today");
    const plan = G.store.get("plan", null);
    const last = P().data().last;
    const due = P().due();
    let planHtml;
    if (!plan) planHtml = `<p>No study plan yet. <a href="#plan">Pick a 2-week or 4-week plan</a> and this spot will show what to do each day.</p>`;
    else {
      const pd = planDay(plan);
      planHtml = pd.msg ? `<p>${G.esc(pd.msg)}</p>` : `<p><b>${G.esc(pd.label)}.</b> ${G.esc(pd.day.t)}</p>${pd.day.l.length ? `<p class="lessons-line">${pd.day.l.map((id) => link(id)).join(" ")}</p>` : ""}`;
    }
    const cont = last && G.BUILT.has(last) ? `<a class="btn" href="${G.lessonHref(last)}">Continue lesson ${last}: ${G.esc(G.lessonById(last).short)}</a>` : `<a class="btn" href="${G.lessonHref("05")}">Open lesson 05: Two pointers</a>`;
    box.innerHTML = `
      <div class="today-grid">
        <div><h3>Today's plan</h3>${planHtml}</div>
        <div><h3>Due for a redo</h3>${due.length ? `<ol class="due">${due.slice(0, 6).map(({ e, k, d }) =>
          `<li><span>${link(e.lesson, "#" + e.item.split("/")[1])}: ${G.esc(e.title)}</span><small>redo ${k + 1} of 2, due ${d}${e.wrong ? ` · ${G.esc(e.wrong)}` : ""}</small><button class="btn ghost" data-done="${e.id}:${k}">Done</button></li>`).join("")}</ol>${due.length > 6 ? `<p><a href="#log">${due.length - 6} more in your redo log</a></p>` : ""}` :
        `<p>Nothing is due. When you mark a problem <em>Needs redo</em>, it comes back here after 3 days and again after 7.</p>`}</div>
      </div>
      <p class="today-cta">${cont}</p>`;
    box.querySelectorAll("[data-done]").forEach((b) => b.addEventListener("click", () => {
      const [id, k] = b.dataset.done.split(":");
      const e = P().data().log.find((x) => x.id === id);
      if (!e) return;
      const done = e.done.slice(); done[+k] = true;
      P().updateLog(id, { done });
      G.toast("Redo marked done");
    }));
  }

  /* ---------- lessons with progress ---------- */
  function renderLessons() {
    const box = document.getElementById("lesson-list");
    const groups = [];
    G.LESSONS.forEach((l) => { let g = groups.find((x) => x.name === l.group); if (!g) groups.push((g = { name: l.group, items: [] })); g.items.push(l); });
    box.innerHTML = groups.map((g) => `<div class="lgroup"><h3>${G.esc(g.name)}</h3><ol>` + g.items.map((l) => {
      const c = P().lessonCounts(l.id);
      const built = G.BUILT.has(l.id);
      const pct = c.total ? Math.round((100 * c.solved) / c.total) : 0;
      const stars = l.stars ? `<span class="stars" title="${["", "Good for depth", "Fairly likely in interviews", "Very likely in interviews"][l.stars]}">${"★".repeat(l.stars)}</span>` : "<span></span>";
      const prog = !built ? `<span class="muted">coming in a later batch</span>` : c.total ? `<span class="bar" role="img" aria-label="${c.solved} of ${c.total} solved"><i style="width:${pct}%"></i></span><span class="muted">${c.solved}/${c.total} solved${c.redo ? `, ${c.redo} to redo` : ""}</span>` : `<span class="muted">not opened yet</span>`;
      return `<li class="${built ? "" : "soon"}"><span class="n">${l.id}</span>${built ? `<a href="${G.lessonHref(l.id)}">${G.esc(l.title)}</a>` : `<span>${G.esc(l.title)}</span>`}${stars}<span class="prog">${prog}</span></li>`;
    }).join("") + `</ol></div>`).join("");
  }

  /* ---------- redo log ---------- */
  function renderLog() {
    const box = document.getElementById("log-table");
    const log = P().data().log;
    if (!log.length) { box.innerHTML = `<p class="muted">Your log is empty. On any problem, choose <em>Needs redo</em> and write one line about what went wrong.</p>`; return; }
    box.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Problem</th><th>Pattern</th><th>What I got wrong</th><th>Redo after 3 days</th><th>Redo after 7 days</th><th></th></tr></thead><tbody>` +
      log.map((e) => `<tr><td>${link(e.lesson, "#" + e.item.split("/")[1])}<br><small class="muted">${G.esc(e.title)} · logged ${e.date}</small></td><td>${G.esc(e.pattern)}</td><td>${G.esc(e.wrong || "")}</td>` +
        e.redo.map((d, k) => `<td><label class="toggle"><input type="checkbox" data-id="${e.id}" data-k="${k}"${e.done[k] ? " checked" : ""}> ${d}</label></td>`).join("") +
        `<td><button class="btn ghost" data-del="${e.id}" aria-label="Delete this log entry">Delete</button></td></tr>`).join("") + `</tbody></table></div>`;
    box.querySelectorAll("input[data-id]").forEach((c) => c.addEventListener("change", () => {
      const e = P().data().log.find((x) => x.id === c.dataset.id);
      const done = e.done.slice(); done[+c.dataset.k] = c.checked;
      P().updateLog(e.id, { done });
    }));
    box.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { P().removeLog(b.dataset.del); G.toast("Log entry deleted"); }));
  }

  /* ---------- plan form ---------- */
  function renderPlan() {
    const f = document.getElementById("plan-form");
    const plan = G.store.get("plan", null);
    f.kind.value = plan ? plan.kind : "4w";
    f.start.value = plan ? plan.start : G.ymd(G.today());
    f.addEventListener("submit", (ev) => {
      ev.preventDefault();
      G.store.set("plan", { kind: f.kind.value, start: f.start.value || G.ymd(G.today()) });
      renderToday();
      G.toast("Study plan saved");
      document.getElementById("today").scrollIntoView({ behavior: G.reducedMotion() ? "auto" : "smooth" });
    });
    document.getElementById("plan-clear").addEventListener("click", () => { G.store.set("plan", null); renderToday(); G.toast("Study plan removed"); });
  }

  /* ---------- progress file ---------- */
  function wireFile() {
    document.getElementById("btn-export").addEventListener("click", () => P().exportFile());
    const inp = document.getElementById("file-import");
    document.getElementById("btn-import").addEventListener("click", () => inp.click());
    inp.addEventListener("change", () => {
      const file = inp.files[0];
      if (!file) return;
      P().importFile(file).then(() => G.toast("Progress loaded from the file")).catch((e) => G.toast(e.message));
      inp.value = "";
    });
    document.getElementById("btn-reset").addEventListener("click", () => {
      if (!confirm("Erase all progress, quiz scores and the redo log in this browser? Export a file first if you want to keep it.")) return;
      G.store.set("progress", null);
      location.reload();
    });
  }

  /* ---------- the guide map: link built lessons from the diagram ---------- */
  const NODE = { F1: "01", F2: "02", F3: "03", P1: "04", P2: "05", P3: "06", P4: "07", P5: "08", R1: "09", R2: "10", R3: "11", S1: "12", S2: "13", S3: "14", S4: "15", S5: "16", S6: "17", S7: "18", G1: "19", G2: "20", G3: "21", G4: "22", T1: "23", T2: "24", T3: "25", T4: "26", E1: "27", E2: "28", E3: "29" };
  const fig = document.getElementById("fig-map");
  if (fig) {
    const links = {};
    for (const k in NODE) if (G.BUILT.has(NODE[k])) links[k] = G.lessonHref(NODE[k]);
    const s = document.createElement("script");
    s.type = "application/json";
    s.className = "links";
    s.textContent = JSON.stringify(links);
    fig.appendChild(s);
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderToday(); renderLessons(); renderLog(); renderPlan(); wireFile();
    G.on("progress", () => { renderToday(); renderLessons(); renderLog(); });
  });
})();

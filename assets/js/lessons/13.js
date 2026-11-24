/* Lesson 13 · Stacks and the monotonic stack — animators and quizzes. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;
  // the stack is drawn as a column, top first
  const stackPanel = (title, items, fmt, hiTop) => ({ title, entries: items.map((x, k) => [`#${k}`, fmt ? fmt(x) : x]).reverse(), hi: hiTop && items.length ? [`#${items.length - 1}`] : [], empty: "(empty)", keyW: 34, valW: 70 });

  A.validParens = {
    title: "Valid Parentheses: the newest opener must close first",
    viz: "array", legend: ["focus:current character", "answer:matched", "bug:mismatch"],
    inputLabel: "brackets", hint: "{[]}",
    presets: [{ label: "{[]} (the trace table)", input: "{[]}" }, { label: "()[]{}", input: "()[]{}" }, { label: "([)]", input: "([)]" }, { label: "((", input: "((" }],
    table: { id: "tbl-2", preset: 0, rows: ["c0", "c1", "c2", "c3"] },
    parse(s) { const t = String(s).trim(); if (!/^[()\[\]{}]{1,14}$/.test(t)) throw new Error("Only ()[]{} characters, up to 14."); return t; },
    lines: { push: { ts: "if (opener === undefined) stack.push(ch);", go: "stack = append(stack, ch) // push the opener" }, pop: { ts: "else if (stack.pop() !== opener) return false;", go: "stack = stack[:len(stack)-1] // pop" }, fail: { ts: "else if (stack.pop() !== opener) return false;", go: "return false // nothing to match" }, end: { ts: "return stack.length === 0;", go: "return len(stack) == 0" } },
    trace(s) {
      const T = new G.Trace();
      const stack = [], idx = [], mk = {};
      const pair = { ")": "(", "]": "[", "}": "{" };
      const st = (i) => ({ cellW: 40, cells: G.cells(s.split("")), marks: Object.assign({}, mk, i != null ? { [i]: mk[i] || "focus" } : {}), panels: [stackPanel("stack (top first)", stack, null, true)] });
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (!pair[ch]) { stack.push(ch); idx.push(i); T.add({ at: "push", key: `c${i}`, state: st(i), vars: { ch }, say: `\`${ch}\` opens something: push it. We now owe a matching closer.` }); continue; }
        const ok = stack.length && stack[stack.length - 1] === pair[ch];
        T.add({ at: "pop", key: `c${i}`, state: st(i), vars: { ch, top: stack.length ? stack[stack.length - 1] : "none" }, say: `\`${ch}\` closes. The top is ${stack.length ? `\`${stack[stack.length - 1]}\`` : "nothing"}.`, ask: { q: `Does \`${ch}\` match the top?`, options: ["Yes: pop it", "No: return false"], answer: ok ? 0 : 1, why: ok ? "The newest opener is the one that must close first." : stack.length ? `The newest opener is \`${stack[stack.length - 1]}\`, not \`${pair[ch]}\`.` : "There is nothing to close." } });
        if (!ok) { mk[i] = "bug"; T.add({ at: "fail", key: `c${i}`, state: st(i), vars: {}, say: "Mismatch: return `false`." }); return T.done(false); }
        stack.pop();
        mk[i] = mk[idx.pop()] = "answer";
        T.add({ at: "pop", key: `c${i}`, state: st(), vars: {}, say: "Matched: pop." });
      }
      const ok = stack.length === 0;
      T.add({ at: "end", state: st(), vars: { leftover: stack.length }, say: ok ? "The stack is empty: every bracket was closed. Return `true`." : `${stack.length} opener${stack.length === 1 ? " was" : "s were"} never closed: return \`false\`.` });
      return T.done(ok);
    },
  };

  A.minStack = {
    title: "Min Stack: every entry remembers the minimum below it",
    viz: "array", legend: ["focus:the top entry"],
    inputLabel: "operations", hint: "push 2, push 5, push 1, getMin, pop, getMin, top",
    presets: [{ label: "the lesson's example", input: "push 2, push 5, push 1, getMin, pop, getMin, top" }],
    parse(s) { const ops = String(s).split(",").map((x) => x.trim().split(/\s+/)).filter((x) => x[0]); if (!ops.length || ops.length > 12) throw new Error("1 to 12 operations."); ops.forEach((o) => { if (!["push", "pop", "top", "getMin"].includes(o[0])) throw new Error(`Unknown operation ${o[0]}.`); if (o[0] === "push" && !Number.isFinite(Number(o[1]))) throw new Error("push needs a number."); }); let size = 0; ops.forEach((o) => { if (o[0] === "push") size++; else if (!size) throw new Error(`${o[0]} on an empty stack.`); else if (o[0] === "pop") size--; }); return ops.map((o) => ({ op: o[0], v: Number(o[1]) })); },
    lines: { min: { ts: "const min = this.items.length === 0 ? value : Math.min(value, this.getMin());", go: "min := value" }, push: { ts: "this.items.push({ value, min });", go: "s.items = append(s.items, minEntry{value, min})" }, pop: { ts: "this.items.pop();", go: "func (s *MinStack) Pop()" }, top: { ts: "return this.items[this.items.length - 1].value;", go: "func (s *MinStack) Top()" }, getMin: { ts: "return this.items[this.items.length - 1].min;", go: "func (s *MinStack) GetMin()" } },
    trace(ops) {
      const T = new G.Trace();
      const items = [], out = [];
      const st = () => ({ cells: [], minW: 200, panels: [stackPanel("stack (value, min below)", items, (e) => `${e.value} (min ${e.min})`, true)], note: out.length ? { text: `outputs: ${out.join(", ")}` } : null });
      ops.forEach(({ op, v }) => {
        if (op === "push") { const min = items.length ? Math.min(v, items[items.length - 1].min) : v; T.add({ at: "min", state: st(), vars: { value: v, min }, say: `push(${v}): the minimum at or below it is min(${v}, ${items.length ? items[items.length - 1].min : v}) = ${min}.` }); items.push({ value: v, min }); T.add({ at: "push", state: st(), vars: {}, say: `Store (${v}, min ${min}).` }); }
        else if (op === "pop") { const e = items.pop(); T.add({ at: "pop", state: st(), vars: {}, say: `pop removes ${e.value}. The new top already knows its minimum: no rescan.` }); }
        else if (op === "top") { out.push(items[items.length - 1].value); T.add({ at: "top", state: st(), vars: { top: items[items.length - 1].value }, say: `top() = ${items[items.length - 1].value}.` }); }
        else { out.push(items[items.length - 1].min); T.add({ at: "getMin", state: st(), vars: { min: items[items.length - 1].min }, say: `getMin() = ${items[items.length - 1].min}, read straight from the top entry: \`O(1)\`.` }); }
      });
      return T.done(out);
    },
  };

  A.evalRPN = {
    title: "Evaluate Reverse Polish Notation",
    viz: "array", legend: ["focus:current token"],
    inputLabel: "tokens", hint: "4 13 5 / +",
    presets: [{ label: "4 13 5 / + (the trace table)", input: "4 13 5 / +" }, { label: "2 1 + 3 *", input: "2 1 + 3 *" }, { label: "the long example", input: "10 6 9 3 + -11 * / * 17 + 5 +" }],
    table: { id: "tbl-3", preset: 0, rows: ["t0", "t1", "t2", "t3", "t4"] },
    parse(s) { const t = String(s).trim().split(/\s+/); let d = 0; t.forEach((x) => { if (["+", "-", "*", "/"].includes(x)) { if (d < 2) throw new Error("An operator needs two numbers before it."); d--; } else if (/^-?\d+$/.test(x)) d++; else throw new Error(`"${x}" is not a number or + - * /.`); }); if (d !== 1 || t.length > 14) throw new Error("Not a complete expression (or more than 14 tokens)."); return t; },
    lines: { op: { ts: "const right = stack.pop()!; // the most recent number is the RIGHT operand", go: "right := stack[len(stack)-1] // the most recent number is the RIGHT operand" }, num: { ts: "stack.push(Number(token));", go: "stack = append(stack, n)" }, ret: { ts: "function evalRPN>>return stack[0];", go: "func evalRPN>>return stack[0]" } },
    trace(toks) {
      const T = new G.Trace();
      const stack = [];
      const st = (i) => ({ cellW: 44, cells: G.cells(toks), marks: i != null ? { [i]: "focus" } : {}, panels: [stackPanel("stack (top first)", stack, null, true)] });
      toks.forEach((t, i) => {
        if (["+", "-", "*", "/"].includes(t)) {
          const r = stack.pop(), l = stack.pop();
          const v = t === "+" ? l + r : t === "-" ? l - r : t === "*" ? l * r : Math.trunc(l / r);
          stack.push(v);
          T.add({ at: "op", key: `t${i}`, state: st(i), vars: { left: l, right: r, result: v }, say: `\`${t}\`: pop ${r} (the right operand), pop ${l} (the left). ${l} ${t} ${r} = ${v}${t === "/" ? " (truncated toward zero)" : ""}. Push it.` });
        } else { stack.push(Number(t)); T.add({ at: "num", key: `t${i}`, state: st(i), vars: {}, say: `A number: push ${t}.` }); }
      });
      T.add({ at: "ret", state: st(null), vars: { result: stack[0] }, say: `One number remains: ${stack[0]}.` });
      return T.done(stack[0]);
    },
  };

  A.dailyTemps = {
    title: "Daily Temperatures: a stack of days still waiting",
    viz: "bars", legend: ["focus:today", "anchor:waiting on the stack", "answer:answered"],
    inputLabel: "temperatures", hint: "73 74 75 71 69 72 76 73",
    presets: [{ label: "the lesson's 8 days (the trace table)", input: "73 74 75 71 69 72 76 73" }, { label: "[5,4,3,6]", input: "5 4 3 6" }],
    table: { id: "tbl-4", preset: 0, rows: ["i0", "i1", "i2", "i3", "i4", "i5", "i6", "i7"] },
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 10, min: -50, max: 130 }),
    lines: { pop: { ts: "const day = waiting.pop()!;", go: "day := waiting[len(waiting)-1]" }, ans: { ts: "answer[day] = i - day; // today is the first warmer day", go: "answer[day] = i - day // today is the first warmer day" }, push: { ts: "waiting.push(i);", go: "waiting = append(waiting, i)" } },
    trace(t) {
      const T = new G.Trace();
      const ans = new Array(t.length).fill(null), wait = [];
      const base = Math.min(...t) - 4;
      const st = (i) => { const mk = {}; wait.forEach((d) => (mk[d] = "anchor")); ans.forEach((a, d) => { if (a != null) mk[d] = "answer"; }); if (i != null && i < t.length) mk[i] = "focus"; return { h: t.map((x) => x - base), maxH: Math.max(...t) - base, marks: mk, rows: [{ label: "temp", vals: t }, { label: "answer", vals: ans.map((a) => (a == null ? null : a)), role: "p1" }], panels: undefined, note: { text: `stack (bottom → top): ${wait.map((d) => `${d}(${t[d]})`).join(" ") || "empty"}` } }; };
      t.forEach((x, i) => {
        while (wait.length && t[wait[wait.length - 1]] < x) {
          const d = wait.pop();
          T.add({ at: "pop", key: `i${i}`, state: st(i), vars: { today: i, temp: x }, say: `${x} is warmer than day ${d} (${t[d]}): day ${d} stops waiting.` });
          ans[d] = i - d;
          T.add({ at: "ans", key: `i${i}`, state: st(i), vars: { [`answer[${d}]`]: ans[d] }, say: `answer[${d}] = ${i} − ${d} = ${ans[d]}.` });
        }
        wait.push(i);
        T.add({ at: "push", key: `i${i}`, state: st(i), vars: { waiting: wait.length }, say: `Day ${i} (${x}) waits on the stack. The waiting temperatures never increase from bottom to top.` });
      });
      wait.forEach((d) => (ans[d] = 0));
      T.add({ state: st(null), vars: { answer: ans }, say: "Days still waiting keep 0: no warmer day came. Each day is pushed once and popped at most once: `O(n)`." });
      return T.done(ans);
    },
  };

  A.decodeIter = {
    title: "Decode String with an explicit stack",
    viz: "array", legend: ["focus:current character"],
    inputLabel: "an encoded string", hint: "3[a2[c]]",
    presets: [{ label: "3[a2[c]] (the trace table)", input: "3[a2[c]]" }, { label: "2[abc]3[cd]ef", input: "2[abc]3[cd]ef" }],
    table: { id: "tbl-5", preset: 0, rows: ["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7"] },
    parse(s) { const t = String(s).trim(); if (!/^[a-z0-9\[\]]{1,16}$/.test(t)) throw new Error("Letters, digits and brackets, up to 16."); let d = 0; for (const c of t) { d += c === "[" ? 1 : c === "]" ? -1 : 0; if (d < 0) throw new Error("Brackets do not match."); } if (d) throw new Error("Brackets do not match."); return t; },
    lines: { digit: { ts: "function decodeStringIterative>>count = count * 10 + Number(ch);", go: "func decodeStringIterative>>count = count*10 + int(ch-'0')" }, open: { ts: "stack.push({ text, count });", go: "stack = append(stack, frame{text, count})" }, close: { ts: "text = saved.text + text.repeat(saved.count);", go: "text = saved.text + strings.Repeat(text, saved.count)" }, letter: { ts: "function decodeStringIterative>>text += ch;", go: "text += string(ch)" } },
    trace(s) {
      const T = new G.Trace();
      const stack = [];
      let text = "", count = 0;
      const st = (i) => ({ cellW: 36, cells: G.cells(s.split("")), marks: i != null ? { [i]: "focus" } : {}, panels: [stackPanel("stack (saved text, count)", stack, (f) => `"${f.text}", ${f.count}`, true)], note: { text: `text = "${text}", count = ${count}` } });
      [...s].forEach((ch, i) => {
        const key = `p${i}`;
        if (ch >= "0" && ch <= "9") { count = count * 10 + Number(ch); T.add({ at: "digit", key, state: st(i), vars: { count }, say: `Digit: count = ${count}.` }); }
        else if (ch === "[") { stack.push({ text, count }); text = ""; count = 0; T.add({ at: "open", key, state: st(i), vars: {}, say: "`[`: push what we had (text and count) and start fresh inside the bracket." }); }
        else if (ch === "]") { const f = stack.pop(); text = f.text + text.repeat(f.count); T.add({ at: "close", key, state: st(i), vars: { text }, say: `\`]\`: pop ("${f.text}", ${f.count}); text = saved text + inner × ${f.count} = "${text}".` }); }
        else { text += ch; T.add({ at: "letter", key, state: st(i), vars: { text }, say: `Letter: text = "${text}".` }); }
      });
      return T.done(text);
    },
  };

  A.histogram = {
    title: "Largest Rectangle in Histogram",
    viz: "bars", legend: ["focus:current bar", "anchor:on the stack (heights increase)", "bug:popped: its rectangle is measured now", "water:that rectangle", "answer:best (dashed)"],
    varRoles: { best: "answer" },
    inputLabel: "bar heights", hint: "2 1 5 6 2 3",
    presets: [{ label: "[2,1,5,6,2,3] (the trace table)", input: "2 1 5 6 2 3" }, { label: "[2,4]", input: "2 4" }, { label: "a staircase", input: "1 2 3 4 5" }],
    table: { id: "tbl-6", preset: 0, rows: ["i0", "i1", "i2", "i3", "i4", "i5", "i6"] },
    parse: (s) => P.nums(s, { minLen: 1, maxLen: 10, min: 0, max: 9 }),
    lines: { pop: { ts: "const height = heights[stack.pop()!];", go: "height := heights[stack[len(stack)-1]]" }, area: { ts: "best = Math.max(best, height * (i - left - 1));", go: "best = max(best, height*(i-left-1))" }, push: { ts: "function largestRectangleArea>>stack.push(i);", go: "func largestRectangleArea>>stack = append(stack, i)" } },
    trace(h) {
      const T = new G.Trace();
      const stack = [];
      let best = 0, bestBox = null;
      const st = (i, mk, area) => { const m = {}; stack.forEach((k) => (m[k] = "anchor")); if (i < h.length) m[i] = "focus"; return { h, marks: Object.assign(m, mk), area, best: bestBox, note: { text: `stack: ${stack.map((k) => `${k}(${h[k]})`).join(" ") || "empty"}` } }; };
      for (let i = 0; i <= h.length; i++) {
        const cur = i === h.length ? 0 : h[i];
        while (stack.length && h[stack[stack.length - 1]] >= cur) {
          const top = stack.pop();
          const left = stack.length ? stack[stack.length - 1] : -1;
          const width = i - left - 1, area = h[top] * width;
          T.add({ at: "pop", key: `i${i}`, state: st(i, { [top]: "bug" }, { l: left + 1, r: i - 1, level: h[top] }), vars: { i, cur, popped: top, height: h[top] }, say: `${i === h.length ? "End: a height-0 sentinel flushes the stack." : `Bar ${i} (${cur}) is not taller than bar ${top} (${h[top]}).`} Pop ${top}: its right limit is ${i}, its left limit is ${left} (the new top).` });
          if (area > best) { best = area; bestBox = { l: left + 1, r: i - 1, level: h[top] }; }
          T.add({ at: "area", key: `i${i}`, state: st(i, { [top]: "bug" }, { l: left + 1, r: i - 1, level: h[top] }), vars: { width, area, best }, say: `Rectangle with height ${h[top]}: width ${i} − ${left} − 1 = ${width}, area ${area}. best = ${best}.` });
        }
        if (i < h.length) { stack.push(i); T.add({ at: "push", key: `i${i}`, state: st(i), vars: { i, best }, say: `Push ${i}. Heights on the stack increase from bottom to top.` }); }
      }
      T.add({ state: st(h.length, {}, null), vars: { best }, say: `The largest rectangle has area ${best}. Each bar is pushed and popped once: \`O(n)\`.` });
      return T.done(best);
    },
  };

  G.quizzes.stack13 = {
    title: "Plain stack or monotonic stack?",
    items: [
      { q: "Check that every HTML tag is closed in the right order.", options: ["Plain stack", "Monotonic stack", "Queue", "Hash set"], answer: 0, why: "The newest unclosed tag must close first." },
      { q: "For each stock price, how many consecutive previous days had a price ≤ today's? (Stock Span)", options: ["Monotonic stack (decreasing)", "Plain stack", "Sliding window", "Sort the prices"], answer: 0, why: "Pop the smaller-or-equal earlier days; the new top is the previous greater price." },
      { q: "Next greater element in a circular array.", options: ["Monotonic stack, looping 2n times with i % n", "Two pointers", "Binary search", "A queue"], answer: 0, why: "The second lap lets items near the end find answers at the start." },
      { q: "Undo / redo in an editor.", options: ["Two plain stacks", "A monotonic stack", "A heap", "A queue"], answer: 0, why: "Undo pops the newest change; redo keeps what was undone." },
      { q: "Remove k digits to make the smallest number.", options: ["Monotonic stack (increasing)", "Monotonic stack (decreasing)", "Sort the digits", "A heap of digits"], answer: 0, why: "Pop bigger digits while a smaller one arrives and you still have removals left." },
    ],
  };
})();

export const expose = "(globalThis as any).MinStack = MinStack;\n";
export function specs({ A, R, rnd, arr }) {
  return {
    validParens: { gen: () => Array.from({ length: rnd(1, 12) }, () => "()[]{}"[rnd(0, 5)]).join(""), want: (s) => R.isValid(s) },
    minStack: { gen: () => { let size = 0; return Array.from({ length: rnd(1, 12) }, () => { const r = size ? rnd(0, 3) : 0; if (r === 0) { size++; return `push ${rnd(-9, 9)}`; } if (r === 1) { size--; return "pop"; } return r === 2 ? "top" : "getMin"; }).join(", "); }, want: (s) => { const m = new R.MinStack(); const out = []; A.minStack.parse(s).forEach(({ op, v }) => { if (op === "push") m.push(v); else if (op === "pop") m.pop(); else if (op === "top") out.push(m.top()); else out.push(m.getMin()); }); return out; } },
    evalRPN: { gen: () => { const t = [String(rnd(1, 9))]; let d = 1; while (t.length < rnd(1, 11)) { if (d >= 2 && (rnd(0, 1) || t.length + d > 12)) { t.push("+-*"[rnd(0, 2)]); d--; } else { t.push(String(rnd(1, 9))); d++; } } while (d > 1) { t.push("+-*"[rnd(0, 2)]); d--; } return t.join(" "); }, want: (s) => R.evalRPN(s.split(" ")) },
    dailyTemps: { gen: () => arr(rnd(1, 10), 30, 100).join(" "), want: (s) => R.dailyTemperatures(A.dailyTemps.parse(s)) },
    decodeIter: { gen: () => { const g = (d) => Array.from({ length: rnd(1, 3) }, () => (d < 2 && rnd(0, 1) ? `${rnd(1, 3)}[${g(d + 1)}]` : "ab"[rnd(0, 1)])).join(""); let t = g(0); while (t.length > 16) t = g(1); return t; }, want: (s) => R.decodeStringIterative(s) },
    histogram: { gen: () => arr(rnd(1, 10), 0, 9).join(" "), want: (s) => R.largestRectangleArea(A.histogram.parse(s)) },
  };
}

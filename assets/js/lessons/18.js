/* Lesson 18 · Tries — insert and search, longest common prefix, replace words, wildcard search, Word Search II. */
(function () {
  "use strict";
  const G = window.Guide;
  const A = G.animators;
  const P = G.parse;

  const wordList = (s, o) => {
    o = o || {};
    const t = String(s).replace(/[,\[\]"']/g, " ").trim().split(/\s+/).filter(Boolean);
    if (!t.length && !o.allowEmpty) throw new Error("Type some words separated by spaces.");
    const re = o.dots ? /^[a-z.]+$/ : o.star ? /^[a-z]+\*?$/ : /^[a-z]+$/;
    t.forEach((w) => { if (!re.test(w)) throw new Error(`"${w}": lowercase letters a–z only${o.dots ? " (and . for any letter)" : o.star ? " (end with * for a prefix query)" : ""}.`); if (w.length > 8) throw new Error(`"${w}" is long: keep words to 8 letters.`); });
    if (t.length > (o.max || 7)) throw new Error(`Up to ${o.max || 7} words.`);
    return t;
  };

  /* A trie whose nodes keep ids (so the picture grows in place). Children keep insertion order, like the TS Map. */
  function TrieSim() { this.nodes = [{ id: 0, ch: null, parent: null, kids: new Map(), end: false, word: null }]; }
  TrieSim.prototype.child = function (n, ch) { const id = this.nodes[n].kids.get(ch); return id == null ? null : id; };
  TrieSim.prototype.add = function (n, ch) { const id = this.nodes.length; this.nodes.push({ id, ch, parent: n, kids: new Map(), end: false, word: null }); this.nodes[n].kids.set(ch, id); return id; };
  TrieSim.prototype.insert = function (w, emit) {
    let n = 0;
    for (const ch of w) {
      const c = this.child(n, ch);
      if (c == null) { n = this.add(n, ch); if (emit) emit("create", n, `"${ch}" is missing under ${this.label(this.nodes[n].parent)}: create it.`); }
      else { n = c; if (emit) emit("step", n, `"${ch}" already exists: reuse it and step down.`); }
    }
    this.nodes[n].end = true; this.nodes[n].word = w;
    return n;
  };
  TrieSim.prototype.label = function (n) { return n === 0 ? "the root" : `"${this.path(n)}"`; };
  TrieSim.prototype.path = function (n) { let s = ""; while (n) { s = this.nodes[n].ch + s; n = this.nodes[n].parent; } return s; };
  TrieSim.prototype.view = function (marks, opts) {
    opts = opts || {};
    return {
      colW: 40, rowH: 60,
      nodes: this.nodes.filter((n) => !n.gone).map((n) => ({ id: n.id, label: n.id === 0 ? "·" : n.ch, parent: n.parent, m: (marks && marks[n.id]) || null, sub: opts.words ? (n.word || null) : n.end ? "end" : null })),
      note: opts.note ? { text: opts.note, cls: opts.cls } : undefined,
    };
  };
  const pathMarks = (T, n, last) => { const m = {}; let k = n; while (k) { m[k] = "p1"; k = T.nodes[k].parent; } m[0] = "p1"; if (n != null) m[n] = last || "focus"; return m; };

  /* ---------- the basic trie ---------- */
  A.trieOps = {
    title: "A trie: insert, search and startsWith",
    viz: "tree", legend: ["p1:the path walked", "focus:current node", "answer:found", "bug:path breaks"],
    inputLabel: "words to insert ; queries (end with * for startsWith)", hint: "to tea ten in inn ; tea te te* x*",
    presets: [{ label: "the lesson's example", input: "to tea ten in inn ; tea te te* x* inn innn" }, { label: "car card care cat", input: "car card care cat ; ca ca* card cars" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'Words, then ";" and queries'); return { words: wordList(a), queries: wordList(b, { star: true, max: 6 }) }; },
    lines: {
      create: { ts: "if (!node.children.has(ch)) node.children.set(ch, new TrieNode());", go: "node.children[idx] = &TrieNode{}" },
      step: { ts: "node = node.children.get(ch)!; // step down one letter", go: "node = node.children[idx] // step down one letter" },
      mark: { ts: "insert(word: string)>>node.isWord = true;", go: "func (t *Trie) Insert>>node.isWord = true" },
      walk: { ts: "const next = node.children.get(ch);", go: "node = node.children[text[i]-'a']" },
      miss: { ts: "if (next === undefined) return null;", go: "func (t *Trie) walk>>return nil" },
      search: { ts: "return this.walk(word)?.isWord === true;", go: "return node != nil && node.isWord" },
      prefix: { ts: "return this.walk(prefix) !== null;", go: "func (t *Trie) StartsWith" },
    },
    table: { id: "tbl-2", preset: 0, rows: ["ins:tea", "ins:ten"] },
    trace({ words, queries }) {
      const Tr = new G.Trace();
      const T = new TrieSim();
      const out = [];
      words.forEach((w) => {
        T.insert(w, (at, n, say) => Tr.add({ at, state: T.view(pathMarks(T, n)), vars: { word: w, letter: T.nodes[n].ch }, say: `insert("${w}"): ${say}` }));
        let n = 0; for (const ch of w) n = T.child(n, ch);
        Tr.add({ key: "ins:" + w, at: "mark", state: T.view(pathMarks(T, n, "answer")), vars: { word: w }, say: `Mark the last node: a word ends at "${w}". Shared prefixes share nodes.` });
      });
      queries.forEach((q) => {
        const pre = q.endsWith("*"), text = pre ? q.slice(0, -1) : q, name = pre ? `startsWith("${text}")` : `search("${text}")`;
        let n = 0, broke = false;
        for (let i = 0; i < text.length; i++) {
          const c = T.child(n, text[i]);
          if (c == null) { Tr.add({ at: "miss", state: T.view(pathMarks(T, n, "bug")), vars: { query: name, letter: text[i] }, say: `${name}: no "${text[i]}" under ${T.label(n)}. The path breaks: walk returns null.` }); broke = true; break; }
          n = c;
          const lastSearch = !pre && i === text.length - 1;
          Tr.add({ at: "walk", state: T.view(pathMarks(T, n)), vars: { query: name, letter: text[i] }, say: `${name}: follow "${text[i]}".`, ask: lastSearch ? { q: `Walked all of "${text}". What does search return?`, options: ["true", "false"], answer: T.nodes[n].end ? 0 : 1, why: T.nodes[n].end ? "A word ends at this node." : `The path exists, but no word ends here: "${text}" is only a prefix.` } : undefined });
        }
        const r = broke ? false : pre ? true : T.nodes[n].end;
        out.push(r);
        if (!broke) Tr.add({ at: pre ? "prefix" : "search", state: T.view(pathMarks(T, n, r ? "answer" : "bug")), vars: { query: name, result: r }, say: pre ? `${name} = true: the path exists.` : r ? `${name} = true: a word ends here.` : `${name} = false: the path exists but no word ends here.` });
        else Tr.add({ at: pre ? "prefix" : "search", state: T.view(pathMarks(T, n, "bug")), vars: { query: name, result: false }, say: `${name} = false.` });
      });
      return Tr.done(out);
    },
  };

  /* ---------- Problem 2: longest common prefix ---------- */
  A.lcp = {
    title: "Longest Common Prefix: walk down while there is one way",
    viz: "tree", legend: ["p1:the common prefix", "focus:current node", "bug:a fork or a word end: stop"],
    inputLabel: "words", hint: "flower flow flight",
    presets: [{ label: "flower flow flight", input: "flower flow flight" }, { label: "dog racecar car", input: "dog racecar car" }, { label: "ab abc", input: "ab abc" }],
    parse: (s) => wordList(s, { max: 5 }),
    lines: { build: { ts: "longestCommonPrefixTrie>>node.isWord = true;", go: "func longestCommonPrefixTrie>>node.isWord = true" }, loop: { ts: "while (node.children.size === 1 && !node.isWord) {", go: "if count != 1 {" }, step: { ts: "prefix += letter;", go: "sb.WriteByte(byte('a' + only))" }, ret: { ts: "longestCommonPrefixTrie>>return prefix;", go: "return sb.String()" } },
    trace(words) {
      const Tr = new G.Trace();
      const T = new TrieSim();
      words.forEach((w) => { T.insert(w); Tr.add({ at: "build", state: T.view({}), vars: { word: w }, say: `Insert "${w}".` }); });
      let n = 0, prefix = "";
      for (;;) {
        const nd = T.nodes[n];
        const go = nd.kids.size === 1 && !nd.end;
        Tr.add({ at: "loop", state: T.view(pathMarks(T, n, go ? "focus" : "bug")), vars: { children: nd.kids.size, "word ends here": nd.end, prefix: `"${prefix}"` }, say: go ? `${n ? `"${prefix}"` : "The root"} has exactly one child and no word ends here: keep going.` : nd.end ? `A word ends at "${prefix}": no longer prefix is shared by every word. Stop.` : `${nd.kids.size} children: the words disagree here. Stop.` });
        if (!go) break;
        const [ch, nx] = [...nd.kids][0];
        prefix += ch; n = nx;
        Tr.add({ at: "step", state: T.view(pathMarks(T, n)), vars: { prefix: `"${prefix}"` }, say: `Take "${ch}": prefix "${prefix}".` });
      }
      Tr.add({ at: "ret", state: T.view(pathMarks(T, n, "answer"), { note: `longest common prefix: "${prefix}"`, cls: "ok" }), vars: { result: `"${prefix}"` }, say: `Answer "${prefix}". O(total letters) to build, O(answer) to walk.` });
      return Tr.done(prefix);
    },
  };

  /* ---------- Problem 3: replace words ---------- */
  A.replaceWords = {
    title: "Replace Words: the first word end on the path is the shortest root",
    viz: "tree", legend: ["p1:the path walked", "answer:a root ends here: replace", "bug:no root continues"],
    inputLabel: "roots ; sentence", hint: "cat bat rat ; the cattle was rattled by the battery",
    presets: [{ label: "cat bat rat", input: "cat bat rat ; the cattle was rattled by the battery" }, { label: "a b c", input: "a b c ; aadsfasf absbs bbab cadsfafs" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'Roots, then ";" and the sentence'); return { roots: wordList(a, { max: 5 }), words: wordList(b, { max: 7 }) }; },
    lines: { build: { ts: "replaceWords>>node.isWord = true;", go: "func replaceWords>>node.isWord = true" }, step: { ts: "const next = node.children.get(word[i]);", go: "node = node.children[word[i]-'a']" }, keep: { ts: "if (next === undefined) return word; // no root matches: keep the word", go: "return word // no root matches: keep the word" }, root: { ts: "if (node.isWord) return word.slice(0, i + 1);", go: "return word[:i+1]" }, whole: { ts: "slice(0, i + 1)>>return word;", go: "word[:i+1]>>return word" } },
    table: { id: "tbl-3", preset: 0, rows: ["cattle:0", "cattle:1", "cattle:2"] },
    trace({ roots, words }) {
      const Tr = new G.Trace();
      const T = new TrieSim();
      roots.forEach((r) => T.insert(r));
      const out = [];
      const st = (mk) => T.view(mk, { note: `output: ${out.join(" ") || "—"}` });
      Tr.add({ at: "build", state: st({}), vars: { roots: roots.length }, say: `Insert every root: ${roots.join(", ")}.` });
      words.forEach((w) => {
        let n = 0, res = w, at = "whole";
        for (let i = 0; i < w.length; i++) {
          const c = T.child(n, w[i]);
          if (c == null) { Tr.add({ key: `${w}:${i}`, at: "keep", state: st(pathMarks(T, n, "bug")), vars: { word: w, letter: w[i] }, say: `"${w}": no "${w[i]}" under ${T.label(n)}. No root matches: keep the word.` }); at = null; break; }
          n = c;
          if (T.nodes[n].end) { res = w.slice(0, i + 1); Tr.add({ key: `${w}:${i}`, at: "root", state: st(pathMarks(T, n, "answer")), vars: { word: w, letter: w[i] }, say: `"${w}": "${w[i]}" reaches a word end. The shortest root is "${res}".` }); at = null; break; }
          Tr.add({ key: `${w}:${i}`, at: "step", state: st(pathMarks(T, n)), vars: { word: w, letter: w[i] }, say: `"${w}": follow "${w[i]}". No root ends here yet.` });
        }
        if (at) Tr.add({ at, state: st(pathMarks(T, n)), vars: { word: w }, say: `"${w}" ran out of letters before any root ended: keep it.` });
        out.push(res);
      });
      Tr.add({ state: st({}), vars: { result: `"${out.join(" ")}"` }, say: `Result: "${out.join(" ")}". Each word costs at most its length.` });
      return Tr.done(out.join(" "));
    },
  };

  /* ---------- Problem 4: wildcard search ---------- */
  A.wildcard = {
    title: "Add and Search Words: a dot tries every child",
    viz: "tree", legend: ["p1:the path being tried", "focus:current node", "bug:dead end", "answer:match"],
    inputLabel: "words ; patterns (. = any letter)", hint: "bad dad mad ; pad .ad b.. b.",
    presets: [{ label: "bad dad mad", input: "bad dad mad ; pad .ad b.. b." }, { label: "backtracking on dots", input: "ab ac bd ; .d .c" }],
    parse(s) { const [a, b] = P.parts(s, 2, 'Words, then ";" and patterns'); return { words: wordList(a, { max: 6 }), pats: wordList(b, { dots: true, max: 5 }) }; },
    lines: { add: { ts: "addWord(word: string)>>node.isWord = true;", go: "func (d *WordDictionary) AddWord>>node.isWord = true" }, end: { ts: "if (i === pattern.length) return node.isWord;", go: "return node.isWord" }, dot: { ts: "for (const child of node.children.values()) if (dfs(child, i + 1)) return true;", go: "if child != nil && dfs(child, i+1) {" }, dotfail: { ts: "search(pattern: string)>>return false;", go: "func (d *WordDictionary) Search>>return false" }, one: { ts: "return next !== undefined && dfs(next, i + 1);", go: "return next != nil && dfs(next, i+1)" } },
    trace({ words, pats }) {
      const Tr = new G.Trace();
      const T = new TrieSim();
      words.forEach((w) => T.insert(w));
      Tr.add({ at: "add", flow: [], state: T.view({}), vars: {}, say: `Add ${words.join(", ")}.` });
      const out = [];
      pats.forEach((p) => {
        const dfs = (n, i) => {
          if (i === p.length) {
            const ok = T.nodes[n].end;
            Tr.add({ at: "end", flow: ["A", "B", "C"], state: T.view(pathMarks(T, n, ok ? "answer" : "bug")), vars: { pattern: p, i }, say: ok ? `End of "${p}" and a word ends here: true.` : `End of "${p}", but no word ends here: false, back up.` });
            return ok;
          }
          const ch = p[i];
          if (ch === ".") {
            Tr.add({ at: "dot", flow: ["A", "B", "D", "E"], state: T.view(pathMarks(T, n)), vars: { pattern: p, i, char: "." }, say: `"." at position ${i}: try each of the ${T.nodes[n].kids.size} children of ${T.label(n)} in turn.` });
            for (const c of T.nodes[n].kids.values()) if (dfs(c, i + 1)) return true;
            Tr.add({ at: "dotfail", flow: ["E"], state: T.view(pathMarks(T, n, "bug")), vars: { pattern: p, i }, say: `No child of ${T.label(n)} worked: false.` });
            return false;
          }
          const c = T.child(n, ch);
          if (c == null) { Tr.add({ at: "one", flow: ["A", "B", "D", "F"], state: T.view(pathMarks(T, n, "bug")), vars: { pattern: p, i, char: ch }, say: `No "${ch}" under ${T.label(n)}: false.` }); return false; }
          Tr.add({ at: "one", flow: ["A", "B", "D", "F"], state: T.view(pathMarks(T, c)), vars: { pattern: p, i, char: ch }, say: `"${ch}": follow the one matching child.` });
          return dfs(c, i + 1);
        };
        const r = dfs(0, 0);
        out.push(r);
        Tr.add({ state: T.view({}, { note: `search("${p}") = ${r}`, cls: r ? "ok" : "" }), vars: { pattern: p, result: r }, say: `search("${p}") = ${r}.` });
      });
      return Tr.done(out);
    },
  };

  /* ---------- Problem 5: Word Search II ---------- */
  A.wordSearch2 = {
    title: "Word Search II: walk the board and the trie together",
    viz: "grid", legend: ["p1:the current path", "focus:this cell", "answer:a word just found", "bug:no word continues: prune"],
    inputLabel: "board rows separated by | ; words", hint: "oaan etae ihkr iflv ; oath pea eat rain",
    presets: [{ label: "the lesson's 4×4", input: "oaan | etae | ihkr | iflv ; oath pea eat rain" }, { label: "ab | cd ; abcb", input: "ab | cd ; abcb abdc" }],
    parse(s) {
      const [a, b] = P.parts(s, 2, 'Board rows, then ";" and the words');
      const rows = a.replace(/\|/g, " ").trim().split(/\s+/).filter(Boolean);
      if (!rows.length || rows.length > 4) throw new Error("1 to 4 rows.");
      if (rows.some((r) => !/^[a-z]+$/.test(r) || r.length !== rows[0].length || r.length > 4)) throw new Error("Rows must be lowercase letters, all the same length (up to 4).");
      return { board: rows.map((r) => r.split("")), words: wordList(b, { max: 5 }) };
    },
    lines: { build: { ts: "node.word = w;", go: "node.word = w" }, prune0: { ts: "if (node === undefined) return; // no word continues with this letter: prune", go: "return // no word continues with this letter: prune" }, found: { ts: "found.push(node.word);", go: "found = append(found, node.word)" }, mark: { ts: 'board[r][c] = "#"; // mark visited', go: "board[r][c] = '#' // mark visited" }, unmark: { ts: "board[r][c] = ch; // un-mark (backtrack)", go: "board[r][c] = ch // un-mark (backtrack)" }, prune: { ts: "parent.children.delete(ch); // prune dead branch", go: "parent.children[ch-'a'] = nil // prune dead branch" }, ret: { ts: "return found.sort();", go: "sort.Strings(found)" } },
    trace({ board, words }) {
      const Tr = new G.Trace();
      const B = board.map((r) => r.slice());
      const rows = B.length, cols = B[0].length;
      const T = new TrieSim();
      words.forEach((w) => T.insert(w));
      const found = [];
      const path = [];
      const st = (mk, note) => ({ cells: B.map((row, r) => row.map((v, c) => ({ v: v === "#" ? board[r][c] : v, m: (mk && mk[r + "," + c]) || (path.some((p) => p[0] === r && p[1] === c) ? "p1" : null) }))), panels: [{ title: "found", keyW: 70, entries: found.map((w) => [w]), empty: "(none yet)" }], note: { text: note || `path: "${path.map(([r, c]) => board[r][c]).join("")}"` } });
      Tr.add({ at: "build", state: st({}, `trie of ${words.join(", ")}`), vars: {}, say: "Put all the words in one trie. Then start a DFS from every cell, walking the board and the trie in step." });
      let budget = 400;
      function dfs(r, c, parent) {
        const ch = B[r][c];
        const node = T.child(parent, ch);
        if (node == null) {
          if (parent !== 0 && budget-- > 0) Tr.add({ at: "prune0", state: st({ [r + "," + c]: "bug" }), vars: { cell: `(${r},${c})`, letter: ch }, say: `No word continues "${T.path(parent)}" with "${ch}": stop here.` });
          return;
        }
        path.push([r, c]);
        if (T.nodes[node].word !== null) {
          found.push(T.nodes[node].word);
          Tr.add({ at: "found", state: st({ [r + "," + c]: "answer" }), vars: { word: T.nodes[node].word }, say: `"${T.nodes[node].word}" ends here: record it and clear it, so it is not reported twice.` });
          T.nodes[node].word = null; T.nodes[node].end = false;
        } else if (budget-- > 0) Tr.add({ at: "mark", state: st({ [r + "," + c]: "focus" }), vars: { cell: `(${r},${c})`, prefix: `"${T.path(node)}"` }, say: `"${T.path(node)}" is a prefix of some word. Mark (${r},${c}) visited and try its 4 neighbors.` });
        B[r][c] = "#";
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && B[nr][nc] !== "#") dfs(nr, nc, node);
        }
        B[r][c] = ch;
        path.pop();
        if (T.nodes[node].kids.size === 0 && T.nodes[node].word === null) {
          T.nodes[parent].kids.delete(ch); T.nodes[node].gone = true;
          if (budget-- > 0) Tr.add({ at: "prune", state: st({ [r + "," + c]: "bug" }), vars: { pruned: `"${T.path(node)}"` }, say: `Back out of (${r},${c}). Nothing is left below "${T.path(node)}" in the trie: delete that branch so no one walks it again.` });
        }
      }
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dfs(r, c, 0);
      found.sort();
      Tr.add({ at: "ret", state: st({}, `found: [${found.join(", ")}]`), vars: { found: `[${found.join(", ")}]` }, say: `Done: [${found.join(", ")}]. One DFS serves every word at once, and pruning keeps it fast.` });
      return Tr.done(found);
    },
  };

  G.quizzes.trie18 = {
    title: "Tries",
    items: [
      { q: "A trie holds \"tea\" and \"ten\". What does search(\"te\") return?", options: ["false: the path exists, but no word ends there", "true", "an error", "null"], answer: 0, why: "That is what the word-end flag is for. startsWith(\"te\") would be true." },
      { q: "When is a hash set better than a trie?", options: ["Only exact membership is needed", "You need all words with a prefix", "You need autocomplete", "Many words share prefixes"], answer: 0, why: "A set is simpler and usually smaller for plain lookups." },
      { q: "Cost of inserting or finding a word of length L?", options: ["O(L), whatever the number of words", "O(log n)", "O(n · L)", "O(1)"], answer: 0, why: "One step per letter." },
      { q: "In Word Search II, why put all words in one trie?", options: ["One DFS checks every word at once, and dead prefixes stop early", "To sort the answer", "To save the board", "Tries use less memory than the board"], answer: 0, why: "Searching word by word repeats the same walks many times." },
      { q: "What is the alphabet of the trie in Maximum XOR of Two Numbers?", options: ["The bits 0 and 1, from the highest bit down", "Decimal digits", "Letters", "The numbers themselves"], answer: 0, why: "At each bit, prefer the child with the opposite bit to make the XOR large." },
    ],
  };
})();

#!/usr/bin/env python3
"""One-time helper: convert a lesson .md into a draft HTML <article> body.

Not shipped. Produces structure that later hand edits can target:
  * <section class="sec" id="..."> per H2, <section class="problem" id="pN"> per '### Problem'
  * consecutive <details> TS/Go pairs -> <div class="code-tabs" id="code-N">
  * ```mermaid -> <figure class="diagram" id="fig-N"><pre class="mermaid-src">
  * tables with a 'trace' look (first col header in {left, read, low, i, ...}) get class="trace"
Usage: md2html.py lesson.md > draft.html
"""
import re, sys, html, os

LESSON_FILES = {}
for f in sorted(os.listdir(os.path.dirname(os.path.abspath(sys.argv[1])))):
    m = re.match(r"^(\d\d) (.+)\.md$", f)
    if m:
        LESSON_FILES[f] = f"{m.group(1)}-{m.group(2)}.html"

src = open(sys.argv[1], encoding="utf-8").read()
lines = src.split("\n")


def slug(s):
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"[`*_]", "", s).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60] or "sec"


def link_target(href):
    from urllib.parse import unquote
    path, _, frag = unquote(href).partition("#")
    if path in LESSON_FILES:
        return LESSON_FILES[path] + (("#" + frag) if frag else "")
    return href


def inline(t):
    """Markdown inline -> HTML. Code spans are protected first."""
    out, codes = [], []

    def stash(m):
        codes.append(m.group(1))
        return f"\x00{len(codes)-1}\x00"

    t = re.sub(r"`([^`]+)`", stash, t)
    # raw inline html we allow through: <br/>, <strong>, <em>, <sub>, <sup>
    t = html.escape(t, quote=False)
    t = re.sub(r"&lt;(/?)(br|strong|em|sub|sup|kbd)\s*/?&gt;", r"<\1\2>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda m: f'<a href="{html.escape(link_target(m.group(2)))}">{m.group(1)}</a>', t)
    t = re.sub(r"\*\*\*(.+?)\*\*\*", r"<strong><em>\1</em></strong>", t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", t)
    t = re.sub(r"\x00(\d+)\x00", lambda m: "<code>" + html.escape(codes[int(m.group(1))], quote=False) + "</code>", t)
    return t


def split_row(row):
    """Split a pipe-table row, ignoring pipes inside backticks."""
    row = row.strip()
    if row.startswith("|"):
        row = row[1:]
    if row.endswith("|"):
        row = row[:-1]
    cells, cur, in_code = [], "", False
    for ch in row:
        if ch == "`":
            in_code = not in_code
        if ch == "|" and not in_code:
            cells.append(cur)
            cur = ""
        else:
            cur += ch
    cells.append(cur)
    return [c.strip() for c in cells]


out = []
fig_n = 0
code_n = 0
tbl_n = 0
i = 0
open_sections = []  # stack of 'sec' / 'problem'
pending_code = []   # buffered (lang, summary, code) from consecutive <details>


def flush_code():
    global code_n, pending_code
    if not pending_code:
        return
    code_n += 1
    out.append(f'<div class="code-tabs" id="code-{code_n}">')
    for lang, summary, code in pending_code:
        cap = f' data-caption="{html.escape(summary)}"' if summary else ""
        out.append(f'<pre data-lang="{lang}"{cap}><code class="language-{lang}">{html.escape(code, quote=False)}</code></pre>')
    out.append("</div>")
    pending_code = []


def close_until(kind_levels):
    while open_sections and open_sections[-1] in kind_levels:
        out.append("</section>")
        open_sections.pop()


def read_fence(start):
    m = re.match(r"^```(\w*)\s*$", lines[start])
    lang = m.group(1)
    j = start + 1
    body = []
    while not lines[j].startswith("```"):
        body.append(lines[j])
        j += 1
    return lang, "\n".join(body), j + 1


while i < len(lines):
    ln = lines[i]

    # <details> containing one code block
    if ln.strip() == "<details>":
        j = i + 1
        summary = ""
        sm = re.match(r"<summary>(.*)</summary>", lines[j].strip())
        if sm:
            s = re.sub(r"<[^>]+>", "", sm.group(1))
            s = re.sub(r"^(TypeScript|Go)\s*:?\s*", "", s).strip()
            summary = s
            j += 1
        while lines[j].strip() == "":
            j += 1
        if lines[j].startswith("```"):
            lang, code, j = read_fence(j)
            while lines[j].strip() == "":
                j += 1
            assert lines[j].strip() == "</details>", (i, lines[j])
            pending_code.append((lang, summary, code))
            i = j + 1
            continue
        # generic details: pass through (finish any buffered code pair first)
        flush_code()
        out.append("<details>")
        i += 1
        continue
    if ln.strip() == "":
        i += 1
        continue
    flush_code()

    if ln.startswith("```"):
        lang, body, i = read_fence(i)
        if lang == "mermaid":
            fig_n += 1
            out.append(f'<figure class="diagram" id="fig-{fig_n}"><pre class="mermaid-src">{html.escape(body, quote=False)}</pre></figure>')
        elif lang in ("ts", "go"):
            code_n += 1
            out.append(f'<div class="code-tabs" id="code-{code_n}"><pre data-lang="{lang}"><code class="language-{lang}">{html.escape(body, quote=False)}</code></pre></div>')
        else:
            cls = f' class="language-{lang}"' if lang else ""
            out.append(f'<pre class="plain"><code{cls}>{html.escape(body, quote=False)}</code></pre>')
        continue

    m = re.match(r"^(#{1,4})\s+(.*)$", ln)
    if m:
        level, text = len(m.group(1)), m.group(2)
        if level == 1:
            out.append(f"<h1>{inline(text)}</h1>")
        elif level == 2:
            close_until({"problem", "sec"})
            sid = slug(re.sub(r"^\d+\.\s*", "", text))
            out.append(f'<section class="sec" id="{sid}">')
            open_sections.append("sec")
            out.append(f"<h2>{inline(text)}</h2>")
        elif level == 3:
            close_until({"problem"})
            pm = re.match(r"Problem\s+(\w+)\s*·", text)
            if pm:
                pid = "p" + pm.group(1).lower()
                out.append(f'<section class="problem" id="{pid}">')
                open_sections.append("problem")
                out.append(f"<h3>{inline(text)}</h3>")
            else:
                out.append(f'<h3 id="{slug(text)}">{inline(text)}</h3>')
        else:
            out.append(f"<h4>{inline(text)}</h4>")
        i += 1
        continue

    if re.match(r"^-{3,}\s*$", ln):
        i += 1
        continue

    if ln.startswith(">"):
        buf = []
        while i < len(lines) and lines[i].startswith(">"):
            buf.append(lines[i][1:].strip())
            i += 1
        paras = "\n".join(buf).split("\n\n")
        out.append("<blockquote>" + "".join(f"<p>{inline(' '.join(p.split(chr(10))))}</p>" for p in paras) + "</blockquote>")
        continue

    if ln.lstrip().startswith("|"):
        rows = []
        while i < len(lines) and lines[i].lstrip().startswith("|"):
            rows.append(split_row(lines[i]))
            i += 1
        head, body = rows[0], rows[2:]
        tbl_n += 1
        first = re.sub(r"[`*]", "", head[0]).strip().lower()
        trace = first in {"left", "read", "low", "i", "step", "right", "l", "lo", "window", "n", "call", "node", "queue", "stack", "index", "idx", "x", "mid", "pass", "round", "slow", "cur", "day", "len"}
        cls = ' class="trace"' if trace else ""
        out.append(f'<div class="table-wrap"><table id="tbl-{tbl_n}"{cls}><thead><tr>' + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>")
        for r in body:
            out.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>")
        out.append("</tbody></table></div>")
        continue

    # lists (with simple nesting by indentation)
    lm = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)$", ln)
    if lm:
        stack = []  # (indent, tag)
        while i < len(lines):
            m2 = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)$", lines[i])
            if not m2:
                # continuation line of previous item
                if lines[i].startswith("  ") and lines[i].strip() and stack:
                    out[-1] = out[-1][:-5] + " " + inline(lines[i].strip()) + "</li>"
                    i += 1
                    continue
                break
            ind = len(m2.group(1))
            tag = "ol" if m2.group(2)[0].isdigit() else "ul"
            if not stack or ind > stack[-1][0]:
                out.append(f"<{tag}>")
                stack.append((ind, tag))
            else:
                while stack and ind < stack[-1][0]:
                    out.append(f"</{stack.pop()[1]}>")
            out.append(f"<li>{inline(m2.group(3))}</li>")
            i += 1
        while stack:
            out.append(f"</{stack.pop()[1]}>")
        continue

    # raw html lines pass through
    if ln.strip().startswith("<") and not ln.strip().startswith("<br"):
        out.append(ln.strip())
        i += 1
        continue

    # paragraph
    buf = [ln.strip()]
    i += 1
    while i < len(lines) and lines[i].strip() and not re.match(r"^(#|```|\||>|\s*([-*]|\d+\.)\s|<details>|-{3,})", lines[i]):
        buf.append(lines[i].strip())
        i += 1
    out.append(f"<p>{inline(' '.join(buf))}</p>")

flush_code()
close_until({"problem", "sec"})
print("\n".join(out))

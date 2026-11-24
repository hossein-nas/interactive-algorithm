#!/usr/bin/env python3
"""One-time assembly of an interactive lesson page from its .md plus a per-lesson config.
Usage: buildlesson.py cfg/NN.py
The config module defines CFG = {...}; see cfg/*.py. After assembly the HTML is maintained by hand."""
import re, html, sys, os, subprocess, importlib.util

SP = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(SP, "..", ".."))  # tools live in <guide>/interactive/tools
spec = importlib.util.spec_from_file_location("cfg", sys.argv[1])
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
C = mod.CFG
lid = C["id"]
md_file = next(f for f in os.listdir(ROOT) if f.startswith(lid + " ") and f.endswith(".md"))
draft = subprocess.run(["python3", os.path.join(SP, "md2html.py"), os.path.join(ROOT, md_file)], capture_output=True, text=True, check=True).stdout

# ---- generic details (answers, notes) become reveal boxes ----
draft = re.sub(r"<details>\n<summary>(.*?)</summary>", lambda m: f'<details class="reveal"><summary>{m.group(1)}</summary><div class="reveal-body">', draft)
draft = draft.replace("\n</details>", "\n</div></details>")

# ---- added, verified code ----
ADDED = {}
if C.get("added"):
    txt = open(os.path.join(SP, C["added"]), encoding="utf-8").read()
    blocks = re.findall(r"^```(ts|go)\n(.*?)^```", txt, re.S | re.M)
    names = C["added_names"]
    k = 0
    for name in names:
        langs = C.get("added_langs", {}).get(name, ["ts", "go"])
        ADDED[name] = []
        for l in langs:
            assert blocks[k][0] == l, (name, blocks[k][0], l)
            ADDED[name].append((l, blocks[k][1].rstrip("\n")))
            k += 1
    assert k == len(blocks), "unused added blocks"


def code_tabs(name, cap=""):
    c = f' data-caption="{html.escape(cap)}"' if cap else ""
    pres = "\n".join(f'<pre data-lang="{l}"{c if i == 0 else ""}><code class="language-{l}">{html.escape(b, quote=False)}</code></pre>' for i, (l, b) in enumerate(ADDED[name]))
    return f'<div class="code-tabs" id="code-{name}">\n{pres}\n</div>'


def expand(s):
    return re.sub(r"\{\{code:([\w-]+)(?:\|([^}]*))?\}\}", lambda m: code_tabs(m.group(1), m.group(2) or ""), s)


def sub(old, new, mode="replace"):
    global draft
    assert old in draft, f"[{lid}] anchor not found: {old[:90]!r}"
    new = expand(new)
    rep = new if mode == "replace" else (new + old if mode == "before" else old + new)
    draft = draft.replace(old, rep, 1)


# ---- hero ----
m = re.match(r"<h1>.*?</h1>\n", draft)
draft = draft[m.end():]
bq = re.match(r"(<blockquote>.*?</blockquote>)\n", draft, re.S)
book = ""
if bq and C.get("hero_quote", True):
    book = bq.group(1)
    draft = draft[bq.end():]
stars = C.get("stars", 0)
kick = "".join(f"<span>{k}</span>" for k in C["kicker"]) + (f'<span class="stars" title="{["", "Good for depth", "Fairly likely in interviews", "Very likely in interviews"][stars]}">{"★" * stars}</span>' if stars else "")
glance = "".join(f"<div><b>{b}</b><p>{p}</p></div>" for b, p in C["glance"])
INKS = ('<div class="inks"><span class="ink p1"><i></i>left, low, slow, write, i</span><span class="ink p2"><i></i>right, high, fast, read, j</span>'
        '<span class="ink focus"><i></i>being looked at</span><span class="ink anchor"><i></i>fixed for now</span><span class="ink done"><i></i>discarded or skipped</span>'
        '<span class="ink answer"><i></i>answer</span><span class="ink bug"><i></i>a bug</span></div>')
howto = (f'<div class="callout analogy"><b>How to use the animations</b><p>Press play, or click a stage and step with the arrow keys. Turn on <em>Predict the next move</em> to guess each decision before it is shown. Type your own input to test an idea. The colors mean the same thing in every lesson:</p>{INKS}</div>' if C.get("howto", True) else "")
hero = f'''<header class="lesson-hero">
<div class="kicker">{kick}</div>
<h1>{C["title"]}</h1>
<p class="sub">{C["sub"]}</p>
{book}
<div class="glance">{glance}</div>
{howto}
</header>
'''
draft = hero + draft

for ins in C.get("inserts", []):
    sub(*ins)

# ---- try it without looking ----
if C.get("exercises") is not None:
    m2 = re.search(r'<section class="sec" id="(try-it-without-looking)">\n<h2>(.*?)</h2>\n<ol>\n(.*?)</ol>\n', draft, re.S)
    assert m2, "no exercise list"
    items = re.findall(r"<li>(.*?)</li>", m2.group(3), re.S)
    assert len(items) == len(C["exercises"]), (len(items), len(C["exercises"]))
    out = [f'<section class="sec" id="{m2.group(1)}">\n<h2>{m2.group(2)}</h2>\n<p>Try each one on paper or in an editor first. Open the hint only when you are stuck, and the answer only after you have an attempt.</p>']
    for k, (li, ex) in enumerate(zip(items, C["exercises"]), 1):
        track = " data-track" if ex.get("track") else ""
        hint = f'<details class="reveal"><summary>Hint</summary><div class="reveal-body"><p>{ex["hint"]}</p></div></details>' if ex.get("hint") else ""
        out.append(f'<div class="exercise" id="ex{k}"{track}>\n<h3>{k} · {ex["title"]}</h3>\n<p>{li}</p>\n{hint}\n'
                   f'<details class="reveal"><summary>{ex.get("label", "Answer")}</summary><div class="reveal-body">{expand(ex["answer"])}</div></details>\n</div>')
    draft = draft[: m2.start()] + "\n".join(out) + "\n" + draft[m2.end():]
# drop the old Previous/Next line, add the recap quiz and pager
draft = re.sub(r"<p><strong>(Previous|Next):</strong>.*?</p>\n", "", draft)
tail = ""
if C.get("recap"):
    tail += f'<h3 id="check-yourself">Check yourself</h3>\n<div class="quiz" data-quiz="{C["recap"]}"></div>\n'
tail += '<nav class="pager" data-auto aria-label="Previous and next lesson"></nav>\n'
idx = draft.rfind("</section>")
draft = draft[:idx] + tail + draft[idx:]

scripts = ["viz/array.js", "viz/kit.js", "viz/bars.js"] + C.get("viz", []) + C.get("scripts", [])
HEAD = f'''<!doctype html>
<html lang="en" data-root="../" data-lesson="{lid}" data-pattern="{html.escape(C.get("pattern", C["title"]))}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{lid} {re.sub("<[^>]+>", "", C["title"])} | Algorithm guide</title>
<meta name="description" content="{html.escape(C["desc"])}">
<script>try{{var t=localStorage.getItem("algov3:theme");if(t)document.documentElement.setAttribute("data-theme",JSON.parse(t));}}catch(e){{}}</script>
<link rel="stylesheet" href="../assets/css/theme.css">
<link rel="stylesheet" href="../assets/css/components.css">
</head>
<body>
<header class="topbar"></header>
<div class="shell">
<nav class="rail rail-left" aria-label="All lessons"></nav>
<main id="main">
<article class="lesson">
'''
FOOT = '''
</article>
</main>
<aside class="rail rail-right" aria-label="On this page"></aside>
</div>
<script src="../assets/js/core.js"></script>
<script src="../lib/prism-core.min.js"></script>
<script src="../lib/prism-clike.min.js"></script>
<script src="../lib/prism-javascript.min.js"></script>
<script src="../lib/prism-typescript.min.js"></script>
<script src="../lib/prism-go.min.js"></script>
<script src="../lib/prism-bash.min.js"></script>
<script src="../lib/mermaid.min.js"></script>
<script src="../assets/js/progress.js"></script>
<script src="../assets/js/diagrams.js"></script>
<script src="../assets/js/stage.js"></script>
''' + "".join(f'<script src="../assets/js/{s}"></script>\n' for s in scripts) + f'''<script src="../assets/js/quiz.js"></script>
<script src="../assets/js/lessons/{lid}.js"></script>
</body>
</html>
'''
slug = md_file[3:-3]
out = os.path.join(ROOT, "interactive", "lessons", f"{lid}-{slug}.html")
open(out, "w", encoding="utf-8").write(HEAD + draft + FOOT)
print("wrote", out, len(HEAD + draft + FOOT), "bytes;", draft.count('class="stage"'), "stages")

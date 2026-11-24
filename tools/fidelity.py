#!/usr/bin/env python3
"""Check that every ts/go block in a lesson .md appears verbatim (same order) in its HTML page,
and that the page's added code blocks equal the separately verified added-NN.md blocks.
Also checks Mermaid sources and that internal links resolve.
Usage: fidelity.py "05 two-pointers.md" lessons/05-two-pointers.html [added-05.md]"""
import re, sys, html, os

md_path, html_path = sys.argv[1], sys.argv[2]
added_path = sys.argv[3] if len(sys.argv) > 3 else None
md = open(md_path, encoding="utf-8").read()
page = open(html_path, encoding="utf-8").read()

def md_blocks(text, langs):
    return [(l, b.rstrip("\n")) for l, b in re.findall(r"^```(\w+)\n(.*?)^```", text, re.S | re.M) if l in langs]

page_code = [(l, html.unescape(b).rstrip("\n")) for l, b in re.findall(r'<code class="language-(ts|go)">(.*?)</code>', page, re.S)]
page_ids = re.findall(r'<div class="code-tabs" id="(code-[^"]+)">(.*?)</div>', page, re.S)
added_ids = [i for i, _ in page_ids if not re.match(r"code-\d+$", i)]
orig_html = []
added_html = []
for cid, body in page_ids:
    blocks = [(l, html.unescape(b).rstrip("\n")) for l, b in re.findall(r'<code class="language-(ts|go)">(.*?)</code>', body, re.S)]
    (orig_html if re.match(r"code-\d+$", cid) else added_html).extend(blocks)

ok = True
want = md_blocks(md, {"ts", "go"})
if want != orig_html:
    ok = False
    print(f"CODE MISMATCH: md has {len(want)} ts/go blocks, page has {len(orig_html)} original blocks")
    for k, (a, b) in enumerate(zip(want, orig_html)):
        if a != b:
            print(f"  first difference at block {k}: {a[0]} vs {b[0]}")
            break
else:
    print(f"code: {len(want)} ts/go blocks identical to the .md")

if added_path:
    add = md_blocks(open(added_path, encoding="utf-8").read(), {"ts", "go"})
    if add != added_html:
        ok = False
        print(f"ADDED CODE MISMATCH: verified file has {len(add)} blocks, page has {len(added_html)}")
    else:
        print(f"added code: {len(add)} blocks identical to the verified file ({', '.join(added_ids)})")

mer = [b.rstrip("\n") for l, b in re.findall(r"^```(\w+)\n(.*?)^```", md, re.S | re.M) if l == "mermaid"]
pm = [html.unescape(b).rstrip("\n") for b in re.findall(r'<pre class="mermaid-src">(.*?)</pre>', page, re.S)]
missing = [k for k, m in enumerate(mer) if m not in pm]
if missing:
    ok = False
    print(f"MERMAID MISSING: blocks {missing}")
else:
    print(f"mermaid: all {len(mer)} diagrams present ({len(pm) - len(mer)} added)")

# internal links
base = os.path.dirname(os.path.abspath(html_path))
ids = set(re.findall(r'\sid="([^"]+)"', page))
bad = []
for href in re.findall(r'href="([^"]+)"', page):
    if href.startswith(("http:", "https:", "mailto:")):
        continue
    path, _, frag = href.partition("#")
    if path:
        if not os.path.exists(os.path.join(base, html.unescape(path))):
            bad.append(href)
    elif frag and frag not in ids:
        bad.append(href)
if bad:
    print("LINKS that do not resolve (files not built yet are listed too):", sorted(set(bad)))
else:
    print("links: all resolve")
print("FIDELITY", "OK" if ok else "FAILED")
sys.exit(0 if ok else 1)

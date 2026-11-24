# Build and verification tools for the interactive guide

These scripts built and checked the pages in `interactive/lessons/`. The pages do not need them to run. Keep them for re-verifying after an edit, or for rebuilding a lesson from its `.md`.

Requirements: Python 3, Node 18+, `tsc` on the PATH (for the harness), Google Chrome (for the self-test and screenshots).

## Verify a lesson (safe: reads only)

```bash
cd "interactive/tools"
./check.sh 22          # code + diagrams + links match the .md, then the in-browser self-test
node harness.mjs 22    # animator answers vs. the lesson's compiled TypeScript (presets + 200 random inputs)
node harness05.mjs     # lesson 05 has its own harness
```

`check.sh` prints `FIDELITY OK` and `SELFTEST OK …` when all is well. The harness prints `lesson NN: OK: … checks, 0 failures`. Lesson 00 has no harness config (no animators).

## Rebuild a lesson page (overwrites it)

```bash
python3 buildlesson.py cfg/22.py   # writes interactive/lessons/22-….html from "22 ….md" + cfg/22.py
```

Lesson 05 (the pilot) is built by `build05.py` instead. Rebuilding replaces the page; the lesson's animations live in `assets/js/lessons/NN.js` and are not touched.

## What is here

| File | Role |
|---|---|
| `md2html.py` | Turns a lesson `.md` into an HTML draft (code tabs, tables, Mermaid figures) |
| `buildlesson.py`, `cfg/NN.py` | Assembles a page: hero, animation stages, exercises with answers, recap quiz |
| `added-NN.md` | Extra TS/Go solutions written for the exercises; each passed `tools/verify.py` in the guide root |
| `harness.mjs`, `hcfg/NN.mjs` | Correctness harness for each lesson's animators |
| `fidelity.py` | Checks that every code block and diagram in the page is identical to the `.md`, and that links resolve |
| `check.sh` | Runs `fidelity.py` and the headless-Chrome `?selftest` for one lesson |
| `cdp.mjs` | Small Chrome DevTools driver used for screenshots (`node cdp.mjs plan.json`) |

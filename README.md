# Algorithm interview guide (v3)

An interactive algorithm interview guide: **30 lessons** with step-by-step animations, TypeScript and Go code that follows along, self-checks, and a redo tracker.

Live site (GitHub Pages): <https://hossein-nas.github.io/interactive-algorithm/>

## What's inside

| Path | Role |
|---|---|
| `index.html` | Home page: study plan, lesson map, progress, redo log |
| `lessons/` | The 30 lesson pages (`NN-slug.html`) |
| `assets/` | CSS, JS, and the per-lesson animators (`assets/js/lessons/NN.js`) |
| `lib/` | Vendored libraries (Prism, Mermaid) and fonts |
| `tools/` | Build and verification scripts (not needed to run the site) |

## How the site works

- Every lesson uses the same visual language, so a pattern you learned once reads the same everywhere.
- The code runs next to the animation: the highlighted line is the one being executed. Switch TypeScript and Go at the top of any page.
- Progress lives in the browser (Chrome) only, and can be exported to / imported from a JSON file.

## Lessons

1. Interview process
2. Big O and complexity
3. Language toolkit: TypeScript and Go
4. Hash tables (map / set)
5. Two pointers
6. Sliding window
7. Prefix sums
8. Binary search
9. Sorting and divide and conquer
10. Recursion and the call stack
11. Backtracking
12. Linked lists
13. Stacks and monotonic stack
14. Queues and monotonic deque
15. Trees and BST
16. Balanced trees
17. Heaps and priority queues
18. Tries
19. Graphs: BFS, DFS and grids
20. Topological sort
21. Union-find
22. Shortest paths (Dijkstra, Bellman-Ford)
23. Greedy and NP-complete
24. Intervals
25. Dynamic programming, one dimension
26. Dynamic programming, two dimensions
27. Bit manipulation
28. k-NN and where to go next
29. Pattern chooser, mocks and the v2 map
30. Start here and study plan

## Local development

The site is plain static files — any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Rebuilding and verifying a lesson

See `tools/README.md`. Requirements: Python 3, Node 18+, `tsc` on the PATH, Google Chrome.

```bash
cd tools
./check.sh 22          # code + diagrams + links match the .md, then the in-browser self-test
node harness.mjs 22    # animator answers vs. the lesson's compiled TypeScript
```

## Deployment

`main` deploys to GitHub Pages via `.github/workflows/pages.yml`: the workflow copies the static files into `_site/` and publishes them.

## License

Private project. All rights reserved.

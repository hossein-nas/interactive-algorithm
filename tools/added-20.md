# Added code for lesson 20

```ts
// Course Schedule II with DFS: push each node AFTER everything it unlocks, then reverse.
function findOrderDFS(numCourses: number, prerequisites: number[][]): number[] {
  const adj: number[][] = Array.from({ length: numCourses }, () => []);
  for (const [course, prereq] of prerequisites) adj[prereq].push(course);
  const state = new Array<number>(numCourses).fill(0); // 0 new, 1 visiting, 2 done
  const post: number[] = [];
  function visit(node: number): boolean {
    state[node] = 1;
    for (const next of adj[node]) {
      if (state[next] === 1) return false; // cycle
      if (state[next] === 0 && !visit(next)) return false;
    }
    state[node] = 2;
    post.push(node); // everything after it is already in `post`
    return true;
  }
  for (let i = 0; i < numCourses; i++) if (state[i] === 0 && !visit(i)) return [];
  return post.reverse();
}
console.log(findOrderDFS(4, [[1, 0], [2, 0], [3, 1], [3, 2]])); // [ 0, 2, 1, 3 ]
console.log(findOrderDFS(2, [[1, 0], [0, 1]])); // []
```

```go
// Course Schedule II with DFS: push each node AFTER everything it unlocks, then reverse.
func findOrderDFS(numCourses int, prerequisites [][]int) []int {
	adj := make([][]int, numCourses)
	for _, p := range prerequisites {
		adj[p[1]] = append(adj[p[1]], p[0])
	}
	state := make([]int, numCourses) // 0 new, 1 visiting, 2 done
	post := []int{}
	var visit func(node int) bool
	visit = func(node int) bool {
		state[node] = 1
		for _, next := range adj[node] {
			if state[next] == 1 {
				return false // cycle
			}
			if state[next] == 0 && !visit(next) {
				return false
			}
		}
		state[node] = 2
		post = append(post, node) // everything after it is already in post
		return true
	}
	for i := 0; i < numCourses; i++ {
		if state[i] == 0 && !visit(i) {
			return []int{}
		}
	}
	for i, j := 0, len(post)-1; i < j; i, j = i+1, j-1 {
		post[i], post[j] = post[j], post[i]
	}
	return post
}

func exampleFindOrderDFS() {
	fmt.Println(findOrderDFS(4, [][]int{{1, 0}, {2, 0}, {3, 1}, {3, 2}})) // [0 2 1 3]
	fmt.Println(findOrderDFS(2, [][]int{{1, 0}, {0, 1}}))                 // []
}
```

```ts
// Critical path (Parallel Courses III): with unlimited workers, a task finishes at
// its own duration plus the latest finish among its prerequisites.
function minimumTime(n: number, relations: number[][], time: number[]): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const indegree = new Array<number>(n).fill(0);
  for (const [prev, next] of relations) {
    adj[prev - 1].push(next - 1); // input is 1-indexed
    indegree[next - 1]++;
  }
  const finish = time.slice(); // a task with no prerequisites finishes at its own duration
  const queue: number[] = [];
  for (let i = 0; i < n; i++) if (indegree[i] === 0) queue.push(i);
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    for (const v of adj[u]) {
      finish[v] = Math.max(finish[v], finish[u] + time[v]); // wait for the slowest prerequisite
      if (--indegree[v] === 0) queue.push(v);
    }
  }
  return Math.max(...finish);
}
console.log(minimumTime(3, [[1, 3], [2, 3]], [3, 2, 5])); // 8
console.log(minimumTime(5, [[1, 5], [2, 5], [3, 5], [3, 4], [4, 5]], [1, 2, 3, 4, 5])); // 12
```

```go
// Critical path (Parallel Courses III): with unlimited workers, a task finishes at
// its own duration plus the latest finish among its prerequisites.
func minimumTime(n int, relations [][]int, time []int) int {
	adj := make([][]int, n)
	indegree := make([]int, n)
	for _, r := range relations {
		adj[r[0]-1] = append(adj[r[0]-1], r[1]-1) // input is 1-indexed
		indegree[r[1]-1]++
	}
	finish := append([]int(nil), time...) // a task with no prerequisites finishes at its own duration
	queue := []int{}
	for i := 0; i < n; i++ {
		if indegree[i] == 0 {
			queue = append(queue, i)
		}
	}
	for head := 0; head < len(queue); head++ {
		u := queue[head]
		for _, v := range adj[u] {
			finish[v] = max(finish[v], finish[u]+time[v]) // wait for the slowest prerequisite
			indegree[v]--
			if indegree[v] == 0 {
				queue = append(queue, v)
			}
		}
	}
	best := 0
	for _, f := range finish {
		best = max(best, f)
	}
	return best
}

func exampleMinimumTime() {
	fmt.Println(minimumTime(3, [][]int{{1, 3}, {2, 3}}, []int{3, 2, 5}))                                 // 8
	fmt.Println(minimumTime(5, [][]int{{1, 5}, {2, 5}, {3, 5}, {3, 4}, {4, 5}}, []int{1, 2, 3, 4, 5})) // 12
}
```

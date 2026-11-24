# Added code for lesson 04

```ts
function firstUniqueChar(s: string): number {
  const counts = new Map<string, number>();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1); // pass 1: count everything
  for (let i = 0; i < s.length; i++) {
    if (counts.get(s[i]) === 1) return i; // pass 2: the first character seen once
  }
  return -1;
}
console.log(firstUniqueChar("leetcode")); // 0
console.log(firstUniqueChar("loveleetcode")); // 2
console.log(firstUniqueChar("aabb")); // -1
```

```go
func firstUniqueChar(s string) int {
	counts := make(map[byte]int)
	for i := 0; i < len(s); i++ {
		counts[s[i]]++ // pass 1: count everything
	}
	for i := 0; i < len(s); i++ {
		if counts[s[i]] == 1 {
			return i // pass 2: the first character seen once
		}
	}
	return -1
}

func exampleFirstUniqueChar() {
	fmt.Println(firstUniqueChar("leetcode"))     // 0
	fmt.Println(firstUniqueChar("loveleetcode")) // 2
	fmt.Println(firstUniqueChar("aabb"))         // -1
}
```

```ts
function isIsomorphic(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const sToT = new Map<string, string>(); // each s-char maps to one t-char
  const tToS = new Map<string, string>(); // and no two s-chars share a t-char
  for (let i = 0; i < s.length; i++) {
    const a = s[i], b = t[i];
    if (sToT.has(a) && sToT.get(a) !== b) return false;
    if (tToS.has(b) && tToS.get(b) !== a) return false;
    sToT.set(a, b);
    tToS.set(b, a);
  }
  return true;
}
console.log(isIsomorphic("egg", "add")); // true
console.log(isIsomorphic("foo", "bar")); // false
console.log(isIsomorphic("badc", "baba")); // false
```

```go
func isIsomorphic(s, t string) bool {
	if len(s) != len(t) {
		return false
	}
	sToT := make(map[byte]byte) // each s-char maps to one t-char
	tToS := make(map[byte]byte) // and no two s-chars share a t-char
	for i := 0; i < len(s); i++ {
		a, b := s[i], t[i]
		if v, ok := sToT[a]; ok && v != b {
			return false
		}
		if v, ok := tToS[b]; ok && v != a {
			return false
		}
		sToT[a] = b
		tToS[b] = a
	}
	return true
}

func exampleIsIsomorphic() {
	fmt.Println(isIsomorphic("egg", "add"))   // true
	fmt.Println(isIsomorphic("foo", "bar"))   // false
	fmt.Println(isIsomorphic("badc", "baba")) // false
}
```

```ts
class MyHashSet {
  private buckets: number[][] = Array.from({ length: 4 }, () => []);
  private count = 0;

  private slot(key: number): number {
    const n = this.buckets.length;
    return ((key % n) + n) % n; // positive modulo, so negative keys work too
  }

  add(key: number): void {
    if (this.contains(key)) return;
    this.buckets[this.slot(key)].push(key);
    this.count++;
    if (this.count / this.buckets.length > 0.75) this.resize(); // keep chains short
  }

  remove(key: number): void {
    const chain = this.buckets[this.slot(key)];
    const i = chain.indexOf(key);
    if (i >= 0) {
      chain.splice(i, 1);
      this.count--;
    }
  }

  contains(key: number): boolean {
    return this.buckets[this.slot(key)].includes(key);
  }

  private resize(): void {
    const old = this.buckets;
    this.buckets = Array.from({ length: old.length * 2 }, () => []);
    for (const chain of old) for (const key of chain) this.buckets[this.slot(key)].push(key); // re-insert everything
  }
}
const hs = new MyHashSet();
for (const k of [1, 5, 9, 2, 6]) hs.add(k);
console.log(hs.contains(9), hs.contains(3)); // true false
hs.remove(9);
console.log(hs.contains(9)); // false
```

```go
type MyHashSet struct {
	buckets [][]int
	count   int
}

func NewMyHashSet() *MyHashSet {
	return &MyHashSet{buckets: make([][]int, 4)}
}

func (h *MyHashSet) slot(key int) int {
	n := len(h.buckets)
	return ((key % n) + n) % n // positive modulo, so negative keys work too
}

func (h *MyHashSet) Add(key int) {
	if h.Contains(key) {
		return
	}
	s := h.slot(key)
	h.buckets[s] = append(h.buckets[s], key)
	h.count++
	if float64(h.count)/float64(len(h.buckets)) > 0.75 {
		h.resize() // keep chains short
	}
}

func (h *MyHashSet) Remove(key int) {
	s := h.slot(key)
	chain := h.buckets[s]
	for i, k := range chain {
		if k == key {
			h.buckets[s] = append(chain[:i], chain[i+1:]...)
			h.count--
			return
		}
	}
}

func (h *MyHashSet) Contains(key int) bool {
	for _, k := range h.buckets[h.slot(key)] {
		if k == key {
			return true
		}
	}
	return false
}

func (h *MyHashSet) resize() {
	old := h.buckets
	h.buckets = make([][]int, len(old)*2)
	for _, chain := range old {
		for _, key := range chain {
			s := h.slot(key) // re-insert everything
			h.buckets[s] = append(h.buckets[s], key)
		}
	}
}

func exampleMyHashSet() {
	hs := NewMyHashSet()
	for _, k := range []int{1, 5, 9, 2, 6} {
		hs.Add(k)
	}
	fmt.Println(hs.Contains(9), hs.Contains(3)) // true false
	hs.Remove(9)
	fmt.Println(hs.Contains(9)) // false
}
```

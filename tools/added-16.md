# Added code for lesson 16

```ts
class ListNode {
  constructor(public val: number, public next: ListNode | null = null) {}
}
class TreeNode {
  constructor(public val: number, public left: TreeNode | null = null, public right: TreeNode | null = null) {}
}

// Sorted List to BST: the middle node (found with slow/fast) becomes the root.
function sortedListToBST(head: ListNode | null): TreeNode | null {
  function build(start: ListNode | null, end: ListNode | null): TreeNode | null {
    if (start === end) return null; // the range [start, end) is empty
    let slow = start!, fast = start!;
    while (fast.next !== end && fast.next!.next !== end) {
      slow = slow.next!;
      fast = fast.next!.next!;
    }
    return new TreeNode(slow.val, build(start, slow), build(slow.next, end));
  }
  return build(head, null);
}

const fromArray = (a: number[]): ListNode | null => a.reduceRight<ListNode | null>((next, v) => new ListNode(v, next), null);
const preorder = (n: TreeNode | null): number[] => (n === null ? [] : [n.val, ...preorder(n.left), ...preorder(n.right)]);
console.log(preorder(sortedListToBST(fromArray([-10, -3, 0, 5, 9]))).join(",")); // 0,-10,-3,5,9
console.log(preorder(sortedListToBST(fromArray([1, 2, 3, 4]))).join(",")); // 2,1,3,4
console.log(preorder(sortedListToBST(null)).length); // 0
```

```go
type ListNode struct {
	Val  int
	Next *ListNode
}
type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

// Sorted List to BST: the middle node (found with slow/fast) becomes the root.
func sortedListToBST(head *ListNode) *TreeNode {
	var build func(start, end *ListNode) *TreeNode
	build = func(start, end *ListNode) *TreeNode {
		if start == end {
			return nil // the range [start, end) is empty
		}
		slow, fast := start, start
		for fast.Next != end && fast.Next.Next != end {
			slow = slow.Next
			fast = fast.Next.Next
		}
		return &TreeNode{Val: slow.Val, Left: build(start, slow), Right: build(slow.Next, end)}
	}
	return build(head, nil)
}

func preorder(n *TreeNode) []int {
	if n == nil {
		return []int{}
	}
	return append(append([]int{n.Val}, preorder(n.Left)...), preorder(n.Right)...)
}

func exampleSortedListToBST() {
	fromSlice := func(a []int) *ListNode {
		var head *ListNode
		for i := len(a) - 1; i >= 0; i-- {
			head = &ListNode{Val: a[i], Next: head}
		}
		return head
	}
	fmt.Println(preorder(sortedListToBST(fromSlice([]int{-10, -3, 0, 5, 9})))) // [0 -10 -3 5 9]
	fmt.Println(preorder(sortedListToBST(fromSlice([]int{1, 2, 3, 4}))))       // [2 1 3 4]
	fmt.Println(len(preorder(sortedListToBST(nil))))                            // 0
}
```

```go
// An ordered set of ints on a sorted slice: Floor and Ceiling by binary search.
// Insert is O(n) because of the shift, which is fine up to roughly 10^5 items.
type OrderedSet struct{ keys []int }

func (s *OrderedSet) Insert(v int) {
	i := sort.SearchInts(s.keys, v)
	if i < len(s.keys) && s.keys[i] == v {
		return // already present
	}
	s.keys = append(s.keys, 0)
	copy(s.keys[i+1:], s.keys[i:])
	s.keys[i] = v
}

// Floor: the largest key <= v.
func (s *OrderedSet) Floor(v int) (int, bool) {
	i := sort.SearchInts(s.keys, v+1) // first key > v
	if i == 0 {
		return 0, false
	}
	return s.keys[i-1], true
}

// Ceiling: the smallest key >= v.
func (s *OrderedSet) Ceiling(v int) (int, bool) {
	i := sort.SearchInts(s.keys, v) // first key >= v
	if i == len(s.keys) {
		return 0, false
	}
	return s.keys[i], true
}

func exampleOrderedSet() {
	s := &OrderedSet{}
	for _, v := range []int{20, 5, 40, 10, 5} {
		s.Insert(v)
	}
	fmt.Println(s.keys)          // [5 10 20 40]
	fmt.Println(s.Floor(15))     // 10 true
	fmt.Println(s.Ceiling(15))   // 20 true
	fmt.Println(s.Floor(4))      // 0 false
	fmt.Println(s.Ceiling(40))   // 40 true
}
```

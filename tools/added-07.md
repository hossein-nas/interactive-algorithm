# Added code for lesson 07

```ts
function pivotIndex(nums: number[]): number {
  const total = nums.reduce((a, b) => a + b, 0);
  let leftSum = 0; // sum of everything before i
  for (let i = 0; i < nums.length; i++) {
    if (leftSum === total - leftSum - nums[i]) return i; // left side equals right side
    leftSum += nums[i];
  }
  return -1;
}
console.log(pivotIndex([1, 7, 3, 6, 5, 6])); // 3
console.log(pivotIndex([1, 2, 3])); // -1
console.log(pivotIndex([2, 1, -1])); // 0
```

```go
func pivotIndex(nums []int) int {
	total := 0
	for _, x := range nums {
		total += x
	}
	leftSum := 0 // sum of everything before i
	for i, x := range nums {
		if leftSum == total-leftSum-x {
			return i // left side equals right side
		}
		leftSum += x
	}
	return -1
}

func examplePivotIndex() {
	fmt.Println(pivotIndex([]int{1, 7, 3, 6, 5, 6})) // 3
	fmt.Println(pivotIndex([]int{1, 2, 3}))          // -1
	fmt.Println(pivotIndex([]int{2, 1, -1}))         // 0
}
```

```ts
function subarraysDivByK(nums: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]); // the empty prefix, remainder 0
  let prefix = 0, count = 0;
  for (const x of nums) {
    prefix += x;
    const r = ((prefix % k) + k) % k; // positive remainder, even for negative sums
    count += seen.get(r) ?? 0; // same remainder earlier: the subarray between is divisible by k
    seen.set(r, (seen.get(r) ?? 0) + 1);
  }
  return count;
}
console.log(subarraysDivByK([4, 5, 0, -2, -3, 1], 5)); // 7
console.log(subarraysDivByK([5], 9)); // 0
```

```go
func subarraysDivByK(nums []int, k int) int {
	seen := map[int]int{0: 1} // the empty prefix, remainder 0
	prefix, count := 0, 0
	for _, x := range nums {
		prefix += x
		r := ((prefix % k) + k) % k // positive remainder, even for negative sums
		count += seen[r]            // same remainder earlier: the subarray between is divisible by k
		seen[r]++
	}
	return count
}

func exampleSubarraysDivByK() {
	fmt.Println(subarraysDivByK([]int{4, 5, 0, -2, -3, 1}, 5)) // 7
	fmt.Println(subarraysDivByK([]int{5}, 9))                  // 0
}
```

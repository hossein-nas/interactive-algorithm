# Added code for lesson 08

```ts
// Search Insert Position: the first index whose value is >= target.
function searchInsert(nums: number[], target: number): number {
  let lo = 0, hi = nums.length; // the answer may be nums.length (insert at the end)
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] >= target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

// Sqrt(x): the largest r with r * r <= x, found as (first r with r * r > x) - 1.
function mySqrt(x: number): number {
  let lo = 0, hi = x + 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (mid * mid > x) hi = mid;
    else lo = mid + 1;
  }
  return lo - 1;
}
console.log(searchInsert([1, 3, 5, 6], 5), searchInsert([1, 3, 5, 6], 2), searchInsert([1, 3, 5, 6], 7)); // 2 1 4
console.log(mySqrt(8), mySqrt(16), mySqrt(0), mySqrt(1)); // 2 4 0 1
```

```go
// Search Insert Position: the first index whose value is >= target.
func searchInsert(nums []int, target int) int {
	lo, hi := 0, len(nums) // the answer may be len(nums) (insert at the end)
	for lo < hi {
		mid := lo + (hi-lo)/2
		if nums[mid] >= target {
			hi = mid
		} else {
			lo = mid + 1
		}
	}
	return lo
}

// Sqrt(x): the largest r with r * r <= x, found as (first r with r * r > x) - 1.
func mySqrt(x int) int {
	lo, hi := 0, x+1
	for lo < hi {
		mid := lo + (hi-lo)/2
		if mid*mid > x {
			hi = mid
		} else {
			lo = mid + 1
		}
	}
	return lo - 1
}

func exampleSearchInsertSqrt() {
	fmt.Println(searchInsert([]int{1, 3, 5, 6}, 5), searchInsert([]int{1, 3, 5, 6}, 2), searchInsert([]int{1, 3, 5, 6}, 7)) // 2 1 4
	fmt.Println(mySqrt(8), mySqrt(16), mySqrt(0), mySqrt(1))                                                            // 2 4 0 1
}
```

```ts
// Find Peak Element: the first index i with nums[i] > nums[i + 1] (the last index counts as yes).
function findPeakElement(nums: number[]): number {
  let lo = 0, hi = nums.length - 1; // index n-1 is always a valid "yes"
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] > nums[mid + 1]) hi = mid; // going down: a peak is at mid or to its left
    else lo = mid + 1; // going up: a peak is to the right
  }
  return lo;
}
console.log(findPeakElement([1, 2, 3, 1])); // 2
console.log(findPeakElement([1, 2, 1, 3, 5, 6, 4])); // 5
console.log(findPeakElement([0, 1, 2, 5, 3, 1])); // 3
```

```go
// Find Peak Element: the first index i with nums[i] > nums[i + 1] (the last index counts as yes).
func findPeakElement(nums []int) int {
	lo, hi := 0, len(nums)-1 // index n-1 is always a valid "yes"
	for lo < hi {
		mid := lo + (hi-lo)/2
		if nums[mid] > nums[mid+1] {
			hi = mid // going down: a peak is at mid or to its left
		} else {
			lo = mid + 1 // going up: a peak is to the right
		}
	}
	return lo
}

func exampleFindPeakElement() {
	fmt.Println(findPeakElement([]int{1, 2, 3, 1}))          // 2
	fmt.Println(findPeakElement([]int{1, 2, 1, 3, 5, 6, 4})) // 5
	fmt.Println(findPeakElement([]int{0, 1, 2, 5, 3, 1}))    // 3
}
```

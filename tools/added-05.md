# Added code for lesson 05 (verified with tools/verify.py)

```ts
function trapWithArrays(height: number[]): number {
  const n = height.length;
  const maxLeft = new Array<number>(n).fill(0);
  const maxRight = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) maxLeft[i] = Math.max(height[i], i > 0 ? maxLeft[i - 1] : 0);
  for (let i = n - 1; i >= 0; i--) maxRight[i] = Math.max(height[i], i < n - 1 ? maxRight[i + 1] : 0);
  let water = 0;
  for (let i = 0; i < n; i++) {
    water += Math.min(maxLeft[i], maxRight[i]) - height[i]; // level minus the bar itself
  }
  return water;
}
console.log(trapWithArrays([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1])); // 6
console.log(trapWithArrays([4, 2, 0, 3, 2, 5])); // 9
console.log(trapWithArrays([])); // 0
```

```go
func trapWithArrays(height []int) int {
	n := len(height)
	maxLeft := make([]int, n)
	maxRight := make([]int, n)
	for i := 0; i < n; i++ {
		maxLeft[i] = height[i]
		if i > 0 {
			maxLeft[i] = max(maxLeft[i], maxLeft[i-1])
		}
	}
	for i := n - 1; i >= 0; i-- {
		maxRight[i] = height[i]
		if i < n-1 {
			maxRight[i] = max(maxRight[i], maxRight[i+1])
		}
	}
	water := 0
	for i := 0; i < n; i++ {
		water += min(maxLeft[i], maxRight[i]) - height[i] // level minus the bar itself
	}
	return water
}

func exampleTrapWithArrays() {
	fmt.Println(trapWithArrays([]int{0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1})) // 6
	fmt.Println(trapWithArrays([]int{4, 2, 0, 3, 2, 5}))                    // 9
	fmt.Println(trapWithArrays(nil))                                        // 0
}
```

```ts
function moveZeroes(nums: number[]): void {
  let write = 0; // everything before `write` is a non-zero, in the original order
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      [nums[write], nums[read]] = [nums[read], nums[write]];
      write++;
    }
  }
}
const zs = [0, 1, 0, 3, 12];
moveZeroes(zs);
console.log(zs); // [ 1, 3, 12, 0, 0 ]
const noZeros = [1, 2];
moveZeroes(noZeros);
console.log(noZeros); // [ 1, 2 ]
```

```go
func moveZeroes(nums []int) {
	write := 0 // everything before `write` is a non-zero, in the original order
	for read := 0; read < len(nums); read++ {
		if nums[read] != 0 {
			nums[write], nums[read] = nums[read], nums[write]
			write++
		}
	}
}

func exampleMoveZeroes() {
	zs := []int{0, 1, 0, 3, 12}
	moveZeroes(zs)
	fmt.Println(zs) // [1 3 12 0 0]
	noZeros := []int{1, 2}
	moveZeroes(noZeros)
	fmt.Println(noZeros) // [1 2]
}
```

```ts
function isAlphaNum(c: string): boolean {
  return /^[a-z0-9]$/i.test(c);
}

function isPalindrome(s: string): boolean {
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (!isAlphaNum(s[left])) { left++; continue; } // skip spaces and punctuation
    if (!isAlphaNum(s[right])) { right--; continue; }
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}
console.log(isPalindrome("A man, a plan, a canal: Panama")); // true
console.log(isPalindrome("race a car")); // false
console.log(isPalindrome(" ")); // true
```

```go
func isAlphaNum(b byte) bool {
	return (b >= 'a' && b <= 'z') || (b >= 'A' && b <= 'Z') || (b >= '0' && b <= '9')
}

func toLower(b byte) byte {
	if b >= 'A' && b <= 'Z' {
		return b + ('a' - 'A')
	}
	return b
}

func isPalindrome(s string) bool {
	left, right := 0, len(s)-1
	for left < right {
		if !isAlphaNum(s[left]) {
			left++ // skip spaces and punctuation
			continue
		}
		if !isAlphaNum(s[right]) {
			right--
			continue
		}
		if toLower(s[left]) != toLower(s[right]) {
			return false
		}
		left++
		right--
	}
	return true
}

func exampleIsPalindrome() {
	fmt.Println(isPalindrome("A man, a plan, a canal: Panama")) // true
	fmt.Println(isPalindrome("race a car"))                     // false
	fmt.Println(isPalindrome(" "))                              // true
}
```

```ts
function mergeSorted(nums1: number[], m: number, nums2: number[], n: number): void {
  let i = m - 1, j = n - 1, write = m + n - 1; // write fills the spare room from the back
  while (j >= 0) {
    if (i >= 0 && nums1[i] > nums2[j]) {
      nums1[write] = nums1[i];
      i--;
    } else {
      nums1[write] = nums2[j];
      j--;
    }
    write--;
  }
}
const room = [1, 2, 3, 0, 0, 0];
mergeSorted(room, 3, [2, 5, 6], 3);
console.log(room); // [ 1, 2, 2, 3, 5, 6 ]
const onlySecond = [0];
mergeSorted(onlySecond, 0, [1], 1);
console.log(onlySecond); // [ 1 ]
```

```go
func mergeSorted(nums1 []int, m int, nums2 []int, n int) {
	i, j, write := m-1, n-1, m+n-1 // write fills the spare room from the back
	for j >= 0 {
		if i >= 0 && nums1[i] > nums2[j] {
			nums1[write] = nums1[i]
			i--
		} else {
			nums1[write] = nums2[j]
			j--
		}
		write--
	}
}

func exampleMergeSorted() {
	room := []int{1, 2, 3, 0, 0, 0}
	mergeSorted(room, 3, []int{2, 5, 6}, 3)
	fmt.Println(room) // [1 2 2 3 5 6]
	onlySecond := []int{0}
	mergeSorted(onlySecond, 0, []int{1}, 1)
	fmt.Println(onlySecond) // [1]
}
```

```ts
function threeSumClosest(nums: number[], target: number): number {
  const a = [...nums].sort((x, y) => x - y);
  let best = a[0] + a[1] + a[2];
  for (let i = 0; i < a.length - 2; i++) {
    let left = i + 1, right = a.length - 1;
    while (left < right) {
      const sum = a[i] + a[left] + a[right];
      if (Math.abs(sum - target) < Math.abs(best - target)) best = sum; // closer: remember it
      if (sum === target) return sum; // nothing is closer than exact
      if (sum < target) left++;
      else right--;
    }
  }
  return best;
}
console.log(threeSumClosest([-1, 2, 1, -4], 1)); // 2
console.log(threeSumClosest([0, 0, 0], 1)); // 0
console.log(threeSumClosest([1, 1, 1, 0], 100)); // 3
```

```go
func absInt(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func threeSumClosest(nums []int, target int) int {
	a := make([]int, len(nums))
	copy(a, nums)
	sort.Ints(a)
	best := a[0] + a[1] + a[2]
	for i := 0; i < len(a)-2; i++ {
		left, right := i+1, len(a)-1
		for left < right {
			sum := a[i] + a[left] + a[right]
			if absInt(sum-target) < absInt(best-target) {
				best = sum // closer: remember it
			}
			if sum == target {
				return sum // nothing is closer than exact
			}
			if sum < target {
				left++
			} else {
				right--
			}
		}
	}
	return best
}

func exampleThreeSumClosest() {
	fmt.Println(threeSumClosest([]int{-1, 2, 1, -4}, 1)) // 2
	fmt.Println(threeSumClosest([]int{0, 0, 0}, 1))      // 0
	fmt.Println(threeSumClosest([]int{1, 1, 1, 0}, 100)) // 3
}
```

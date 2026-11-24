# Added code for lesson 06

```ts
function checkInclusion(t: string, s: string): boolean {
  if (t.length > s.length) return false;
  const need = new Array<number>(26).fill(0); // letters t still needs inside the window
  for (let i = 0; i < t.length; i++) need[t.charCodeAt(i) - 97]++;
  let missing = t.length;
  for (let right = 0; right < s.length; right++) {
    if (need[s.charCodeAt(right) - 97]-- > 0) missing--; // a needed letter entered
    const left = right - t.length; // the letter that just left the fixed window
    if (left >= 0 && ++need[s.charCodeAt(left) - 97] > 0) missing++; // a needed letter left
    if (missing === 0) return true;
  }
  return false;
}
console.log(checkInclusion("ab", "eidbaooo")); // true
console.log(checkInclusion("ab", "eidboaoo")); // false
console.log(checkInclusion("adc", "dcda")); // true
```

```go
func checkInclusion(t, s string) bool {
	if len(t) > len(s) {
		return false
	}
	var need [26]int // letters t still needs inside the window
	for i := 0; i < len(t); i++ {
		need[t[i]-'a']++
	}
	missing := len(t)
	for right := 0; right < len(s); right++ {
		if need[s[right]-'a'] > 0 {
			missing-- // a needed letter entered
		}
		need[s[right]-'a']--
		left := right - len(t) // the letter that just left the fixed window
		if left >= 0 {
			need[s[left]-'a']++
			if need[s[left]-'a'] > 0 {
				missing++ // a needed letter left
			}
		}
		if missing == 0 {
			return true
		}
	}
	return false
}

func exampleCheckInclusion() {
	fmt.Println(checkInclusion("ab", "eidbaooo"))  // true
	fmt.Println(checkInclusion("ab", "eidboaoo"))  // false
	fmt.Println(checkInclusion("adc", "dcda"))     // true
}
```

```ts
function countSubarraysBelow(nums: number[], k: number): number {
  let left = 0, sum = 0, count = 0;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= k && left <= right) { // shrink until the window is valid again
      sum -= nums[left];
      left++;
    }
    count += right - left + 1; // every valid subarray that ends at right
  }
  return count;
}
console.log(countSubarraysBelow([2, 5, 6], 10)); // 4
console.log(countSubarraysBelow([1, 1, 1], 3)); // 5
console.log(countSubarraysBelow([10, 20], 5)); // 0
```

```go
func countSubarraysBelow(nums []int, k int) int {
	left, sum, count := 0, 0, 0
	for right := 0; right < len(nums); right++ {
		sum += nums[right]
		for sum >= k && left <= right { // shrink until the window is valid again
			sum -= nums[left]
			left++
		}
		count += right - left + 1 // every valid subarray that ends at right
	}
	return count
}

func exampleCountSubarraysBelow() {
	fmt.Println(countSubarraysBelow([]int{2, 5, 6}, 10)) // 4
	fmt.Println(countSubarraysBelow([]int{1, 1, 1}, 3))  // 5
	fmt.Println(countSubarraysBelow([]int{10, 20}, 5))   // 0
}
```

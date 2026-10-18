nums = [3, 34, 4, 12, 5, 2]
n = len(nums)
target = 9
checked = 0
# every number is either in or out: 2^n subsets, one per bit pattern
for mask in range(1 << n):
    total = 0
    for i in range(n):
        if mask & (1 << i):
            total += nums[i]
    checked += 1
    if total == target:
        found = []
        for i in range(n):
            if mask & (1 << i):
                found.append(nums[i])
        print("Found:", *found)
print("Subsets checked:", checked)

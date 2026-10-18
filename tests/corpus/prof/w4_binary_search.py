def binary_search(arr, target, low, high):
    if low > high:
        return -1
    mid = (low + high) // 2
    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        return binary_search(arr, target, mid + 1, high)
    else:
        return binary_search(arr, target, low, mid - 1)


n = 4
for x in range(0, n):
    for y in range(0, n):
        print(x * y, end=" ")
    print()
data = [3, 8, 15, 21, 42, 57]
print(binary_search(data, 42, 0, len(data) - 1))

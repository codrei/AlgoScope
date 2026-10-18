def counting_sort(arr):
    n = len(arr)
    max_val = arr[0]
    for i in range(1, n):
        if arr[i] > max_val:
            max_val = arr[i]
    # count[v] = how many times v appears
    count = [0] * (max_val + 1)
    for i in range(n):
        count[arr[i]] += 1
    # write each value back as many times as it was counted
    k = 0
    for v in range(max_val + 1):
        while count[v] > 0:
            arr[k] = v
            k += 1
            count[v] -= 1


arr = [5, 1, 4, 2, 8, 3]
counting_sort(arr)
print("Sorted:", *arr)

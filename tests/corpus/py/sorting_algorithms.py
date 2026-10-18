def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)


def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left, right = merge_sort(arr[:mid]), merge_sort(arr[mid:])
    merged, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged


def counting_sort(arr):
    counts = [0] * (max(arr) + 1)
    for x in arr:
        counts[x] += 1
    out = []
    for value, c in enumerate(counts):
        out += [value] * c
    return out


students = [("Ana", 88), ("Ben", 95), ("Cy", 72), ("Di", 95)]
data = [38, 27, 43, 3, 9, 82, 10]
print(quick_sort(data))
print(merge_sort(data))
print(counting_sort([4, 2, 2, 8, 3, 3, 1]))
print(sorted(students, key=lambda s: (-s[1], s[0])))
print(max(students, key=lambda s: s[1])[0], min(data), sum(data) / len(data))
words = "banana apple cherry date".split()
words.sort(key=len, reverse=True)
print(words, sorted("hello"), list(reversed(range(5))))

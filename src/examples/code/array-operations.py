def show(arr, n):
    for i in range(n):
        print(arr[i], end=" ")
    print()


def insert_at(arr, n, pos, value):
    # shift everything from pos one place right, then write the value
    for i in range(n, pos, -1):
        arr[i] = arr[i - 1]
    arr[pos] = value
    return n + 1


def delete_at(arr, n, pos):
    # shift everything after pos one place left over the removed value
    for i in range(pos, n - 1):
        arr[i] = arr[i + 1]
    return n - 1


arr = [10, 20, 30, 40, 50, 0, 0, 0]
n = 5
show(arr, n)
n = insert_at(arr, n, 1, 15)
show(arr, n)
n = delete_at(arr, n, 3)
show(arr, n)

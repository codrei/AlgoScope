heap = []


def insert(value):
    # a new value climbs up while it is smaller than its parent
    heap.append(value)
    i = len(heap) - 1
    while i > 0 and heap[(i - 1) // 2] > heap[i]:
        parent = (i - 1) // 2
        heap[i], heap[parent] = heap[parent], heap[i]
        i = parent


def extract_min():
    # the last value moves to the root and sinks below its smaller child
    smallest_value = heap[0]
    heap[0] = heap[-1]
    heap.pop()
    heap_size = len(heap)
    i = 0
    while True:
        left = 2 * i + 1
        right = 2 * i + 2
        smallest = i
        if left < heap_size and heap[left] < heap[smallest]:
            smallest = left
        if right < heap_size and heap[right] < heap[smallest]:
            smallest = right
        if smallest == i:
            break
        heap[i], heap[smallest] = heap[smallest], heap[i]
        i = smallest
    return smallest_value


for v in [5, 3, 8, 1, 9, 2]:
    insert(v)
print("Extracted:", end="")
for i in range(3):
    print("", extract_min(), end="")
print()

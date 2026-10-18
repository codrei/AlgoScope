V = 5

# edges already sorted by weight: (from, to, weight)
edges = [
    [0, 1, 2], [1, 2, 3], [1, 4, 5], [0, 3, 6],
    [2, 4, 7], [1, 3, 8], [3, 4, 9],
]
parent = list(range(V))


def find(v):
    # follow parent links to the representative of v's group
    while parent[v] != v:
        v = parent[v]
    return v


def kruskal():
    total = 0
    used = 0
    for i in range(len(edges)):
        if used == V - 1:
            break
        a = find(edges[i][0])
        b = find(edges[i][1])
        # only take the edge if it joins two different groups (no cycle)
        if a != b:
            parent[a] = b
            print("Edge", edges[i][0], "-", edges[i][1], "weight", edges[i][2])
            total += edges[i][2]
            used += 1
    print("Total weight:", total)


kruskal()

import sys

V = 5

graph = [
    [0, 2, 0, 6, 0],
    [2, 0, 3, 8, 5],
    [0, 3, 0, 0, 7],
    [6, 8, 0, 0, 9],
    [0, 5, 7, 9, 0],
]


def min_key(key, in_tree):
    # the vertex outside the tree with the cheapest edge into it
    min_value = sys.maxsize
    min_index = -1
    for v in range(V):
        if not in_tree[v] and key[v] < min_value:
            min_value = key[v]
            min_index = v
    return min_index


def prim():
    parent = [-1] * V
    key = [sys.maxsize] * V
    in_tree = [False] * V
    key[0] = 0
    for count in range(V):
        u = min_key(key, in_tree)
        in_tree[u] = True
        # a cheaper edge to a vertex outside the tree replaces the old one
        for v in range(V):
            if graph[u][v] != 0 and not in_tree[v] and graph[u][v] < key[v]:
                parent[v] = u
                key[v] = graph[u][v]
    total = 0
    for v in range(1, V):
        print("Edge", parent[v], "-", v, "weight", graph[v][parent[v]])
        total += graph[v][parent[v]]
    print("Total weight:", total)


prim()

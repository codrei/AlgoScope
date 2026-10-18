from collections import deque

V = 6

# graph[u][v] = 1 means u must come before v
graph = [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0],
    [1, 0, 1, 0, 0, 0],
]


def topological_sort():
    indegree = [0] * V
    for u in range(V):
        for v in range(V):
            if graph[u][v] == 1:
                indegree[v] += 1
    # start with the vertices that nothing points to
    queue = deque()
    for v in range(V):
        if indegree[v] == 0:
            queue.append(v)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for v in range(V):
            if graph[node][v] == 1:
                indegree[v] -= 1
                if indegree[v] == 0:
                    queue.append(v)
    print("Topological order:", *order)


topological_sort()

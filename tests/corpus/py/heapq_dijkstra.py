import heapq
from collections import deque, defaultdict


def dijkstra(graph, start):
    dist = {node: float("inf") for node in graph}
    dist[start] = 0
    pq = [(0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))
    return dist


def bfs_levels(adj, s):
    level = {s: 0}
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if v not in level:
                level[v] = level[u] + 1
                q.append(v)
    return level


graph = {
    "A": [("B", 4), ("C", 1)],
    "B": [("A", 4), ("C", 2), ("D", 5)],
    "C": [("A", 1), ("B", 2), ("D", 8)],
    "D": [("B", 5), ("C", 8)],
}
for node, d in dijkstra(graph, "A").items():
    print(f"{node}: {d}")

adj = defaultdict(list)
for u, v in [(1, 2), (1, 3), (2, 4), (3, 4), (4, 5)]:
    adj[u].append(v)
    adj[v].append(u)
print(bfs_levels(adj, 1))

nums = [9, 4, 7, 1, 8, 2]
heapq.heapify(nums)
print([heapq.heappop(nums) for _ in range(3)], heapq.nsmallest(2, [5, 3, 8, 1]))

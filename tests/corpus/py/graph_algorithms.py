class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.rank[ra] < self.rank[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        if self.rank[ra] == self.rank[rb]:
            self.rank[ra] += 1
        return True


def kruskal(n, edges):
    uf = UnionFind(n)
    mst = []
    for w, u, v in sorted(edges):
        if uf.union(u, v):
            mst.append((u, v, w))
    return mst


def topo_sort(graph):
    visited, order = set(), []

    def dfs(u):
        visited.add(u)
        for v in graph.get(u, []):
            if v not in visited:
                dfs(v)
        order.append(u)

    for node in graph:
        if node not in visited:
            dfs(node)
    return order[::-1]


def n_queens(n):
    solutions = []
    cols = [0] * n

    def safe(r, c):
        return all(cols[i] != c and abs(cols[i] - c) != r - i for i in range(r))

    def place(r):
        if r == n:
            solutions.append(cols[:])
            return
        for c in range(n):
            if safe(r, c):
                cols[r] = c
                place(r + 1)

    place(0)
    return solutions


edges = [(10, 0, 1), (6, 0, 2), (5, 0, 3), (15, 1, 3), (4, 2, 3)]
mst = kruskal(4, edges)
print("MST:", mst, "weight", sum(w for _, _, w in mst))
print("Topo:", topo_sort({"shirt": ["tie"], "tie": ["jacket"], "pants": ["shoes", "jacket"], "socks": ["shoes"]}))
sols = n_queens(5)
print(len(sols), "solutions; first:", sols[0])

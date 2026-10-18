V = 4
INF = 99999


def floyd_warshall(dist):
    # allow k as a stop between every pair i -> j
    for k in range(V):
        for i in range(V):
            for j in range(V):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]


dist = [
    [0, 3, INF, 7],
    [8, 0, 2, INF],
    [5, INF, 0, 1],
    [2, INF, INF, 0],
]
floyd_warshall(dist)
print("Shortest distances:")
for i in range(V):
    for j in range(V):
        print(dist[i][j], end=" ")
    print()

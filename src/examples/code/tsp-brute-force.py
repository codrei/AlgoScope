N = 4

dist = [
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0],
]
visited = [False] * N
best = 9999
routes = 0


def tour(city, count, cost):
    # try every order of the remaining cities: (N-1)! routes in total
    global best, routes
    if count == N:
        routes += 1
        total = cost + dist[city][0]   # return to the start
        if total < best:
            best = total
        return
    for nxt in range(N):
        if not visited[nxt]:
            visited[nxt] = True
            tour(nxt, count + 1, cost + dist[city][nxt])
            visited[nxt] = False


visited[0] = True
tour(0, 1, 0)
print("Routes checked:", routes)
print("Shortest tour:", best)

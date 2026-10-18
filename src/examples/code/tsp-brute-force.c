#include <stdio.h>
#define N 4

int dist[N][N] = {
    {0, 10, 15, 20},
    {10, 0, 35, 25},
    {15, 35, 0, 30},
    {20, 25, 30, 0}
};
int visited[N];
int best = 9999;
int routes = 0;

// try every order of the remaining cities: (N-1)! routes in total
void tour(int city, int count, int cost) {
    if (count == N) {
        routes++;
        int total = cost + dist[city][0];   // return to the start
        if (total < best) {
            best = total;
        }
        return;
    }
    for (int next = 0; next < N; next++) {
        if (!visited[next]) {
            visited[next] = 1;
            tour(next, count + 1, cost + dist[city][next]);
            visited[next] = 0;
        }
    }
}

int main() {
    visited[0] = 1;
    tour(0, 1, 0);
    printf("Routes checked: %d\n", routes);
    printf("Shortest tour: %d\n", best);
    return 0;
}

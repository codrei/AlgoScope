#include <stdio.h>
#define V 4
#define INF 99999

void floydWarshall(int dist[V][V]) {
    // allow k as a stop between every pair i -> j
    for (int k = 0; k < V; k++) {
        for (int i = 0; i < V; i++) {
            for (int j = 0; j < V; j++) {
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }
}

int main() {
    int dist[V][V] = {
        {0, 3, INF, 7},
        {8, 0, 2, INF},
        {5, INF, 0, 1},
        {2, INF, INF, 0}
    };
    floydWarshall(dist);
    printf("Shortest distances:\n");
    for (int i = 0; i < V; i++) {
        for (int j = 0; j < V; j++) {
            printf("%d ", dist[i][j]);
        }
        printf("\n");
    }
    return 0;
}

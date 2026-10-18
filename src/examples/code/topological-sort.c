#include <stdio.h>
#define V 6

// graph[u][v] = 1 means u must come before v
int graph[V][V] = {
    {0, 0, 0, 0, 0, 0},
    {0, 0, 0, 0, 0, 0},
    {0, 0, 0, 1, 0, 0},
    {0, 1, 0, 0, 0, 0},
    {1, 1, 0, 0, 0, 0},
    {1, 0, 1, 0, 0, 0}
};

void topologicalSort() {
    int indegree[V] = {0};
    for (int u = 0; u < V; u++) {
        for (int v = 0; v < V; v++) {
            if (graph[u][v] == 1) {
                indegree[v]++;
            }
        }
    }
    // start with the vertices that nothing points to
    int queue[V];
    int front = 0, rear = 0;
    for (int v = 0; v < V; v++) {
        if (indegree[v] == 0) {
            queue[rear++] = v;
        }
    }
    printf("Topological order:");
    while (front < rear) {
        int node = queue[front++];
        printf(" %d", node);
        for (int v = 0; v < V; v++) {
            if (graph[node][v] == 1) {
                indegree[v]--;
                if (indegree[v] == 0) {
                    queue[rear++] = v;
                }
            }
        }
    }
    printf("\n");
}

int main() {
    topologicalSort();
    return 0;
}

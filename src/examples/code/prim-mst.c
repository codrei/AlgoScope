#include <stdio.h>
#include <limits.h>
#define V 5

int graph[V][V] = {
    {0, 2, 0, 6, 0},
    {2, 0, 3, 8, 5},
    {0, 3, 0, 0, 7},
    {6, 8, 0, 0, 9},
    {0, 5, 7, 9, 0}
};

// the vertex outside the tree with the cheapest edge into it
int minKey(int key[], int inTree[]) {
    int min = INT_MAX, minIndex = -1;
    for (int v = 0; v < V; v++) {
        if (!inTree[v] && key[v] < min) {
            min = key[v];
            minIndex = v;
        }
    }
    return minIndex;
}

void prim() {
    int parent[V];
    int key[V];
    int inTree[V];
    for (int i = 0; i < V; i++) {
        key[i] = INT_MAX;
        inTree[i] = 0;
    }
    key[0] = 0;
    parent[0] = -1;
    for (int count = 0; count < V; count++) {
        int u = minKey(key, inTree);
        inTree[u] = 1;
        // a cheaper edge to a vertex outside the tree replaces the old one
        for (int v = 0; v < V; v++) {
            if (graph[u][v] != 0 && !inTree[v] && graph[u][v] < key[v]) {
                parent[v] = u;
                key[v] = graph[u][v];
            }
        }
    }
    int total = 0;
    for (int v = 1; v < V; v++) {
        printf("Edge %d - %d weight %d\n", parent[v], v, graph[v][parent[v]]);
        total += graph[v][parent[v]];
    }
    printf("Total weight: %d\n", total);
}

int main() {
    prim();
    return 0;
}

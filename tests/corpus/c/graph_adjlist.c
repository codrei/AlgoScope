#include <stdio.h>
#include <stdlib.h>

struct AdjNode {
    int dest;
    struct AdjNode *next;
};

struct Graph {
    int V;
    struct AdjNode **adj;
};

struct Graph *createGraph(int V) {
    struct Graph *g = malloc(sizeof(struct Graph));
    g->V = V;
    g->adj = malloc(V * sizeof(struct AdjNode *));
    for (int i = 0; i < V; i++) g->adj[i] = NULL;
    return g;
}

void addEdge(struct Graph *g, int s, int d) {
    struct AdjNode *n = malloc(sizeof(struct AdjNode));
    n->dest = d;
    n->next = g->adj[s];
    g->adj[s] = n;
    n = malloc(sizeof(struct AdjNode));
    n->dest = s;
    n->next = g->adj[d];
    g->adj[d] = n;
}

void printGraph(struct Graph *g) {
    for (int v = 0; v < g->V; v++) {
        printf("Vertex %d:", v);
        for (struct AdjNode *t = g->adj[v]; t; t = t->next) printf(" %d", t->dest);
        printf("\n");
    }
}

void bfs(struct Graph *g, int start) {
    int visited[10] = {0};
    int queue[10], front = 0, rear = 0;
    visited[start] = 1;
    queue[rear++] = start;
    printf("BFS from %d:", start);
    while (front < rear) {
        int v = queue[front++];
        printf(" %d", v);
        for (struct AdjNode *t = g->adj[v]; t != NULL; t = t->next) {
            if (!visited[t->dest]) {
                visited[t->dest] = 1;
                queue[rear++] = t->dest;
            }
        }
    }
    printf("\n");
}

int main() {
    struct Graph *g = createGraph(5);
    addEdge(g, 0, 1);
    addEdge(g, 0, 4);
    addEdge(g, 1, 2);
    addEdge(g, 1, 3);
    addEdge(g, 1, 4);
    addEdge(g, 2, 3);
    addEdge(g, 3, 4);
    printGraph(g);
    bfs(g, 0);
    return 0;
}

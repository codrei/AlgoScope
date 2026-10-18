#include <iostream>
using namespace std;

const int V = 5;
const int E = 7;

// edges already sorted by weight: {from, to, weight}
int edges[E][3] = {
    {0, 1, 2}, {1, 2, 3}, {1, 4, 5}, {0, 3, 6},
    {2, 4, 7}, {1, 3, 8}, {3, 4, 9}
};
int parent[V];

// follow parent links to the representative of v's group
int find(int v) {
    while (parent[v] != v) {
        v = parent[v];
    }
    return v;
}

void kruskal() {
    for (int v = 0; v < V; v++) {
        parent[v] = v;
    }
    int total = 0, used = 0;
    for (int i = 0; i < E && used < V - 1; i++) {
        int a = find(edges[i][0]);
        int b = find(edges[i][1]);
        // only take the edge if it joins two different groups (no cycle)
        if (a != b) {
            parent[a] = b;
            cout << "Edge " << edges[i][0] << " - " << edges[i][1] << " weight " << edges[i][2] << endl;
            total += edges[i][2];
            used++;
        }
    }
    cout << "Total weight: " << total << endl;
}

int main() {
    kruskal();
    return 0;
}

#include <iostream>
#include <queue>
using namespace std;

const int V = 6;

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
    queue<int> q;
    for (int v = 0; v < V; v++) {
        if (indegree[v] == 0) {
            q.push(v);
        }
    }
    cout << "Topological order:";
    while (!q.empty()) {
        int node = q.front();
        q.pop();
        cout << " " << node;
        for (int v = 0; v < V; v++) {
            if (graph[node][v] == 1) {
                indegree[v]--;
                if (indegree[v] == 0) {
                    q.push(v);
                }
            }
        }
    }
    cout << endl;
}

int main() {
    topologicalSort();
    return 0;
}

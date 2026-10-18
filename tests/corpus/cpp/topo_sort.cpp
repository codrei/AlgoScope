#include <iostream>
#include <vector>
#include <stack>
using namespace std;

class Graph {
    int V;
    vector<vector<int>> adj;

    void dfs(int v, vector<bool>& visited, stack<int>& st) {
        visited[v] = true;
        for (int u : adj[v])
            if (!visited[u]) dfs(u, visited, st);
        st.push(v);
    }

public:
    Graph(int v) : V(v), adj(v) {}
    void addEdge(int u, int v) { adj[u].push_back(v); }

    void topologicalSort() {
        stack<int> st;
        vector<bool> visited(V, false);
        for (int i = 0; i < V; i++)
            if (!visited[i]) dfs(i, visited, st);
        cout << "Topological order:";
        while (!st.empty()) {
            cout << " " << st.top();
            st.pop();
        }
        cout << endl;
    }
};

int main() {
    Graph g(6);
    g.addEdge(5, 2);
    g.addEdge(5, 0);
    g.addEdge(4, 0);
    g.addEdge(4, 1);
    g.addEdge(2, 3);
    g.addEdge(3, 1);
    g.topologicalSort();
    return 0;
}

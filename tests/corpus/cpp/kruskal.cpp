#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

struct Edge {
    int u, v, w;
};

vector<int> parent, rnk;

int find(int x) {
    if (parent[x] != x) parent[x] = find(parent[x]);
    return parent[x];
}

bool unite(int a, int b) {
    a = find(a);
    b = find(b);
    if (a == b) return false;
    if (rnk[a] < rnk[b]) swap(a, b);
    parent[b] = a;
    if (rnk[a] == rnk[b]) rnk[a]++;
    return true;
}

bool cmp(Edge a, Edge b) { return a.w < b.w; }

int main() {
    int n = 5;
    vector<Edge> edges = {{0, 1, 10}, {0, 2, 6}, {0, 3, 5}, {1, 3, 15}, {2, 3, 4}, {3, 4, 8}, {2, 4, 9}};
    sort(edges.begin(), edges.end(), cmp);
    parent.resize(n);
    rnk.assign(n, 0);
    for (int i = 0; i < n; i++) parent[i] = i;
    int total = 0;
    cout << "Edges in MST:" << endl;
    for (const Edge& e : edges) {
        if (unite(e.u, e.v)) {
            cout << e.u << " - " << e.v << " : " << e.w << endl;
            total += e.w;
        }
    }
    cout << "Total weight: " << total << endl;
    return 0;
}

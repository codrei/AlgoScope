using System;

class Program {
    const int V = 5;

    static int[,] graph = {
        { 0, 2, 0, 6, 0 },
        { 2, 0, 3, 8, 5 },
        { 0, 3, 0, 0, 7 },
        { 6, 8, 0, 0, 9 },
        { 0, 5, 7, 9, 0 }
    };

    // the vertex outside the tree with the cheapest edge into it
    static int MinKey(int[] key, bool[] inTree) {
        int min = int.MaxValue, minIndex = -1;
        for (int v = 0; v < V; v++) {
            if (!inTree[v] && key[v] < min) {
                min = key[v];
                minIndex = v;
            }
        }
        return minIndex;
    }

    static void Prim() {
        int[] parent = new int[V];
        int[] key = new int[V];
        bool[] inTree = new bool[V];
        for (int i = 0; i < V; i++) {
            key[i] = int.MaxValue;
        }
        key[0] = 0;
        parent[0] = -1;
        for (int count = 0; count < V; count++) {
            int u = MinKey(key, inTree);
            inTree[u] = true;
            // a cheaper edge to a vertex outside the tree replaces the old one
            for (int v = 0; v < V; v++) {
                if (graph[u, v] != 0 && !inTree[v] && graph[u, v] < key[v]) {
                    parent[v] = u;
                    key[v] = graph[u, v];
                }
            }
        }
        int total = 0;
        for (int v = 1; v < V; v++) {
            Console.WriteLine("Edge " + parent[v] + " - " + v + " weight " + graph[v, parent[v]]);
            total += graph[v, parent[v]];
        }
        Console.WriteLine("Total weight: " + total);
    }

    static void Main(string[] args) {
        Prim();
    }
}

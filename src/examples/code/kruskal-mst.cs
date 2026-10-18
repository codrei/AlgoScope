using System;

class Program {
    const int V = 5;

    // edges already sorted by weight: {from, to, weight}
    static int[,] edges = {
        { 0, 1, 2 }, { 1, 2, 3 }, { 1, 4, 5 }, { 0, 3, 6 },
        { 2, 4, 7 }, { 1, 3, 8 }, { 3, 4, 9 }
    };
    static int[] parent = new int[V];

    // follow parent links to the representative of v's group
    static int Find(int v) {
        while (parent[v] != v) {
            v = parent[v];
        }
        return v;
    }

    static void Kruskal() {
        for (int v = 0; v < V; v++) {
            parent[v] = v;
        }
        int total = 0, used = 0;
        for (int i = 0; i < edges.GetLength(0) && used < V - 1; i++) {
            int a = Find(edges[i, 0]);
            int b = Find(edges[i, 1]);
            // only take the edge if it joins two different groups (no cycle)
            if (a != b) {
                parent[a] = b;
                Console.WriteLine("Edge " + edges[i, 0] + " - " + edges[i, 1] + " weight " + edges[i, 2]);
                total += edges[i, 2];
                used++;
            }
        }
        Console.WriteLine("Total weight: " + total);
    }

    static void Main(string[] args) {
        Kruskal();
    }
}

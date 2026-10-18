using System;
using System.Collections.Generic;

class Program {
    const int V = 6;

    // graph[u, v] = 1 means u must come before v
    static int[,] graph = {
        { 0, 0, 0, 0, 0, 0 },
        { 0, 0, 0, 0, 0, 0 },
        { 0, 0, 0, 1, 0, 0 },
        { 0, 1, 0, 0, 0, 0 },
        { 1, 1, 0, 0, 0, 0 },
        { 1, 0, 1, 0, 0, 0 }
    };

    static void TopologicalSort() {
        int[] indegree = new int[V];
        for (int u = 0; u < V; u++) {
            for (int v = 0; v < V; v++) {
                if (graph[u, v] == 1) {
                    indegree[v]++;
                }
            }
        }
        // start with the vertices that nothing points to
        Queue<int> queue = new Queue<int>();
        for (int v = 0; v < V; v++) {
            if (indegree[v] == 0) {
                queue.Enqueue(v);
            }
        }
        Console.Write("Topological order:");
        while (queue.Count > 0) {
            int node = queue.Dequeue();
            Console.Write(" " + node);
            for (int v = 0; v < V; v++) {
                if (graph[node, v] == 1) {
                    indegree[v]--;
                    if (indegree[v] == 0) {
                        queue.Enqueue(v);
                    }
                }
            }
        }
        Console.WriteLine();
    }

    static void Main(string[] args) {
        TopologicalSort();
    }
}

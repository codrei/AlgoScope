using System;
using System.Collections.Generic;

class Graph
{
    private Dictionary<int, List<int>> adj = new Dictionary<int, List<int>>();

    public void AddEdge(int u, int v)
    {
        if (!adj.ContainsKey(u)) adj[u] = new List<int>();
        if (!adj.ContainsKey(v)) adj[v] = new List<int>();
        adj[u].Add(v);
        adj[v].Add(u);
    }

    public void BFS(int start)
    {
        var visited = new HashSet<int>();
        var queue = new Queue<int>();
        visited.Add(start);
        queue.Enqueue(start);
        Console.Write("BFS:");
        while (queue.Count > 0)
        {
            int node = queue.Dequeue();
            Console.Write($" {node}");
            foreach (int next in adj[node])
            {
                if (!visited.Contains(next))
                {
                    visited.Add(next);
                    queue.Enqueue(next);
                }
            }
        }
        Console.WriteLine();
    }

    public bool HasPathDFS(int src, int dst, HashSet<int> seen)
    {
        if (src == dst) return true;
        seen.Add(src);
        foreach (var n in adj[src])
            if (!seen.Contains(n) && HasPathDFS(n, dst, seen)) return true;
        return false;
    }
}

class Program
{
    static void Main()
    {
        var g = new Graph();
        int[,] edges = { { 1, 2 }, { 1, 3 }, { 2, 4 }, { 3, 4 }, { 4, 5 }, { 6, 7 } };
        for (int i = 0; i < edges.GetLength(0); i++) g.AddEdge(edges[i, 0], edges[i, 1]);
        g.BFS(1);
        Console.WriteLine($"Path 1->5: {g.HasPathDFS(1, 5, new HashSet<int>())}");
        Console.WriteLine($"Path 1->7: {g.HasPathDFS(1, 7, new HashSet<int>())}");

        var scores = new Dictionary<string, int> { { "Ana", 90 }, { "Ben", 75 } };
        scores["Cy"] = 82;
        foreach (KeyValuePair<string, int> kv in scores) Console.WriteLine($"{kv.Key,-5}{kv.Value,4}");
        if (scores.TryGetValue("Ben", out int b)) Console.WriteLine($"Ben has {b}");
    }
}

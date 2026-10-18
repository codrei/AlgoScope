using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        int n = 5;
        var graph = new List<(int to, int w)>[n];
        for (int i = 0; i < n; i++) graph[i] = new List<(int, int)>();
        void Add(int u, int v, int w)
        {
            graph[u].Add((v, w));
            graph[v].Add((u, w));
        }
        Add(0, 1, 4); Add(0, 2, 1); Add(2, 1, 2); Add(1, 3, 1); Add(2, 3, 5); Add(3, 4, 3);
        int[] dist = new int[n];
        Array.Fill(dist, int.MaxValue);
        dist[0] = 0;
        var pq = new PriorityQueue<int, int>();
        pq.Enqueue(0, 0);
        while (pq.Count > 0)
        {
            int u = pq.Dequeue();
            foreach (var (to, w) in graph[u])
            {
                if (dist[u] + w < dist[to])
                {
                    dist[to] = dist[u] + w;
                    pq.Enqueue(to, dist[to]);
                }
            }
        }
        for (int i = 0; i < n; i++) Console.WriteLine($"dist[{i}] = {dist[i]}");
    }
}

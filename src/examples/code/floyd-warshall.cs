using System;

class Program {
    const int V = 4;
    const int INF = 99999;

    static void FloydWarshall(int[,] dist) {
        // allow k as a stop between every pair i -> j
        for (int k = 0; k < V; k++) {
            for (int i = 0; i < V; i++) {
                for (int j = 0; j < V; j++) {
                    if (dist[i, k] + dist[k, j] < dist[i, j]) {
                        dist[i, j] = dist[i, k] + dist[k, j];
                    }
                }
            }
        }
    }

    static void Main(string[] args) {
        int[,] dist = {
            { 0, 3, INF, 7 },
            { 8, 0, 2, INF },
            { 5, INF, 0, 1 },
            { 2, INF, INF, 0 }
        };
        FloydWarshall(dist);
        Console.WriteLine("Shortest distances:");
        for (int i = 0; i < V; i++) {
            for (int j = 0; j < V; j++) {
                Console.Write(dist[i, j] + " ");
            }
            Console.WriteLine();
        }
    }
}

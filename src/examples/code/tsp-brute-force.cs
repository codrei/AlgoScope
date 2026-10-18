using System;

class Program {
    const int N = 4;

    static int[,] dist = {
        { 0, 10, 15, 20 },
        { 10, 0, 35, 25 },
        { 15, 35, 0, 30 },
        { 20, 25, 30, 0 }
    };
    static bool[] visited = new bool[N];
    static int best = 9999;
    static int routes = 0;

    // try every order of the remaining cities: (N-1)! routes in total
    static void Tour(int city, int count, int cost) {
        if (count == N) {
            routes++;
            int total = cost + dist[city, 0];   // return to the start
            if (total < best) {
                best = total;
            }
            return;
        }
        for (int next = 0; next < N; next++) {
            if (!visited[next]) {
                visited[next] = true;
                Tour(next, count + 1, cost + dist[city, next]);
                visited[next] = false;
            }
        }
    }

    static void Main(string[] args) {
        visited[0] = true;
        Tour(0, 1, 0);
        Console.WriteLine("Routes checked: " + routes);
        Console.WriteLine("Shortest tour: " + best);
    }
}

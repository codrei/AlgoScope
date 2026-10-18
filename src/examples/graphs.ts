import type { Example } from './types';

export const bfs: Example = {
  id: "bfs",
  title: "Breadth-First Search (BFS)",
  topic: "Graphs",
  description: "Visits the graph level by level using a queue: first the start node, then all its neighbors, then their neighbors.",
  time: "O(V\u00b2)",
  space: "O(V)",
  notes: "O(V\u00b2) with an adjacency matrix; O(V + E) with adjacency lists.",
  output: "BFS: 0 1 2 3 4 5\n",
  code: {
    c: String.raw`#include <stdio.h>
#define V 6

int graph[V][V] = {
    {0, 1, 1, 0, 0, 0},
    {1, 0, 0, 1, 1, 0},
    {1, 0, 0, 0, 1, 0},
    {0, 1, 0, 0, 0, 1},
    {0, 1, 1, 0, 0, 1},
    {0, 0, 0, 1, 1, 0}
};

void bfs(int start) {
    int visited[V] = {0};
    int queue[V];
    int front = 0, rear = 0;
    visited[start] = 1;
    queue[rear++] = start;
    printf("BFS:");
    while (front < rear) {
        int node = queue[front++];
        printf(" %d", node);
        for (int neighbor = 0; neighbor < V; neighbor++) {
            if (graph[node][neighbor] == 1 && !visited[neighbor]) {
                visited[neighbor] = 1;
                queue[rear++] = neighbor;
            }
        }
    }
    printf("\n");
}

int main() {
    bfs(0);
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
#include <queue>
#include <vector>
using namespace std;

const int V = 6;
int graph[V][V] = {
    {0, 1, 1, 0, 0, 0},
    {1, 0, 0, 1, 1, 0},
    {1, 0, 0, 0, 1, 0},
    {0, 1, 0, 0, 0, 1},
    {0, 1, 1, 0, 0, 1},
    {0, 0, 0, 1, 1, 0}
};

void bfs(int start) {
    vector<bool> visited(V, false);
    queue<int> q;
    visited[start] = true;
    q.push(start);
    cout << "BFS:";
    while (!q.empty()) {
        int node = q.front();
        q.pop();
        cout << " " << node;
        for (int neighbor = 0; neighbor < V; neighbor++) {
            if (graph[node][neighbor] == 1 && !visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
            }
        }
    }
    cout << endl;
}

int main() {
    bfs(0);
    return 0;
}
`,
    java: String.raw`import java.util.LinkedList;
import java.util.Queue;

public class Main {
    static final int V = 6;
    static int[][] graph = {
        {0, 1, 1, 0, 0, 0},
        {1, 0, 0, 1, 1, 0},
        {1, 0, 0, 0, 1, 0},
        {0, 1, 0, 0, 0, 1},
        {0, 1, 1, 0, 0, 1},
        {0, 0, 0, 1, 1, 0}
    };

    static void bfs(int start) {
        boolean[] visited = new boolean[V];
        Queue<Integer> q = new LinkedList<>();
        visited[start] = true;
        q.add(start);
        System.out.print("BFS:");
        while (!q.isEmpty()) {
            int node = q.poll();
            System.out.print(" " + node);
            for (int neighbor = 0; neighbor < V; neighbor++) {
                if (graph[node][neighbor] == 1 && !visited[neighbor]) {
                    visited[neighbor] = true;
                    q.add(neighbor);
                }
            }
        }
        System.out.println();
    }

    public static void main(String[] args) {
        bfs(0);
    }
}
`,
    csharp: String.raw`using System;
using System.Collections.Generic;

class Program {
    const int V = 6;
    static int[,] graph = {
        {0, 1, 1, 0, 0, 0},
        {1, 0, 0, 1, 1, 0},
        {1, 0, 0, 0, 1, 0},
        {0, 1, 0, 0, 0, 1},
        {0, 1, 1, 0, 0, 1},
        {0, 0, 0, 1, 1, 0}
    };

    static void Bfs(int start) {
        bool[] visited = new bool[V];
        Queue<int> q = new Queue<int>();
        visited[start] = true;
        q.Enqueue(start);
        Console.Write("BFS:");
        while (q.Count > 0) {
            int node = q.Dequeue();
            Console.Write(" " + node);
            for (int neighbor = 0; neighbor < V; neighbor++) {
                if (graph[node, neighbor] == 1 && !visited[neighbor]) {
                    visited[neighbor] = true;
                    q.Enqueue(neighbor);
                }
            }
        }
        Console.WriteLine();
    }

    static void Main(string[] args) {
        Bfs(0);
    }
}
`,
    python: String.raw`from collections import deque

V = 6
graph = [
    [0, 1, 1, 0, 0, 0],
    [1, 0, 0, 1, 1, 0],
    [1, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 1],
    [0, 1, 1, 0, 0, 1],
    [0, 0, 0, 1, 1, 0],
]


def bfs(start):
    visited = [False] * V
    q = deque([start])
    visited[start] = True
    print("BFS:", end="")
    while q:
        node = q.popleft()
        print(f" {node}", end="")
        for neighbor in range(V):
            if graph[node][neighbor] == 1 and not visited[neighbor]:
                visited[neighbor] = True
                q.append(neighbor)
    print()


bfs(0)
`,
  },
};

export const dfs: Example = {
  id: "dfs",
  title: "Depth-First Search (DFS)",
  topic: "Graphs",
  description: "Goes as deep as possible along each path before backing up. The recursion (call stack) remembers where to come back to.",
  time: "O(V\u00b2)",
  space: "O(V)",
  notes: "O(V\u00b2) with an adjacency matrix; O(V + E) with adjacency lists.",
  output: "DFS: 0 1 3 5 4 2\n",
  code: {
    c: String.raw`#include <stdio.h>
#define V 6

int graph[V][V] = {
    {0, 1, 1, 0, 0, 0},
    {1, 0, 0, 1, 1, 0},
    {1, 0, 0, 0, 1, 0},
    {0, 1, 0, 0, 0, 1},
    {0, 1, 1, 0, 0, 1},
    {0, 0, 0, 1, 1, 0}
};
int visited[V];

void dfs(int node) {
    visited[node] = 1;
    printf(" %d", node);
    for (int neighbor = 0; neighbor < V; neighbor++) {
        if (graph[node][neighbor] == 1 && !visited[neighbor]) {
            dfs(neighbor);
        }
    }
}

int main() {
    printf("DFS:");
    dfs(0);
    printf("\n");
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
using namespace std;

const int V = 6;
int graph[V][V] = {
    {0, 1, 1, 0, 0, 0},
    {1, 0, 0, 1, 1, 0},
    {1, 0, 0, 0, 1, 0},
    {0, 1, 0, 0, 0, 1},
    {0, 1, 1, 0, 0, 1},
    {0, 0, 0, 1, 1, 0}
};
bool visited[V];

void dfs(int node) {
    visited[node] = true;
    cout << " " << node;
    for (int neighbor = 0; neighbor < V; neighbor++) {
        if (graph[node][neighbor] == 1 && !visited[neighbor]) {
            dfs(neighbor);
        }
    }
}

int main() {
    cout << "DFS:";
    dfs(0);
    cout << endl;
    return 0;
}
`,
    java: String.raw`public class Main {
    static final int V = 6;
    static int[][] graph = {
        {0, 1, 1, 0, 0, 0},
        {1, 0, 0, 1, 1, 0},
        {1, 0, 0, 0, 1, 0},
        {0, 1, 0, 0, 0, 1},
        {0, 1, 1, 0, 0, 1},
        {0, 0, 0, 1, 1, 0}
    };
    static boolean[] visited = new boolean[V];

    static void dfs(int node) {
        visited[node] = true;
        System.out.print(" " + node);
        for (int neighbor = 0; neighbor < V; neighbor++) {
            if (graph[node][neighbor] == 1 && !visited[neighbor]) {
                dfs(neighbor);
            }
        }
    }

    public static void main(String[] args) {
        System.out.print("DFS:");
        dfs(0);
        System.out.println();
    }
}
`,
    csharp: String.raw`using System;

class Program {
    const int V = 6;
    static int[,] graph = {
        {0, 1, 1, 0, 0, 0},
        {1, 0, 0, 1, 1, 0},
        {1, 0, 0, 0, 1, 0},
        {0, 1, 0, 0, 0, 1},
        {0, 1, 1, 0, 0, 1},
        {0, 0, 0, 1, 1, 0}
    };
    static bool[] visited = new bool[V];

    static void Dfs(int node) {
        visited[node] = true;
        Console.Write(" " + node);
        for (int neighbor = 0; neighbor < V; neighbor++) {
            if (graph[node, neighbor] == 1 && !visited[neighbor]) {
                Dfs(neighbor);
            }
        }
    }

    static void Main(string[] args) {
        Console.Write("DFS:");
        Dfs(0);
        Console.WriteLine();
    }
}
`,
    python: String.raw`V = 6
graph = [
    [0, 1, 1, 0, 0, 0],
    [1, 0, 0, 1, 1, 0],
    [1, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 1],
    [0, 1, 1, 0, 0, 1],
    [0, 0, 0, 1, 1, 0],
]
visited = [False] * V


def dfs(node):
    visited[node] = True
    print(f" {node}", end="")
    for neighbor in range(V):
        if graph[node][neighbor] == 1 and not visited[neighbor]:
            dfs(neighbor)


print("DFS:", end="")
dfs(0)
print()
`,
  },
};

export const dijkstra: Example = {
  id: "dijkstra",
  title: "Dijkstra's Shortest Path",
  topic: "Graphs",
  description: "Greedy: repeatedly pick the unvisited vertex with the smallest known distance, then try to improve (relax) the distances of its neighbors.",
  time: "O(V\u00b2)",
  space: "O(V)",
  notes: "O(V\u00b2) with this simple version; O((V + E) log V) with a priority queue. \u221e means \"not reached yet\".",
  output: "Vertex 0: 0\nVertex 1: 3\nVertex 2: 1\nVertex 3: 8\nVertex 4: 10\n",
  code: {
    c: String.raw`#include <stdio.h>
#include <limits.h>
#define V 5

int minDistance(int dist[], int visited[]) {
    int min = INT_MAX, minIndex = -1;
    for (int v = 0; v < V; v++) {
        if (!visited[v] && dist[v] < min) {
            min = dist[v];
            minIndex = v;
        }
    }
    return minIndex;
}

void dijkstra(int graph[V][V], int src) {
    int dist[V];
    int visited[V];
    for (int i = 0; i < V; i++) {
        dist[i] = INT_MAX;
        visited[i] = 0;
    }
    dist[src] = 0;
    for (int count = 0; count < V - 1; count++) {
        int u = minDistance(dist, visited);
        visited[u] = 1;
        for (int v = 0; v < V; v++) {
            if (!visited[v] && graph[u][v] != 0 && dist[u] != INT_MAX &&
                dist[u] + graph[u][v] < dist[v]) {
                dist[v] = dist[u] + graph[u][v];
            }
        }
    }
    for (int i = 0; i < V; i++) {
        printf("Vertex %d: %d\n", i, dist[i]);
    }
}

int main() {
    int graph[V][V] = {
        {0, 4, 1, 0, 0},
        {4, 0, 2, 5, 0},
        {1, 2, 0, 8, 10},
        {0, 5, 8, 0, 2},
        {0, 0, 10, 2, 0}
    };
    dijkstra(graph, 0);
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
#include <climits>
using namespace std;

const int V = 5;

int minDistance(int dist[], bool visited[]) {
    int minValue = INT_MAX, minIndex = -1;
    for (int v = 0; v < V; v++) {
        if (!visited[v] && dist[v] < minValue) {
            minValue = dist[v];
            minIndex = v;
        }
    }
    return minIndex;
}

void dijkstra(int graph[V][V], int src) {
    int dist[V];
    bool visited[V];
    for (int i = 0; i < V; i++) {
        dist[i] = INT_MAX;
        visited[i] = false;
    }
    dist[src] = 0;
    for (int count = 0; count < V - 1; count++) {
        int u = minDistance(dist, visited);
        visited[u] = true;
        for (int v = 0; v < V; v++) {
            if (!visited[v] && graph[u][v] != 0 && dist[u] != INT_MAX &&
                dist[u] + graph[u][v] < dist[v]) {
                dist[v] = dist[u] + graph[u][v];
            }
        }
    }
    for (int i = 0; i < V; i++) {
        cout << "Vertex " << i << ": " << dist[i] << endl;
    }
}

int main() {
    int graph[V][V] = {
        {0, 4, 1, 0, 0},
        {4, 0, 2, 5, 0},
        {1, 2, 0, 8, 10},
        {0, 5, 8, 0, 2},
        {0, 0, 10, 2, 0}
    };
    dijkstra(graph, 0);
    return 0;
}
`,
    java: String.raw`public class Main {
    static final int V = 5;

    static int minDistance(int[] dist, boolean[] visited) {
        int min = Integer.MAX_VALUE, minIndex = -1;
        for (int v = 0; v < V; v++) {
            if (!visited[v] && dist[v] < min) {
                min = dist[v];
                minIndex = v;
            }
        }
        return minIndex;
    }

    static void dijkstra(int[][] graph, int src) {
        int[] dist = new int[V];
        boolean[] visited = new boolean[V];
        for (int i = 0; i < V; i++) {
            dist[i] = Integer.MAX_VALUE;
        }
        dist[src] = 0;
        for (int count = 0; count < V - 1; count++) {
            int u = minDistance(dist, visited);
            visited[u] = true;
            for (int v = 0; v < V; v++) {
                if (!visited[v] && graph[u][v] != 0 && dist[u] != Integer.MAX_VALUE &&
                    dist[u] + graph[u][v] < dist[v]) {
                    dist[v] = dist[u] + graph[u][v];
                }
            }
        }
        for (int i = 0; i < V; i++) {
            System.out.println("Vertex " + i + ": " + dist[i]);
        }
    }

    public static void main(String[] args) {
        int[][] graph = {
            {0, 4, 1, 0, 0},
            {4, 0, 2, 5, 0},
            {1, 2, 0, 8, 10},
            {0, 5, 8, 0, 2},
            {0, 0, 10, 2, 0}
        };
        dijkstra(graph, 0);
    }
}
`,
    csharp: String.raw`using System;

class Program {
    const int V = 5;

    static int MinDistance(int[] dist, bool[] visited) {
        int min = int.MaxValue, minIndex = -1;
        for (int v = 0; v < V; v++) {
            if (!visited[v] && dist[v] < min) {
                min = dist[v];
                minIndex = v;
            }
        }
        return minIndex;
    }

    static void Dijkstra(int[,] graph, int src) {
        int[] dist = new int[V];
        bool[] visited = new bool[V];
        for (int i = 0; i < V; i++) {
            dist[i] = int.MaxValue;
        }
        dist[src] = 0;
        for (int count = 0; count < V - 1; count++) {
            int u = MinDistance(dist, visited);
            visited[u] = true;
            for (int v = 0; v < V; v++) {
                if (!visited[v] && graph[u, v] != 0 && dist[u] != int.MaxValue &&
                    dist[u] + graph[u, v] < dist[v]) {
                    dist[v] = dist[u] + graph[u, v];
                }
            }
        }
        for (int i = 0; i < V; i++) {
            Console.WriteLine($"Vertex {i}: {dist[i]}");
        }
    }

    static void Main(string[] args) {
        int[,] graph = {
            {0, 4, 1, 0, 0},
            {4, 0, 2, 5, 0},
            {1, 2, 0, 8, 10},
            {0, 5, 8, 0, 2},
            {0, 0, 10, 2, 0}
        };
        Dijkstra(graph, 0);
    }
}
`,
    python: String.raw`V = 5
INF = float("inf")


def min_distance(dist, visited):
    min_value = INF
    min_index = -1
    for v in range(V):
        if not visited[v] and dist[v] < min_value:
            min_value = dist[v]
            min_index = v
    return min_index


def dijkstra(graph, src):
    dist = [INF] * V
    visited = [False] * V
    dist[src] = 0
    for _ in range(V - 1):
        u = min_distance(dist, visited)
        visited[u] = True
        for v in range(V):
            if not visited[v] and graph[u][v] != 0 and dist[u] + graph[u][v] < dist[v]:
                dist[v] = dist[u] + graph[u][v]
    for i in range(V):
        print(f"Vertex {i}: {dist[i]}")


graph = [
    [0, 4, 1, 0, 0],
    [4, 0, 2, 5, 0],
    [1, 2, 0, 8, 10],
    [0, 5, 8, 0, 2],
    [0, 0, 10, 2, 0],
]
dijkstra(graph, 0)
`,
  },
};

import java.util.*;

public class Main {
    private int V;
    private ArrayList<ArrayList<Integer>> adj;

    Main(int v) {
        V = v;
        adj = new ArrayList<>();
        for (int i = 0; i < v; i++) adj.add(new ArrayList<>());
    }

    void addEdge(int u, int v) {
        adj.get(u).add(v);
        adj.get(v).add(u);
    }

    void bfs(int s) {
        boolean[] visited = new boolean[V];
        Queue<Integer> queue = new LinkedList<>();
        visited[s] = true;
        queue.offer(s);
        System.out.print("BFS: ");
        while (!queue.isEmpty()) {
            int u = queue.poll();
            System.out.print(u + " ");
            for (int n : adj.get(u)) {
                if (!visited[n]) {
                    visited[n] = true;
                    queue.offer(n);
                }
            }
        }
        System.out.println();
    }

    void dfsUtil(int v, boolean[] visited) {
        visited[v] = true;
        System.out.print(v + " ");
        for (Integer n : adj.get(v)) if (!visited[n]) dfsUtil(n, visited);
    }

    void dfs(int v) {
        System.out.print("DFS: ");
        dfsUtil(v, new boolean[V]);
        System.out.println();
    }

    public static void main(String[] args) {
        Main g = new Main(6);
        g.addEdge(0, 1);
        g.addEdge(0, 2);
        g.addEdge(1, 3);
        g.addEdge(2, 4);
        g.addEdge(3, 5);
        g.addEdge(4, 5);
        g.bfs(0);
        g.dfs(0);
    }
}

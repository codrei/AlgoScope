import java.util.LinkedList;
import java.util.Queue;

public class Main {
    static final int V = 6;

    // graph[u][v] = 1 means u must come before v
    static int[][] graph = {
        {0, 0, 0, 0, 0, 0},
        {0, 0, 0, 0, 0, 0},
        {0, 0, 0, 1, 0, 0},
        {0, 1, 0, 0, 0, 0},
        {1, 1, 0, 0, 0, 0},
        {1, 0, 1, 0, 0, 0}
    };

    static void topologicalSort() {
        int[] indegree = new int[V];
        for (int u = 0; u < V; u++) {
            for (int v = 0; v < V; v++) {
                if (graph[u][v] == 1) {
                    indegree[v]++;
                }
            }
        }
        // start with the vertices that nothing points to
        Queue<Integer> queue = new LinkedList<>();
        for (int v = 0; v < V; v++) {
            if (indegree[v] == 0) {
                queue.add(v);
            }
        }
        System.out.print("Topological order:");
        while (!queue.isEmpty()) {
            int node = queue.poll();
            System.out.print(" " + node);
            for (int v = 0; v < V; v++) {
                if (graph[node][v] == 1) {
                    indegree[v]--;
                    if (indegree[v] == 0) {
                        queue.add(v);
                    }
                }
            }
        }
        System.out.println();
    }

    public static void main(String[] args) {
        topologicalSort();
    }
}

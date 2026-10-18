public class Main {
    static final int V = 5;

    static int[][] graph = {
        {0, 2, 0, 6, 0},
        {2, 0, 3, 8, 5},
        {0, 3, 0, 0, 7},
        {6, 8, 0, 0, 9},
        {0, 5, 7, 9, 0}
    };

    // the vertex outside the tree with the cheapest edge into it
    static int minKey(int[] key, boolean[] inTree) {
        int min = Integer.MAX_VALUE, minIndex = -1;
        for (int v = 0; v < V; v++) {
            if (!inTree[v] && key[v] < min) {
                min = key[v];
                minIndex = v;
            }
        }
        return minIndex;
    }

    static void prim() {
        int[] parent = new int[V];
        int[] key = new int[V];
        boolean[] inTree = new boolean[V];
        for (int i = 0; i < V; i++) {
            key[i] = Integer.MAX_VALUE;
        }
        key[0] = 0;
        parent[0] = -1;
        for (int count = 0; count < V; count++) {
            int u = minKey(key, inTree);
            inTree[u] = true;
            // a cheaper edge to a vertex outside the tree replaces the old one
            for (int v = 0; v < V; v++) {
                if (graph[u][v] != 0 && !inTree[v] && graph[u][v] < key[v]) {
                    parent[v] = u;
                    key[v] = graph[u][v];
                }
            }
        }
        int total = 0;
        for (int v = 1; v < V; v++) {
            System.out.println("Edge " + parent[v] + " - " + v + " weight " + graph[v][parent[v]]);
            total += graph[v][parent[v]];
        }
        System.out.println("Total weight: " + total);
    }

    public static void main(String[] args) {
        prim();
    }
}

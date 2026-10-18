public class Main {
    static final int V = 4;
    static final int INF = 99999;

    static void floydWarshall(int[][] dist) {
        // allow k as a stop between every pair i -> j
        for (int k = 0; k < V; k++) {
            for (int i = 0; i < V; i++) {
                for (int j = 0; j < V; j++) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }
    }

    public static void main(String[] args) {
        int[][] dist = {
            {0, 3, INF, 7},
            {8, 0, 2, INF},
            {5, INF, 0, 1},
            {2, INF, INF, 0}
        };
        floydWarshall(dist);
        System.out.println("Shortest distances:");
        for (int i = 0; i < V; i++) {
            for (int j = 0; j < V; j++) {
                System.out.print(dist[i][j] + " ");
            }
            System.out.println();
        }
    }
}

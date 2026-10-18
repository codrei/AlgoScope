public class Main {
    static final int N = 4;

    static int[][] dist = {
        {0, 10, 15, 20},
        {10, 0, 35, 25},
        {15, 35, 0, 30},
        {20, 25, 30, 0}
    };
    static boolean[] visited = new boolean[N];
    static int best = 9999;
    static int routes = 0;

    // try every order of the remaining cities: (N-1)! routes in total
    static void tour(int city, int count, int cost) {
        if (count == N) {
            routes++;
            int total = cost + dist[city][0];   // return to the start
            if (total < best) {
                best = total;
            }
            return;
        }
        for (int next = 0; next < N; next++) {
            if (!visited[next]) {
                visited[next] = true;
                tour(next, count + 1, cost + dist[city][next]);
                visited[next] = false;
            }
        }
    }

    public static void main(String[] args) {
        visited[0] = true;
        tour(0, 1, 0);
        System.out.println("Routes checked: " + routes);
        System.out.println("Shortest tour: " + best);
    }
}

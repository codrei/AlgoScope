public class Main {
    // each method counts how many times its loop body runs

    static int constant(int n) {
        int steps = 0;
        steps++;
        return steps;
    }

    static int logarithmic(int n) {
        int steps = 0;
        for (int i = 1; i < n; i = i * 2) {
            steps++;
        }
        return steps;
    }

    static int linear(int n) {
        int steps = 0;
        for (int i = 0; i < n; i++) {
            steps++;
        }
        return steps;
    }

    static int quadratic(int n) {
        int steps = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                steps++;
            }
        }
        return steps;
    }

    public static void main(String[] args) {
        for (int n = 4; n <= 16; n = n * 2) {
            System.out.println("n = " + n + ": O(1) = " + constant(n) + ", O(log n) = " + logarithmic(n)
                + ", O(n) = " + linear(n) + ", O(n^2) = " + quadratic(n));
        }
    }
}

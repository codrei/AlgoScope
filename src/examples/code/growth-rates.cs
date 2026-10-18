using System;

class Program {
    // each method counts how many times its loop body runs

    static int Constant(int n) {
        int steps = 0;
        steps++;
        return steps;
    }

    static int Logarithmic(int n) {
        int steps = 0;
        for (int i = 1; i < n; i = i * 2) {
            steps++;
        }
        return steps;
    }

    static int Linear(int n) {
        int steps = 0;
        for (int i = 0; i < n; i++) {
            steps++;
        }
        return steps;
    }

    static int Quadratic(int n) {
        int steps = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                steps++;
            }
        }
        return steps;
    }

    static void Main(string[] args) {
        for (int n = 4; n <= 16; n = n * 2) {
            Console.WriteLine("n = " + n + ": O(1) = " + Constant(n) + ", O(log n) = " + Logarithmic(n)
                + ", O(n) = " + Linear(n) + ", O(n^2) = " + Quadratic(n));
        }
    }
}

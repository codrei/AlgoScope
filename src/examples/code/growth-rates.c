#include <stdio.h>

// each function counts how many times its loop body runs

int constant(int n) {
    int steps = 0;
    steps++;
    return steps;
}

int logarithmic(int n) {
    int steps = 0;
    for (int i = 1; i < n; i = i * 2) {
        steps++;
    }
    return steps;
}

int linear(int n) {
    int steps = 0;
    for (int i = 0; i < n; i++) {
        steps++;
    }
    return steps;
}

int quadratic(int n) {
    int steps = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            steps++;
        }
    }
    return steps;
}

int main() {
    for (int n = 4; n <= 16; n = n * 2) {
        printf("n = %d: O(1) = %d, O(log n) = %d, O(n) = %d, O(n^2) = %d\n",
               n, constant(n), logarithmic(n), linear(n), quadratic(n));
    }
    return 0;
}

#include <iostream>
using namespace std;

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
        cout << "n = " << n << ": O(1) = " << constant(n) << ", O(log n) = " << logarithmic(n)
             << ", O(n) = " << linear(n) << ", O(n^2) = " << quadratic(n) << endl;
    }
    return 0;
}

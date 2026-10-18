#include <iostream>
#include <cstdio>
using namespace std;

// items are already sorted by value per kg, best first
double knapsack(int value[], int weight[], int n, int capacity) {
    double total = 0;
    for (int i = 0; i < n; i++) {
        if (weight[i] <= capacity) {
            // the whole item fits
            capacity -= weight[i];
            total += value[i];
        } else {
            // take only the fraction that fits, then the bag is full
            total += (double) value[i] * capacity / weight[i];
            break;
        }
    }
    return total;
}

int main() {
    int value[] = {60, 100, 120};
    int weight[] = {10, 20, 30};
    printf("Maximum value: %.2f\n", knapsack(value, weight, 3, 50));
    return 0;
}

#include <stdio.h>

void coinChange(int coins[], int n, int amount) {
    int count = 0;
    printf("Coins:");
    // greedy choice: always take the biggest coin that still fits
    for (int i = 0; i < n; i++) {
        while (amount >= coins[i]) {
            amount -= coins[i];
            printf(" %d", coins[i]);
            count++;
        }
    }
    printf("\nTotal coins: %d\n", count);
}

int main() {
    int coins[] = {25, 10, 5, 1};
    int n = sizeof(coins) / sizeof(coins[0]);
    coinChange(coins, n, 63);
    return 0;
}

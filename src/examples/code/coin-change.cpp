#include <iostream>
using namespace std;

void coinChange(int coins[], int n, int amount) {
    int count = 0;
    cout << "Coins:";
    // greedy choice: always take the biggest coin that still fits
    for (int i = 0; i < n; i++) {
        while (amount >= coins[i]) {
            amount -= coins[i];
            cout << " " << coins[i];
            count++;
        }
    }
    cout << endl << "Total coins: " << count << endl;
}

int main() {
    int coins[] = {25, 10, 5, 1};
    int n = sizeof(coins) / sizeof(coins[0]);
    coinChange(coins, n, 63);
    return 0;
}

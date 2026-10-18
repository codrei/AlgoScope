#include <iostream>
#include <vector>
using namespace std;

int minCoins(int coins[], int n, int amount) {
    // dp[a] = fewest coins that make the amount a
    vector<int> dp(amount + 1, 999);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int i = 0; i < n; i++) {
            // use coin i last: 1 coin plus the best way to make the rest
            if (coins[i] <= a && dp[a - coins[i]] + 1 < dp[a]) {
                dp[a] = dp[a - coins[i]] + 1;
            }
        }
    }
    return dp[amount];
}

int main() {
    int coins[] = {1, 3, 4};
    cout << "Fewest coins for 6: " << minCoins(coins, 3, 6) << endl;
    return 0;
}

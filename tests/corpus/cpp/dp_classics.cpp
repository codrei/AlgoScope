#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int coinChange(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int i = 1; i <= amount; i++)
        for (int c : coins)
            if (c <= i) dp[i] = min(dp[i], dp[i - c] + 1);
    return dp[amount] > amount ? -1 : dp[amount];
}

int editDistance(string a, string b) {
    int m = a.size(), n = b.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1));
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            if (a[i - 1] == b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]});
    return dp[m][n];
}

int lis(const vector<int>& v) {
    vector<int> dp(v.size(), 1);
    int best = 1;
    for (size_t i = 1; i < v.size(); i++) {
        for (size_t j = 0; j < i; j++)
            if (v[j] < v[i]) dp[i] = max(dp[i], dp[j] + 1);
        best = max(best, dp[i]);
    }
    return best;
}

long long memo[50];
long long fib(int n) {
    if (n <= 1) return n;
    if (memo[n] != 0) return memo[n];
    return memo[n] = fib(n - 1) + fib(n - 2);
}

int main() {
    vector<int> coins = {1, 5, 6, 9};
    cout << "Coins for 11: " << coinChange(coins, 11) << endl;
    cout << "Edit distance kitten -> sitting: " << editDistance("kitten", "sitting") << endl;
    cout << "LIS: " << lis({10, 9, 2, 5, 3, 7, 101, 18}) << endl;
    cout << "fib(40) = " << fib(40) << endl;
    return 0;
}

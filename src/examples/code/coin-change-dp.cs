using System;

class Program {
    static int MinCoins(int[] coins, int amount) {
        // dp[a] = fewest coins that make the amount a
        int[] dp = new int[amount + 1];
        for (int a = 1; a <= amount; a++) {
            dp[a] = 999;
        }
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int i = 0; i < coins.Length; i++) {
                // use coin i last: 1 coin plus the best way to make the rest
                if (coins[i] <= a && dp[a - coins[i]] + 1 < dp[a]) {
                    dp[a] = dp[a - coins[i]] + 1;
                }
            }
        }
        return dp[amount];
    }

    static void Main(string[] args) {
        int[] coins = { 1, 3, 4 };
        Console.WriteLine("Fewest coins for 6: " + MinCoins(coins, 6));
    }
}

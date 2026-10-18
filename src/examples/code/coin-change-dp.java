import java.util.Arrays;

public class Main {
    static int minCoins(int[] coins, int amount) {
        // dp[a] = fewest coins that make the amount a
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, 999);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int i = 0; i < coins.length; i++) {
                // use coin i last: 1 coin plus the best way to make the rest
                if (coins[i] <= a && dp[a - coins[i]] + 1 < dp[a]) {
                    dp[a] = dp[a - coins[i]] + 1;
                }
            }
        }
        return dp[amount];
    }

    public static void main(String[] args) {
        int[] coins = {1, 3, 4};
        System.out.println("Fewest coins for 6: " + minCoins(coins, 6));
    }
}

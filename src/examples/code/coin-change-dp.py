def min_coins(coins, amount):
    # dp[a] = fewest coins that make the amount a
    dp = [999] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for i in range(len(coins)):
            # use coin i last: 1 coin plus the best way to make the rest
            if coins[i] <= a and dp[a - coins[i]] + 1 < dp[a]:
                dp[a] = dp[a - coins[i]] + 1
    return dp[amount]


coins = [1, 3, 4]
print("Fewest coins for 6:", min_coins(coins, 6))

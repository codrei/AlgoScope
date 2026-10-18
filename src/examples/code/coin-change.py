def coin_change(coins, amount):
    used = []
    # greedy choice: always take the biggest coin that still fits
    for i in range(len(coins)):
        while amount >= coins[i]:
            amount -= coins[i]
            used.append(coins[i])
    print("Coins:", *used)
    print("Total coins:", len(used))


coins = [25, 10, 5, 1]
coin_change(coins, 63)

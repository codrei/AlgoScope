using System;

class Program {
    static void CoinChange(int[] coins, int amount) {
        int count = 0;
        Console.Write("Coins:");
        // greedy choice: always take the biggest coin that still fits
        for (int i = 0; i < coins.Length; i++) {
            while (amount >= coins[i]) {
                amount -= coins[i];
                Console.Write(" " + coins[i]);
                count++;
            }
        }
        Console.WriteLine();
        Console.WriteLine("Total coins: " + count);
    }

    static void Main(string[] args) {
        int[] coins = { 25, 10, 5, 1 };
        CoinChange(coins, 63);
    }
}

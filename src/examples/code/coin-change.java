public class Main {
    static void coinChange(int[] coins, int amount) {
        int count = 0;
        System.out.print("Coins:");
        // greedy choice: always take the biggest coin that still fits
        for (int i = 0; i < coins.length; i++) {
            while (amount >= coins[i]) {
                amount -= coins[i];
                System.out.print(" " + coins[i]);
                count++;
            }
        }
        System.out.println();
        System.out.println("Total coins: " + count);
    }

    public static void main(String[] args) {
        int[] coins = {25, 10, 5, 1};
        coinChange(coins, 63);
    }
}

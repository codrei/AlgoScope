using System;

class Program {
    // items are already sorted by value per kg, best first
    static double Knapsack(int[] value, int[] weight, int capacity) {
        double total = 0;
        for (int i = 0; i < value.Length; i++) {
            if (weight[i] <= capacity) {
                // the whole item fits
                capacity -= weight[i];
                total += value[i];
            } else {
                // take only the fraction that fits, then the bag is full
                total += (double) value[i] * capacity / weight[i];
                break;
            }
        }
        return total;
    }

    static void Main(string[] args) {
        int[] value = { 60, 100, 120 };
        int[] weight = { 10, 20, 30 };
        Console.WriteLine("Maximum value: " + Knapsack(value, weight, 50).ToString("F2"));
    }
}

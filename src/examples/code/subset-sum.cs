using System;

class Program {
    static void Main(string[] args) {
        int[] set = { 3, 34, 4, 12, 5, 2 };
        int n = set.Length;
        int target = 9;
        int checkedCount = 0;
        // every number is either in or out: 2^n subsets, one per bit pattern
        for (int mask = 0; mask < (1 << n); mask++) {
            int sum = 0;
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) != 0) {
                    sum += set[i];
                }
            }
            checkedCount++;
            if (sum == target) {
                Console.Write("Found:");
                for (int i = 0; i < n; i++) {
                    if ((mask & (1 << i)) != 0) {
                        Console.Write(" " + set[i]);
                    }
                }
                Console.WriteLine();
            }
        }
        Console.WriteLine("Subsets checked: " + checkedCount);
    }
}

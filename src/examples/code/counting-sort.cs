using System;

class Program {
    static void CountingSort(int[] arr) {
        int n = arr.Length;
        int max = arr[0];
        for (int i = 1; i < n; i++) {
            if (arr[i] > max) {
                max = arr[i];
            }
        }
        // count[v] = how many times v appears
        int[] count = new int[max + 1];
        for (int i = 0; i < n; i++) {
            count[arr[i]]++;
        }
        // write each value back as many times as it was counted
        int k = 0;
        for (int v = 0; v <= max; v++) {
            while (count[v] > 0) {
                arr[k] = v;
                k++;
                count[v]--;
            }
        }
    }

    static void Main(string[] args) {
        int[] arr = { 5, 1, 4, 2, 8, 3 };
        CountingSort(arr);
        Console.Write("Sorted:");
        foreach (int x in arr) {
            Console.Write(" " + x);
        }
        Console.WriteLine();
    }
}

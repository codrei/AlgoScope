using System;

class Program {
    static void Print(int[] arr, int n) {
        for (int i = 0; i < n; i++) {
            Console.Write(arr[i] + " ");
        }
        Console.WriteLine();
    }

    // shift everything from pos one place right, then write the value
    static int InsertAt(int[] arr, int n, int pos, int value) {
        for (int i = n; i > pos; i--) {
            arr[i] = arr[i - 1];
        }
        arr[pos] = value;
        return n + 1;
    }

    // shift everything after pos one place left over the removed value
    static int DeleteAt(int[] arr, int n, int pos) {
        for (int i = pos; i < n - 1; i++) {
            arr[i] = arr[i + 1];
        }
        return n - 1;
    }

    static void Main(string[] args) {
        int[] arr = { 10, 20, 30, 40, 50, 0, 0, 0 };
        int n = 5;
        Print(arr, n);
        n = InsertAt(arr, n, 1, 15);
        Print(arr, n);
        n = DeleteAt(arr, n, 3);
        Print(arr, n);
    }
}

using System;

class Program {
    // the activities are already sorted by finish time
    static void SelectActivities(int[] start, int[] finish) {
        int last = 0;
        Console.Write("Selected activities: 0");
        for (int i = 1; i < start.Length; i++) {
            // greedy choice: take it if it starts after the last one ends
            if (start[i] >= finish[last]) {
                Console.Write(" " + i);
                last = i;
            }
        }
        Console.WriteLine();
    }

    static void Main(string[] args) {
        int[] start = { 1, 3, 0, 5, 8, 5 };
        int[] finish = { 2, 4, 6, 7, 9, 9 };
        SelectActivities(start, finish);
    }
}

using System;

class Program {
    static int[] heap = new int[10];
    static int heapSize = 0;

    // a new value climbs up while it is smaller than its parent
    static void Insert(int value) {
        int i = heapSize;
        heap[i] = value;
        heapSize++;
        while (i > 0 && heap[(i - 1) / 2] > heap[i]) {
            int parent = (i - 1) / 2;
            int temp = heap[i];
            heap[i] = heap[parent];
            heap[parent] = temp;
            i = parent;
        }
    }

    // the last value moves to the root and sinks below its smaller child
    static int ExtractMin() {
        int min = heap[0];
        heapSize--;
        heap[0] = heap[heapSize];
        int i = 0;
        while (true) {
            int left = 2 * i + 1;
            int right = 2 * i + 2;
            int smallest = i;
            if (left < heapSize && heap[left] < heap[smallest]) smallest = left;
            if (right < heapSize && heap[right] < heap[smallest]) smallest = right;
            if (smallest == i) break;
            int temp = heap[i];
            heap[i] = heap[smallest];
            heap[smallest] = temp;
            i = smallest;
        }
        return min;
    }

    static void Main(string[] args) {
        int[] values = { 5, 3, 8, 1, 9, 2 };
        foreach (int v in values) {
            Insert(v);
        }
        Console.Write("Extracted:");
        for (int i = 0; i < 3; i++) {
            Console.Write(" " + ExtractMin());
        }
        Console.WriteLine();
    }
}

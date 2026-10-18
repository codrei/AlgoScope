using System;

class Program {
    const int SIZE = 7;
    static int[] table = new int[SIZE];

    static int HashKey(int key) {
        return key % SIZE;
    }

    static void Insert(int key) {
        int index = HashKey(key);
        // collision: the slot is taken, so try the next one (linear probing)
        while (table[index] != -1) {
            index = (index + 1) % SIZE;
        }
        table[index] = key;
    }

    static int Search(int key) {
        int index = HashKey(key);
        int tries = 0;
        while (table[index] != -1 && tries < SIZE) {
            if (table[index] == key) {
                return index;
            }
            index = (index + 1) % SIZE;
            tries++;
        }
        return -1;
    }

    static void Main(string[] args) {
        for (int i = 0; i < SIZE; i++) {
            table[i] = -1;
        }
        int[] keys = { 50, 700, 76, 85, 92 };
        foreach (int key in keys) {
            Insert(key);
        }
        Console.Write("Table:");
        foreach (int x in table) {
            Console.Write(" " + x);
        }
        Console.WriteLine();
        Console.WriteLine("85 is at index " + Search(85));
        Console.WriteLine("40 is at index " + Search(40));
    }
}

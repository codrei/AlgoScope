public class Main {
    static final int SIZE = 7;
    static int[] table = new int[SIZE];

    static int hashKey(int key) {
        return key % SIZE;
    }

    static void insert(int key) {
        int index = hashKey(key);
        // collision: the slot is taken, so try the next one (linear probing)
        while (table[index] != -1) {
            index = (index + 1) % SIZE;
        }
        table[index] = key;
    }

    static int search(int key) {
        int index = hashKey(key);
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

    public static void main(String[] args) {
        for (int i = 0; i < SIZE; i++) {
            table[i] = -1;
        }
        int[] keys = {50, 700, 76, 85, 92};
        for (int key : keys) {
            insert(key);
        }
        System.out.print("Table:");
        for (int x : table) {
            System.out.print(" " + x);
        }
        System.out.println();
        System.out.println("85 is at index " + search(85));
        System.out.println("40 is at index " + search(40));
    }
}

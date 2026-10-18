public class Main {
    static void print(int[] arr, int n) {
        for (int i = 0; i < n; i++) {
            System.out.print(arr[i] + " ");
        }
        System.out.println();
    }

    // shift everything from pos one place right, then write the value
    static int insertAt(int[] arr, int n, int pos, int value) {
        for (int i = n; i > pos; i--) {
            arr[i] = arr[i - 1];
        }
        arr[pos] = value;
        return n + 1;
    }

    // shift everything after pos one place left over the removed value
    static int deleteAt(int[] arr, int n, int pos) {
        for (int i = pos; i < n - 1; i++) {
            arr[i] = arr[i + 1];
        }
        return n - 1;
    }

    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40, 50, 0, 0, 0};
        int n = 5;
        print(arr, n);
        n = insertAt(arr, n, 1, 15);
        print(arr, n);
        n = deleteAt(arr, n, 3);
        print(arr, n);
    }
}

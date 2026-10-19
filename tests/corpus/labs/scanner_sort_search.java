import java.util.Scanner;

public class Main {
    static void selectionSort(int[] a) {
        for (int i = 0; i < a.length - 1; i++) {
            int min = i;
            for (int j = i + 1; j < a.length; j++) if (a[j] < a[min]) min = j;
            int t = a[i]; a[i] = a[min]; a[min] = t;
        }
    }

    static int binarySearch(int[] a, int key) {
        int lo = 0, hi = a.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (a[mid] == key) return mid;
            if (a[mid] < key) lo = mid + 1; else hi = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("How many? ");
        int n = sc.nextInt();
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = sc.nextInt();
        selectionSort(a);
        for (int x : a) System.out.print(x + " ");
        System.out.println();
        System.out.print("Search: ");
        int key = sc.nextInt();
        int idx = binarySearch(a, key);
        System.out.println(idx >= 0 ? "Found at index " + idx : "Not found");
    }
}

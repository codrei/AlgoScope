public class Main {
    public static void main(String[] args) {
        int[] set = {3, 34, 4, 12, 5, 2};
        int n = set.length;
        int target = 9;
        int checked = 0;
        // every number is either in or out: 2^n subsets, one per bit pattern
        for (int mask = 0; mask < (1 << n); mask++) {
            int sum = 0;
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) != 0) {
                    sum += set[i];
                }
            }
            checked++;
            if (sum == target) {
                System.out.print("Found:");
                for (int i = 0; i < n; i++) {
                    if ((mask & (1 << i)) != 0) {
                        System.out.print(" " + set[i]);
                    }
                }
                System.out.println();
            }
        }
        System.out.println("Subsets checked: " + checked);
    }
}

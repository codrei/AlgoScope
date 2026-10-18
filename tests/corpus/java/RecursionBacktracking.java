import java.util.ArrayList;
import java.util.List;

public class Main {
    static List<String> results = new ArrayList<>();

    static void permute(char[] arr, int k) {
        if (k == arr.length) {
            results.add(new String(arr));
            return;
        }
        for (int i = k; i < arr.length; i++) {
            char t = arr[k]; arr[k] = arr[i]; arr[i] = t;
            permute(arr, k + 1);
            t = arr[k]; arr[k] = arr[i]; arr[i] = t;
        }
    }

    static void subsets(int[] nums, int idx, List<Integer> cur) {
        if (idx == nums.length) {
            System.out.print(cur + " ");
            return;
        }
        cur.add(nums[idx]);
        subsets(nums, idx + 1, cur);
        cur.remove(cur.size() - 1);
        subsets(nums, idx + 1, cur);
    }

    static int countWays(int n) {
        if (n <= 1) return 1;
        return countWays(n - 1) + countWays(n - 2);
    }

    static boolean solveSudokuLike(int[] slots, int pos, int target) {
        if (target == 0) return true;
        if (pos == slots.length || target < 0) return false;
        return solveSudokuLike(slots, pos + 1, target - slots[pos]) || solveSudokuLike(slots, pos + 1, target);
    }

    public static void main(String[] args) {
        permute("ABC".toCharArray(), 0);
        System.out.println(results);
        subsets(new int[]{1, 2, 3}, 0, new ArrayList<>());
        System.out.println();
        System.out.println("Ways to climb 6 stairs: " + countWays(6));
        System.out.println("Subset sum 9 possible: " + solveSudokuLike(new int[]{3, 34, 4, 12, 5, 2}, 0, 9));
    }
}

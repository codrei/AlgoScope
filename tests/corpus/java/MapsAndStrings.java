import java.util.*;

public class Main {
    public static void main(String[] args) {
        String text = "the quick brown fox jumps over the lazy dog the end";
        Map<String, Integer> freq = new TreeMap<>();
        for (String w : text.split(" ")) freq.put(w, freq.getOrDefault(w, 0) + 1);
        for (Map.Entry<String, Integer> e : freq.entrySet()) {
            if (e.getValue() > 1) System.out.println(e.getKey() + " -> " + e.getValue());
        }
        System.out.println("Distinct words: " + freq.size());

        HashMap<Character, Integer> counts = new HashMap<>();
        for (char c : "mississippi".toCharArray()) counts.put(c, counts.getOrDefault(c, 0) + 1);
        System.out.println("s appears " + counts.get('s') + " times");

        Set<Integer> seen = new HashSet<>();
        int[] arr = {3, 1, 4, 1, 5, 9, 2, 6, 5};
        List<Integer> dups = new ArrayList<>();
        for (int x : arr) if (!seen.add(x)) dups.add(x);
        System.out.println("Duplicates: " + dups);

        System.out.println(String.format("%-8s|%5d|%8.3f", "row", 42, Math.PI));
        String s = "Data Structures";
        System.out.println(s.toLowerCase().replace(" ", "_") + " " + s.indexOf('S') + " " + s.substring(5));
        int[][] grid = new int[3][4];
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 4; j++) grid[i][j] = i * j;
        for (int[] row : grid) {
            for (int v : row) System.out.printf("%3d", v);
            System.out.println();
        }
    }
}

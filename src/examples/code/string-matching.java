public class Main {
    static void search(String text, String pattern) {
        int n = text.length();
        int m = pattern.length();
        // slide the pattern over the text one position at a time
        for (int i = 0; i <= n - m; i++) {
            int j = 0;
            while (j < m && text.charAt(i + j) == pattern.charAt(j)) {
                j++;
            }
            if (j == m) {
                System.out.println("Found at index " + i);
            }
        }
    }

    public static void main(String[] args) {
        String text = "AABAACAADAABAABA";
        String pattern = "AABA";
        search(text, pattern);
    }
}

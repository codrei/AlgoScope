public class Main {
    static void permute(char[] s, int start) {
        if (start == s.length - 1) {
            System.out.println(new String(s));
            return;
        }
        for (int i = start; i < s.length; i++) {
            // choose s[i] for this position, arrange the rest, then undo
            char temp = s[start]; s[start] = s[i]; s[i] = temp;
            permute(s, start + 1);
            temp = s[start]; s[start] = s[i]; s[i] = temp;
        }
    }

    public static void main(String[] args) {
        char[] s = {'A', 'B', 'C'};
        permute(s, 0);
    }
}

public class Main {
    static int sumDigits(int n) {
        if (n < 10) return n;
        return n % 10 + sumDigits(n / 10);
    }

    static boolean isPal(String s) {
        if (s.length() <= 1) return true;
        if (s.charAt(0) != s.charAt(s.length() - 1)) return false;
        return isPal(s.substring(1, s.length() - 1));
    }

    static String reverse(String s) {
        if (s.isEmpty()) return "";
        return reverse(s.substring(1)) + s.charAt(0);
    }

    public static void main(String[] args) {
        System.out.println(sumDigits(98765));
        System.out.println(isPal("level") + " " + isPal("levels"));
        System.out.println(reverse("stack"));
        int[][] m = {{1, 2, 3}, {4, 5, 6}};
        for (int[] row : m) {
            StringBuilder sb = new StringBuilder();
            for (int v : row) sb.append(String.format("%3d", v));
            System.out.println(sb);
        }
        String code = "A1b2C3";
        int digits = 0;
        for (char ch : code.toCharArray()) if (Character.isDigit(ch)) digits += Character.getNumericValue(ch);
        System.out.println(digits + " " + Integer.parseInt("123") * 2 + " " + code.toLowerCase());
    }
}

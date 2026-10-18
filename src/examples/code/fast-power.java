public class Main {
    // divide and conquer: x^n = (x^(n/2))^2, times x once more if n is odd
    static long power(long x, int n) {
        if (n == 0) {
            return 1;
        }
        long half = power(x, n / 2);
        if (n % 2 == 0) {
            return half * half;
        }
        return half * half * x;
    }

    public static void main(String[] args) {
        System.out.println("2^10 = " + power(2, 10));
        System.out.println("3^5 = " + power(3, 5));
    }
}

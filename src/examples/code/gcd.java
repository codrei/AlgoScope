public class Main {
    static int gcd(int a, int b) {
        // Euclid: gcd(a, b) = gcd(b, a % b), until the remainder is 0
        while (b != 0) {
            int r = a % b;
            System.out.println(a + " = " + (a / b) + " x " + b + " + " + r);
            a = b;
            b = r;
        }
        return a;
    }

    public static void main(String[] args) {
        int result = gcd(252, 105);
        System.out.println("GCD = " + result);
    }
}

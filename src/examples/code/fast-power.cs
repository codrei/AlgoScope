using System;

class Program {
    // divide and conquer: x^n = (x^(n/2))^2, times x once more if n is odd
    static long Power(long x, int n) {
        if (n == 0) {
            return 1;
        }
        long half = Power(x, n / 2);
        if (n % 2 == 0) {
            return half * half;
        }
        return half * half * x;
    }

    static void Main(string[] args) {
        Console.WriteLine("2^10 = " + Power(2, 10));
        Console.WriteLine("3^5 = " + Power(3, 5));
    }
}

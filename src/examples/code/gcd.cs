using System;

class Program {
    static int Gcd(int a, int b) {
        // Euclid: gcd(a, b) = gcd(b, a % b), until the remainder is 0
        while (b != 0) {
            int r = a % b;
            Console.WriteLine(a + " = " + (a / b) + " x " + b + " + " + r);
            a = b;
            b = r;
        }
        return a;
    }

    static void Main(string[] args) {
        int result = Gcd(252, 105);
        Console.WriteLine("GCD = " + result);
    }
}

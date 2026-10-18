#include <stdio.h>

int gcd(int a, int b) {
    // Euclid: gcd(a, b) = gcd(b, a % b), until the remainder is 0
    while (b != 0) {
        int r = a % b;
        printf("%d = %d x %d + %d\n", a, a / b, b, r);
        a = b;
        b = r;
    }
    return a;
}

int main() {
    int result = gcd(252, 105);
    printf("GCD = %d\n", result);
    return 0;
}

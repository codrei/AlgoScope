#include <stdio.h>

// divide and conquer: x^n = (x^(n/2))^2, times x once more if n is odd
long power(long x, int n) {
    if (n == 0) {
        return 1;
    }
    long half = power(x, n / 2);
    if (n % 2 == 0) {
        return half * half;
    }
    return half * half * x;
}

int main() {
    printf("2^10 = %ld\n", power(2, 10));
    printf("3^5 = %ld\n", power(3, 5));
    return 0;
}

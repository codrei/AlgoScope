#include <iostream>
using namespace std;

// divide and conquer: x^n = (x^(n/2))^2, times x once more if n is odd
long long power(long long x, int n) {
    if (n == 0) {
        return 1;
    }
    long long half = power(x, n / 2);
    if (n % 2 == 0) {
        return half * half;
    }
    return half * half * x;
}

int main() {
    cout << "2^10 = " << power(2, 10) << endl;
    cout << "3^5 = " << power(3, 5) << endl;
    return 0;
}

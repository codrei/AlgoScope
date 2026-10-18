#include <iostream>
using namespace std;

int gcd(int a, int b) {
    // Euclid: gcd(a, b) = gcd(b, a % b), until the remainder is 0
    while (b != 0) {
        int r = a % b;
        cout << a << " = " << a / b << " x " << b << " + " << r << endl;
        a = b;
        b = r;
    }
    return a;
}

int main() {
    int result = gcd(252, 105);
    cout << "GCD = " << result << endl;
    return 0;
}

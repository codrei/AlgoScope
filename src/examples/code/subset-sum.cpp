#include <iostream>
using namespace std;

int main() {
    int set[] = {3, 34, 4, 12, 5, 2};
    int n = 6;
    int target = 9;
    int checked = 0;
    // every number is either in or out: 2^n subsets, one per bit pattern
    for (int mask = 0; mask < (1 << n); mask++) {
        int sum = 0;
        for (int i = 0; i < n; i++) {
            if (mask & (1 << i)) {
                sum += set[i];
            }
        }
        checked++;
        if (sum == target) {
            cout << "Found:";
            for (int i = 0; i < n; i++) {
                if (mask & (1 << i)) {
                    cout << " " << set[i];
                }
            }
            cout << endl;
        }
    }
    cout << "Subsets checked: " << checked << endl;
    return 0;
}

#include <iostream>
#include <vector>
using namespace std;

void countingSort(int arr[], int n) {
    int max = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    // count[v] = how many times v appears
    vector<int> count(max + 1, 0);
    for (int i = 0; i < n; i++) {
        count[arr[i]]++;
    }
    // write each value back as many times as it was counted
    int k = 0;
    for (int v = 0; v <= max; v++) {
        while (count[v] > 0) {
            arr[k] = v;
            k++;
            count[v]--;
        }
    }
}

int main() {
    int arr[] = {5, 1, 4, 2, 8, 3};
    int n = sizeof(arr) / sizeof(arr[0]);
    countingSort(arr, n);
    cout << "Sorted:";
    for (int i = 0; i < n; i++) {
        cout << " " << arr[i];
    }
    cout << endl;
    return 0;
}

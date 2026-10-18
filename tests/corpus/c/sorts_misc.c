#include <stdio.h>

void countingSort(int arr[], int n, int maxVal) {
    int count[maxVal + 1];
    int output[n];
    for (int i = 0; i <= maxVal; i++) count[i] = 0;
    for (int i = 0; i < n; i++) count[arr[i]]++;
    for (int i = 1; i <= maxVal; i++) count[i] += count[i - 1];
    for (int i = n - 1; i >= 0; i--) {
        output[count[arr[i]] - 1] = arr[i];
        count[arr[i]]--;
    }
    for (int i = 0; i < n; i++) arr[i] = output[i];
}

void shellSort(int arr[], int n) {
    for (int gap = n / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < n; i++) {
            int temp = arr[i];
            int j;
            for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) arr[j] = arr[j - gap];
            arr[j] = temp;
        }
    }
}

void print(const char *label, int arr[], int n) {
    printf("%s:", label);
    for (int i = 0; i < n; i++) printf(" %d", arr[i]);
    printf("\n");
}

int main() {
    int a[] = {4, 2, 2, 8, 3, 3, 1};
    countingSort(a, 7, 8);
    print("Counting sort", a, 7);
    int b[] = {12, 34, 54, 2, 3, 9, 17};
    shellSort(b, 7);
    print("Shell sort", b, 7);
    return 0;
}

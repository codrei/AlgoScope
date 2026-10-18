#include <stdio.h>

int search(int arr[], int n, int x)
{
    int i;
    for (i = 0; i < n; i++) {
        if (arr[i] == x)
        {
            return i;
        }
    }
    // x is not found
    return -1;
}

int bin_search(int arr[], int x, int start, int end) {
    int mid = (start + end) / 2;
    if (arr[mid] == x)
    { return mid; }
    if (start == end)
    { return -1; }
    if (arr[mid] > x)
    { return bin_search(arr, x, start, mid - 1); }
    if (arr[mid] < x)
    { return bin_search(arr, x, mid + 1, end); }
    return -1;
}

int main() {
    int arr[] = {2, 3, 4, 10, 40, 51, 63};
    printf("linear: %d\n", search(arr, 7, 10));
    printf("binary: %d\n", bin_search(arr, 51, 0, 6));
    printf("binary: %d\n", bin_search(arr, 2, 0, 6));
    return 0;
}

#include <stdio.h>

void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }

void heapify(int A[], int n, int i) {
    int left = 2 * i + 1;
    int right = 2 * i + 2;
    int max;
    if (left < n && A[left] > A[i]) max = left;
    else max = i;
    if (right < n && A[right] > A[max]) max = right;
    if (max != i) {
        swap(&A[i], &A[max]);
        heapify(A, n, max);
    }
}

void buildMaxHeap(int A[], int n) {
    for (int i = n / 2 - 1; i >= 0; i--) heapify(A, n, i);
}

void heapSort(int A[], int n) {
    buildMaxHeap(A, n);
    for (int i = n - 1; i >= 1; i--) {
        swap(&A[0], &A[i]);
        heapify(A, i, 0);
    }
}

int main() {
    int arr[] = {4, 10, 3, 5, 1};
    int n = sizeof(arr) / sizeof(arr[0]);
    heapSort(arr, n);
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\n");
    return 0;
}

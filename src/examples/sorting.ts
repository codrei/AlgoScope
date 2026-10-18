import type { Example } from './types';

export const bubbleSort: Example = {
  id: 'bubble-sort',
  title: 'Bubble Sort',
  topic: 'Sorting',
  description: 'Repeatedly swaps adjacent out-of-order pairs, letting larger values bubble toward the end.',
  time: 'O(n²)',
  space: 'O(1)',
  output: 'Sorted: 1 2 3 4 5 8\n',
  code: {
    c: String.raw`#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {5, 1, 4, 2, 8, 3};
    int n = sizeof(arr) / sizeof(arr[0]);
    bubbleSort(arr, n);
    printf("Sorted:");
    for (int i = 0; i < n; i++) {
        printf(" %d", arr[i]);
    }
    printf("\n");
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
using namespace std;

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {5, 1, 4, 2, 8, 3};
    int n = 6;
    bubbleSort(arr, n);
    cout << "Sorted:";
    for (int i = 0; i < n; i++) {
        cout << " " << arr[i];
    }
    cout << endl;
    return 0;
}
`,
    java: String.raw`public class Main {
    static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }

    public static void main(String[] args) {
        int[] arr = {5, 1, 4, 2, 8, 3};
        bubbleSort(arr);
        System.out.print("Sorted:");
        for (int x : arr) {
            System.out.print(" " + x);
        }
        System.out.println();
    }
}
`,
    csharp: String.raw`using System;

class Program {
    static void BubbleSort(int[] arr) {
        int n = arr.Length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }

    static void Main(string[] args) {
        int[] arr = { 5, 1, 4, 2, 8, 3 };
        BubbleSort(arr);
        Console.Write("Sorted:");
        foreach (int x in arr) {
            Console.Write(" " + x);
        }
        Console.WriteLine();
    }
}
`,
    python: String.raw`def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]


arr = [5, 1, 4, 2, 8, 3]
bubble_sort(arr)
print("Sorted:", *arr)
`,
  },
};

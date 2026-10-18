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
    int n = sizeof(arr) / sizeof(arr[0]);
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

const SORT_OUT = 'Sorted: 1 2 3 4 5 8\n';

const mainC = (call: string) => String.raw`int main() {
    int arr[] = {5, 1, 4, 2, 8, 3};
    int n = sizeof(arr) / sizeof(arr[0]);
    ${call};
    printf("Sorted:");
    for (int i = 0; i < n; i++) {
        printf(" %d", arr[i]);
    }
    printf("\n");
    return 0;
}
`;

const mainCpp = (call: string) => String.raw`int main() {
    int arr[] = {5, 1, 4, 2, 8, 3};
    int n = sizeof(arr) / sizeof(arr[0]);
    ${call};
    cout << "Sorted:";
    for (int i = 0; i < n; i++) {
        cout << " " << arr[i];
    }
    cout << endl;
    return 0;
}
`;

const mainJava = (call: string) => String.raw`    public static void main(String[] args) {
        int[] arr = {5, 1, 4, 2, 8, 3};
        ${call};
        System.out.print("Sorted:");
        for (int x : arr) {
            System.out.print(" " + x);
        }
        System.out.println();
    }
}
`;

const mainCs = (call: string) => String.raw`    static void Main(string[] args) {
        int[] arr = { 5, 1, 4, 2, 8, 3 };
        ${call};
        Console.Write("Sorted:");
        foreach (int x in arr) {
            Console.Write(" " + x);
        }
        Console.WriteLine();
    }
}
`;

const mainPy = (call: string) => String.raw`arr = [5, 1, 4, 2, 8, 3]
${call}
print("Sorted:", *arr)
`;

export const selectionSort: Example = {
  id: 'selection-sort',
  title: 'Selection Sort',
  topic: 'Sorting',
  description: 'Finds the smallest remaining value and swaps it into the next position, growing a sorted part on the left.',
  time: 'O(n²)',
  space: 'O(1)',
  notes: 'Always n(n−1)/2 comparisons, but at most n−1 swaps.',
  output: SORT_OUT,
  code: {
    c: String.raw`#include <stdio.h>

void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            int temp = arr[i];
            arr[i] = arr[minIdx];
            arr[minIdx] = temp;
        }
    }
}

` + mainC('selectionSort(arr, n)'),
    cpp: String.raw`#include <iostream>
using namespace std;

void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        if (minIdx != i) {
            swap(arr[i], arr[minIdx]);
        }
    }
}

` + mainCpp('selectionSort(arr, n)'),
    java: String.raw`public class Main {
    static void selectionSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            if (minIdx != i) {
                int temp = arr[i];
                arr[i] = arr[minIdx];
                arr[minIdx] = temp;
            }
        }
    }

` + mainJava('selectionSort(arr)'),
    csharp: String.raw`using System;

class Program {
    static void SelectionSort(int[] arr) {
        int n = arr.Length;
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            if (minIdx != i) {
                int temp = arr[i];
                arr[i] = arr[minIdx];
                arr[minIdx] = temp;
            }
        }
    }

` + mainCs('SelectionSort(arr)'),
    python: String.raw`def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]


` + mainPy('selection_sort(arr)'),
  },
};

export const insertionSort: Example = {
  id: 'insertion-sort',
  title: 'Insertion Sort',
  topic: 'Sorting',
  description: 'Takes the next value (the key) and shifts bigger values one place right until the key fits, like sorting cards in your hand.',
  time: 'O(n²)',
  space: 'O(1)',
  notes: 'Best case O(n) when the array is already sorted.',
  output: SORT_OUT,
  code: {
    c: String.raw`#include <stdio.h>

void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

` + mainC('insertionSort(arr, n)'),
    cpp: String.raw`#include <iostream>
using namespace std;

void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

` + mainCpp('insertionSort(arr, n)'),
    java: String.raw`public class Main {
    static void insertionSort(int[] arr) {
        for (int i = 1; i < arr.length; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }

` + mainJava('insertionSort(arr)'),
    csharp: String.raw`using System;

class Program {
    static void InsertionSort(int[] arr) {
        for (int i = 1; i < arr.Length; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }

` + mainCs('InsertionSort(arr)'),
    python: String.raw`def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key


` + mainPy('insertion_sort(arr)'),
  },
};

export const mergeSort: Example = {
  id: 'merge-sort',
  title: 'Merge Sort',
  topic: 'Sorting',
  description: 'Divide and conquer: split the array in half, sort each half recursively, then merge the two sorted halves.',
  time: 'O(n log n)',
  space: 'O(n)',
  notes: 'Same O(n log n) in the best, average and worst case.',
  output: SORT_OUT,
  code: {
    c: String.raw`#include <stdio.h>

void merge(int arr[], int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;
    int L[n1], R[n2];
    for (int i = 0; i < n1; i++) L[i] = arr[left + i];
    for (int j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];

    int i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }
    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}

void mergeSort(int arr[], int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

` + mainC('mergeSort(arr, 0, n - 1)'),
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;

void merge(int arr[], int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;
    vector<int> L(n1), R(n2);
    for (int i = 0; i < n1; i++) L[i] = arr[left + i];
    for (int j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];

    int i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }
    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}

void mergeSort(int arr[], int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

` + mainCpp('mergeSort(arr, 0, n - 1)'),
    java: String.raw`public class Main {
    static void merge(int[] arr, int left, int mid, int right) {
        int n1 = mid - left + 1;
        int n2 = right - mid;
        int[] L = new int[n1];
        int[] R = new int[n2];
        for (int i = 0; i < n1; i++) L[i] = arr[left + i];
        for (int j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];

        int i = 0, j = 0, k = left;
        while (i < n1 && j < n2) {
            if (L[i] <= R[j]) {
                arr[k] = L[i];
                i++;
            } else {
                arr[k] = R[j];
                j++;
            }
            k++;
        }
        while (i < n1) {
            arr[k] = L[i];
            i++;
            k++;
        }
        while (j < n2) {
            arr[k] = R[j];
            j++;
            k++;
        }
    }

    static void mergeSort(int[] arr, int left, int right) {
        if (left < right) {
            int mid = left + (right - left) / 2;
            mergeSort(arr, left, mid);
            mergeSort(arr, mid + 1, right);
            merge(arr, left, mid, right);
        }
    }

` + mainJava('mergeSort(arr, 0, arr.length - 1)'),
    csharp: String.raw`using System;

class Program {
    static void Merge(int[] arr, int left, int mid, int right) {
        int n1 = mid - left + 1;
        int n2 = right - mid;
        int[] L = new int[n1];
        int[] R = new int[n2];
        for (int i = 0; i < n1; i++) L[i] = arr[left + i];
        for (int j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];

        int a = 0, b = 0, k = left;
        while (a < n1 && b < n2) {
            if (L[a] <= R[b]) {
                arr[k] = L[a];
                a++;
            } else {
                arr[k] = R[b];
                b++;
            }
            k++;
        }
        while (a < n1) {
            arr[k] = L[a];
            a++;
            k++;
        }
        while (b < n2) {
            arr[k] = R[b];
            b++;
            k++;
        }
    }

    static void MergeSort(int[] arr, int left, int right) {
        if (left < right) {
            int mid = left + (right - left) / 2;
            MergeSort(arr, left, mid);
            MergeSort(arr, mid + 1, right);
            Merge(arr, left, mid, right);
        }
    }

` + mainCs('MergeSort(arr, 0, arr.Length - 1)'),
    python: String.raw`def merge(arr, left, mid, right):
    L = arr[left:mid + 1]
    R = arr[mid + 1:right + 1]
    i = j = 0
    k = left
    while i < len(L) and j < len(R):
        if L[i] <= R[j]:
            arr[k] = L[i]
            i += 1
        else:
            arr[k] = R[j]
            j += 1
        k += 1
    while i < len(L):
        arr[k] = L[i]
        i += 1
        k += 1
    while j < len(R):
        arr[k] = R[j]
        j += 1
        k += 1


def merge_sort(arr, left, right):
    if left < right:
        mid = (left + right) // 2
        merge_sort(arr, left, mid)
        merge_sort(arr, mid + 1, right)
        merge(arr, left, mid, right)


` + mainPy('merge_sort(arr, 0, len(arr) - 1)'),
  },
};

export const quickSort: Example = {
  id: 'quick-sort',
  title: 'Quick Sort',
  topic: 'Sorting',
  description: 'Picks a pivot (the last element), moves smaller values to its left and bigger values to its right, then sorts both sides recursively.',
  time: 'O(n log n)',
  space: 'O(log n)',
  notes: 'Average O(n log n); worst case O(n²) when the pivot is always the smallest or largest.',
  output: SORT_OUT,
  code: {
    c: String.raw`#include <stdio.h>

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(&arr[i], &arr[j]);
        }
    }
    swap(&arr[i + 1], &arr[high]);
    return i + 1;
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

` + mainC('quickSort(arr, 0, n - 1)'),
    cpp: String.raw`#include <iostream>
using namespace std;

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

` + mainCpp('quickSort(arr, 0, n - 1)'),
    java: String.raw`public class Main {
    static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        int temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        return i + 1;
    }

    static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            quickSort(arr, low, pi - 1);
            quickSort(arr, pi + 1, high);
        }
    }

` + mainJava('quickSort(arr, 0, arr.length - 1)'),
    csharp: String.raw`using System;

class Program {
    static int Partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                (arr[i], arr[j]) = (arr[j], arr[i]);
            }
        }
        (arr[i + 1], arr[high]) = (arr[high], arr[i + 1]);
        return i + 1;
    }

    static void QuickSort(int[] arr, int low, int high) {
        if (low < high) {
            int pi = Partition(arr, low, high);
            QuickSort(arr, low, pi - 1);
            QuickSort(arr, pi + 1, high);
        }
    }

` + mainCs('QuickSort(arr, 0, arr.Length - 1)'),
    python: String.raw`def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1


def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)


` + mainPy('quick_sort(arr, 0, len(arr) - 1)'),
  },
};

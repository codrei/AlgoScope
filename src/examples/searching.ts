import type { Example } from './types';

export const linearSearch: Example = {
  id: 'linear-search',
  title: 'Linear Search',
  topic: 'Searching',
  description: 'Checks each element from left to right until it finds the target or reaches the end.',
  time: 'O(n)',
  space: 'O(1)',
  notes: 'Works on unsorted data. Best case O(1) when the target is first.',
  output: 'Found 18 at index 4\n',
  code: {
    c: String.raw`#include <stdio.h>

int linearSearch(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;
}

int main() {
    int arr[] = {10, 25, 3, 47, 18, 32};
    int n = sizeof(arr) / sizeof(arr[0]);
    int target = 18;
    int index = linearSearch(arr, n, target);
    if (index != -1) {
        printf("Found %d at index %d\n", target, index);
    } else {
        printf("%d not found\n", target);
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
using namespace std;

int linearSearch(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) {
            return i;
        }
    }
    return -1;
}

int main() {
    int arr[] = {10, 25, 3, 47, 18, 32};
    int n = 6;
    int target = 18;
    int index = linearSearch(arr, n, target);
    if (index != -1) {
        cout << "Found " << target << " at index " << index << endl;
    } else {
        cout << target << " not found" << endl;
    }
    return 0;
}
`,
    java: String.raw`public class Main {
    static int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return i;
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {10, 25, 3, 47, 18, 32};
        int target = 18;
        int index = linearSearch(arr, target);
        if (index != -1) {
            System.out.println("Found " + target + " at index " + index);
        } else {
            System.out.println(target + " not found");
        }
    }
}
`,
    csharp: String.raw`using System;

class Program {
    static int LinearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.Length; i++) {
            if (arr[i] == target) {
                return i;
            }
        }
        return -1;
    }

    static void Main(string[] args) {
        int[] arr = { 10, 25, 3, 47, 18, 32 };
        int target = 18;
        int index = LinearSearch(arr, target);
        if (index != -1) {
            Console.WriteLine($"Found {target} at index {index}");
        } else {
            Console.WriteLine($"{target} not found");
        }
    }
}
`,
    python: String.raw`def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1


arr = [10, 25, 3, 47, 18, 32]
target = 18
index = linear_search(arr, target)
if index != -1:
    print(f"Found {target} at index {index}")
else:
    print(f"{target} not found")
`,
  },
};

export const binarySearch: Example = {
  id: 'binary-search',
  title: 'Binary Search',
  topic: 'Searching',
  description: 'On a sorted array, looks at the middle element and throws away the half that cannot contain the target.',
  time: 'O(log n)',
  space: 'O(1)',
  notes: 'The array must already be sorted. Each step halves the search range.',
  output: 'Found 23 at index 5\n',
  code: {
    c: String.raw`#include <stdio.h>

int binarySearch(int arr[], int n, int target) {
    int low = 0;
    int high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}

int main() {
    int arr[] = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int n = sizeof(arr) / sizeof(arr[0]);
    int target = 23;
    int index = binarySearch(arr, n, target);
    if (index != -1) {
        printf("Found %d at index %d\n", target, index);
    } else {
        printf("%d not found\n", target);
    }
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
using namespace std;

int binarySearch(int arr[], int n, int target) {
    int low = 0;
    int high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}

int main() {
    int arr[] = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int n = 10;
    int target = 23;
    int index = binarySearch(arr, n, target);
    if (index != -1) {
        cout << "Found " << target << " at index " << index << endl;
    } else {
        cout << target << " not found" << endl;
    }
    return 0;
}
`,
    java: String.raw`public class Main {
    static int binarySearch(int[] arr, int target) {
        int low = 0;
        int high = arr.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (arr[mid] == target) {
                return mid;
            } else if (arr[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        int target = 23;
        int index = binarySearch(arr, target);
        if (index != -1) {
            System.out.println("Found " + target + " at index " + index);
        } else {
            System.out.println(target + " not found");
        }
    }
}
`,
    csharp: String.raw`using System;

class Program {
    static int BinarySearch(int[] arr, int target) {
        int low = 0;
        int high = arr.Length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (arr[mid] == target) {
                return mid;
            } else if (arr[mid] < target) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return -1;
    }

    static void Main(string[] args) {
        int[] arr = { 2, 5, 8, 12, 16, 23, 38, 56, 72, 91 };
        int target = 23;
        int index = BinarySearch(arr, target);
        if (index != -1) {
            Console.WriteLine($"Found {target} at index {index}");
        } else {
            Console.WriteLine($"{target} not found");
        }
    }
}
`,
    python: String.raw`def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1


arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
target = 23
index = binary_search(arr, target)
if index != -1:
    print(f"Found {target} at index {index}")
else:
    print(f"{target} not found")
`,
  },
};

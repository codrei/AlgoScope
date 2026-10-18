#include <stdio.h>
#include <string.h>

long power(int base, int exp) {
    if (exp == 0) return 1;
    return base * power(base, exp - 1);
}

int sumDigits(int n) {
    if (n == 0) return 0;
    return n % 10 + sumDigits(n / 10);
}

int isPalindrome(char str[], int start, int end) {
    if (start >= end) return 1;
    if (str[start] != str[end]) return 0;
    return isPalindrome(str, start + 1, end - 1);
}

int binarySearch(int arr[], int low, int high, int x) {
    if (high >= low) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == x) return mid;
        if (arr[mid] > x) return binarySearch(arr, low, mid - 1, x);
        return binarySearch(arr, mid + 1, high, x);
    }
    return -1;
}

void printBinary(int n) {
    if (n > 1) printBinary(n / 2);
    printf("%d", n % 2);
}

int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }

int main() {
    printf("2^10 = %ld\n", power(2, 10));
    printf("Sum of digits of 98765 = %d\n", sumDigits(98765));
    char w1[] = "racecar", w2[] = "algorithm";
    printf("%s palindrome? %s\n", w1, isPalindrome(w1, 0, strlen(w1) - 1) ? "yes" : "no");
    printf("%s palindrome? %s\n", w2, isPalindrome(w2, 0, strlen(w2) - 1) ? "yes" : "no");
    int arr[] = {2, 3, 4, 10, 40, 55, 70};
    printf("Index of 40 = %d\n", binarySearch(arr, 0, 6, 40));
    printf("13 in binary = ");
    printBinary(13);
    printf("\nGCD(84, 36) = %d\n", gcd(84, 36));
    return 0;
}

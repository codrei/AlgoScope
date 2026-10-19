#include <stdio.h>
#include <string.h>

int isPalindrome(char s[]) {
    int i = 0, j = strlen(s) - 1;
    while (i < j) {
        if (s[i] != s[j]) return 0;
        i++;
        j--;
    }
    return 1;
}

void reverse(char s[]) {
    int n = strlen(s);
    for (int i = 0; i < n / 2; i++) {
        char t = s[i];
        s[i] = s[n - 1 - i];
        s[n - 1 - i] = t;
    }
}

int main() {
    int a[2][3] = {{1, 2, 3}, {4, 5, 6}};
    int b[3][2] = {{7, 8}, {9, 10}, {11, 12}};
    int c[2][2] = {0};
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 2; j++)
            for (int k = 0; k < 3; k++)
                c[i][j] += a[i][k] * b[k][j];
    for (int i = 0; i < 2; i++) printf("%d %d\n", c[i][0], c[i][1]);
    char w1[] = "racecar", w2[] = "algorithm";
    printf("%d %d\n", isPalindrome(w1), isPalindrome(w2));
    reverse(w2);
    printf("%s\n", w2);
    return 0;
}

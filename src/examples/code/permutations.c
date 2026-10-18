#include <stdio.h>

void permute(char s[], int start, int n) {
    if (start == n - 1) {
        printf("%s\n", s);
        return;
    }
    for (int i = start; i < n; i++) {
        // choose s[i] for this position, arrange the rest, then undo
        char temp = s[start]; s[start] = s[i]; s[i] = temp;
        permute(s, start + 1, n);
        temp = s[start]; s[start] = s[i]; s[i] = temp;
    }
}

int main() {
    char s[] = "ABC";
    permute(s, 0, 3);
    return 0;
}

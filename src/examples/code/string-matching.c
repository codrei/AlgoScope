#include <stdio.h>
#include <string.h>

void search(char text[], char pattern[]) {
    int n = strlen(text);
    int m = strlen(pattern);
    // slide the pattern over the text one position at a time
    for (int i = 0; i <= n - m; i++) {
        int j = 0;
        while (j < m && text[i + j] == pattern[j]) {
            j++;
        }
        if (j == m) {
            printf("Found at index %d\n", i);
        }
    }
}

int main() {
    char text[] = "AABAACAADAABAABA";
    char pattern[] = "AABA";
    search(text, pattern);
    return 0;
}

#include <stdio.h>

// the activities are already sorted by finish time
void selectActivities(int start[], int finish[], int n) {
    int last = 0;
    printf("Selected activities: 0");
    for (int i = 1; i < n; i++) {
        // greedy choice: take it if it starts after the last one ends
        if (start[i] >= finish[last]) {
            printf(" %d", i);
            last = i;
        }
    }
    printf("\n");
}

int main() {
    int start[] = {1, 3, 0, 5, 8, 5};
    int finish[] = {2, 4, 6, 7, 9, 9};
    int n = sizeof(start) / sizeof(start[0]);
    selectActivities(start, finish, n);
    return 0;
}

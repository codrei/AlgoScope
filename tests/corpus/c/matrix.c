#include <stdio.h>
#define R 3
#define C 3

int main() {
    int a[R][C] = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    int b[R][C] = {{9, 8, 7}, {6, 5, 4}, {3, 2, 1}};
    int result[R][C];
    for (int i = 0; i < R; i++) {
        for (int j = 0; j < C; j++) {
            result[i][j] = 0;
            for (int k = 0; k < C; k++) result[i][j] += a[i][k] * b[k][j];
        }
    }
    printf("Product:\n");
    for (int i = 0; i < R; i++) {
        for (int j = 0; j < C; j++) printf("%4d", result[i][j]);
        printf("\n");
    }
    int trace = 0;
    for (int i = 0; i < R; i++) trace += result[i][i];
    printf("Trace = %d\n", trace);
    printf("Transpose of a:\n");
    for (int i = 0; i < C; i++) {
        for (int j = 0; j < R; j++) printf("%-3d", a[j][i]);
        printf("\n");
    }
    return 0;
}

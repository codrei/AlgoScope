#include <stdio.h>
#include <stdbool.h>
#define N 4

int board[N][N];
int solutions = 0;

bool isSafe(int row, int col) {
    for (int i = 0; i < col; i++)
        if (board[row][i]) return false;
    for (int i = row, j = col; i >= 0 && j >= 0; i--, j--)
        if (board[i][j]) return false;
    for (int i = row, j = col; j >= 0 && i < N; i++, j--)
        if (board[i][j]) return false;
    return true;
}

void printBoard() {
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) printf(board[i][j] ? "Q " : ". ");
        printf("\n");
    }
    printf("\n");
}

void solve(int col) {
    if (col == N) {
        solutions++;
        printBoard();
        return;
    }
    for (int i = 0; i < N; i++) {
        if (isSafe(i, col)) {
            board[i][col] = 1;
            solve(col + 1);
            board[i][col] = 0;
        }
    }
}

int main() {
    solve(0);
    printf("Total solutions: %d\n", solutions);
    return 0;
}

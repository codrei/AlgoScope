#include <stdio.h>
#define N 4

int board[N][N];

// can a queen go here? check the column and both diagonals above
int isSafe(int row, int col) {
    for (int i = 0; i < row; i++) {
        if (board[i][col] == 1) {
            return 0;
        }
    }
    for (int i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j] == 1) {
            return 0;
        }
    }
    for (int i = row - 1, j = col + 1; i >= 0 && j < N; i--, j++) {
        if (board[i][j] == 1) {
            return 0;
        }
    }
    return 1;
}

int solve(int row) {
    if (row == N) {
        return 1;
    }
    for (int col = 0; col < N; col++) {
        if (isSafe(row, col)) {
            board[row][col] = 1;
            if (solve(row + 1)) {
                return 1;
            }
            board[row][col] = 0;  // backtrack: take the queen back
        }
    }
    return 0;
}

int main() {
    solve(0);
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) {
            printf(board[i][j] == 1 ? "Q " : ". ");
        }
        printf("\n");
    }
    return 0;
}

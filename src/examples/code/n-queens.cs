using System;

class Program {
    const int N = 4;
    static int[,] board = new int[N, N];

    // can a queen go here? check the column and both diagonals above
    static bool IsSafe(int row, int col) {
        for (int i = 0; i < row; i++) {
            if (board[i, col] == 1) {
                return false;
            }
        }
        for (int i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
            if (board[i, j] == 1) {
                return false;
            }
        }
        for (int i = row - 1, j = col + 1; i >= 0 && j < N; i--, j++) {
            if (board[i, j] == 1) {
                return false;
            }
        }
        return true;
    }

    static bool Solve(int row) {
        if (row == N) {
            return true;
        }
        for (int col = 0; col < N; col++) {
            if (IsSafe(row, col)) {
                board[row, col] = 1;
                if (Solve(row + 1)) {
                    return true;
                }
                board[row, col] = 0;  // backtrack: take the queen back
            }
        }
        return false;
    }

    static void Main(string[] args) {
        Solve(0);
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                Console.Write(board[i, j] == 1 ? "Q " : ". ");
            }
            Console.WriteLine();
        }
    }
}

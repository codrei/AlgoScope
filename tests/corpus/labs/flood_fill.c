#include <stdio.h>
#define R 5
#define C 6

char grid[R][C + 1] = {
    "..#...",
    ".##.#.",
    "....#.",
    "###.#.",
    "....#."
};

int fill(int r, int c) {
    if (r < 0 || r >= R || c < 0 || c >= C) return 0;
    if (grid[r][c] != '.') return 0;
    grid[r][c] = 'o';
    return 1 + fill(r + 1, c) + fill(r - 1, c) + fill(r, c + 1) + fill(r, c - 1);
}

int main() {
    int count = fill(0, 0);
    printf("filled %d cells\n", count);
    for (int r = 0; r < R; r++) printf("%s\n", grid[r]);
    return 0;
}

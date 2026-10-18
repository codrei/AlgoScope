N = 4
board = [[0] * N for _ in range(N)]


def is_safe(row, col):
    # can a queen go here? check the column and both diagonals above
    for i in range(row):
        if board[i][col] == 1:
            return False
    i, j = row - 1, col - 1
    while i >= 0 and j >= 0:
        if board[i][j] == 1:
            return False
        i -= 1
        j -= 1
    i, j = row - 1, col + 1
    while i >= 0 and j < N:
        if board[i][j] == 1:
            return False
        i -= 1
        j += 1
    return True


def solve(row):
    if row == N:
        return True
    for col in range(N):
        if is_safe(row, col):
            board[row][col] = 1
            if solve(row + 1):
                return True
            board[row][col] = 0  # backtrack: take the queen back
    return False


solve(0)
for i in range(N):
    for j in range(N):
        print("Q" if board[i][j] == 1 else ".", end=" ")
    print()

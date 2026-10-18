# each function counts how many times its loop body runs

def constant(n):
    steps = 0
    steps += 1
    return steps


def logarithmic(n):
    steps = 0
    i = 1
    while i < n:
        steps += 1
        i = i * 2
    return steps


def linear(n):
    steps = 0
    for i in range(n):
        steps += 1
    return steps


def quadratic(n):
    steps = 0
    for i in range(n):
        for j in range(n):
            steps += 1
    return steps


n = 4
while n <= 16:
    print(f"n = {n}: O(1) = {constant(n)}, O(log n) = {logarithmic(n)}, O(n) = {linear(n)}, O(n^2) = {quadratic(n)}")
    n = n * 2

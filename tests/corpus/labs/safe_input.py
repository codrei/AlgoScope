total = 0
count = 0
while True:
    line = input()
    if line == "done":
        break
    try:
        value = int(line)
    except ValueError:
        print("not a number:", line)
        continue
    total += value
    count += 1

print("count", count, "total", total)
moves = 0


def hanoi(n, a, b, c):
    global moves
    if n == 0:
        return
    hanoi(n - 1, a, c, b)
    moves += 1
    hanoi(n - 1, c, b, a)


hanoi(4, "A", "B", "C")
print("moves", moves)

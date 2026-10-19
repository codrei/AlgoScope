text = "the quick brown fox jumps over the lazy dog the end"
counts = {}
for word in text.split():
    counts[word] = counts.get(word, 0) + 1

top = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:3]
for word, c in top:
    print(f"{word:>6}: {c}")

lengths = {w: len(w) for w in set(text.split()) if len(w) > 4}
print(sorted(lengths.items()))
grid = [[0] * 3 for _ in range(3)]
for i in range(3):
    grid[i][i] = i + 1
print("\n".join(" ".join(str(x) for x in row) for row in grid))

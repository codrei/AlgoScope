def search(text, pattern):
    n = len(text)
    m = len(pattern)
    # slide the pattern over the text one position at a time
    for i in range(n - m + 1):
        j = 0
        while j < m and text[i + j] == pattern[j]:
            j += 1
        if j == m:
            print("Found at index", i)


text = "AABAACAADAABAABA"
pattern = "AABA"
search(text, pattern)

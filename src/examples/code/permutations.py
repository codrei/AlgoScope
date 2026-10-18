def permute(s, start):
    if start == len(s) - 1:
        print("".join(s))
        return
    for i in range(start, len(s)):
        # choose s[i] for this position, arrange the rest, then undo
        s[start], s[i] = s[i], s[start]
        permute(s, start + 1)
        s[start], s[i] = s[i], s[start]


s = ['A', 'B', 'C']
permute(s, 0)

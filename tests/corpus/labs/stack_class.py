class Stack:
    def __init__(self):
        self.items = []

    def push(self, x):
        self.items.append(x)

    def pop(self):
        if self.is_empty():
            raise IndexError("pop from empty stack")
        return self.items.pop()

    def peek(self):
        return self.items[-1]

    def is_empty(self):
        return len(self.items) == 0

    def __len__(self):
        return len(self.items)


def balanced(expr):
    s = Stack()
    pairs = {")": "(", "]": "[", "}": "{"}
    for ch in expr:
        if ch in "([{":
            s.push(ch)
        elif ch in pairs:
            if s.is_empty() or s.pop() != pairs[ch]:
                return False
    return s.is_empty()


for e in ["{[()]}", "([)]", "((", ""]:
    print(repr(e), balanced(e))

s = Stack()
s.push(1)
print(len(s), s.peek())
s.pop()
try:
    s.pop()
except IndexError as err:
    print("error:", err)

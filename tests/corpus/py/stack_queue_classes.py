from collections import deque


class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        if self.is_empty():
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def peek(self):
        return self._items[-1]

    def is_empty(self):
        return not self._items

    def __len__(self):
        return len(self._items)


class Queue:
    def __init__(self):
        self.items = deque()

    def enqueue(self, x):
        self.items.append(x)

    def dequeue(self):
        return self.items.popleft()

    def __str__(self):
        return "Queue(" + ", ".join(map(str, self.items)) + ")"


def is_balanced(expr: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    s = Stack()
    for ch in expr:
        if ch in "([{":
            s.push(ch)
        elif ch in pairs:
            if s.is_empty() or s.pop() != pairs[ch]:
                return False
    return s.is_empty()


def to_binary(n: int) -> str:
    s = Stack()
    while n > 0:
        s.push(n % 2)
        n //= 2
    out = ""
    while len(s) > 0:
        out += str(s.pop())
    return out


for e in ["(a[b]{c})", "(]", "((()"]:
    print(e, is_balanced(e))
print(to_binary(37))
q = Queue()
for t in ["job1", "job2", "job3"]:
    q.enqueue(t)
q.dequeue()
print(q)
try:
    Stack().pop()
except IndexError as err:
    print("caught:", err)

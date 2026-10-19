class Shape:
    def __init__(self, name):
        self.name = name

    def describe(self):
        return "shape " + self.name


class Square(Shape):
    def __init__(self, side):
        super().__init__("square")
        self.side = side

    def describe(self):
        return super().describe() + " with side " + str(self.side)


print(Square(3).describe())


def make_counter():
    count = 0

    def inc():
        nonlocal count
        count += 1
        return count

    return inc


c = make_counter()
c()
c()
print("counter", c())

n = 3
while n > 0:
    n -= 1
else:
    print("while finished", n)

n = 3
while n > 0:
    if n == 2:
        break
    n -= 1
else:
    print("not printed")

for x in [1, 2, 3]:
    if x == 10:
        break
else:
    print("for finished")

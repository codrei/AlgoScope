def precedence(op):
    if op == '*' or op == '/':
        return 2
    if op == '+' or op == '-':
        return 1
    return 0


def to_postfix(infix):
    ops = []
    postfix = ""
    for c in infix:
        if 'A' <= c <= 'Z':
            postfix += c                   # operands go straight to the output
        elif c == '(':
            ops.append(c)
        elif c == ')':
            while ops[-1] != '(':
                postfix += ops.pop()
            ops.pop()                      # drop the '('
        else:
            # pop operators that bind at least as tightly
            while ops and precedence(ops[-1]) >= precedence(c):
                postfix += ops.pop()
            ops.append(c)
    while ops:
        postfix += ops.pop()
    return postfix


infix = "A+B*(C-D)/E"
print("Infix:", infix)
print("Postfix:", to_postfix(infix))

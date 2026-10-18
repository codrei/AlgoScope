from collections import deque


class Node:
    def __init__(self, data):
        self.data = data
        self.left = None
        self.right = None


def preorder(root):     # node, left, right
    if root is None:
        return
    print("", root.data, end="")
    preorder(root.left)
    preorder(root.right)


def inorder(root):      # left, node, right
    if root is None:
        return
    inorder(root.left)
    print("", root.data, end="")
    inorder(root.right)


def postorder(root):    # left, right, node
    if root is None:
        return
    postorder(root.left)
    postorder(root.right)
    print("", root.data, end="")


def level_order(root):  # row by row, using a queue
    queue = deque([root])
    while queue:
        cur = queue.popleft()
        print("", cur.data, end="")
        if cur.left is not None:
            queue.append(cur.left)
        if cur.right is not None:
            queue.append(cur.right)


root = Node(1)
root.left = Node(2)
root.right = Node(3)
root.left.left = Node(4)
root.left.right = Node(5)
root.right.right = Node(6)
print("Preorder:", end="")
preorder(root)
print("\nInorder:", end="")
inorder(root)
print("\nPostorder:", end="")
postorder(root)
print("\nLevel order:", end="")
level_order(root)
print()

class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

    def __repr__(self):
        return f"Node({self.data})"


class LinkedList:
    def __init__(self):
        self.head = None
        self.size = 0

    def push(self, data):
        node = Node(data)
        node.next = self.head
        self.head = node
        self.size += 1

    def append(self, data):
        node = Node(data)
        if not self.head:
            self.head = node
        else:
            cur = self.head
            while cur.next:
                cur = cur.next
            cur.next = node
        self.size += 1

    def delete(self, key):
        cur, prev = self.head, None
        while cur and cur.data != key:
            prev, cur = cur, cur.next
        if cur is None:
            return False
        if prev is None:
            self.head = cur.next
        else:
            prev.next = cur.next
        self.size -= 1
        return True

    def reverse(self):
        prev = None
        cur = self.head
        while cur:
            cur.next, prev, cur = prev, cur, cur.next
        self.head = prev

    def __len__(self):
        return self.size

    def __str__(self):
        parts = []
        cur = self.head
        while cur:
            parts.append(str(cur.data))
            cur = cur.next
        return " -> ".join(parts) + " -> None"


ll = LinkedList()
for x in [3, 4, 5]:
    ll.append(x)
ll.push(2)
ll.push(1)
print(ll)
print("length:", len(ll), "head:", repr(ll.head))
ll.delete(3)
print(ll.delete(42))
ll.reverse()
print(ll)

class Node:
    def __init__(self, data):
        self.data = data
        self.prev = None
        self.next = None


head = None
tail = None


def insert_end(data):
    global head, tail
    node = Node(data)
    node.prev = tail
    if tail is None:
        head = node
    else:
        tail.next = node
    tail = node


def delete_value(data):
    global head, tail
    cur = head
    while cur is not None and cur.data != data:
        cur = cur.next
    if cur is None:
        return
    # link the neighbors to each other, skipping cur
    if cur.prev is not None:
        cur.prev.next = cur.next
    else:
        head = cur.next
    if cur.next is not None:
        cur.next.prev = cur.prev
    else:
        tail = cur.prev


def print_forward():
    values = []
    cur = head
    while cur is not None:
        values.append(cur.data)
        cur = cur.next
    print("Forward:", *values)


def print_backward():
    values = []
    cur = tail
    while cur is not None:
        values.append(cur.data)
        cur = cur.prev
    print("Backward:", *values)


insert_end(10)
insert_end(20)
insert_end(30)
insert_end(40)
delete_value(20)
print_forward()
print_backward()

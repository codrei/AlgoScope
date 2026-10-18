SIZE = 7
table = [-1] * SIZE


def hash_key(key):
    return key % SIZE


def insert(key):
    index = hash_key(key)
    # collision: the slot is taken, so try the next one (linear probing)
    while table[index] != -1:
        index = (index + 1) % SIZE
    table[index] = key


def search(key):
    index = hash_key(key)
    tries = 0
    while table[index] != -1 and tries < SIZE:
        if table[index] == key:
            return index
        index = (index + 1) % SIZE
        tries += 1
    return -1


for key in [50, 700, 76, 85, 92]:
    insert(key)
print("Table:", *table)
print("85 is at index", search(85))
print("40 is at index", search(40))

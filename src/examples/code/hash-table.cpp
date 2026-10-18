#include <iostream>
using namespace std;

const int SIZE = 7;
int table[SIZE];

int hashKey(int key) {
    return key % SIZE;
}

void insert(int key) {
    int index = hashKey(key);
    // collision: the slot is taken, so try the next one (linear probing)
    while (table[index] != -1) {
        index = (index + 1) % SIZE;
    }
    table[index] = key;
}

int search(int key) {
    int index = hashKey(key);
    int tries = 0;
    while (table[index] != -1 && tries < SIZE) {
        if (table[index] == key) {
            return index;
        }
        index = (index + 1) % SIZE;
        tries++;
    }
    return -1;
}

int main() {
    for (int i = 0; i < SIZE; i++) {
        table[i] = -1;
    }
    int keys[] = {50, 700, 76, 85, 92};
    for (int i = 0; i < 5; i++) {
        insert(keys[i]);
    }
    cout << "Table:";
    for (int i = 0; i < SIZE; i++) {
        cout << " " << table[i];
    }
    cout << endl;
    cout << "85 is at index " << search(85) << endl;
    cout << "40 is at index " << search(40) << endl;
    return 0;
}

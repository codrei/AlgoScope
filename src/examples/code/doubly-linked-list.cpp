#include <iostream>
using namespace std;

struct Node {
    int data;
    Node *prev;
    Node *next;
    Node(int d) : data(d), prev(nullptr), next(nullptr) {}
};

Node *head = nullptr;
Node *tail = nullptr;

void insertEnd(int data) {
    Node *node = new Node(data);
    node->prev = tail;
    if (tail == nullptr) {
        head = node;
    } else {
        tail->next = node;
    }
    tail = node;
}

void deleteValue(int data) {
    Node *cur = head;
    while (cur != nullptr && cur->data != data) {
        cur = cur->next;
    }
    if (cur == nullptr) {
        return;
    }
    // link the neighbors to each other, skipping cur
    if (cur->prev != nullptr) {
        cur->prev->next = cur->next;
    } else {
        head = cur->next;
    }
    if (cur->next != nullptr) {
        cur->next->prev = cur->prev;
    } else {
        tail = cur->prev;
    }
    delete cur;
}

void printForward() {
    cout << "Forward:";
    for (Node *cur = head; cur != nullptr; cur = cur->next) {
        cout << " " << cur->data;
    }
    cout << endl;
}

void printBackward() {
    cout << "Backward:";
    for (Node *cur = tail; cur != nullptr; cur = cur->prev) {
        cout << " " << cur->data;
    }
    cout << endl;
}

int main() {
    insertEnd(10);
    insertEnd(20);
    insertEnd(30);
    insertEnd(40);
    deleteValue(20);
    printForward();
    printBackward();
    return 0;
}

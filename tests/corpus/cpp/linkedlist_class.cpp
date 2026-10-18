#include <iostream>
using namespace std;

class Node {
public:
    int data;
    Node* next;
    Node(int d) : data(d), next(nullptr) {}
};

class LinkedList {
private:
    Node* head;
    int size;

public:
    LinkedList() {
        head = nullptr;
        size = 0;
    }

    ~LinkedList() {
        Node* cur = head;
        while (cur) {
            Node* nxt = cur->next;
            delete cur;
            cur = nxt;
        }
    }

    void pushFront(int val) {
        Node* n = new Node(val);
        n->next = head;
        head = n;
        size++;
    }

    void pushBack(int val) {
        Node* n = new Node(val);
        if (!head) {
            head = n;
        } else {
            Node* t = head;
            while (t->next) t = t->next;
            t->next = n;
        }
        size++;
    }

    bool remove(int val) {
        if (!head) return false;
        if (head->data == val) {
            Node* t = head;
            head = head->next;
            delete t;
            size--;
            return true;
        }
        Node* cur = head;
        while (cur->next && cur->next->data != val) cur = cur->next;
        if (!cur->next) return false;
        Node* t = cur->next;
        cur->next = t->next;
        delete t;
        size--;
        return true;
    }

    void reverse() {
        Node *prev = nullptr, *cur = head, *next = nullptr;
        while (cur != nullptr) {
            next = cur->next;
            cur->next = prev;
            prev = cur;
            cur = next;
        }
        head = prev;
    }

    int getSize() const { return size; }

    void print() const {
        Node* t = head;
        while (t != nullptr) {
            cout << t->data;
            if (t->next) cout << " -> ";
            t = t->next;
        }
        cout << endl;
    }
};

int main() {
    LinkedList list;
    list.pushBack(2);
    list.pushBack(3);
    list.pushFront(1);
    list.pushBack(4);
    list.print();
    cout << "Size: " << list.getSize() << endl;
    list.remove(3);
    cout << boolalpha << "Removed 9? " << list.remove(9) << endl;
    list.reverse();
    list.print();
    return 0;
}

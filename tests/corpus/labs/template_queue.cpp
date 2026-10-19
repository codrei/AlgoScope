#include <iostream>
#include <string>
using namespace std;

template <typename T>
class Queue {
    T items[10];
    int front, rear, count;
public:
    Queue() : front(0), rear(-1), count(0) {}
    bool isEmpty() { return count == 0; }
    void enqueue(T x) {
        rear = (rear + 1) % 10;
        items[rear] = x;
        count++;
    }
    T dequeue() {
        T x = items[front];
        front = (front + 1) % 10;
        count--;
        return x;
    }
    int size() { return count; }
};

int main() {
    Queue<int> q;
    for (int i = 1; i <= 3; i++) q.enqueue(i * 100);
    cout << q.dequeue() << " " << q.size() << endl;
    Queue<string> names;
    names.enqueue("Ana");
    names.enqueue("Ben");
    while (!names.isEmpty()) cout << names.dequeue() << " ";
    cout << endl;
    return 0;
}

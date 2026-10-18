#include <iostream>
using namespace std;

class CircularQueue {
    int *arr;
    int front, rear, capacity, count;

public:
    CircularQueue(int size) {
        arr = new int[size];
        capacity = size;
        front = 0;
        rear = -1;
        count = 0;
    }

    ~CircularQueue() { delete[] arr; }

    bool isFull() { return count == capacity; }
    bool isEmpty() { return count == 0; }

    void enqueue(int x) {
        if (isFull()) {
            cout << "Queue full, cannot add " << x << endl;
            return;
        }
        rear = (rear + 1) % capacity;
        arr[rear] = x;
        count++;
    }

    int dequeue() {
        if (isEmpty()) return -1;
        int x = arr[front];
        front = (front + 1) % capacity;
        count--;
        return x;
    }

    void display() {
        cout << "Queue:";
        for (int i = 0; i < count; i++) cout << " " << arr[(front + i) % capacity];
        cout << endl;
    }
};

int main() {
    CircularQueue q(4);
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    q.enqueue(4);
    q.enqueue(5);
    q.display();
    cout << "Dequeued " << q.dequeue() << " and " << q.dequeue() << endl;
    q.enqueue(6);
    q.enqueue(7);
    q.display();
    return 0;
}

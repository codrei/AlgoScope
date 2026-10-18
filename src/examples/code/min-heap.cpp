#include <iostream>
using namespace std;

int heap[10];
int heapSize = 0;

// a new value climbs up while it is smaller than its parent
void insert(int value) {
    int i = heapSize;
    heap[i] = value;
    heapSize++;
    while (i > 0 && heap[(i - 1) / 2] > heap[i]) {
        int parent = (i - 1) / 2;
        swap(heap[i], heap[parent]);
        i = parent;
    }
}

// the last value moves to the root and sinks below its smaller child
int extractMin() {
    int minValue = heap[0];
    heapSize--;
    heap[0] = heap[heapSize];
    int i = 0;
    while (true) {
        int left = 2 * i + 1;
        int right = 2 * i + 2;
        int smallest = i;
        if (left < heapSize && heap[left] < heap[smallest]) smallest = left;
        if (right < heapSize && heap[right] < heap[smallest]) smallest = right;
        if (smallest == i) break;
        swap(heap[i], heap[smallest]);
        i = smallest;
    }
    return minValue;
}

int main() {
    int values[] = {5, 3, 8, 1, 9, 2};
    for (int v : values) {
        insert(v);
    }
    cout << "Extracted:";
    for (int i = 0; i < 3; i++) {
        cout << " " << extractMin();
    }
    cout << endl;
    return 0;
}

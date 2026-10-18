#include <iostream>
#include <string>
using namespace std;

template <typename T>
class Stack {
private:
    T arr[100];
    int top;

public:
    Stack() { top = -1; }
    void push(T x) { arr[++top] = x; }
    T pop() { return arr[top--]; }
    T peek() { return arr[top]; }
    bool isEmpty() { return top == -1; }
    int size() { return top + 1; }
};

template <typename T>
T maxOf(T a, T b) {
    return a > b ? a : b;
}

int main() {
    Stack<int> s;
    for (int i = 1; i <= 4; i++) s.push(i * i);
    cout << "Size: " << s.size() << endl;
    while (!s.isEmpty()) cout << s.pop() << " ";
    cout << endl;

    Stack<string> words;
    words.push("data");
    words.push("structures");
    cout << words.peek() << " " << words.size() << endl;

    cout << maxOf(3, 7) << " " << maxOf(2.5, 1.5) << " " << maxOf<char>('a', 'z') << endl;
    return 0;
}

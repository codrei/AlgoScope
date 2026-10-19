#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <stack>
#include <queue>
using namespace std;

void swapPtr(int *a, int *b) { int t = *a; *a = *b; *b = t; }
void swapRef(int &a, int &b) { int t = a; a = b; b = t; }

int main() {
    int x = 1, y = 2;
    swapPtr(&x, &y);
    cout << x << y;
    swapRef(x, y);
    cout << x << y << endl;
    vector<pair<string, int>> v = {{"pear", 3}, {"apple", 5}, {"fig", 3}};
    sort(v.begin(), v.end(), [](const pair<string, int> &a, const pair<string, int> &b) {
        if (a.second != b.second) return a.second > b.second;
        return a.first < b.first;
    });
    for (auto [name, qty] : v) cout << name << ":" << qty << " ";
    cout << endl;
    stack<int> s;
    queue<int> q;
    for (int i = 1; i <= 3; i++) { s.push(i); q.push(i); }
    while (!s.empty()) { cout << s.top(); s.pop(); }
    cout << " ";
    while (!q.empty()) { cout << q.front(); q.pop(); }
    cout << endl;
    return 0;
}

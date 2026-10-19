#include <iostream>
#include <vector>
#include <map>
#include <string>
using namespace std;

struct Point {
    int x, y;
};

class Counter {
public:
    int count = 0;
    void add() { count++; }
};

void addOne(vector<int> v) {       // a copy
    v.push_back(1);
}

void addOneRef(vector<int> &v) {   // the original
    v.push_back(1);
}

int total(Counter c) {
    c.add();
    return c.count;
}

int main() {
    Point a = {1, 2};
    Point b = a;
    b.x = 9;
    cout << a.x << " " << b.x << endl;

    vector<int> v = {3, 1, 2};
    vector<int> w = v;
    w[0] = 100;
    addOne(v);
    cout << v.size() << " " << v[0] << " " << w[0] << endl;
    addOneRef(v);
    cout << v.size() << endl;

    vector<Point> pts = {{1, 1}, {2, 2}};
    for (Point p : pts) p.x = 50;          // copies
    for (Point &p : pts) p.y = 70;         // references
    cout << pts[0].x << " " << pts[0].y << endl;

    Counter c1;
    c1.add();
    Counter c2 = c1;
    c2.add();
    cout << c1.count << " " << c2.count << " " << total(c1) << " " << c1.count << endl;

    map<string, int> m1;
    m1["a"] = 1;
    map<string, int> m2 = m1;
    m2["a"] = 5;
    m2["b"] = 6;
    cout << m1["a"] << " " << m1.size() << " " << m2["a"] << " " << m2.size() << endl;

    vector<vector<int>> grid = {{1, 2}, {3, 4}};
    vector<vector<int>> copyGrid = grid;
    copyGrid[0][0] = 99;
    cout << grid[0][0] << " " << copyGrid[0][0] << endl;
    return 0;
}

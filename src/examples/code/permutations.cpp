#include <iostream>
#include <string>
using namespace std;

void permute(string &s, int start) {
    if (start == (int) s.length() - 1) {
        cout << s << endl;
        return;
    }
    for (int i = start; i < (int) s.length(); i++) {
        // choose s[i] for this position, arrange the rest, then undo
        swap(s[start], s[i]);
        permute(s, start + 1);
        swap(s[start], s[i]);
    }
}

int main() {
    string s = "ABC";
    permute(s, 0);
    return 0;
}

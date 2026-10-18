#include <iostream>
#include <string>
using namespace std;

void permute(string s, int l, int r) {
    if (l == r) {
        cout << s << " ";
        return;
    }
    for (int i = l; i <= r; i++) {
        swap(s[l], s[i]);
        permute(s, l + 1, r);
        swap(s[l], s[i]);
    }
}

string reverseStr(string s) {
    int n = s.length();
    for (int i = 0; i < n / 2; i++) {
        char t = s[i];
        s[i] = s[n - 1 - i];
        s[n - 1 - i] = t;
    }
    return s;
}

bool isPalindrome(const string& s) {
    int i = 0, j = s.size() - 1;
    while (i < j) {
        if (s[i] != s[j]) return false;
        i++;
        j--;
    }
    return true;
}

int main() {
    permute("ABC", 0, 2);
    cout << endl;
    cout << reverseStr("stack") << endl;
    string word = "level";
    cout << word << (isPalindrome(word) ? " is" : " is not") << " a palindrome" << endl;
    string caps = "hello";
    for (char& c : caps) c = toupper(c);
    cout << caps << endl;
    string s = "data";
    s += " structures";
    s[0] = 'D';
    cout << s << " (" << s.length() << ")" << endl;
    return 0;
}

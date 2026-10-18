#include <iostream>
#include <string>
using namespace std;

void search(string text, string pattern) {
    int n = text.length();
    int m = pattern.length();
    // slide the pattern over the text one position at a time
    for (int i = 0; i <= n - m; i++) {
        int j = 0;
        while (j < m && text[i + j] == pattern[j]) {
            j++;
        }
        if (j == m) {
            cout << "Found at index " << i << endl;
        }
    }
}

int main() {
    string text = "AABAACAADAABAABA";
    string pattern = "AABA";
    search(text, pattern);
    return 0;
}

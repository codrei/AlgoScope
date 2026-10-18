#include <iostream>
#include <stack>
#include <string>
using namespace std;

int precedence(char op) {
    if (op == '*' || op == '/') {
        return 2;
    }
    if (op == '+' || op == '-') {
        return 1;
    }
    return 0;
}

string toPostfix(string infix) {
    stack<char> ops;
    string postfix = "";
    for (char c : infix) {
        if (c >= 'A' && c <= 'Z') {
            postfix += c;                  // operands go straight to the output
        } else if (c == '(') {
            ops.push(c);
        } else if (c == ')') {
            while (ops.top() != '(') {
                postfix += ops.top();
                ops.pop();
            }
            ops.pop();                     // drop the '('
        } else {
            // pop operators that bind at least as tightly
            while (!ops.empty() && precedence(ops.top()) >= precedence(c)) {
                postfix += ops.top();
                ops.pop();
            }
            ops.push(c);
        }
    }
    while (!ops.empty()) {
        postfix += ops.top();
        ops.pop();
    }
    return postfix;
}

int main() {
    string infix = "A+B*(C-D)/E";
    cout << "Infix: " << infix << endl;
    cout << "Postfix: " << toPostfix(infix) << endl;
    return 0;
}

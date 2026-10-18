#include <stdio.h>
#include <ctype.h>
#include <string.h>

char stack[100];
int top = -1;

void push(char c) { stack[++top] = c; }
char pop() { return stack[top--]; }
char peek() { return stack[top]; }

int precedence(char op) {
    if (op == '+' || op == '-') return 1;
    if (op == '*' || op == '/') return 2;
    if (op == '^') return 3;
    return 0;
}

void infixToPostfix(char *exp) {
    char output[100];
    int k = 0;
    for (int i = 0; exp[i] != '\0'; i++) {
        char c = exp[i];
        if (isalnum(c)) {
            output[k++] = c;
        } else if (c == '(') {
            push(c);
        } else if (c == ')') {
            while (top != -1 && peek() != '(') output[k++] = pop();
            pop();
        } else {
            while (top != -1 && precedence(peek()) >= precedence(c)) output[k++] = pop();
            push(c);
        }
    }
    while (top != -1) output[k++] = pop();
    output[k] = '\0';
    printf("Postfix: %s\n", output);
}

int evaluatePostfix(char *exp) {
    int st[100];
    int t = -1;
    for (int i = 0; exp[i]; i++) {
        if (isdigit(exp[i])) {
            st[++t] = exp[i] - '0';
        } else {
            int b = st[t--];
            int a = st[t--];
            switch (exp[i]) {
                case '+': st[++t] = a + b; break;
                case '-': st[++t] = a - b; break;
                case '*': st[++t] = a * b; break;
                case '/': st[++t] = a / b; break;
            }
        }
    }
    return st[t];
}

int main() {
    char exp[] = "a+b*(c^d-e)^(f+g*h)-i";
    printf("Infix: %s\n", exp);
    infixToPostfix(exp);
    char post[] = "231*+9-";
    printf("Value of %s = %d\n", post, evaluatePostfix(post));
    return 0;
}

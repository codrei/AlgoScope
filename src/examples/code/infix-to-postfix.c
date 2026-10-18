#include <stdio.h>
#include <string.h>

char stack[20];
int top = -1;

int precedence(char op) {
    if (op == '*' || op == '/') {
        return 2;
    }
    if (op == '+' || op == '-') {
        return 1;
    }
    return 0;
}

void toPostfix(char infix[]) {
    char postfix[20];
    int k = 0;
    for (int i = 0; i < strlen(infix); i++) {
        char c = infix[i];
        if (c >= 'A' && c <= 'Z') {
            postfix[k++] = c;              // operands go straight to the output
        } else if (c == '(') {
            stack[++top] = c;
        } else if (c == ')') {
            while (stack[top] != '(') {
                postfix[k++] = stack[top--];
            }
            top--;                         // drop the '('
        } else {
            // pop operators that bind at least as tightly
            while (top >= 0 && precedence(stack[top]) >= precedence(c)) {
                postfix[k++] = stack[top--];
            }
            stack[++top] = c;
        }
    }
    while (top >= 0) {
        postfix[k++] = stack[top--];
    }
    postfix[k] = '\0';
    printf("Postfix: %s\n", postfix);
}

int main() {
    char infix[] = "A+B*(C-D)/E";
    printf("Infix: %s\n", infix);
    toPostfix(infix);
    return 0;
}

#include <stdio.h>
#define MAX 5

typedef struct {
    int data[MAX];
    int top;
} Stack;

void push(Stack *s, int x) {
    if (s->top == MAX - 1) {
        printf("Stack overflow!\n");
        return;
    }
    s->data[++s->top] = x;
    printf("Pushed %d\n", x);
}

int pop(Stack *s) {
    if (s->top == -1) {
        printf("Stack underflow!\n");
        return -1;
    }
    return s->data[s->top--];
}

void display(Stack s) {
    if (s.top == -1) {
        printf("Stack is empty\n");
        return;
    }
    printf("Stack:");
    for (int i = s.top; i >= 0; i--) printf(" %d", s.data[i]);
    printf("\n");
}

int main() {
    Stack s;
    s.top = -1;
    int choice, value;
    do {
        printf("1.Push 2.Pop 3.Display 4.Exit\nEnter choice: ");
        scanf("%d", &choice);
        switch (choice) {
            case 1:
                printf("Enter value: ");
                scanf("%d", &value);
                push(&s, value);
                break;
            case 2:
                value = pop(&s);
                if (value != -1) printf("Popped %d\n", value);
                break;
            case 3:
                display(s);
                break;
            case 4:
                printf("Bye\n");
                break;
            default:
                printf("Invalid choice\n");
        }
    } while (choice != 4);
    return 0;
}

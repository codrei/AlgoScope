#include <stdio.h>
#include <stdbool.h>
#define MAX 5

struct Stack {
    int items[MAX];
    int top;
};

void init(struct Stack *s) { s->top = -1; }
bool isEmpty(struct Stack *s) { return s->top == -1; }
bool isFull(struct Stack *s) { return s->top == MAX - 1; }

void push(struct Stack *s, int value) {
    if (isFull(s)) {
        printf("Stack Overflow! Cannot push %d\n", value);
        return;
    }
    s->items[++s->top] = value;
    printf("Pushed %d\n", value);
}

int pop(struct Stack *s) {
    if (isEmpty(s)) {
        printf("Stack Underflow!\n");
        return -1;
    }
    return s->items[s->top--];
}

int peek(struct Stack *s) { return s->items[s->top]; }

void display(struct Stack *s) {
    printf("Stack: ");
    for (int i = s->top; i >= 0; i--) printf("%d ", s->items[i]);
    printf("\n");
}

int main() {
    struct Stack s;
    init(&s);
    for (int i = 1; i <= 6; i++) push(&s, i * 10);
    display(&s);
    printf("Top element: %d\n", peek(&s));
    printf("Popped: %d\n", pop(&s));
    printf("Popped: %d\n", pop(&s));
    display(&s);
    return 0;
}

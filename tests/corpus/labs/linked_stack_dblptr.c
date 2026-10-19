#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

void push(struct Node **top, int x) {
    struct Node *n = (struct Node *) malloc(sizeof(struct Node));
    n->data = x;
    n->next = *top;
    *top = n;
}

int pop(struct Node **top) {
    if (*top == NULL) return -1;
    struct Node *t = *top;
    int x = t->data;
    *top = t->next;
    free(t);
    return x;
}

int main() {
    struct Node *top = NULL;
    for (int i = 1; i <= 4; i++) push(&top, i * i);
    printf("%d ", pop(&top));
    printf("%d\n", pop(&top));
    for (struct Node *p = top; p != NULL; p = p->next) printf("[%d]", p->data);
    printf("\n");
    return 0;
}

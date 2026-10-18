#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *prev, *next;
} Node;

Node *head = NULL, *tail = NULL;

Node *createNode(int data) {
    Node *n = (Node *)malloc(sizeof(Node));
    n->data = data;
    n->prev = n->next = NULL;
    return n;
}

void append(int data) {
    Node *n = createNode(data);
    if (head == NULL) {
        head = tail = n;
    } else {
        tail->next = n;
        n->prev = tail;
        tail = n;
    }
}

void removeValue(int data) {
    Node *cur = head;
    while (cur && cur->data != data) cur = cur->next;
    if (!cur) return;
    if (cur->prev) cur->prev->next = cur->next; else head = cur->next;
    if (cur->next) cur->next->prev = cur->prev; else tail = cur->prev;
    free(cur);
}

void forward() {
    for (Node *c = head; c != NULL; c = c->next) printf("%d ", c->data);
    printf("\n");
}

void backward() {
    for (Node *c = tail; c != NULL; c = c->prev) printf("%d ", c->data);
    printf("\n");
}

int main() {
    for (int i = 1; i <= 5; i++) append(i * 2);
    forward();
    backward();
    removeValue(6);
    removeValue(2);
    removeValue(10);
    forward();
    backward();
    return 0;
}

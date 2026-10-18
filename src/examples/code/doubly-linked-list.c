#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *prev;
    struct Node *next;
};

struct Node *head = NULL;
struct Node *tail = NULL;

void insertEnd(int data) {
    struct Node *node = malloc(sizeof(struct Node));
    node->data = data;
    node->next = NULL;
    node->prev = tail;
    if (tail == NULL) {
        head = node;
    } else {
        tail->next = node;
    }
    tail = node;
}

void deleteValue(int data) {
    struct Node *cur = head;
    while (cur != NULL && cur->data != data) {
        cur = cur->next;
    }
    if (cur == NULL) {
        return;
    }
    // link the neighbors to each other, skipping cur
    if (cur->prev != NULL) {
        cur->prev->next = cur->next;
    } else {
        head = cur->next;
    }
    if (cur->next != NULL) {
        cur->next->prev = cur->prev;
    } else {
        tail = cur->prev;
    }
    free(cur);
}

void printForward() {
    printf("Forward:");
    for (struct Node *cur = head; cur != NULL; cur = cur->next) {
        printf(" %d", cur->data);
    }
    printf("\n");
}

void printBackward() {
    printf("Backward:");
    for (struct Node *cur = tail; cur != NULL; cur = cur->prev) {
        printf(" %d", cur->data);
    }
    printf("\n");
}

int main() {
    insertEnd(10);
    insertEnd(20);
    insertEnd(30);
    insertEnd(40);
    deleteValue(20);
    printForward();
    printBackward();
    return 0;
}

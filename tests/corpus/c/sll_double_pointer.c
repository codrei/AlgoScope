#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

void insertAtBeginning(struct Node **head, int data) {
    struct Node *newNode = (struct Node *)malloc(sizeof(struct Node));
    newNode->data = data;
    newNode->next = *head;
    *head = newNode;
}

void insertAtEnd(struct Node **head, int data) {
    struct Node *newNode = (struct Node *)malloc(sizeof(struct Node));
    newNode->data = data;
    newNode->next = NULL;
    if (*head == NULL) {
        *head = newNode;
        return;
    }
    struct Node *temp = *head;
    while (temp->next != NULL) temp = temp->next;
    temp->next = newNode;
}

void insertAtPosition(struct Node **head, int data, int pos) {
    if (pos == 1) {
        insertAtBeginning(head, data);
        return;
    }
    struct Node *temp = *head;
    for (int i = 1; i < pos - 1 && temp != NULL; i++) temp = temp->next;
    if (temp == NULL) {
        printf("Invalid position\n");
        return;
    }
    struct Node *newNode = (struct Node *)malloc(sizeof(struct Node));
    newNode->data = data;
    newNode->next = temp->next;
    temp->next = newNode;
}

void deleteNode(struct Node **head, int key) {
    struct Node *temp = *head, *prev = NULL;
    if (temp != NULL && temp->data == key) {
        *head = temp->next;
        free(temp);
        return;
    }
    while (temp != NULL && temp->data != key) {
        prev = temp;
        temp = temp->next;
    }
    if (temp == NULL) {
        printf("%d not found\n", key);
        return;
    }
    prev->next = temp->next;
    free(temp);
}

int search(struct Node *head, int key) {
    int pos = 1;
    while (head != NULL) {
        if (head->data == key) return pos;
        head = head->next;
        pos++;
    }
    return -1;
}

int count(struct Node *head) {
    int c = 0;
    for (; head; head = head->next) c++;
    return c;
}

void display(struct Node *node) {
    while (node != NULL) {
        printf("%d -> ", node->data);
        node = node->next;
    }
    printf("NULL\n");
}

int main() {
    struct Node *head = NULL;
    insertAtEnd(&head, 20);
    insertAtBeginning(&head, 10);
    insertAtEnd(&head, 40);
    insertAtPosition(&head, 30, 3);
    display(&head == NULL ? NULL : head);
    printf("Count = %d\n", count(head));
    printf("Position of 30 = %d\n", search(head, 30));
    deleteNode(&head, 10);
    deleteNode(&head, 99);
    display(head);
    return 0;
}

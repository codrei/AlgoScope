#include <stdio.h>
#include <stdlib.h>
#define SIZE 7

struct Node {
    int key;
    struct Node *next;
};

struct Node *table[SIZE];

int hash(int key) { return key % SIZE; }

void insert(int key) {
    int index = hash(key);
    struct Node *newNode = malloc(sizeof(struct Node));
    newNode->key = key;
    newNode->next = table[index];
    table[index] = newNode;
}

int search(int key) {
    struct Node *temp = table[hash(key)];
    while (temp) {
        if (temp->key == key) return 1;
        temp = temp->next;
    }
    return 0;
}

void display() {
    for (int i = 0; i < SIZE; i++) {
        printf("[%d]", i);
        struct Node *temp = table[i];
        while (temp) {
            printf(" -> %d", temp->key);
            temp = temp->next;
        }
        printf("\n");
    }
}

int main() {
    int keys[] = {15, 11, 27, 8, 12, 22, 29};
    for (int i = 0; i < 7; i++) insert(keys[i]);
    display();
    printf("Search 27: %d\n", search(27));
    printf("Search 5: %d\n", search(5));
    return 0;
}

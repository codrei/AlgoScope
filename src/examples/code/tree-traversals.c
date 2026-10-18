#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *left;
    struct Node *right;
};

struct Node *newNode(int data) {
    struct Node *node = malloc(sizeof(struct Node));
    node->data = data;
    node->left = NULL;
    node->right = NULL;
    return node;
}

void preorder(struct Node *root) {     // node, left, right
    if (root == NULL) return;
    printf(" %d", root->data);
    preorder(root->left);
    preorder(root->right);
}

void inorder(struct Node *root) {      // left, node, right
    if (root == NULL) return;
    inorder(root->left);
    printf(" %d", root->data);
    inorder(root->right);
}

void postorder(struct Node *root) {    // left, right, node
    if (root == NULL) return;
    postorder(root->left);
    postorder(root->right);
    printf(" %d", root->data);
}

void levelOrder(struct Node *root) {   // row by row, using a queue
    struct Node *queue[10];
    int front = 0, rear = 0;
    queue[rear++] = root;
    while (front < rear) {
        struct Node *cur = queue[front++];
        printf(" %d", cur->data);
        if (cur->left != NULL) queue[rear++] = cur->left;
        if (cur->right != NULL) queue[rear++] = cur->right;
    }
}

int main() {
    struct Node *root = newNode(1);
    root->left = newNode(2);
    root->right = newNode(3);
    root->left->left = newNode(4);
    root->left->right = newNode(5);
    root->right->right = newNode(6);
    printf("Preorder:");
    preorder(root);
    printf("\nInorder:");
    inorder(root);
    printf("\nPostorder:");
    postorder(root);
    printf("\nLevel order:");
    levelOrder(root);
    printf("\n");
    return 0;
}

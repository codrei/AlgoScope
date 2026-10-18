#include <stdio.h>
#include <stdlib.h>

struct node {
    int key;
    struct node *left, *right;
};

struct node *newNode(int item) {
    struct node *temp = (struct node *)malloc(sizeof(struct node));
    temp->key = item;
    temp->left = temp->right = NULL;
    return temp;
}

struct node *insert(struct node *node, int key) {
    if (node == NULL) return newNode(key);
    if (key < node->key)
        node->left = insert(node->left, key);
    else if (key > node->key)
        node->right = insert(node->right, key);
    return node;
}

struct node *minValueNode(struct node *node) {
    struct node *current = node;
    while (current && current->left != NULL) current = current->left;
    return current;
}

struct node *deleteNode(struct node *root, int key) {
    if (root == NULL) return root;
    if (key < root->key)
        root->left = deleteNode(root->left, key);
    else if (key > root->key)
        root->right = deleteNode(root->right, key);
    else {
        if (root->left == NULL) {
            struct node *temp = root->right;
            free(root);
            return temp;
        } else if (root->right == NULL) {
            struct node *temp = root->left;
            free(root);
            return temp;
        }
        struct node *temp = minValueNode(root->right);
        root->key = temp->key;
        root->right = deleteNode(root->right, temp->key);
    }
    return root;
}

void inorder(struct node *root) {
    if (root != NULL) {
        inorder(root->left);
        printf("%d ", root->key);
        inorder(root->right);
    }
}

void preorder(struct node *root) {
    if (root) {
        printf("%d ", root->key);
        preorder(root->left);
        preorder(root->right);
    }
}

void postorder(struct node *root) {
    if (root) {
        postorder(root->left);
        postorder(root->right);
        printf("%d ", root->key);
    }
}

int height(struct node *root) {
    if (root == NULL) return 0;
    int l = height(root->left), r = height(root->right);
    return (l > r ? l : r) + 1;
}

struct node *search(struct node *root, int key) {
    if (root == NULL || root->key == key) return root;
    if (root->key < key) return search(root->right, key);
    return search(root->left, key);
}

int main() {
    struct node *root = NULL;
    int keys[] = {50, 30, 20, 40, 70, 60, 80};
    int n = sizeof(keys) / sizeof(keys[0]);
    for (int i = 0; i < n; i++) root = insert(root, keys[i]);
    printf("Inorder: "); inorder(root); printf("\n");
    printf("Preorder: "); preorder(root); printf("\n");
    printf("Postorder: "); postorder(root); printf("\n");
    printf("Height: %d\n", height(root));
    printf("Search 60: %s\n", search(root, 60) ? "found" : "not found");
    printf("Search 65: %s\n", search(root, 65) ? "found" : "not found");
    root = deleteNode(root, 20);
    root = deleteNode(root, 30);
    root = deleteNode(root, 50);
    printf("After deleting 20, 30, 50: "); inorder(root); printf("\n");
    return 0;
}

#include <iostream>
#include <queue>
using namespace std;

struct Node {
    int data;
    Node *left;
    Node *right;
    Node(int d) : data(d), left(nullptr), right(nullptr) {}
};

void preorder(Node *root) {     // node, left, right
    if (root == nullptr) return;
    cout << " " << root->data;
    preorder(root->left);
    preorder(root->right);
}

void inorder(Node *root) {      // left, node, right
    if (root == nullptr) return;
    inorder(root->left);
    cout << " " << root->data;
    inorder(root->right);
}

void postorder(Node *root) {    // left, right, node
    if (root == nullptr) return;
    postorder(root->left);
    postorder(root->right);
    cout << " " << root->data;
}

void levelOrder(Node *root) {   // row by row, using a queue
    queue<Node*> q;
    q.push(root);
    while (!q.empty()) {
        Node *cur = q.front();
        q.pop();
        cout << " " << cur->data;
        if (cur->left != nullptr) q.push(cur->left);
        if (cur->right != nullptr) q.push(cur->right);
    }
}

int main() {
    Node *root = new Node(1);
    root->left = new Node(2);
    root->right = new Node(3);
    root->left->left = new Node(4);
    root->left->right = new Node(5);
    root->right->right = new Node(6);
    cout << "Preorder:";
    preorder(root);
    cout << endl << "Inorder:";
    inorder(root);
    cout << endl << "Postorder:";
    postorder(root);
    cout << endl << "Level order:";
    levelOrder(root);
    cout << endl;
    return 0;
}

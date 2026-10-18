#include <iostream>
#include <queue>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int v) : val(v), left(NULL), right(NULL) {}
};

class BST {
public:
    TreeNode* root = nullptr;

    void insert(int v) { root = insertRec(root, v); }

    void levelOrder() {
        if (!root) return;
        queue<TreeNode*> q;
        q.push(root);
        int level = 0;
        while (!q.empty()) {
            int sz = q.size();
            cout << "Level " << level++ << ":";
            for (int i = 0; i < sz; i++) {
                TreeNode* cur = q.front();
                q.pop();
                cout << " " << cur->val;
                if (cur->left) q.push(cur->left);
                if (cur->right) q.push(cur->right);
            }
            cout << endl;
        }
    }

    int countLeaves(TreeNode* n) {
        if (n == NULL) return 0;
        if (!n->left && !n->right) return 1;
        return countLeaves(n->left) + countLeaves(n->right);
    }

private:
    TreeNode* insertRec(TreeNode* node, int v) {
        if (node == nullptr) return new TreeNode(v);
        if (v < node->val) node->left = insertRec(node->left, v);
        else node->right = insertRec(node->right, v);
        return node;
    }
};

int main() {
    BST tree;
    int vals[] = {8, 3, 10, 1, 6, 14, 4, 7, 13};
    for (int v : vals) tree.insert(v);
    tree.levelOrder();
    cout << "Leaves: " << tree.countLeaves(tree.root) << endl;
    return 0;
}

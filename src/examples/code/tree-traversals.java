import java.util.LinkedList;
import java.util.Queue;

public class Main {
    static class Node {
        int data;
        Node left, right;
        Node(int data) {
            this.data = data;
        }
    }

    static void preorder(Node root) {     // node, left, right
        if (root == null) return;
        System.out.print(" " + root.data);
        preorder(root.left);
        preorder(root.right);
    }

    static void inorder(Node root) {      // left, node, right
        if (root == null) return;
        inorder(root.left);
        System.out.print(" " + root.data);
        inorder(root.right);
    }

    static void postorder(Node root) {    // left, right, node
        if (root == null) return;
        postorder(root.left);
        postorder(root.right);
        System.out.print(" " + root.data);
    }

    static void levelOrder(Node root) {   // row by row, using a queue
        Queue<Node> queue = new LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            Node cur = queue.poll();
            System.out.print(" " + cur.data);
            if (cur.left != null) queue.add(cur.left);
            if (cur.right != null) queue.add(cur.right);
        }
    }

    public static void main(String[] args) {
        Node root = new Node(1);
        root.left = new Node(2);
        root.right = new Node(3);
        root.left.left = new Node(4);
        root.left.right = new Node(5);
        root.right.right = new Node(6);
        System.out.print("Preorder:");
        preorder(root);
        System.out.print("\nInorder:");
        inorder(root);
        System.out.print("\nPostorder:");
        postorder(root);
        System.out.print("\nLevel order:");
        levelOrder(root);
        System.out.println();
    }
}

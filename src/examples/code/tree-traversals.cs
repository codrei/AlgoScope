using System;
using System.Collections.Generic;

class Node {
    public int Data;
    public Node Left, Right;
    public Node(int data) {
        Data = data;
    }
}

class Program {
    static void Preorder(Node root) {     // node, left, right
        if (root == null) return;
        Console.Write(" " + root.Data);
        Preorder(root.Left);
        Preorder(root.Right);
    }

    static void Inorder(Node root) {      // left, node, right
        if (root == null) return;
        Inorder(root.Left);
        Console.Write(" " + root.Data);
        Inorder(root.Right);
    }

    static void Postorder(Node root) {    // left, right, node
        if (root == null) return;
        Postorder(root.Left);
        Postorder(root.Right);
        Console.Write(" " + root.Data);
    }

    static void LevelOrder(Node root) {   // row by row, using a queue
        Queue<Node> queue = new Queue<Node>();
        queue.Enqueue(root);
        while (queue.Count > 0) {
            Node cur = queue.Dequeue();
            Console.Write(" " + cur.Data);
            if (cur.Left != null) queue.Enqueue(cur.Left);
            if (cur.Right != null) queue.Enqueue(cur.Right);
        }
    }

    static void Main(string[] args) {
        Node root = new Node(1);
        root.Left = new Node(2);
        root.Right = new Node(3);
        root.Left.Left = new Node(4);
        root.Left.Right = new Node(5);
        root.Right.Right = new Node(6);
        Console.Write("Preorder:");
        Preorder(root);
        Console.Write("\nInorder:");
        Inorder(root);
        Console.Write("\nPostorder:");
        Postorder(root);
        Console.Write("\nLevel order:");
        LevelOrder(root);
        Console.WriteLine();
    }
}

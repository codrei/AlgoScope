using System;

class Node {
    public int Data;
    public Node Prev, Next;
    public Node(int data) {
        Data = data;
    }
}

class Program {
    static Node head = null;
    static Node tail = null;

    static void InsertEnd(int data) {
        Node node = new Node(data);
        node.Prev = tail;
        if (tail == null) {
            head = node;
        } else {
            tail.Next = node;
        }
        tail = node;
    }

    static void DeleteValue(int data) {
        Node cur = head;
        while (cur != null && cur.Data != data) {
            cur = cur.Next;
        }
        if (cur == null) {
            return;
        }
        // link the neighbors to each other, skipping cur
        if (cur.Prev != null) {
            cur.Prev.Next = cur.Next;
        } else {
            head = cur.Next;
        }
        if (cur.Next != null) {
            cur.Next.Prev = cur.Prev;
        } else {
            tail = cur.Prev;
        }
    }

    static void PrintForward() {
        Console.Write("Forward:");
        for (Node cur = head; cur != null; cur = cur.Next) {
            Console.Write(" " + cur.Data);
        }
        Console.WriteLine();
    }

    static void PrintBackward() {
        Console.Write("Backward:");
        for (Node cur = tail; cur != null; cur = cur.Prev) {
            Console.Write(" " + cur.Data);
        }
        Console.WriteLine();
    }

    static void Main(string[] args) {
        InsertEnd(10);
        InsertEnd(20);
        InsertEnd(30);
        InsertEnd(40);
        DeleteValue(20);
        PrintForward();
        PrintBackward();
    }
}

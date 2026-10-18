using System;

public class Node
{
    public int Value;
    public Node Left, Right;
    public Node(int value) { Value = value; }
}

public class BinarySearchTree
{
    public Node Root { get; private set; }

    public void Insert(int value) => Root = Insert(Root, value);

    private Node Insert(Node node, int value)
    {
        if (node == null) return new Node(value);
        if (value < node.Value) node.Left = Insert(node.Left, value);
        else node.Right = Insert(node.Right, value);
        return node;
    }

    public bool Contains(int value)
    {
        Node cur = Root;
        while (cur != null)
        {
            if (value == cur.Value) return true;
            cur = value < cur.Value ? cur.Left : cur.Right;
        }
        return false;
    }

    public void InOrder(Node n)
    {
        if (n == null) return;
        InOrder(n.Left);
        Console.Write(n.Value + " ");
        InOrder(n.Right);
    }

    public int Height(Node n) => n == null ? 0 : 1 + Math.Max(Height(n.Left), Height(n.Right));
}

public class Program
{
    public static void Main()
    {
        var bst = new BinarySearchTree();
        foreach (var v in new[] { 15, 10, 20, 8, 12, 17, 25 }) bst.Insert(v);
        bst.InOrder(bst.Root);
        Console.WriteLine();
        Console.WriteLine($"Height: {bst.Height(bst.Root)}, has 12: {bst.Contains(12)}, has 13: {bst.Contains(13)}");
    }
}

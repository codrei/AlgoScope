using System;
using System.Collections.Generic;

class MyQueue<T>
{
    private T[] items;
    private int front, rear, count;

    public MyQueue(int capacity)
    {
        items = new T[capacity];
        front = 0;
        rear = -1;
        count = 0;
    }

    public int Count => count;
    public bool IsEmpty => count == 0;

    public void Enqueue(T item)
    {
        if (count == items.Length) { Console.WriteLine("Queue is full"); return; }
        rear = (rear + 1) % items.Length;
        items[rear] = item;
        count++;
    }

    public T Dequeue()
    {
        T item = items[front];
        front = (front + 1) % items.Length;
        count--;
        return item;
    }
}

class Program
{
    static void Main(string[] args)
    {
        var q = new MyQueue<string>(3);
        q.Enqueue("A");
        q.Enqueue("B");
        q.Enqueue("C");
        q.Enqueue("D");
        Console.WriteLine($"Dequeued {q.Dequeue()}, count {q.Count}");
        q.Enqueue("E");
        while (!q.IsEmpty) Console.Write(q.Dequeue() + " ");
        Console.WriteLine();

        Queue<int> builtIn = new Queue<int>();
        for (int i = 1; i <= 3; i++) builtIn.Enqueue(i * 100);
        Console.WriteLine($"Peek {builtIn.Peek()}, Count {builtIn.Count}");
        Stack<int> st = new Stack<int>(new[] { 1, 2, 3 });
        Console.WriteLine($"Stack top {st.Peek()}");
    }
}

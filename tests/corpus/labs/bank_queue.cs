using System;
using System.Collections.Generic;

class Customer {
    public string Name { get; set; }
    public int Tickets { get; set; }
    public Customer(string name, int tickets) {
        Name = name;
        Tickets = tickets;
    }
}

class Program {
    static void Main(string[] args) {
        Queue<Customer> line = new Queue<Customer>();
        line.Enqueue(new Customer("Ana", 2));
        line.Enqueue(new Customer("Ben", 1));
        line.Enqueue(new Customer("Cy", 3));
        int time = 0;
        while (line.Count > 0) {
            Customer c = line.Dequeue();
            time++;
            c.Tickets--;
            if (c.Tickets > 0) {
                line.Enqueue(c);
            } else {
                Console.WriteLine($"{c.Name} done at t={time}");
            }
        }
        Stack<string> history = new Stack<string>();
        history.Push("home");
        history.Push("search");
        history.Push("results");
        Console.WriteLine(history.Pop() + " -> " + history.Peek() + " (" + history.Count + ")");
    }
}

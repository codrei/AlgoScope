using System;
using System.Collections.Generic;

class Account : IComparable<Account>
{
    public string Owner { get; set; }
    public decimal Balance { get; private set; }

    public Account(string owner, decimal balance)
    {
        Owner = owner;
        Balance = balance;
    }

    public void Deposit(decimal amount) => Balance += amount;

    public int CompareTo(Account other) => Balance.CompareTo(other.Balance);

    public override string ToString() => $"{Owner}: {Balance:F2}";
}

class Program
{
    static void Main()
    {
        var accounts = new List<Account>
        {
            new Account("Ana", 1500.50m),
            new Account("Ben", 320m),
            new Account("Cy", 980.25m)
        };
        accounts[1].Deposit(1000);
        accounts.Sort();
        foreach (var a in accounts) Console.WriteLine(a);
        accounts.Sort((x, y) => string.Compare(x.Owner, y.Owner));
        Console.WriteLine(string.Join(" | ", accounts));
        int[] nums = { 5, 3, 8, 1, 9 };
        Array.Sort(nums, (a, b) => b - a);
        Console.WriteLine(string.Join(",", nums));
    }
}

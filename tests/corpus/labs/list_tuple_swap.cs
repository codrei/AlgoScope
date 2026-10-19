using System;
using System.Collections.Generic;
using System.Text;

class Program {
    static Dictionary<int, long> memo = new Dictionary<int, long>();

    static long Fib(int n) {
        if (n <= 1) return n;
        if (memo.ContainsKey(n)) return memo[n];
        long r = Fib(n - 1) + Fib(n - 2);
        memo[n] = r;
        return r;
    }

    static void Main(string[] args) {
        var a = new List<int> { 5, 2, 8, 1, 9 };
        for (int i = 0; i < a.Count - 1; i++)
            for (int j = 0; j < a.Count - 1 - i; j++)
                if (a[j] > a[j + 1]) (a[j], a[j + 1]) = (a[j + 1], a[j]);
        Console.WriteLine(string.Join(", ", a));
        Console.WriteLine(Fib(50));
        string s = "Data Structures and Algorithms";
        string[] words = s.Split(' ');
        var sb = new StringBuilder();
        foreach (var w in words) sb.Append(char.ToUpper(w[0]));
        Console.WriteLine(sb.ToString() + " " + s.Substring(5, 10).ToUpper() + " " + s.IndexOf("and") + " " + words.Length);
        int[,] grid = new int[2, 3];
        for (int i = 0; i < 2; i++)
            for (int j = 0; j < 3; j++)
                grid[i, j] = i * 3 + j;
        Console.WriteLine($"{grid[1, 2]} {grid.GetLength(0)}x{grid.GetLength(1)}");
    }
}

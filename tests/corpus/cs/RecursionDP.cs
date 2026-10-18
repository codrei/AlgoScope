using System;
using System.Collections.Generic;

class Program
{
    static Dictionary<int, long> memo = new Dictionary<int, long>();

    static long Fib(int n)
    {
        if (n <= 1) return n;
        if (memo.ContainsKey(n)) return memo[n];
        long r = Fib(n - 1) + Fib(n - 2);
        memo[n] = r;
        return r;
    }

    static int Knapsack(int[] w, int[] v, int cap)
    {
        int[,] dp = new int[w.Length + 1, cap + 1];
        for (int i = 1; i <= w.Length; i++)
            for (int c = 0; c <= cap; c++)
            {
                dp[i, c] = dp[i - 1, c];
                if (w[i - 1] <= c) dp[i, c] = Math.Max(dp[i, c], dp[i - 1, c - w[i - 1]] + v[i - 1]);
            }
        return dp[w.Length, cap];
    }

    static void Hanoi(int n, char from, char to, char via, ref int moves)
    {
        if (n == 0) return;
        Hanoi(n - 1, from, via, to, ref moves);
        moves++;
        Hanoi(n - 1, via, to, from, ref moves);
    }

    static string Reverse(string s) => s.Length <= 1 ? s : Reverse(s.Substring(1)) + s[0];

    static void Main()
    {
        Console.WriteLine($"Fib(50) = {Fib(50)}");
        Console.WriteLine($"Knapsack = {Knapsack(new[] { 1, 3, 4, 5 }, new[] { 1, 4, 5, 7 }, 7)}");
        int moves = 0;
        Hanoi(5, 'A', 'C', 'B', ref moves);
        Console.WriteLine($"Hanoi(5) moves = {moves}");
        Console.WriteLine(Reverse("recursion"));
        double avg = (double)(3 + 4 + 5) / 2;
        Console.WriteLine($"{avg} {Math.Round(2.567, 2)} {10 / 3} {10 % 3} {7.0 / 2:F3}");
    }
}

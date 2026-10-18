using System;

class Program {
    static void Permute(char[] s, int start) {
        if (start == s.Length - 1) {
            Console.WriteLine(new string(s));
            return;
        }
        for (int i = start; i < s.Length; i++) {
            // choose s[i] for this position, arrange the rest, then undo
            char temp = s[start]; s[start] = s[i]; s[i] = temp;
            Permute(s, start + 1);
            temp = s[start]; s[start] = s[i]; s[i] = temp;
        }
    }

    static void Main(string[] args) {
        char[] s = { 'A', 'B', 'C' };
        Permute(s, 0);
    }
}

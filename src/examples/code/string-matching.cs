using System;

class Program {
    static void Search(string text, string pattern) {
        int n = text.Length;
        int m = pattern.Length;
        // slide the pattern over the text one position at a time
        for (int i = 0; i <= n - m; i++) {
            int j = 0;
            while (j < m && text[i + j] == pattern[j]) {
                j++;
            }
            if (j == m) {
                Console.WriteLine("Found at index " + i);
            }
        }
    }

    static void Main(string[] args) {
        string text = "AABAACAADAABAABA";
        string pattern = "AABA";
        Search(text, pattern);
    }
}

import type { Example } from './types';

export const fibDp: Example = {
  id: 'fibonacci-dp',
  title: 'Fibonacci (DP Table)',
  topic: 'Dynamic Programming',
  description: 'Bottom-up dynamic programming: fill dp[i] = dp[i−1] + dp[i−2] from left to right so each value is computed only once.',
  time: 'O(n)',
  space: 'O(n)',
  notes: 'Compare with recursive Fibonacci: O(n) instead of O(2^n).',
  output: 'fib(10) = 55\n',
  code: {
    c: String.raw`#include <stdio.h>

int fib(int n) {
    int dp[n + 1];
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}

int main() {
    int n = 10;
    printf("fib(%d) = %d\n", n, fib(n));
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;

int fib(int n) {
    vector<int> dp(n + 1);
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}

int main() {
    int n = 10;
    cout << "fib(" << n << ") = " << fib(n) << endl;
    return 0;
}
`,
    java: String.raw`public class Main {
    static int fib(int n) {
        int[] dp = new int[n + 1];
        dp[0] = 0;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        return dp[n];
    }

    public static void main(String[] args) {
        int n = 10;
        System.out.println("fib(" + n + ") = " + fib(n));
    }
}
`,
    csharp: String.raw`using System;

class Program {
    static int Fib(int n) {
        int[] dp = new int[n + 1];
        dp[0] = 0;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }
        return dp[n];
    }

    static void Main(string[] args) {
        int n = 10;
        Console.WriteLine($"fib({n}) = {Fib(n)}");
    }
}
`,
    python: String.raw`def fib(n):
    dp = [0] * (n + 1)
    dp[0] = 0
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]


n = 10
print(f"fib({n}) = {fib(n)}")
`,
  },
};

export const knapsack: Example = {
  id: 'knapsack',
  title: '0/1 Knapsack',
  topic: 'Dynamic Programming',
  description: 'dp[i][w] is the best value using the first i items with capacity w. Each cell either skips item i or takes it, whichever is worth more.',
  time: 'O(n·W)',
  space: 'O(n·W)',
  notes: 'n items, capacity W. Watch the table fill row by row.',
  output: 'Maximum value = 9\n',
  code: {
    c: String.raw`#include <stdio.h>

int max(int a, int b) {
    return a > b ? a : b;
}

int knapsack(int W, int wt[], int val[], int n) {
    int dp[n + 1][W + 1];
    for (int i = 0; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            if (i == 0 || w == 0) {
                dp[i][w] = 0;
            } else if (wt[i - 1] <= w) {
                dp[i][w] = max(val[i - 1] + dp[i - 1][w - wt[i - 1]], dp[i - 1][w]);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    return dp[n][W];
}

int main() {
    int val[] = {1, 4, 5, 7};
    int wt[] = {1, 3, 4, 5};
    int W = 7;
    int n = 4;
    printf("Maximum value = %d\n", knapsack(W, wt, val, n));
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
#include <vector>
using namespace std;

int knapsack(int W, int wt[], int val[], int n) {
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));
    for (int i = 0; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            if (i == 0 || w == 0) {
                dp[i][w] = 0;
            } else if (wt[i - 1] <= w) {
                dp[i][w] = max(val[i - 1] + dp[i - 1][w - wt[i - 1]], dp[i - 1][w]);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    return dp[n][W];
}

int main() {
    int val[] = {1, 4, 5, 7};
    int wt[] = {1, 3, 4, 5};
    int W = 7;
    int n = 4;
    cout << "Maximum value = " << knapsack(W, wt, val, n) << endl;
    return 0;
}
`,
    java: String.raw`public class Main {
    static int knapsack(int W, int[] wt, int[] val, int n) {
        int[][] dp = new int[n + 1][W + 1];
        for (int i = 0; i <= n; i++) {
            for (int w = 0; w <= W; w++) {
                if (i == 0 || w == 0) {
                    dp[i][w] = 0;
                } else if (wt[i - 1] <= w) {
                    dp[i][w] = Math.max(val[i - 1] + dp[i - 1][w - wt[i - 1]], dp[i - 1][w]);
                } else {
                    dp[i][w] = dp[i - 1][w];
                }
            }
        }
        return dp[n][W];
    }

    public static void main(String[] args) {
        int[] val = {1, 4, 5, 7};
        int[] wt = {1, 3, 4, 5};
        int W = 7;
        int n = 4;
        System.out.println("Maximum value = " + knapsack(W, wt, val, n));
    }
}
`,
    csharp: String.raw`using System;

class Program {
    static int Knapsack(int W, int[] wt, int[] val, int n) {
        int[,] dp = new int[n + 1, W + 1];
        for (int i = 0; i <= n; i++) {
            for (int w = 0; w <= W; w++) {
                if (i == 0 || w == 0) {
                    dp[i, w] = 0;
                } else if (wt[i - 1] <= w) {
                    dp[i, w] = Math.Max(val[i - 1] + dp[i - 1, w - wt[i - 1]], dp[i - 1, w]);
                } else {
                    dp[i, w] = dp[i - 1, w];
                }
            }
        }
        return dp[n, W];
    }

    static void Main(string[] args) {
        int[] val = { 1, 4, 5, 7 };
        int[] wt = { 1, 3, 4, 5 };
        int W = 7;
        int n = 4;
        Console.WriteLine($"Maximum value = {Knapsack(W, wt, val, n)}");
    }
}
`,
    python: String.raw`def knapsack(W, wt, val, n):
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        for w in range(W + 1):
            if i == 0 or w == 0:
                dp[i][w] = 0
            elif wt[i - 1] <= w:
                dp[i][w] = max(val[i - 1] + dp[i - 1][w - wt[i - 1]], dp[i - 1][w])
            else:
                dp[i][w] = dp[i - 1][w]
    return dp[n][W]


val = [1, 4, 5, 7]
wt = [1, 3, 4, 5]
W = 7
n = 4
print(f"Maximum value = {knapsack(W, wt, val, n)}")
`,
  },
};

export const lcs: Example = {
  id: 'lcs',
  title: 'Longest Common Subsequence',
  topic: 'Dynamic Programming',
  description: 'dp[i][j] is the LCS length of the first i letters of X and the first j letters of Y. Matching letters extend the diagonal; otherwise take the better neighbor.',
  time: 'O(m·n)',
  space: 'O(m·n)',
  notes: 'X = "ABCBDAB", Y = "BDCABA": one longest common subsequence is "BCBA".',
  output: 'LCS length = 4\n',
  code: {
    c: String.raw`#include <stdio.h>
#include <string.h>

int max(int a, int b) {
    return a > b ? a : b;
}

int lcs(char X[], char Y[]) {
    int m = strlen(X);
    int n = strlen(Y);
    int dp[m + 1][n + 1];
    for (int i = 0; i <= m; i++) {
        for (int j = 0; j <= n; j++) {
            if (i == 0 || j == 0) {
                dp[i][j] = 0;
            } else if (X[i - 1] == Y[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[m][n];
}

int main() {
    char X[] = "ABCBDAB";
    char Y[] = "BDCABA";
    printf("LCS length = %d\n", lcs(X, Y));
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
#include <string>
#include <vector>
using namespace std;

int lcs(string X, string Y) {
    int m = X.length();
    int n = Y.length();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
    for (int i = 0; i <= m; i++) {
        for (int j = 0; j <= n; j++) {
            if (i == 0 || j == 0) {
                dp[i][j] = 0;
            } else if (X[i - 1] == Y[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[m][n];
}

int main() {
    string X = "ABCBDAB";
    string Y = "BDCABA";
    cout << "LCS length = " << lcs(X, Y) << endl;
    return 0;
}
`,
    java: String.raw`public class Main {
    static int lcs(String X, String Y) {
        int m = X.length();
        int n = Y.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) {
            for (int j = 0; j <= n; j++) {
                if (i == 0 || j == 0) {
                    dp[i][j] = 0;
                } else if (X.charAt(i - 1) == Y.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        return dp[m][n];
    }

    public static void main(String[] args) {
        String X = "ABCBDAB";
        String Y = "BDCABA";
        System.out.println("LCS length = " + lcs(X, Y));
    }
}
`,
    csharp: String.raw`using System;

class Program {
    static int Lcs(string X, string Y) {
        int m = X.Length;
        int n = Y.Length;
        int[,] dp = new int[m + 1, n + 1];
        for (int i = 0; i <= m; i++) {
            for (int j = 0; j <= n; j++) {
                if (i == 0 || j == 0) {
                    dp[i, j] = 0;
                } else if (X[i - 1] == Y[j - 1]) {
                    dp[i, j] = dp[i - 1, j - 1] + 1;
                } else {
                    dp[i, j] = Math.Max(dp[i - 1, j], dp[i, j - 1]);
                }
            }
        }
        return dp[m, n];
    }

    static void Main(string[] args) {
        string X = "ABCBDAB";
        string Y = "BDCABA";
        Console.WriteLine($"LCS length = {Lcs(X, Y)}");
    }
}
`,
    python: String.raw`def lcs(X, Y):
    m = len(X)
    n = len(Y)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        for j in range(n + 1):
            if i == 0 or j == 0:
                dp[i][j] = 0
            elif X[i - 1] == Y[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]


X = "ABCBDAB"
Y = "BDCABA"
print(f"LCS length = {lcs(X, Y)}")
`,
  },
};

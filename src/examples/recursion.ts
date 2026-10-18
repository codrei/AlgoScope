import type { Example } from './types';

export const factorial: Example = {
  id: 'factorial',
  title: 'Factorial',
  topic: 'Recursion',
  description: 'n! = n × (n−1)!. Each call waits on the call stack until the base case (n ≤ 1) returns, then the results multiply on the way back.',
  time: 'O(n)',
  space: 'O(n)',
  notes: 'Space is O(n) because n calls are on the stack at the deepest point.',
  output: '5! = 120\n',
  code: {
    c: String.raw`#include <stdio.h>

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    int n = 5;
    int result = factorial(n);
    printf("%d! = %d\n", n, result);
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
using namespace std;

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    int n = 5;
    int result = factorial(n);
    cout << n << "! = " << result << endl;
    return 0;
}
`,
    java: String.raw`public class Main {
    static int factorial(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        int n = 5;
        int result = factorial(n);
        System.out.println(n + "! = " + result);
    }
}
`,
    csharp: String.raw`using System;

class Program {
    static int Factorial(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * Factorial(n - 1);
    }

    static void Main(string[] args) {
        int n = 5;
        int result = Factorial(n);
        Console.WriteLine($"{n}! = {result}");
    }
}
`,
    python: String.raw`def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)


n = 5
result = factorial(n)
print(f"{n}! = {result}")
`,
  },
};

export const fibonacci: Example = {
  id: 'fibonacci',
  title: 'Fibonacci (Recursive)',
  topic: 'Recursion',
  description: 'fib(n) = fib(n−1) + fib(n−2). Watch the call stack: the same values are computed again and again.',
  time: 'O(2ⁿ)',
  space: 'O(n)',
  notes: 'Exponential: fib(5) makes 15 calls. Compare with the dynamic programming version.',
  output: 'fib(5) = 5\n',
  code: {
    c: String.raw`#include <stdio.h>

int fib(int n) {
    if (n <= 1) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}

int main() {
    int n = 5;
    printf("fib(%d) = %d\n", n, fib(n));
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
using namespace std;

int fib(int n) {
    if (n <= 1) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}

int main() {
    int n = 5;
    cout << "fib(" << n << ") = " << fib(n) << endl;
    return 0;
}
`,
    java: String.raw`public class Main {
    static int fib(int n) {
        if (n <= 1) {
            return n;
        }
        return fib(n - 1) + fib(n - 2);
    }

    public static void main(String[] args) {
        int n = 5;
        System.out.println("fib(" + n + ") = " + fib(n));
    }
}
`,
    csharp: String.raw`using System;

class Program {
    static int Fib(int n) {
        if (n <= 1) {
            return n;
        }
        return Fib(n - 1) + Fib(n - 2);
    }

    static void Main(string[] args) {
        int n = 5;
        Console.WriteLine($"fib({n}) = {Fib(n)}");
    }
}
`,
    python: String.raw`def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)


n = 5
print(f"fib({n}) = {fib(n)}")
`,
  },
};

const HANOI_OUT = [
  'Move disk 1 from A to C',
  'Move disk 2 from A to B',
  'Move disk 1 from C to B',
  'Move disk 3 from A to C',
  'Move disk 1 from B to A',
  'Move disk 2 from B to C',
  'Move disk 1 from A to C',
].join('\n') + '\n';

export const hanoi: Example = {
  id: 'tower-of-hanoi',
  title: 'Tower of Hanoi',
  topic: 'Recursion',
  description: 'Move n disks from A to C: move n−1 disks out of the way to B, move the biggest disk to C, then move the n−1 disks onto it.',
  time: 'O(2ⁿ)',
  space: 'O(n)',
  notes: 'Needs exactly 2ⁿ − 1 moves: 7 moves for 3 disks.',
  output: HANOI_OUT,
  code: {
    c: String.raw`#include <stdio.h>

void hanoi(int n, char from, char to, char via) {
    if (n == 1) {
        printf("Move disk 1 from %c to %c\n", from, to);
        return;
    }
    hanoi(n - 1, from, via, to);
    printf("Move disk %d from %c to %c\n", n, from, to);
    hanoi(n - 1, via, to, from);
}

int main() {
    hanoi(3, 'A', 'C', 'B');
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
using namespace std;

void hanoi(int n, char from, char to, char via) {
    if (n == 1) {
        cout << "Move disk 1 from " << from << " to " << to << endl;
        return;
    }
    hanoi(n - 1, from, via, to);
    cout << "Move disk " << n << " from " << from << " to " << to << endl;
    hanoi(n - 1, via, to, from);
}

int main() {
    hanoi(3, 'A', 'C', 'B');
    return 0;
}
`,
    java: String.raw`public class Main {
    static void hanoi(int n, char from, char to, char via) {
        if (n == 1) {
            System.out.println("Move disk 1 from " + from + " to " + to);
            return;
        }
        hanoi(n - 1, from, via, to);
        System.out.println("Move disk " + n + " from " + from + " to " + to);
        hanoi(n - 1, via, to, from);
    }

    public static void main(String[] args) {
        hanoi(3, 'A', 'C', 'B');
    }
}
`,
    csharp: String.raw`using System;

class Program {
    static void Hanoi(int n, char from, char to, char via) {
        if (n == 1) {
            Console.WriteLine($"Move disk 1 from {from} to {to}");
            return;
        }
        Hanoi(n - 1, from, via, to);
        Console.WriteLine($"Move disk {n} from {from} to {to}");
        Hanoi(n - 1, via, to, from);
    }

    static void Main(string[] args) {
        Hanoi(3, 'A', 'C', 'B');
    }
}
`,
    python: String.raw`def hanoi(n, source, target, via):
    if n == 1:
        print(f"Move disk 1 from {source} to {target}")
        return
    hanoi(n - 1, source, via, target)
    print(f"Move disk {n} from {source} to {target}")
    hanoi(n - 1, via, target, source)


hanoi(3, "A", "C", "B")
`,
  },
};

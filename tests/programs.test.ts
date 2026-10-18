// Programs written the way students and teachers usually write them, beyond the built-in examples.
import { describe, expect, it } from 'vitest';
import './setup';
import { runCode } from '../src/engine';
import type { Lang } from '../src/engine/ir';

interface Case {
  name: string;
  lang: Lang;
  code: string;
  out: string;
  stdin?: string;
}

const CASES: Case[] = [
  // ------------------------------------------------------------------ C
  {
    name: 'scanf input',
    lang: 'c',
    stdin: '3 4',
    code: `#include <stdio.h>
int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("Sum = %d\\n", a + b);
    return 0;
}`,
    out: 'Sum = 7\n',
  },
  {
    name: 'pointer arithmetic and malloc array',
    lang: 'c',
    code: `#include <stdio.h>
#include <stdlib.h>
int main() {
    int n = 5;
    int *arr = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) arr[i] = i * i;
    int *p = arr;
    int sum = 0;
    for (int i = 0; i < n; i++) sum += *(p + i);
    printf("%d\\n", sum);
    free(arr);
    return 0;
}`,
    out: '30\n',
  },
  {
    name: 'typedef struct and struct values',
    lang: 'c',
    code: `#include <stdio.h>
typedef struct {
    int x, y;
} Point;
int main() {
    Point p = {1, 2};
    p.x = p.x + 10;
    printf("(%d, %d)\\n", p.x, p.y);
    return 0;
}`,
    out: '(11, 2)\n',
  },
  {
    name: 'do-while, switch, break, continue',
    lang: 'c',
    code: `#include <stdio.h>
int main() {
    int i = 0;
    do {
        i++;
        if (i == 2) continue;
        switch (i % 3) {
            case 0: printf("fizz "); break;
            case 1: printf("one "); break;
            default: printf("%d ", i);
        }
        if (i >= 5) break;
    } while (i < 10);
    printf("\\n");
    return 0;
}`,
    out: 'one fizz one 5 \n',
  },
  {
    name: 'reverse string in place',
    lang: 'c',
    code: `#include <stdio.h>
#include <string.h>
int main() {
    char s[] = "hello";
    int n = strlen(s);
    for (int i = 0; i < n / 2; i++) {
        char t = s[i];
        s[i] = s[n - 1 - i];
        s[n - 1 - i] = t;
    }
    printf("%s\\n", s);
    return 0;
}`,
    out: 'olleh\n',
  },
  {
    name: 'gcd recursion and integer division',
    lang: 'c',
    code: `#include <stdio.h>
int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }
int main() {
    printf("%d %d %.2f\\n", gcd(48, 18), 7 / 2, 7 / 2.0);
    return 0;
}`,
    out: '6 3 3.50\n',
  },
  // ------------------------------------------------------------------ C++
  {
    name: 'cin into vector, std::sort',
    lang: 'cpp',
    stdin: '5\n3 1 4 1 5',
    code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    sort(v.begin(), v.end());
    for (int x : v) cout << x << " ";
    cout << endl;
    return 0;
}`,
    out: '1 1 3 4 5 \n',
  },
  {
    name: 'class with private fields and initializer list',
    lang: 'cpp',
    code: `#include <iostream>
using namespace std;
class Stack {
private:
    int arr[10];
    int top;
public:
    Stack() : top(-1) {}
    void push(int x) { arr[++top] = x; }
    int pop() { return arr[top--]; }
    bool isEmpty() { return top == -1; }
};
int main() {
    Stack s;
    s.push(1);
    s.push(2);
    s.push(3);
    while (!s.isEmpty()) cout << s.pop() << " ";
    cout << endl;
    return 0;
}`,
    out: '3 2 1 \n',
  },
  {
    name: 'pass by reference',
    lang: 'cpp',
    code: `#include <iostream>
using namespace std;
void addOne(int &x) { x++; }
void swapVals(int &a, int &b) { int t = a; a = b; b = t; }
int main() {
    int a = 5, b = 9;
    addOne(a);
    swapVals(a, b);
    cout << a << " " << b << endl;
    return 0;
}`,
    out: '9 6\n',
  },
  {
    name: 'map word counts and pairs',
    lang: 'cpp',
    code: `#include <iostream>
#include <map>
#include <string>
using namespace std;
int main() {
    string words[] = {"b", "a", "b", "c", "a", "b"};
    map<string, int> count;
    for (int i = 0; i < 6; i++) count[words[i]]++;
    for (auto &p : count) cout << p.first << "=" << p.second << " ";
    cout << endl;
    if (count.find("z") == count.end()) cout << "no z" << endl;
    return 0;
}`,
    out: 'a=2 b=3 c=1 \nno z\n',
  },
  {
    name: 'stack and queue from the STL',
    lang: 'cpp',
    code: `#include <iostream>
#include <stack>
#include <queue>
using namespace std;
int main() {
    stack<int> s;
    queue<int> q;
    for (int i = 1; i <= 3; i++) { s.push(i); q.push(i); }
    while (!s.empty()) { cout << s.top(); s.pop(); }
    cout << " ";
    while (!q.empty()) { cout << q.front(); q.pop(); }
    cout << endl;
    return 0;
}`,
    out: '321 123\n',
  },
  {
    name: 'fixed and setprecision',
    lang: 'cpp',
    code: `#include <iostream>
#include <iomanip>
using namespace std;
int main() {
    double avg = 10 / 4.0;
    cout << avg << " " << fixed << setprecision(2) << avg << endl;
    cout << to_string(42) + "!" << endl;
    return 0;
}`,
    out: '2.5 2.50\n42!\n',
  },
  {
    name: 'vector by reference recursion',
    lang: 'cpp',
    code: `#include <iostream>
#include <vector>
using namespace std;
int sum(vector<int>& v, int i) {
    if (i == v.size()) return 0;
    return v[i] + sum(v, i + 1);
}
int main() {
    vector<int> v = {1, 2, 3, 4};
    v.push_back(5);
    cout << sum(v, 0) << " " << v.size() << endl;
    return 0;
}`,
    out: '15 5\n',
  },
  // ------------------------------------------------------------------ Java
  {
    name: 'Scanner input',
    lang: 'java',
    stdin: '4\n10 20 30 40',
    code: `import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int total = 0;
        for (int i = 0; i < n; i++) total += sc.nextInt();
        System.out.println("Average: " + (double) total / n);
    }
}`,
    out: 'Average: 25.0\n',
  },
  {
    name: 'separate class with instance methods',
    lang: 'java',
    code: `class Counter {
    private int count;
    private String name;
    Counter(String name) { this.name = name; count = 0; }
    void increment() { count++; }
    int getCount() { return count; }
    String getName() { return name; }
}
public class Main {
    public static void main(String[] args) {
        Counter c = new Counter("clicks");
        for (int i = 0; i < 3; i++) c.increment();
        System.out.println(c.getName() + ": " + c.getCount());
    }
}`,
    out: 'clicks: 3\n',
  },
  {
    name: 'ArrayList and HashMap',
    lang: 'java',
    code: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        list.add(5); list.add(3); list.add(8);
        Collections.sort(list);
        System.out.println(list + " size=" + list.size() + " first=" + list.get(0));
        HashMap<String, Integer> ages = new HashMap<>();
        ages.put("Ana", 20);
        ages.put("Ben", 22);
        ages.put("Ana", ages.getOrDefault("Ana", 0) + 1);
        System.out.println(ages.get("Ana") + " " + ages.containsKey("Cy") + " " + ages.size());
    }
}`,
    out: '[3, 5, 8] size=3 first=3\n21 false 2\n',
  },
  {
    name: 'Strings and StringBuilder',
    lang: 'java',
    code: `public class Main {
    public static void main(String[] args) {
        String s = "Hello World";
        System.out.println(s.length() + " " + s.toUpperCase() + " " + s.charAt(4) + " " + s.substring(0, 5));
        String rev = new StringBuilder(s).reverse().toString();
        System.out.println(rev + " " + s.indexOf("World") + " " + s.equals("Hello World"));
        System.out.printf("%.2f %d %s%n", 3.14159, 42, "ok");
    }
}`,
    out: '11 HELLO WORLD o Hello\ndlroW olleH 6 true\n3.14 42 ok\n',
  },
  {
    name: 'inheritance and overriding',
    lang: 'java',
    code: `class Shape {
    double area() { return 0; }
    String name() { return "shape"; }
}
class Square extends Shape {
    double side;
    Square(double s) { side = s; }
    double area() { return side * side; }
    String name() { return "square"; }
}
public class Main {
    public static void main(String[] args) {
        Shape sq = new Square(3);
        System.out.println(sq.name() + " " + sq.area());
    }
}`,
    out: 'square 9.0\n',
  },
  // ------------------------------------------------------------------ C#
  {
    name: 'Console.ReadLine and int.Parse',
    lang: 'csharp',
    stdin: '6\n7',
    code: `using System;
class Program {
    static void Main() {
        int a = int.Parse(Console.ReadLine());
        int b = Convert.ToInt32(Console.ReadLine());
        Console.WriteLine("{0} x {1} = {2}", a, b, a * b);
    }
}`,
    out: '6 x 7 = 42\n',
  },
  {
    name: 'List, Dictionary, foreach KeyValuePair',
    lang: 'csharp',
    code: `using System;
using System.Collections.Generic;
class Program {
    static void Main() {
        List<int> nums = new List<int> { 4, 2, 9 };
        nums.Add(1);
        nums.Sort();
        Console.WriteLine(string.Join(",", nums) + " count=" + nums.Count);
        Dictionary<string, int> stock = new Dictionary<string, int>();
        stock["pen"] = 3;
        stock["ink"] = 5;
        stock["pen"] += 2;
        foreach (KeyValuePair<string, int> kv in stock) {
            Console.WriteLine($"{kv.Key}: {kv.Value}");
        }
    }
}`,
    out: '1,2,4,9 count=4\npen: 5\nink: 5\n',
  },
  {
    name: 'class with auto-properties and formatting',
    lang: 'csharp',
    code: `using System;
class Student {
    public string Name { get; set; }
    public double Grade { get; set; }
    public Student(string name, double grade) { Name = name; Grade = grade; }
}
class Program {
    static void Main() {
        Student s = new Student("Lia", 91.456);
        Console.WriteLine($"{s.Name} got {s.Grade:F1}");
        int[][] jag = new int[2][];
        jag[0] = new int[] { 1, 2 };
        jag[1] = new int[] { 3 };
        Console.WriteLine(jag[0][1] + jag[1][0]);
    }
}`,
    out: 'Lia got 91.5\n5\n',
  },
  // ------------------------------------------------------------------ Python
  {
    name: 'input() and int()',
    lang: 'python',
    stdin: '5\n',
    code: `n = int(input("n? "))
total = 0
for i in range(1, n + 1):
    total += i
print("Sum:", total)`,
    out: 'n? Sum: 15\n',
  },
  {
    name: 'comprehensions, slicing, sorted with key, enumerate, zip',
    lang: 'python',
    code: `nums = [5, 3, 8, 1]
squares = [x * x for x in nums if x > 2]
print(squares, nums[1:3], nums[::-1])
words = ["pear", "fig", "banana"]
print(sorted(words, key=len), sorted(nums, reverse=True))
for i, (w, n) in enumerate(zip(words, nums)):
    print(i, w, n)`,
    out: '[25, 9, 64] [3, 8] [1, 8, 3, 5]\n[\'fig\', \'pear\', \'banana\'] [8, 5, 3, 1]\n0 pear 5\n1 fig 3\n2 banana 8\n',
  },
  {
    name: 'class-based stack',
    lang: 'python',
    code: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, x):
        self.items.append(x)

    def pop(self):
        return self.items.pop()

    def is_empty(self):
        return len(self.items) == 0


s = Stack()
for x in [1, 2, 3]:
    s.push(x)
out = []
while not s.is_empty():
    out.append(s.pop())
print(out)`,
    out: '[3, 2, 1]\n',
  },
  {
    name: 'dict counting, memo recursion, f-string formats',
    lang: 'python',
    code: `text = "banana"
counts = {}
for ch in text:
    counts[ch] = counts.get(ch, 0) + 1
print(counts)

memo = {}
def fib(n):
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib(n - 1) + fib(n - 2)
    return memo[n]

print(f"{fib(30)} {3.14159:.2f} {'x':>3}|{7:03d} {10 / 4} {10 // 4}")`,
    out: "{'b': 1, 'a': 3, 'n': 2}\n832040 3.14   x|007 2.5 2\n",
  },
  {
    name: 'strings: split, join, methods',
    lang: 'python',
    code: `line = "the quick brown fox"
parts = line.split()
print(len(parts), "-".join(p.upper() for p in parts), line.count("o"), line.find("brown"))
print(" ".join(reversed(parts)), line.replace("quick", "slow").title())`,
    out: '4 THE-QUICK-BROWN-FOX 2 10\nfox brown quick the The Slow Brown Fox\n',
  },
];

describe('student-style programs', () => {
  it.each(CASES.map((c) => [`${c.lang}: ${c.name}`, c] as const))('%s', async (_n, c) => {
    const r = await runCode(c.lang, c.code, { stdin: c.stdin, maxSteps: 20000 });
    expect(r.compileError).toBeUndefined();
    expect(r.trace!.error).toBeUndefined();
    expect(r.trace!.stdout).toBe(c.out);
  });
});

describe('errors are reported clearly', () => {
  it('syntax error has a line number', async () => {
    const r = await runCode('cpp', 'int main() {\n  int x = 5\n  return 0;\n}');
    expect(r.compileError?.line).toBe(2);
  });
  it('index out of bounds', async () => {
    const r = await runCode('java', 'public class Main { public static void main(String[] a) { int[] x = new int[3]; x[3] = 1; } }');
    expect(r.trace?.error?.msg).toMatch(/out of bounds/);
  });
  it('infinite loop stops at the step limit', async () => {
    const r = await runCode('python', 'i = 0\nwhile True:\n    i += 1\n', { maxSteps: 500 });
    expect(r.trace?.truncated).toBe(true);
  });
  it('runaway recursion is caught', async () => {
    const r = await runCode('c', 'int f(int n) { return f(n + 1); }\nint main() { return f(0); }', { maxSteps: 100000 });
    expect(r.trace?.error?.msg).toMatch(/stack overflow/);
  });
  it('null pointer is explained', async () => {
    const r = await runCode('cpp', 'struct N { int v; N* next; };\nint main() { N* p = nullptr; return p->v; }');
    expect(r.trace?.error?.msg).toMatch(/null/);
  });
});

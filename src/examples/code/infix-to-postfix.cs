using System;
using System.Collections.Generic;

class Program {
    static int Precedence(char op) {
        if (op == '*' || op == '/') {
            return 2;
        }
        if (op == '+' || op == '-') {
            return 1;
        }
        return 0;
    }

    static string ToPostfix(string infix) {
        Stack<char> ops = new Stack<char>();
        string postfix = "";
        foreach (char c in infix) {
            if (c >= 'A' && c <= 'Z') {
                postfix += c;                  // operands go straight to the output
            } else if (c == '(') {
                ops.Push(c);
            } else if (c == ')') {
                while (ops.Peek() != '(') {
                    postfix += ops.Pop();
                }
                ops.Pop();                     // drop the '('
            } else {
                // pop operators that bind at least as tightly
                while (ops.Count > 0 && Precedence(ops.Peek()) >= Precedence(c)) {
                    postfix += ops.Pop();
                }
                ops.Push(c);
            }
        }
        while (ops.Count > 0) {
            postfix += ops.Pop();
        }
        return postfix;
    }

    static void Main(string[] args) {
        string infix = "A+B*(C-D)/E";
        Console.WriteLine("Infix: " + infix);
        Console.WriteLine("Postfix: " + ToPostfix(infix));
    }
}

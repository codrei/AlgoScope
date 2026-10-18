import java.util.Stack;

public class Main {
    static int precedence(char op) {
        if (op == '*' || op == '/') {
            return 2;
        }
        if (op == '+' || op == '-') {
            return 1;
        }
        return 0;
    }

    static String toPostfix(String infix) {
        Stack<Character> ops = new Stack<>();
        String postfix = "";
        for (char c : infix.toCharArray()) {
            if (c >= 'A' && c <= 'Z') {
                postfix += c;                  // operands go straight to the output
            } else if (c == '(') {
                ops.push(c);
            } else if (c == ')') {
                while (ops.peek() != '(') {
                    postfix += ops.pop();
                }
                ops.pop();                     // drop the '('
            } else {
                // pop operators that bind at least as tightly
                while (!ops.isEmpty() && precedence(ops.peek()) >= precedence(c)) {
                    postfix += ops.pop();
                }
                ops.push(c);
            }
        }
        while (!ops.isEmpty()) {
            postfix += ops.pop();
        }
        return postfix;
    }

    public static void main(String[] args) {
        String infix = "A+B*(C-D)/E";
        System.out.println("Infix: " + infix);
        System.out.println("Postfix: " + toPostfix(infix));
    }
}

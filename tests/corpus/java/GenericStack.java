import java.util.EmptyStackException;

public class Main {
    static class Stack<T> {
        private T[] items;
        private int top;

        @SuppressWarnings("unchecked")
        Stack(int capacity) {
            items = (T[]) new Object[capacity];
            top = -1;
        }

        void push(T item) {
            if (top == items.length - 1) {
                System.out.println("Stack is full");
                return;
            }
            items[++top] = item;
        }

        T pop() {
            if (isEmpty()) return null;
            T item = items[top];
            items[top--] = null;
            return item;
        }

        T peek() { return items[top]; }
        boolean isEmpty() { return top == -1; }
        int size() { return top + 1; }
    }

    static String reverse(String s) {
        Stack<Character> st = new Stack<>(s.length());
        for (char c : s.toCharArray()) st.push(c);
        String out = "";
        while (!st.isEmpty()) out += st.pop();
        return out;
    }

    public static void main(String[] args) {
        Stack<Integer> s = new Stack<>(3);
        s.push(1);
        s.push(2);
        s.push(3);
        s.push(4);
        System.out.println("Peek: " + s.peek() + ", size: " + s.size());
        while (!s.isEmpty()) System.out.print(s.pop() + " ");
        System.out.println();
        System.out.println(reverse("algorithm"));
    }
}

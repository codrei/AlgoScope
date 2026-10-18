import type { Example } from './types';

const STACK_OUT = 'Pushed 10\nPushed 20\nPushed 30\nPopped 30\nPushed 40\nPopped 40\nPopped 20\n';

export const stackArray: Example = {
  id: 'stack-array',
  title: 'Stack (Array)',
  topic: 'Data Structures',
  description: 'Last In, First Out. push puts a value on top and moves top up; pop takes the top value and moves top down.',
  time: 'O(1)',
  space: 'O(n)',
  notes: 'push and pop are O(1). Popped values stay in the array but are no longer part of the stack.',
  output: STACK_OUT,
  code: {
    c: String.raw`#include <stdio.h>
#define MAX 5

int stack[MAX];
int top = -1;

void push(int value) {
    if (top == MAX - 1) {
        printf("Stack overflow\n");
        return;
    }
    top++;
    stack[top] = value;
    printf("Pushed %d\n", value);
}

int pop() {
    if (top == -1) {
        printf("Stack underflow\n");
        return -1;
    }
    int value = stack[top];
    top--;
    return value;
}

int main() {
    push(10);
    push(20);
    push(30);
    printf("Popped %d\n", pop());
    push(40);
    printf("Popped %d\n", pop());
    printf("Popped %d\n", pop());
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
using namespace std;

const int MAX = 5;
int stack[MAX];
int top = -1;

void push(int value) {
    if (top == MAX - 1) {
        cout << "Stack overflow" << endl;
        return;
    }
    top++;
    stack[top] = value;
    cout << "Pushed " << value << endl;
}

int pop() {
    if (top == -1) {
        cout << "Stack underflow" << endl;
        return -1;
    }
    int value = stack[top];
    top--;
    return value;
}

int main() {
    push(10);
    push(20);
    push(30);
    cout << "Popped " << pop() << endl;
    push(40);
    cout << "Popped " << pop() << endl;
    cout << "Popped " << pop() << endl;
    return 0;
}
`,
    java: String.raw`public class Main {
    static final int MAX = 5;
    static int[] stack = new int[MAX];
    static int top = -1;

    static void push(int value) {
        if (top == MAX - 1) {
            System.out.println("Stack overflow");
            return;
        }
        top++;
        stack[top] = value;
        System.out.println("Pushed " + value);
    }

    static int pop() {
        if (top == -1) {
            System.out.println("Stack underflow");
            return -1;
        }
        int value = stack[top];
        top--;
        return value;
    }

    public static void main(String[] args) {
        push(10);
        push(20);
        push(30);
        System.out.println("Popped " + pop());
        push(40);
        System.out.println("Popped " + pop());
        System.out.println("Popped " + pop());
    }
}
`,
    csharp: String.raw`using System;

class Program {
    const int MAX = 5;
    static int[] stack = new int[MAX];
    static int top = -1;

    static void Push(int value) {
        if (top == MAX - 1) {
            Console.WriteLine("Stack overflow");
            return;
        }
        top++;
        stack[top] = value;
        Console.WriteLine($"Pushed {value}");
    }

    static int Pop() {
        if (top == -1) {
            Console.WriteLine("Stack underflow");
            return -1;
        }
        int value = stack[top];
        top--;
        return value;
    }

    static void Main(string[] args) {
        Push(10);
        Push(20);
        Push(30);
        Console.WriteLine($"Popped {Pop()}");
        Push(40);
        Console.WriteLine($"Popped {Pop()}");
        Console.WriteLine($"Popped {Pop()}");
    }
}
`,
    python: String.raw`MAX = 5
stack = [0] * MAX
top = -1


def push(value):
    global top
    if top == MAX - 1:
        print("Stack overflow")
        return
    top += 1
    stack[top] = value
    print(f"Pushed {value}")


def pop():
    global top
    if top == -1:
        print("Stack underflow")
        return -1
    value = stack[top]
    top -= 1
    return value


push(10)
push(20)
push(30)
print(f"Popped {pop()}")
push(40)
print(f"Popped {pop()}")
print(f"Popped {pop()}")
`,
  },
};

const QUEUE_OUT = 'Enqueued 10\nEnqueued 20\nEnqueued 30\nDequeued 10\nEnqueued 40\nDequeued 20\nDequeued 30\n';

export const queueArray: Example = {
  id: 'queue-circular',
  title: 'Queue (Circular Array)',
  topic: 'Data Structures',
  description: 'First In, First Out. enqueue adds at rear, dequeue removes from front, and both wrap around the array with % SIZE.',
  time: 'O(1)',
  space: 'O(n)',
  notes: 'The modulo (%) lets the queue reuse the freed slots at the start of the array.',
  output: QUEUE_OUT,
  code: {
    c: String.raw`#include <stdio.h>
#define SIZE 5

int queue[SIZE];
int front = 0, rear = -1, count = 0;

void enqueue(int value) {
    if (count == SIZE) {
        printf("Queue is full\n");
        return;
    }
    rear = (rear + 1) % SIZE;
    queue[rear] = value;
    count++;
    printf("Enqueued %d\n", value);
}

int dequeue() {
    if (count == 0) {
        printf("Queue is empty\n");
        return -1;
    }
    int value = queue[front];
    front = (front + 1) % SIZE;
    count--;
    return value;
}

int main() {
    enqueue(10);
    enqueue(20);
    enqueue(30);
    printf("Dequeued %d\n", dequeue());
    enqueue(40);
    printf("Dequeued %d\n", dequeue());
    printf("Dequeued %d\n", dequeue());
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
using namespace std;

const int SIZE = 5;
int queue[SIZE];
int front = 0, rear = -1, count = 0;

void enqueue(int value) {
    if (count == SIZE) {
        cout << "Queue is full" << endl;
        return;
    }
    rear = (rear + 1) % SIZE;
    queue[rear] = value;
    count++;
    cout << "Enqueued " << value << endl;
}

int dequeue() {
    if (count == 0) {
        cout << "Queue is empty" << endl;
        return -1;
    }
    int value = queue[front];
    front = (front + 1) % SIZE;
    count--;
    return value;
}

int main() {
    enqueue(10);
    enqueue(20);
    enqueue(30);
    cout << "Dequeued " << dequeue() << endl;
    enqueue(40);
    cout << "Dequeued " << dequeue() << endl;
    cout << "Dequeued " << dequeue() << endl;
    return 0;
}
`,
    java: String.raw`public class Main {
    static final int SIZE = 5;
    static int[] queue = new int[SIZE];
    static int front = 0, rear = -1, count = 0;

    static void enqueue(int value) {
        if (count == SIZE) {
            System.out.println("Queue is full");
            return;
        }
        rear = (rear + 1) % SIZE;
        queue[rear] = value;
        count++;
        System.out.println("Enqueued " + value);
    }

    static int dequeue() {
        if (count == 0) {
            System.out.println("Queue is empty");
            return -1;
        }
        int value = queue[front];
        front = (front + 1) % SIZE;
        count--;
        return value;
    }

    public static void main(String[] args) {
        enqueue(10);
        enqueue(20);
        enqueue(30);
        System.out.println("Dequeued " + dequeue());
        enqueue(40);
        System.out.println("Dequeued " + dequeue());
        System.out.println("Dequeued " + dequeue());
    }
}
`,
    csharp: String.raw`using System;

class Program {
    const int SIZE = 5;
    static int[] queue = new int[SIZE];
    static int front = 0, rear = -1, count = 0;

    static void Enqueue(int value) {
        if (count == SIZE) {
            Console.WriteLine("Queue is full");
            return;
        }
        rear = (rear + 1) % SIZE;
        queue[rear] = value;
        count++;
        Console.WriteLine($"Enqueued {value}");
    }

    static int Dequeue() {
        if (count == 0) {
            Console.WriteLine("Queue is empty");
            return -1;
        }
        int value = queue[front];
        front = (front + 1) % SIZE;
        count--;
        return value;
    }

    static void Main(string[] args) {
        Enqueue(10);
        Enqueue(20);
        Enqueue(30);
        Console.WriteLine($"Dequeued {Dequeue()}");
        Enqueue(40);
        Console.WriteLine($"Dequeued {Dequeue()}");
        Console.WriteLine($"Dequeued {Dequeue()}");
    }
}
`,
    python: String.raw`SIZE = 5
queue = [0] * SIZE
front = 0
rear = -1
count = 0


def enqueue(value):
    global rear, count
    if count == SIZE:
        print("Queue is full")
        return
    rear = (rear + 1) % SIZE
    queue[rear] = value
    count += 1
    print(f"Enqueued {value}")


def dequeue():
    global front, count
    if count == 0:
        print("Queue is empty")
        return -1
    value = queue[front]
    front = (front + 1) % SIZE
    count -= 1
    return value


enqueue(10)
enqueue(20)
enqueue(30)
print(f"Dequeued {dequeue()}")
enqueue(40)
print(f"Dequeued {dequeue()}")
print(f"Dequeued {dequeue()}")
`,
  },
};

export const balancedParens: Example = {
  id: 'balanced-parentheses',
  title: 'Balanced Parentheses',
  topic: 'Data Structures',
  description: 'A classic stack problem: push every opening bracket, and for every closing bracket pop and check that it matches.',
  time: 'O(n)',
  space: 'O(n)',
  notes: 'The string is balanced only if every bracket matched and the stack is empty at the end.',
  output: '{[()]} is balanced\n([)] is not balanced\n',
  code: {
    c: String.raw`#include <stdio.h>

char stack[100];
int top = -1;

void push(char c) {
    top++;
    stack[top] = c;
}

char pop() {
    char c = stack[top];
    top--;
    return c;
}

int isMatching(char open, char close) {
    return (open == '(' && close == ')') ||
           (open == '[' && close == ']') ||
           (open == '{' && close == '}');
}

int isBalanced(char expr[]) {
    top = -1;
    for (int i = 0; expr[i] != '\0'; i++) {
        char c = expr[i];
        if (c == '(' || c == '[' || c == '{') {
            push(c);
        } else if (c == ')' || c == ']' || c == '}') {
            if (top == -1 || !isMatching(pop(), c)) {
                return 0;
            }
        }
    }
    return top == -1;
}

int main() {
    char a[] = "{[()]}";
    char b[] = "([)]";
    printf("%s is %s\n", a, isBalanced(a) ? "balanced" : "not balanced");
    printf("%s is %s\n", b, isBalanced(b) ? "balanced" : "not balanced");
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
#include <stack>
#include <string>
using namespace std;

bool isMatching(char open, char close) {
    return (open == '(' && close == ')') ||
           (open == '[' && close == ']') ||
           (open == '{' && close == '}');
}

bool isBalanced(string expr) {
    stack<char> st;
    for (char c : expr) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else if (c == ')' || c == ']' || c == '}') {
            if (st.empty() || !isMatching(st.top(), c)) {
                return false;
            }
            st.pop();
        }
    }
    return st.empty();
}

int main() {
    string a = "{[()]}";
    string b = "([)]";
    cout << a << " is " << (isBalanced(a) ? "balanced" : "not balanced") << endl;
    cout << b << " is " << (isBalanced(b) ? "balanced" : "not balanced") << endl;
    return 0;
}
`,
    java: String.raw`import java.util.Stack;

public class Main {
    static boolean isMatching(char open, char close) {
        return (open == '(' && close == ')') ||
               (open == '[' && close == ']') ||
               (open == '{' && close == '}');
    }

    static boolean isBalanced(String expr) {
        Stack<Character> st = new Stack<>();
        for (char c : expr.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                st.push(c);
            } else if (c == ')' || c == ']' || c == '}') {
                if (st.isEmpty() || !isMatching(st.peek(), c)) {
                    return false;
                }
                st.pop();
            }
        }
        return st.isEmpty();
    }

    public static void main(String[] args) {
        String a = "{[()]}";
        String b = "([)]";
        System.out.println(a + " is " + (isBalanced(a) ? "balanced" : "not balanced"));
        System.out.println(b + " is " + (isBalanced(b) ? "balanced" : "not balanced"));
    }
}
`,
    csharp: String.raw`using System;
using System.Collections.Generic;

class Program {
    static bool IsMatching(char open, char close) {
        return (open == '(' && close == ')') ||
               (open == '[' && close == ']') ||
               (open == '{' && close == '}');
    }

    static bool IsBalanced(string expr) {
        Stack<char> st = new Stack<char>();
        foreach (char c in expr) {
            if (c == '(' || c == '[' || c == '{') {
                st.Push(c);
            } else if (c == ')' || c == ']' || c == '}') {
                if (st.Count == 0 || !IsMatching(st.Peek(), c)) {
                    return false;
                }
                st.Pop();
            }
        }
        return st.Count == 0;
    }

    static void Main(string[] args) {
        string a = "{[()]}";
        string b = "([)]";
        Console.WriteLine(a + " is " + (IsBalanced(a) ? "balanced" : "not balanced"));
        Console.WriteLine(b + " is " + (IsBalanced(b) ? "balanced" : "not balanced"));
    }
}
`,
    python: String.raw`def is_matching(open_ch, close_ch):
    return (open_ch == "(" and close_ch == ")") or \
           (open_ch == "[" and close_ch == "]") or \
           (open_ch == "{" and close_ch == "}")


def is_balanced(expr):
    stack = []
    for c in expr:
        if c in "([{":
            stack.append(c)
        elif c in ")]}":
            if not stack or not is_matching(stack[-1], c):
                return False
            stack.pop()
    return len(stack) == 0


a = "{[()]}"
b = "([)]"
print(a, "is", "balanced" if is_balanced(a) else "not balanced")
print(b, "is", "balanced" if is_balanced(b) else "not balanced")
`,
  },
};

const LL_OUT = '10 -> 20 -> 30 -> 40 -> NULL\n40 -> 30 -> 20 -> 10 -> NULL\n';

export const linkedList: Example = {
  id: 'linked-list',
  title: 'Linked List (Insert & Reverse)',
  topic: 'Data Structures',
  description: 'Each node holds a value and a pointer to the next node. Watch head, cur, prev and next move while the list is built and then reversed in place.',
  time: 'O(n)',
  space: 'O(1)',
  notes: 'Inserting at the end walks the whole list (O(n)); reversing changes every next pointer once (O(n)).',
  output: LL_OUT,
  code: {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

struct Node* createNode(int data) {
    struct Node* node = (struct Node*)malloc(sizeof(struct Node));
    node->data = data;
    node->next = NULL;
    return node;
}

struct Node* insertEnd(struct Node* head, int data) {
    struct Node* newNode = createNode(data);
    if (head == NULL) {
        return newNode;
    }
    struct Node* cur = head;
    while (cur->next != NULL) {
        cur = cur->next;
    }
    cur->next = newNode;
    return head;
}

void printList(struct Node* head) {
    struct Node* cur = head;
    while (cur != NULL) {
        printf("%d -> ", cur->data);
        cur = cur->next;
    }
    printf("NULL\n");
}

struct Node* reverse(struct Node* head) {
    struct Node* prev = NULL;
    struct Node* cur = head;
    while (cur != NULL) {
        struct Node* next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}

int main() {
    struct Node* head = NULL;
    head = insertEnd(head, 10);
    head = insertEnd(head, 20);
    head = insertEnd(head, 30);
    head = insertEnd(head, 40);
    printList(head);
    head = reverse(head);
    printList(head);
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int value) {
        data = value;
        next = nullptr;
    }
};

Node* insertEnd(Node* head, int value) {
    Node* newNode = new Node(value);
    if (head == nullptr) {
        return newNode;
    }
    Node* cur = head;
    while (cur->next != nullptr) {
        cur = cur->next;
    }
    cur->next = newNode;
    return head;
}

void printList(Node* head) {
    Node* cur = head;
    while (cur != nullptr) {
        cout << cur->data << " -> ";
        cur = cur->next;
    }
    cout << "NULL" << endl;
}

Node* reverse(Node* head) {
    Node* prev = nullptr;
    Node* cur = head;
    while (cur != nullptr) {
        Node* next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}

int main() {
    Node* head = nullptr;
    head = insertEnd(head, 10);
    head = insertEnd(head, 20);
    head = insertEnd(head, 30);
    head = insertEnd(head, 40);
    printList(head);
    head = reverse(head);
    printList(head);
    return 0;
}
`,
    java: String.raw`public class Main {
    static class Node {
        int data;
        Node next;

        Node(int data) {
            this.data = data;
            this.next = null;
        }
    }

    static Node insertEnd(Node head, int data) {
        Node newNode = new Node(data);
        if (head == null) {
            return newNode;
        }
        Node cur = head;
        while (cur.next != null) {
            cur = cur.next;
        }
        cur.next = newNode;
        return head;
    }

    static void printList(Node head) {
        Node cur = head;
        while (cur != null) {
            System.out.print(cur.data + " -> ");
            cur = cur.next;
        }
        System.out.println("NULL");
    }

    static Node reverse(Node head) {
        Node prev = null;
        Node cur = head;
        while (cur != null) {
            Node next = cur.next;
            cur.next = prev;
            prev = cur;
            cur = next;
        }
        return prev;
    }

    public static void main(String[] args) {
        Node head = null;
        head = insertEnd(head, 10);
        head = insertEnd(head, 20);
        head = insertEnd(head, 30);
        head = insertEnd(head, 40);
        printList(head);
        head = reverse(head);
        printList(head);
    }
}
`,
    csharp: String.raw`using System;

class Node {
    public int data;
    public Node next;

    public Node(int data) {
        this.data = data;
        this.next = null;
    }
}

class Program {
    static Node InsertEnd(Node head, int data) {
        Node newNode = new Node(data);
        if (head == null) {
            return newNode;
        }
        Node cur = head;
        while (cur.next != null) {
            cur = cur.next;
        }
        cur.next = newNode;
        return head;
    }

    static void PrintList(Node head) {
        Node cur = head;
        while (cur != null) {
            Console.Write(cur.data + " -> ");
            cur = cur.next;
        }
        Console.WriteLine("NULL");
    }

    static Node Reverse(Node head) {
        Node prev = null;
        Node cur = head;
        while (cur != null) {
            Node next = cur.next;
            cur.next = prev;
            prev = cur;
            cur = next;
        }
        return prev;
    }

    static void Main(string[] args) {
        Node head = null;
        head = InsertEnd(head, 10);
        head = InsertEnd(head, 20);
        head = InsertEnd(head, 30);
        head = InsertEnd(head, 40);
        PrintList(head);
        head = Reverse(head);
        PrintList(head);
    }
}
`,
    python: String.raw`class Node:
    def __init__(self, data):
        self.data = data
        self.next = None


def insert_end(head, data):
    new_node = Node(data)
    if head is None:
        return new_node
    cur = head
    while cur.next is not None:
        cur = cur.next
    cur.next = new_node
    return head


def print_list(head):
    cur = head
    while cur is not None:
        print(cur.data, end=" -> ")
        cur = cur.next
    print("NULL")


def reverse(head):
    prev = None
    cur = head
    while cur is not None:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev


head = None
head = insert_end(head, 10)
head = insert_end(head, 20)
head = insert_end(head, 30)
head = insert_end(head, 40)
print_list(head)
head = reverse(head)
print_list(head)
`,
  },
};

export const bst: Example = {
  id: 'binary-search-tree',
  title: 'Binary Search Tree',
  topic: 'Data Structures',
  description: 'Smaller keys go left, larger keys go right. Inserting walks down from the root; an inorder traversal (left, node, right) prints the keys in sorted order.',
  time: 'O(h)',
  space: 'O(n)',
  notes: 'h is the height: O(log n) for a balanced tree, O(n) if keys arrive already sorted.',
  output: 'Inorder: 20 30 40 50 60 70 80 \n',
  code: {
    c: String.raw`#include <stdio.h>
#include <stdlib.h>

struct Node {
    int key;
    struct Node* left;
    struct Node* right;
};

struct Node* newNode(int key) {
    struct Node* node = (struct Node*)malloc(sizeof(struct Node));
    node->key = key;
    node->left = NULL;
    node->right = NULL;
    return node;
}

struct Node* insert(struct Node* root, int key) {
    if (root == NULL) {
        return newNode(key);
    }
    if (key < root->key) {
        root->left = insert(root->left, key);
    } else {
        root->right = insert(root->right, key);
    }
    return root;
}

void inorder(struct Node* root) {
    if (root != NULL) {
        inorder(root->left);
        printf("%d ", root->key);
        inorder(root->right);
    }
}

int main() {
    struct Node* root = NULL;
    int keys[] = {50, 30, 70, 20, 40, 60, 80};
    for (int i = 0; i < 7; i++) {
        root = insert(root, keys[i]);
    }
    printf("Inorder: ");
    inorder(root);
    printf("\n");
    return 0;
}
`,
    cpp: String.raw`#include <iostream>
using namespace std;

struct Node {
    int key;
    Node* left;
    Node* right;
    Node(int k) {
        key = k;
        left = nullptr;
        right = nullptr;
    }
};

Node* insert(Node* root, int key) {
    if (root == nullptr) {
        return new Node(key);
    }
    if (key < root->key) {
        root->left = insert(root->left, key);
    } else {
        root->right = insert(root->right, key);
    }
    return root;
}

void inorder(Node* root) {
    if (root != nullptr) {
        inorder(root->left);
        cout << root->key << " ";
        inorder(root->right);
    }
}

int main() {
    Node* root = nullptr;
    int keys[] = {50, 30, 70, 20, 40, 60, 80};
    for (int i = 0; i < 7; i++) {
        root = insert(root, keys[i]);
    }
    cout << "Inorder: ";
    inorder(root);
    cout << endl;
    return 0;
}
`,
    java: String.raw`public class Main {
    static class Node {
        int key;
        Node left, right;

        Node(int key) {
            this.key = key;
            left = null;
            right = null;
        }
    }

    static Node insert(Node root, int key) {
        if (root == null) {
            return new Node(key);
        }
        if (key < root.key) {
            root.left = insert(root.left, key);
        } else {
            root.right = insert(root.right, key);
        }
        return root;
    }

    static void inorder(Node root) {
        if (root != null) {
            inorder(root.left);
            System.out.print(root.key + " ");
            inorder(root.right);
        }
    }

    public static void main(String[] args) {
        Node root = null;
        int[] keys = {50, 30, 70, 20, 40, 60, 80};
        for (int key : keys) {
            root = insert(root, key);
        }
        System.out.print("Inorder: ");
        inorder(root);
        System.out.println();
    }
}
`,
    csharp: String.raw`using System;

class Node {
    public int key;
    public Node left, right;

    public Node(int key) {
        this.key = key;
        left = null;
        right = null;
    }
}

class Program {
    static Node Insert(Node root, int key) {
        if (root == null) {
            return new Node(key);
        }
        if (key < root.key) {
            root.left = Insert(root.left, key);
        } else {
            root.right = Insert(root.right, key);
        }
        return root;
    }

    static void Inorder(Node root) {
        if (root != null) {
            Inorder(root.left);
            Console.Write(root.key + " ");
            Inorder(root.right);
        }
    }

    static void Main(string[] args) {
        Node root = null;
        int[] keys = { 50, 30, 70, 20, 40, 60, 80 };
        foreach (int key in keys) {
            root = Insert(root, key);
        }
        Console.Write("Inorder: ");
        Inorder(root);
        Console.WriteLine();
    }
}
`,
    python: String.raw`class Node:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None


def insert(root, key):
    if root is None:
        return Node(key)
    if key < root.key:
        root.left = insert(root.left, key)
    else:
        root.right = insert(root.right, key)
    return root


def inorder(root):
    if root is not None:
        inorder(root.left)
        print(root.key, end=" ")
        inorder(root.right)


root = None
keys = [50, 30, 70, 20, 40, 60, 80]
for key in keys:
    root = insert(root, key)
print("Inorder: ", end="")
inorder(root)
print()
`,
  },
};

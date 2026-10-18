public class Main {
    static class Node {
        int data;
        Node prev, next;
        Node(int data) {
            this.data = data;
        }
    }

    static Node head = null;
    static Node tail = null;

    static void insertEnd(int data) {
        Node node = new Node(data);
        node.prev = tail;
        if (tail == null) {
            head = node;
        } else {
            tail.next = node;
        }
        tail = node;
    }

    static void deleteValue(int data) {
        Node cur = head;
        while (cur != null && cur.data != data) {
            cur = cur.next;
        }
        if (cur == null) {
            return;
        }
        // link the neighbors to each other, skipping cur
        if (cur.prev != null) {
            cur.prev.next = cur.next;
        } else {
            head = cur.next;
        }
        if (cur.next != null) {
            cur.next.prev = cur.prev;
        } else {
            tail = cur.prev;
        }
    }

    static void printForward() {
        System.out.print("Forward:");
        for (Node cur = head; cur != null; cur = cur.next) {
            System.out.print(" " + cur.data);
        }
        System.out.println();
    }

    static void printBackward() {
        System.out.print("Backward:");
        for (Node cur = tail; cur != null; cur = cur.prev) {
            System.out.print(" " + cur.data);
        }
        System.out.println();
    }

    public static void main(String[] args) {
        insertEnd(10);
        insertEnd(20);
        insertEnd(30);
        insertEnd(40);
        deleteValue(20);
        printForward();
        printBackward();
    }
}

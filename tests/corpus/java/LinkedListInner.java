public class Main {
    static class LinkedList {
        Node head;
        int size;

        class Node {
            int data;
            Node next;

            Node(int d) {
                data = d;
                next = null;
            }
        }

        void addFirst(int data) {
            Node n = new Node(data);
            n.next = head;
            head = n;
            size++;
        }

        void addLast(int data) {
            Node n = new Node(data);
            if (head == null) {
                head = n;
            } else {
                Node cur = head;
                while (cur.next != null) cur = cur.next;
                cur.next = n;
            }
            size++;
        }

        void deleteKey(int key) {
            Node temp = head, prev = null;
            if (temp != null && temp.data == key) {
                head = temp.next;
                size--;
                return;
            }
            while (temp != null && temp.data != key) {
                prev = temp;
                temp = temp.next;
            }
            if (temp == null) return;
            prev.next = temp.next;
            size--;
        }

        int middle() {
            Node slow = head, fast = head;
            while (fast != null && fast.next != null) {
                slow = slow.next;
                fast = fast.next.next;
            }
            return slow.data;
        }

        public void printList() {
            Node n = head;
            StringBuilder sb = new StringBuilder();
            while (n != null) {
                sb.append(n.data);
                if (n.next != null) sb.append(" -> ");
                n = n.next;
            }
            System.out.println(sb.toString() + " (size " + size + ")");
        }
    }

    public static void main(String[] args) {
        LinkedList list = new LinkedList();
        list.addLast(20);
        list.addLast(30);
        list.addFirst(10);
        list.addLast(40);
        list.addLast(50);
        list.printList();
        System.out.println("Middle: " + list.middle());
        list.deleteKey(30);
        list.deleteKey(10);
        list.printList();
    }
}

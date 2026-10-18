public class Main {
    // the activities are already sorted by finish time
    static void selectActivities(int[] start, int[] finish) {
        int last = 0;
        System.out.print("Selected activities: 0");
        for (int i = 1; i < start.length; i++) {
            // greedy choice: take it if it starts after the last one ends
            if (start[i] >= finish[last]) {
                System.out.print(" " + i);
                last = i;
            }
        }
        System.out.println();
    }

    public static void main(String[] args) {
        int[] start = {1, 3, 0, 5, 8, 5};
        int[] finish = {2, 4, 6, 7, 9, 9};
        selectActivities(start, finish);
    }
}

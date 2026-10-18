import java.util.*;

public class Main {
    static class Student implements Comparable<Student> {
        String name;
        double gpa;

        Student(String name, double gpa) {
            this.name = name;
            this.gpa = gpa;
        }

        @Override
        public int compareTo(Student other) {
            return Double.compare(other.gpa, this.gpa);
        }

        @Override
        public String toString() {
            return name + "(" + gpa + ")";
        }
    }

    public static void main(String[] args) {
        List<Student> list = new ArrayList<>();
        list.add(new Student("Ana", 3.5));
        list.add(new Student("Ben", 3.9));
        list.add(new Student("Cy", 2.8));
        list.add(new Student("Di", 3.7));
        Collections.sort(list);
        System.out.println(list);
        list.sort((a, b) -> a.name.compareTo(b.name));
        System.out.println(list);
        list.sort(Comparator.comparingDouble(st -> st.gpa));
        for (Student st : list) System.out.print(st.name + " ");
        System.out.println();

        int[][] intervals = {{5, 6}, {1, 3}, {2, 4}, {8, 9}};
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        for (int[] iv : intervals) System.out.print(Arrays.toString(iv) + " ");
        System.out.println();

        Integer[] nums = {5, 2, 9, 1, 7};
        Arrays.sort(nums, Collections.reverseOrder());
        System.out.println(Arrays.toString(nums));
    }
}

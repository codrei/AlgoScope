import java.util.ArrayList;
import java.util.List;

abstract class Shape {
    abstract double area();
    String name() { return getClass().getSimpleName(); }
}

class Circle extends Shape {
    double r;
    Circle(double r) { this.r = r; }
    double area() { return Math.PI * r * r; }
}

class Rect extends Shape {
    double w, h;
    Rect(double w, double h) { this.w = w; this.h = h; }
    double area() { return w * h; }
}

class Square extends Rect {
    Square(double s) { super(s, s); }
}

public class Main {
    public static void main(String[] args) {
        List<Shape> shapes = new ArrayList<>();
        shapes.add(new Circle(1));
        shapes.add(new Rect(2, 3));
        shapes.add(new Square(4));
        double total = 0;
        for (Shape s : shapes) {
            System.out.printf("%s %.2f%n", s.name(), s.area());
            total += s.area();
        }
        System.out.printf("Total %.1f%n", total);
        ArrayList<Integer> nums = new ArrayList<>(List.of(5, 3, 9, 3));
        nums.remove(Integer.valueOf(3));
        nums.remove(0);
        System.out.println(nums + " " + nums.indexOf(3) + " " + nums.contains(9));
    }
}

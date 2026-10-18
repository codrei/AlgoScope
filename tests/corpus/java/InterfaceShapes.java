interface Shape {
    double area();
    String name();
}

abstract class Base implements Shape {
    public String describe() {
        return name() + " with area " + String.format("%.2f", area());
    }
}

class Circle extends Base {
    double r;
    Circle(double r) { this.r = r; }
    public double area() { return Math.PI * r * r; }
    public String name() { return "Circle"; }
}

class Rect extends Base {
    double w, h;
    Rect(double w, double h) { this.w = w; this.h = h; }
    public double area() { return w * h; }
    public String name() { return "Rectangle"; }
}

public class Main {
    public static void main(String[] args) {
        Base[] shapes = {new Circle(1.5), new Rect(2, 3.5)};
        double total = 0;
        for (Base s : shapes) {
            System.out.println(s.describe());
            total += s.area();
        }
        System.out.printf("Total area: %.3f%n", total);
    }
}

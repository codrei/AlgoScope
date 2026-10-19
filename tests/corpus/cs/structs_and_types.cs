using System;

struct Point {
    public int X, Y;
    public Point(int x, int y) {
        X = x;
        Y = y;
    }
}

class Box {
    public int Size;
}

class Program {
    static void Move(Point p) {
        p.X = 100;
    }

    static void Grow(Box b) {
        b.Size = 100;
    }

    static void Main(string[] args) {
        Point p = new Point(1, 2);
        Point q = p;
        q.X = 9;
        Move(p);
        Console.WriteLine(p.X + " " + q.X);

        Box a = new Box();
        Box b = a;
        b.Size = 5;
        Grow(a);
        Console.WriteLine(a.Size + " " + b.Size);

        Point[] pts = { new Point(1, 1), new Point(2, 2) };
        Point first = pts[0];
        first.Y = 50;
        pts[1].Y = 60;
        Console.WriteLine(pts[0].Y + " " + pts[1].Y + " " + first.Y);

        Console.WriteLine(a.GetType().Name + " " + p.GetType().Name);
    }
}

#include <stdio.h>
#include <string.h>

struct Point {
    int x;
    int y;
};

struct Student {
    char name[20];
    int scores[3];
};

int length(char *s) {
    int n = 0;
    while (*s != '\0') {
        n++;
        s++;
    }
    return n;
}

void moveRight(struct Point p) {
    p.x = p.x + 100;   // only the copy changes
}

void moveRightPtr(struct Point *p) {
    p->x = p->x + 100; // the original changes
}

int main() {
    int arr[] = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int *p = arr; p < arr + 5; p++) {
        sum += *p;
    }
    printf("sum %d\n", sum);

    int *q = arr;
    q++;
    *q = 20;
    *(q + 1) = 30;
    printf("%d %d %d offset %d\n", arr[1], arr[2], *q, (int) (q - arr));

    int *end = &arr[4];
    while (end >= arr) {
        printf("%d ", *end);
        end--;
    }
    printf("\n");

    printf("length %d\n", length("algorithm"));

    struct Point a = {1, 2};
    struct Point b = a;
    b.x = 9;
    printf("a.x %d b.x %d\n", a.x, b.x);
    moveRight(a);
    printf("after moveRight %d\n", a.x);
    moveRightPtr(&a);
    printf("after moveRightPtr %d\n", a.x);

    struct Point pts[2] = {{1, 1}, {2, 2}};
    struct Point t = pts[0];
    pts[0] = pts[1];
    pts[1] = t;
    pts[1].y = 50;
    printf("pts %d,%d %d,%d t.y %d\n", pts[0].x, pts[0].y, pts[1].x, pts[1].y, t.y);

    struct Student s1;
    strcpy(s1.name, "Ana");
    s1.scores[0] = 90;
    struct Student s2 = s1;
    s2.scores[0] = 70;
    printf("%s %d %d\n", s1.name, s1.scores[0], s2.scores[0]);
    return 0;
}

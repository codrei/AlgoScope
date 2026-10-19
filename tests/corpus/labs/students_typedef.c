#include <stdio.h>
#include <string.h>

typedef struct {
    char name[20];
    int grade;
} Student;

int findByName(Student list[], int n, char key[]) {
    for (int i = 0; i < n; i++) {
        if (strcmp(list[i].name, key) == 0) return i;
    }
    return -1;
}

int main() {
    Student list[4] = {{"Ana", 88}, {"Ben", 75}, {"Carla", 93}, {"Dan", 60}};
    int n = sizeof(list) / sizeof(list[0]);
    int best = 0;
    double sum = 0;
    for (int i = 0; i < n; i++) {
        sum += list[i].grade;
        if (list[i].grade > list[best].grade) best = i;
    }
    printf("Average: %.2f\n", sum / n);
    printf("Top: %s (%d)\n", list[best].name, list[best].grade);
    printf("Ben is at %d, Zed is at %d\n", findByName(list, n, "Ben"), findByName(list, n, "Zed"));
    return 0;
}

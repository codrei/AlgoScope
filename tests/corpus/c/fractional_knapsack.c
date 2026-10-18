#include <stdio.h>

struct Item {
    int value, weight;
    double ratio;
};

int main() {
    struct Item items[] = {{60, 10, 0}, {100, 20, 0}, {120, 30, 0}};
    int n = 3, capacity = 50;
    for (int i = 0; i < n; i++) items[i].ratio = (double)items[i].value / items[i].weight;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (items[j].ratio < items[j + 1].ratio) {
                struct Item temp = items[j];
                items[j] = items[j + 1];
                items[j + 1] = temp;
            }
        }
    }
    double total = 0.0;
    for (int i = 0; i < n; i++) {
        if (capacity >= items[i].weight) {
            capacity -= items[i].weight;
            total += items[i].value;
            printf("Take all of item (v=%d, w=%d)\n", items[i].value, items[i].weight);
        } else {
            double fraction = (double)capacity / items[i].weight;
            total += items[i].value * fraction;
            printf("Take %.2f of item (v=%d, w=%d)\n", fraction, items[i].value, items[i].weight);
            break;
        }
    }
    printf("Maximum value = %.2f\n", total);
    return 0;
}

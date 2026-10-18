def knapsack(value, weight, capacity):
    # items are already sorted by value per kg, best first
    total = 0
    for i in range(len(value)):
        if weight[i] <= capacity:
            # the whole item fits
            capacity -= weight[i]
            total += value[i]
        else:
            # take only the fraction that fits, then the bag is full
            total += value[i] * capacity / weight[i]
            break
    return total


value = [60, 100, 120]
weight = [10, 20, 30]
print(f"Maximum value: {knapsack(value, weight, 50):.2f}")

def select_activities(start, finish):
    # the activities are already sorted by finish time
    selected = [0]
    last = 0
    for i in range(1, len(start)):
        # greedy choice: take it if it starts after the last one ends
        if start[i] >= finish[last]:
            selected.append(i)
            last = i
    print("Selected activities:", *selected)


start = [1, 3, 0, 5, 8, 5]
finish = [2, 4, 6, 7, 9, 9]
select_activities(start, finish)

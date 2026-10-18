/* Lesson 6 - Queue and circular queue (array implementation with a struct) */
#include<stdio.h>
#define MAXQUEUE 7

typedef struct {
    int front;
    int rear;
    char items[MAXQUEUE];
}QUEUE;

void insert(QUEUE *qptr, char x)
{
    if(qptr->rear == MAXQUEUE-1){
        printf("Queue is full\n");
        return;
    }
    qptr->rear++;
    qptr->items[qptr->rear] = x;
}

char removeItem(QUEUE *qptr)
{
    char x;
    if(qptr->front > qptr->rear){
        printf("Queue is empty\n");
        return ' ';
    }
    x = qptr->items[qptr->front];
    qptr->front++;
    return x;
}

/* circular queue: front and rear start at MAXQUEUE-1 */
void cqinsert(QUEUE *qptr, char x)
{
    if((qptr->rear + 1) % MAXQUEUE == qptr->front){
        printf("Circular queue is full, cannot insert %c\n", x);
        return;
    }
    qptr->rear = (qptr->rear + 1) % MAXQUEUE;
    qptr->items[qptr->rear] = x;
}

char cqremove(QUEUE *qptr)
{
    if(qptr->front == qptr->rear){
        printf("Circular queue is empty\n");
        return ' ';
    }
    qptr->front = (qptr->front + 1) % MAXQUEUE;
    return qptr->items[qptr->front];
}

int main()
{
    QUEUE Queue;
    Queue.front = 0;
    Queue.rear = -1;
    insert(&Queue, 'A');
    insert(&Queue, 'B');
    insert(&Queue, 'C');
    insert(&Queue, 'D');
    printf("Removed %c\n", removeItem(&Queue));
    printf("Removed %c\n", removeItem(&Queue));
    printf("front=%d rear=%d\n", Queue.front, Queue.rear);

    QUEUE cq;
    cq.front = MAXQUEUE - 1;
    cq.rear = MAXQUEUE - 1;
    char letters[] = "ABCDEFGHIJ";
    for (int i = 0; i < 3; i++) cqinsert(&cq, letters[i]);
    printf("Removed %c\n", cqremove(&cq));
    printf("Removed %c\n", cqremove(&cq));
    for (int i = 3; i < 9; i++) cqinsert(&cq, letters[i]);
    printf("front=%d rear=%d\n", cq.front, cq.rear);
    while (cq.front != cq.rear) printf("%c ", cqremove(&cq));
    printf("\n");
    return 0;
}

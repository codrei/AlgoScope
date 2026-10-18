/* Lesson 6 - Stack (array implementation with a struct) */
#include<stdio.h>
#include<stdlib.h>
#define STACKSIZE 10
typedef struct{
    int count;
    int top;
    int items[STACKSIZE]; /*stack can contain up to 10 integers*/
}STACK;
void push(STACK *, int);
int pop(STACK *);
int main()
{
    int p, i;
    STACK s;
    s.top = -1; /*indicates that the stack is empty at the beginning*/
    s.count = 0; /* 0 items are in the stack*/
    /*reading and pushing items into the stack*/
    printf("Enter the %d stack items\n",STACKSIZE);
    for(i=0;i<= STACKSIZE-1;i++){
        scanf("%d",&p);
        push(&s,p);
    }
    /*popping and printing the items in the stack*/
    printf("\n\nStack contains the following items\n");
    for(i=0;i<= STACKSIZE-1;i++){
        p=pop(&s);
        printf("%d\t",p);
    }
    return 0;
}
void push(STACK *Sptr, int ps) /*pushes ps into stack*/
{
    if(Sptr->top == STACKSIZE-1){
        printf("Stack is full\n");
        printf("There are %d items in the stack\n", Sptr->count);
        return; /*return back to main function*/
    }
    else {
        Sptr->top++;
        Sptr->items[Sptr->top]= ps;
        Sptr->count++;
    }
}
int pop(STACK *Sptr)
{
    int pp;
    if(Sptr->top == -1){
        printf("Stack is empty\n");
        return -1; /*exit from the function*/
    }
    else {
        pp = Sptr->items[Sptr->top];
        Sptr->top--;
        Sptr->count--;
        return pp;
    }
}

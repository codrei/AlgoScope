#include <stdio.h>

void selectionSort(int array[], int size){
   int i, j, imin;
   for(i = 0; i<size-1; i++) {
      imin = i;   //get index of minimum data
      for(j = i+1; j<size; j++)
         if(array[j] < array[imin])
            imin = j;
      //placing in correct position
      int temp;
      temp = array[i];
      array[i] = array[imin];
      array[imin] = temp;
   }
}

void insertionSort(int array[], int size){
   int key, j;
   for(int i = 1; i<size; i++) {
      key = array[i];//take value
      j = i;
      while(j > 0 && array[j-1]>key) {
         array[j] = array[j-1];
         j--;
      }
      array[j] = key;   //insert in right place
   }
}

void bubbleSort(int numbers[], int array_size){
   int i, j, temp;
   for (i = (array_size - 1); i >= 0; i--)
   for (j = 1; j <= i; j++)
   if (numbers[j-1] > numbers[j]){
      temp = numbers[j-1];
      numbers[j-1] = numbers[j];
      numbers[j] = temp;
   }
}

void display(int array[], int size) {
   for(int i = 0; i<size; i++)
      printf("%d ", array[i]);
   printf("\n");
}

int main() {
   int a[] = {64, 25, 12, 22, 11};
   int b[] = {23, 1, 10, 5, 2};
   int c[] = {6, 0, 3, 5};
   selectionSort(a, 5);
   insertionSort(b, 5);
   bubbleSort(c, 4);
   display(a, 5);
   display(b, 5);
   display(c, 4);
   return 0;
}

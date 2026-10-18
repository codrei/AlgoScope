// The professor's own lesson programs (rebuilt from the CCDATRCL / Algorithms slides),
// in the language each lesson uses. The same files are checked against the real compilers
// in tests/corpus/prof.
import l5 from '../../tests/corpus/prof/l5_linked_list_class.cpp?raw';
import l5out from '../../tests/corpus/prof/l5_linked_list_class.cpp.out?raw';
import stack from '../../tests/corpus/prof/l6_stack_struct.c?raw';
import stackIn from '../../tests/corpus/prof/l6_stack_struct.in?raw';
import stackOut from '../../tests/corpus/prof/l6_stack_struct.c.out?raw';
import queue from '../../tests/corpus/prof/l6_queue_struct.c?raw';
import queueOut from '../../tests/corpus/prof/l6_queue_struct.c.out?raw';
import sorting from '../../tests/corpus/prof/w6_sorting.c?raw';
import sortingOut from '../../tests/corpus/prof/w6_sorting.c.out?raw';
import search from '../../tests/corpus/prof/w5_search.c?raw';
import searchOut from '../../tests/corpus/prof/w5_search.c.out?raw';
import heap from '../../tests/corpus/prof/w8_heapsort.c?raw';
import heapOut from '../../tests/corpus/prof/w8_heapsort.c.out?raw';
import rec from '../../tests/corpus/prof/w9_recursion.c?raw';
import recIn from '../../tests/corpus/prof/w9_recursion.in?raw';
import recOut from '../../tests/corpus/prof/w9_recursion.c.out?raw';
import quick from '../../tests/corpus/prof/w6_quicksort.py?raw';
import quickOut from '../../tests/corpus/prof/w6_quicksort.py.out?raw';
import ins from '../../tests/corpus/prof/w8_insertion.java?raw';
import insOut from '../../tests/corpus/prof/w8_insertion.java.out?raw';
import maze from '../../tests/corpus/prof/smolmaze_turboc.txt?raw';
import type { Example } from './types';

const lesson = (e: Omit<Example, 'topic'>): Example => ({ ...e, topic: 'From the lessons' });

export const LESSONS: Example[] = [
  lesson({
    id: 'lesson-linked-list-class', title: 'Lesson 5 · Linked List class', only: 'cpp',
    description: 'The Node and List classes from Lesson 5: InsertNode, FindNode, DeleteNode and DisplayList.',
    time: 'O(n)', space: 'O(n)', notes: 'Insert, find and delete walk the list, so each is O(n).',
    output: l5out, code: { cpp: l5 },
  }),
  lesson({
    id: 'lesson-stack-struct', title: 'Lesson 6 · Stack (struct)', only: 'c',
    description: 'The STACK struct from Lesson 6: push reads ten numbers with scanf, then pop prints them in reverse (LIFO).',
    time: 'O(1)', space: 'O(n)', notes: 'push and pop only move top, so each is O(1).',
    output: stackOut, stdin: stackIn, code: { c: stack },
  }),
  lesson({
    id: 'lesson-queue-struct', title: 'Lesson 6 · Queue & circular queue', only: 'c',
    description: 'insert(&Queue, \'A\') and remove from Lesson 6, then the circular queue where front and rear start at MAXQUEUE-1 and wrap with %.',
    time: 'O(1)', space: 'O(n)', notes: 'The circular queue reuses freed slots, which the simple queue cannot.',
    output: queueOut, code: { c: queue },
  }),
  lesson({
    id: 'lesson-week6-sorting', title: 'Week 6-7 · Selection, insertion, bubble', only: 'c',
    description: 'The three sorting functions exactly as on the Week 6-7 slides, run on the slide examples {64, 25, 12, 22, 11}, {23, 1, 10, 5, 2} and {6, 0, 3, 5}.',
    time: 'O(n²)', space: 'O(1)', output: sortingOut, code: { c: sorting },
  }),
  lesson({
    id: 'lesson-week5-search', title: 'Week 5 · Linear & binary search', only: 'c',
    description: 'search() and the recursive bin_search() from Week 5.',
    time: 'O(log n)', space: 'O(log n)', notes: 'Linear search is O(n); the recursive binary search is O(log n) and uses O(log n) stack space.',
    output: searchOut, code: { c: search },
  }),
  lesson({
    id: 'lesson-week8-heapsort', title: 'Week 8 · Heap sort', only: 'c',
    description: 'BuildMaxHeap and Heapify from Week 8 on arr[] = {4, 10, 3, 5, 1}. The array is also drawn as the heap tree.',
    time: 'O(n log n)', space: 'O(1)', output: heapOut, code: { c: heap },
  }),
  lesson({
    id: 'lesson-week9-recursion', title: 'Week 9 · Recursion & factorial', only: 'c',
    description: 'The loop and the recursive factorial from Week 9, then Test(3), which prints 3 times and calls itself 4 times.',
    time: 'O(n)', space: 'O(n)', notes: 'T(n) = T(n-1) + 1, so O(n).',
    output: recOut, stdin: recIn, code: { c: rec },
  }),
  lesson({
    id: 'lesson-week6-quicksort', title: 'Week 6-7 · Quick sort (Python)', only: 'python',
    description: 'partition() and quickSort() from the Week 6-7 pseudocode slide.',
    time: 'O(n log n)', space: 'O(log n)', notes: 'Worst case O(n²) when the pivot is always the largest or smallest.',
    output: quickOut, code: { python: quick },
  }),
  lesson({
    id: 'lesson-week8-insertion-java', title: 'Week 8 · Insertion sort (Java)', only: 'java',
    description: 'The Java insertion sort from the Week 8 slides on {9, 1, 8, 2, 7, 3, 6, 5, 4}.',
    time: 'O(n²)', space: 'O(1)', notes: 'Best case O(n) when the array is already sorted.',
    output: insOut, code: { java: ins },
  }),
  lesson({
    id: 'lesson-smolmaze', title: 'SMOLMAZE · Turbo C++ maze game', only: 'cpp',
    description: 'The Turbo C++ maze game (SMOLMAZE.CPP): arrow keys move A through the walls in loc[7][14]. The keys are already in the Input box.',
    time: 'O(1)', space: 'O(1)', notes: 'Each key press checks one cell of the 2D array.',
    output: '', stdin: '<right><right><right><down><down><down><down><right><right><right><right><right><right><right><right><right><up><right><esc>',
    code: { cpp: maze },
  }),
];

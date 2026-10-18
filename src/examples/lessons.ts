// Programs rebuilt from the course slides, in the language the slides use (so only one
// language each). The same files are checked against the real compilers in tests/corpus/prof.
import l5 from '../../tests/corpus/prof/l5_linked_list_class.cpp?raw';
import l5out from '../../tests/corpus/prof/l5_linked_list_class.cpp.out?raw';
import stack from '../../tests/corpus/prof/l6_stack_struct.c?raw';
import stackIn from '../../tests/corpus/prof/l6_stack_struct.in?raw';
import stackOut from '../../tests/corpus/prof/l6_stack_struct.c.out?raw';
import queue from '../../tests/corpus/prof/l6_queue_struct.c?raw';
import queueOut from '../../tests/corpus/prof/l6_queue_struct.c.out?raw';
import maze from '../../tests/corpus/prof/smolmaze_turboc.txt?raw';
import type { Example } from './types';

export const linkedListClass: Example = {
  id: 'linked-list-class', title: 'Linked List (Insert, Find, Delete)', topic: 'Data Structures', only: 'cpp',
  description: 'A Node class and a List class with InsertNode (kept in sorted order), FindNode, DeleteNode and DisplayList.',
  time: 'O(n)', space: 'O(n)', notes: 'Insert, find and delete walk the list, so each is O(n).',
  output: l5out, code: { cpp: l5 },
};

export const stackStruct: Example = {
  id: 'stack-struct', title: 'Stack Using a Struct', topic: 'Data Structures', only: 'c',
  description: 'A STACK struct holding an array and top. push reads ten numbers with scanf, then pop prints them in reverse order (LIFO).',
  time: 'O(1)', space: 'O(n)', notes: 'push and pop only move top, so each is O(1).',
  output: stackOut, stdin: stackIn, code: { c: stack },
};

export const queueStruct: Example = {
  id: 'queue-struct', title: 'Queue and Circular Queue', topic: 'Data Structures', only: 'c',
  description: 'A QUEUE struct with front and rear: insert and remove on a simple queue, then a circular queue where front and rear start at MAXQUEUE-1 and wrap around with %.',
  time: 'O(1)', space: 'O(n)', notes: 'The circular queue reuses freed slots, which the simple queue cannot.',
  output: queueOut, code: { c: queue },
};

export const mazeGame: Example = {
  id: 'maze-game', title: 'Maze Game (2D Array)', topic: 'Data Structures', only: 'cpp',
  description: 'A Turbo C++ console game: the arrow keys move A through the walls stored in the 2D array loc[7][14]. The keys are already in the Input box.',
  time: 'O(1)', space: 'O(1)', notes: 'Each key press checks one cell of the 2D array.',
  output: '', stdin: '<right><right><right><down><down><down><down><right><right><right><right><right><right><right><right><right><up><right><esc>',
  code: { cpp: maze },
};

import type { Lang } from '../engine/ir';

export type Topic = 'Sorting' | 'Searching' | 'Recursion' | 'Data Structures' | 'Dynamic Programming' | 'Graphs';

export interface Example {
  id: string;
  title: string;
  topic: Topic;
  description: string;
  /** time complexity shown on the badge (worst case unless noted) */
  time: string;
  space: string;
  /** extra notes about best/average cases */
  notes?: string;
  /** expected program output (identical in every language); used by the tests */
  output: string;
  /** optional stdin for the example */
  stdin?: string;
  code: Record<Lang, string>;
}

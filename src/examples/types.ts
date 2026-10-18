import type { Lang } from '../engine/ir';

export type Topic = 'From the lessons' | 'Sorting' | 'Searching' | 'Recursion' | 'Data Structures' | 'Dynamic Programming' | 'Graphs';

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
  /** every built-in algorithm has all five languages; lesson examples only the one used in class */
  code: Partial<Record<Lang, string>> & { [K in Lang]?: string };
  /** for lesson examples: the language the slides use */
  only?: Lang;
}

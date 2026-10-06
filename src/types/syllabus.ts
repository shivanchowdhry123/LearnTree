export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export type SyllabusNodeStatus = 'unstarted' | 'in_progress' | 'mastered';

export interface SM2State {
  /** Current interval in days until the next scheduled review */
  interval: number;
  /** Number of consecutive successful recall reviews */
  repetition: number;
  /** Easiness factor reflecting item difficulty (standard default: 2.5, minimum: 1.3) */
  easeFactor: number;
  /** ISO timestamp string of the last review, or null if never reviewed */
  lastReviewedAt: string | null;
  /** ISO timestamp string when the node is next due for review, or null if unstarted */
  nextReviewAt: string | null;
}

export interface SyllabusNode {
  id: string;
  title: string;
  url?: string;
  tags: string[];
  status: SyllabusNodeStatus;
  depth: number;
  children: SyllabusNode[];
  sm2State: SM2State;
}

export interface DashboardMetrics {
  totalNodes: number;
  completedNodes: number;
  dueForReviewCount: number;
  streakDays: number;
  retentionRate: number;
}

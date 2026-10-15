import type { SyllabusNode } from './syllabus';

export interface SyllabusRepo {
  id: string;
  userId: string;
  name: string;
  code: string;
  nodes: SyllabusNode[];
  createdAt: string;
  updatedAt: string;
  // Multi-user & sharing metadata
  isPublic?: boolean;
  shareSlug?: string;
  description?: string;
  category?: string;
  // Denormalized metrics for instant dashboard queries
  dueReviewsCount?: number;
  nextDueDate?: string | null;
  masteredCount?: number;
  totalNodesCount?: number;
  revision?: number;
  syncedAt?: string;
}

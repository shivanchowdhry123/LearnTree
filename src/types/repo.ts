import type { SyllabusNode } from './syllabus';

export interface SyllabusRepo {
  id: string;
  userId: string;
  name: string;
  code: string;
  nodes: SyllabusNode[];
  createdAt: string;
  updatedAt: string;
}

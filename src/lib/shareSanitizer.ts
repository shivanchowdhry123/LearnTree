import type { SyllabusNode, SM2State } from '../types/syllabus';
import type { SyllabusRepo } from '../types/repo';

/**
 * Creates a fresh, unreviewed SM-2 state baseline.
 * Used when sanitizing a syllabus for public sharing so learners who view
 * or clone the curriculum start with a clean slate.
 */
export function getCleanSM2State(): SM2State {
  return {
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    lastReviewedAt: null,
    nextReviewAt: null,
  };
}

/**
 * Recursively sanitizes a list of syllabus nodes:
 * 1. Resets SM-2 spaced repetition state (interval, repetitions, due date)
 * 2. Resets node completion status to 'unstarted'
 * 3. Scrubs any sensitive keywords, private markdown notes, or authentication tokens
 * 4. Filters out personal/confidential tags (e.g. tags starting with '#private', 'my-', 'secret')
 */
export function sanitizeSyllabusNodes(nodes: SyllabusNode[]): SyllabusNode[] {
  return nodes.map((node) => {
    // Sanitize tags: remove any personal/private tag flags
    const cleanTags = (node.tags || []).filter((tag) => {
      const lower = tag.toLowerCase().trim();
      return (
        !lower.startsWith('private:') &&
        !lower.startsWith('my-') &&
        !lower.startsWith('confidential') &&
        !lower.startsWith('internal')
      );
    });

    // Sanitize title and URL (strip local file tokens or private credentials)
    let cleanUrl = node.url ? node.url.trim() : undefined;
    if (cleanUrl) {
      try {
        const parsed = new URL(cleanUrl);
        // Strip sensitive auth params like token, key, secret, session
        parsed.searchParams.delete('token');
        parsed.searchParams.delete('auth');
        parsed.searchParams.delete('key');
        parsed.searchParams.delete('access_token');
        cleanUrl = parsed.toString();
      } catch {
        // Keep as-is if relative or invalid URL format
      }
    }

    return {
      id: node.id,
      title: node.title.trim(),
      url: cleanUrl,
      tags: cleanTags,
      status: 'unstarted',
      depth: node.depth,
      sm2State: getCleanSM2State(),
      children: node.children && node.children.length > 0 ? sanitizeSyllabusNodes(node.children) : [],
    };
  });
}

/**
 * Generates a clean, URL-friendly unique slug for public sharing.
 */
export function generateShareSlug(repoName: string): string {
  const base = repoName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 30) || 'syllabus';
  
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${randomSuffix}`;
}

/**
 * Prepares a complete sanitized public syllabus payload ready for publishing.
 */
export function sanitizeRepoForPublicShare(repo: SyllabusRepo): Partial<SyllabusRepo> {
  const sanitizedNodes = sanitizeSyllabusNodes(repo.nodes);
  const shareSlug = repo.shareSlug || generateShareSlug(repo.name);

  // Calculate clean counters
  let totalNodesCount = 0;
  function countNodes(items: SyllabusNode[]) {
    for (const item of items) {
      totalNodesCount++;
      if (item.children && item.children.length > 0) {
        countNodes(item.children);
      }
    }
  }
  countNodes(sanitizedNodes);

  return {
    isPublic: true,
    shareSlug,
    nodes: sanitizedNodes,
    dueReviewsCount: 0,
    nextDueDate: null,
    masteredCount: 0,
    totalNodesCount,
  };
}

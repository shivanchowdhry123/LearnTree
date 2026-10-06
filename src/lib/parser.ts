import type { SyllabusNode, SyllabusNodeStatus } from '../types/syllabus';
import { createInitialSM2State } from './sm2';

/**
 * Generates a unique identifier for a syllabus node.
 * Uses Web Crypto `crypto.randomUUID()` when available, with a random fallback.
 */
function generateNodeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'node_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Calculates the indent width of a line, converting tabs to 2 spaces.
 */
function getIndentWidth(line: string): number {
  let width = 0;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === ' ') {
      width += 1;
    } else if (char === '\t') {
      width += 2;
    } else {
      break;
    }
  }
  return width;
}

interface ParsedLineDetails {
  title: string;
  url?: string;
  tags: string[];
  status: SyllabusNodeStatus;
}

/**
 * Parses a single line's content after stripping indentation:
 * - Detects and strips markdown list bullets (`- `, `* `, `+ `, `1. `)
 * - Detects and strips checkboxes (`[ ] `, `[x] `, `[X] `)
 * - Determines initial status ('mastered' if checked, otherwise 'unstarted')
 * - Extracts hashtags into `tags` and removes them from the display title
 * - Extracts Markdown links `[Title](url)` or trailing URLs `(http...)` / standalone URLs
 */
function parseLineContent(rawContent: string): ParsedLineDetails {
  let content = rawContent.trim();
  let status: SyllabusNodeStatus = 'unstarted';

  // 1. Strip list bullets (e.g., "- ", "* ", "+ ", "1. ", "12. ")
  content = content.replace(/^([-*+]|\d+\.)\s+/, '');

  // 2. Detect & strip task list checkboxes (e.g., "[x] ", "[X] ", "[ ] ")
  const checkboxMatch = content.match(/^\[([ xX])\]\s*/);
  if (checkboxMatch) {
    if (checkboxMatch[1].toLowerCase() === 'x') {
      status = 'mastered';
    }
    content = content.slice(checkboxMatch[0].length).trim();
  }

  // 3. Extract hashtags (e.g. #webdev, #react-19, #data_structures)
  const tags: string[] = [];
  const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\-]+)/g;
  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = tagRegex.exec(content)) !== null) {
    const tag = tagMatch[1].trim();
    if (tag && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // Remove hashtags from title string
  content = content.replace(/(?:^|\s)#[a-zA-Z0-9_\-]+/g, ' ').trim();

  // 4. Extract URLs & format title
  let extractedUrl: string | undefined;

  // Pattern 4a: Markdown links e.g. [Node Title](https://example.com)
  const mdLinkMatch = content.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
  if (mdLinkMatch) {
    extractedUrl = mdLinkMatch[2];
    // Replace the markdown link with just the anchor text
    content = content.replace(mdLinkMatch[0], mdLinkMatch[1]).trim();
  }

  // Pattern 4b: Trailing or parenthesized URL e.g. Node Title (https://example.com)
  if (!extractedUrl) {
    const parenUrlMatch = content.match(/\((https?:\/\/[^\s)]+)\)\s*$/);
    if (parenUrlMatch) {
      extractedUrl = parenUrlMatch[1];
      content = content.replace(parenUrlMatch[0], '').trim();
    }
  }

  // Pattern 4c: Trailing standalone URL e.g. Node Title https://example.com
  if (!extractedUrl) {
    const rawUrlMatch = content.match(/(https?:\/\/[^\s)]+)\s*$/);
    if (rawUrlMatch) {
      extractedUrl = rawUrlMatch[1];
      content = content.replace(rawUrlMatch[0], '').trim();
    }
  }

  // Clean trailing punctuation or delimiters if left behind
  content = content.replace(/[-:–—\s]+$/, '').trim();

  // If title is empty after URL/tag stripping, fallback to the URL or default label
  const finalTitle = content || extractedUrl || 'Untitled Concept';

  return {
    title: finalTitle,
    url: extractedUrl,
    tags,
    status,
  };
}

/**
 * Pure client-side parser that converts raw indented text or Markdown list lines
 * into a hierarchical `SyllabusNode[]` tree structure.
 *
 * @param rawText Multiline string containing the raw syllabus text.
 * @returns An array of top-level `SyllabusNode` roots with nested children.
 */
export function parseSyllabusText(rawText: string): SyllabusNode[] {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  const lines = rawText.split(/\r?\n/);
  const rootNodes: SyllabusNode[] = [];

  // Indentation tracking stack: keeps ancestors and their indentation widths
  interface StackEntry {
    indent: number;
    depth: number;
    node: SyllabusNode;
  }
  const stack: StackEntry[] = [];

  for (const line of lines) {
    // Skip empty or whitespace-only lines
    if (!line.trim()) {
      continue;
    }

    const indentWidth = getIndentWidth(line);
    const lineContent = line.trim();
    const parsed = parseLineContent(lineContent);

    // Unwind stack to find the proper parent node
    while (stack.length > 0 && indentWidth <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const currentDepth = stack.length;

    const node: SyllabusNode = {
      id: generateNodeId(),
      title: parsed.title,
      url: parsed.url,
      tags: parsed.tags,
      status: parsed.status,
      depth: currentDepth,
      children: [],
      sm2State: createInitialSM2State(),
    };

    if (stack.length === 0) {
      // Top-level root node
      rootNodes.push(node);
    } else {
      // Child of the current stack top
      const parent = stack[stack.length - 1].node;
      parent.children.push(node);
    }

    stack.push({
      indent: indentWidth,
      depth: currentDepth,
      node,
    });
  }

  return rootNodes;
}

/**
 * Flattens a hierarchical `SyllabusNode[]` tree into a 1D array
 * using pre-order depth-first traversal.
 *
 * @param nodes Hierarchical array of syllabus nodes.
 * @returns Flat array of all nodes in sequence.
 */
export function flattenTree(nodes: SyllabusNode[]): SyllabusNode[] {
  const result: SyllabusNode[] = [];

  function traverse(list: SyllabusNode[]): void {
    for (const node of list) {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return result;
}

/**
 * Exports a `SyllabusNode[]` tree back to a clean, indented Markdown checklist format.
 *
 * @param nodes Hierarchical array of syllabus nodes.
 * @param indentSpaces Number of spaces per indentation level (default: 2).
 * @returns Markdown string representation of the syllabus.
 */
export function exportToMarkdown(nodes: SyllabusNode[], indentSpaces: number = 2): string {
  const lines: string[] = [];

  function formatNode(node: SyllabusNode): void {
    const indent = ' '.repeat(node.depth * indentSpaces);
    const checkbox = node.status === 'mastered' ? '[x]' : '[ ]';
    
    // Format title with URL if present
    const titleWithLink = node.url ? `[${node.title}](${node.url})` : node.title;
    
    // Append tags if present
    const tagsSuffix = node.tags.length > 0 ? ` ${node.tags.map(t => `#${t}`).join(' ')}` : '';
    
    lines.push(`${indent}- ${checkbox} ${titleWithLink}${tagsSuffix}`);

    for (const child of node.children) {
      formatNode(child);
    }
  }

  for (const root of nodes) {
    formatNode(root);
  }

  return lines.join('\n');
}

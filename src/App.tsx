'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  FolderTree,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  SyllabusNode,
  SyllabusNodeStatus,
  DashboardMetrics,
  ReviewRating,
} from './types/syllabus';
import { parseSyllabusText, flattenTree, exportToMarkdown } from './lib/parser';
import { calculateNextReview, createInitialSM2State } from './lib/sm2';
import { DashboardHeader } from './components/DashboardHeader';
import { SyllabusTreeView } from './components/SyllabusTreeView';
import { MarkdownImportModal } from './components/MarkdownImportModal';
import { ReviewDrawer } from './components/ReviewDrawer';

const LOCAL_STORAGE_KEY_NODES = 'learntree_nodes';
const LOCAL_STORAGE_KEY_STREAK = 'learntree_streak';
const LOCAL_STORAGE_KEY_LAST_DATE = 'learntree_last_study_date';

const DEFAULT_STARTER_SYLLABUS = `# Full-Stack Systems & Distributed Engineering
- [x] [TypeScript Type Systems & Generics](https://www.typescriptlang.org/docs/) #typescript #types
  - [x] Discriminated Unions & Exhaustiveness Checking #types
  - [ ] Conditional Types & Type Inference with \`infer\` #advanced
- [x] [React 19 Architecture & Compiler](https://react.dev/) #react #frontend
  - [x] Server Components & Streaming Protocol #react19
  - [ ] Concurrent Transitions (\`useTransition\`, \`useDeferredValue\`) #performance
  - [ ] Optimistic Updates (\`useOptimistic\`) #ux
- Local-First Architecture & Sync #architecture
  - [ ] Conflict-Free Replicated Data Types (CRDTs) #localfirst
  - [ ] Offline Storage & IndexedDB Synchronization #storage
- High-Performance Networking & Protocols #backend
  - [x] [HTTP/3 & QUIC Transport](https://http3-explained.haxx.se/) #networking
  - [ ] gRPC & Protocol Buffers Invariants #rpc
  - [ ] Server-Sent Events (SSE) vs WebSockets #realtime
- Memory Management & Virtual Machines #systems
  - [ ] WebAssembly Runtime & SIMD Acceleration #wasm
  - [ ] V8 Hidden Classes & Garbage Collection Cycles #v8`;

function seedDefaultNodes(): SyllabusNode[] {
  const nodes = parseSyllabusText(DEFAULT_STARTER_SYLLABUS);
  const now = new Date();
  
  // Set 2 mastered items to be due for review today so user can immediately test Review Queue
  if (nodes.length > 0 && nodes[0].children.length > 0) {
    const dueTime = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    nodes[0].sm2State = {
      interval: 1,
      repetition: 1,
      easeFactor: 2.5,
      lastReviewedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
      nextReviewAt: dueTime,
    };
    nodes[0].children[0].sm2State = {
      interval: 1,
      repetition: 1,
      easeFactor: 2.4,
      lastReviewedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(),
      nextReviewAt: dueTime,
    };
  }
  return nodes;
}

export default function App() {
  const [nodes, setNodes] = useState<SyllabusNode[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY_NODES);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.error('Failed to load cached nodes:', err);
      }
    }
    return seedDefaultNodes();
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY_STREAK);
        if (cached) {
          return parseInt(cached, 10) || 3;
        }
      } catch {
        // ignore
      }
    }
    return 3;
  });

  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);

  // Synchronize nodes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_NODES, JSON.stringify(nodes));
    } catch (err) {
      console.error('Failed to persist nodes:', err);
    }
  }, [nodes]);

  // Synchronize streak to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_STREAK, streakDays.toString());
    } catch {
      // ignore
    }
  }, [streakDays]);

  const flatNodes = useMemo(() => flattenTree(nodes), [nodes]);

  // Determine which nodes are due for review
  const dueNodes = useMemo(() => {
    const nowTime = Date.now();
    return flatNodes.filter((node) => {
      if (node.sm2State.nextReviewAt) {
        const nextTime = new Date(node.sm2State.nextReviewAt).getTime();
        return nextTime <= nowTime;
      }
      // If node is in_progress or mastered without scheduled date, queue for review
      return node.status !== 'unstarted';
    });
  }, [flatNodes]);

  // Compute DashboardMetrics dynamically
  const metrics = useMemo<DashboardMetrics>(() => {
    const totalNodes = flatNodes.length;
    const completedNodes = flatNodes.filter((n) => n.status === 'mastered').length;
    const dueForReviewCount = dueNodes.length;

    // Calculate retention rate based on average ease factor and successful repetitions
    let retentionRate = 0.85; // baseline
    if (totalNodes > 0) {
      const matureNodes = flatNodes.filter((n) => n.sm2State.repetition >= 2).length;
      retentionRate = Math.min(
        0.98,
        Math.max(0.7, 0.75 + (matureNodes / totalNodes) * 0.23)
      );
    }

    return {
      totalNodes,
      completedNodes,
      dueForReviewCount,
      streakDays,
      retentionRate,
    };
  }, [flatNodes, dueNodes.length, streakDays]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    for (const node of flatNodes) {
      if (node.tags) {
        for (const t of node.tags) {
          tagsSet.add(t);
        }
      }
    }
    return Array.from(tagsSet);
  }, [flatNodes]);

  // Update study streak on review completion
  const recordStudyActivity = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_DATE);

    if (lastDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        setStreakDays((prev) => prev + 1);
      } else if (!lastDate) {
        setStreakDays(1);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_LAST_DATE, todayStr);
    }
  }, []);

  // Recursive tree updater helper
  const updateNodeInTree = useCallback(
    (
      tree: SyllabusNode[],
      targetId: string,
      updater: (node: SyllabusNode) => SyllabusNode
    ): SyllabusNode[] => {
      return tree.map((node) => {
        if (node.id === targetId) {
          return updater(node);
        }
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: updateNodeInTree(node.children, targetId, updater),
          };
        }
        return node;
      });
    },
    []
  );

  // Status Change Handler
  const handleNodeStatusChange = useCallback(
    (id: string, newStatus: SyllabusNodeStatus) => {
      setNodes((prev) =>
        updateNodeInTree(prev, id, (node) => {
          let updatedSM2 = node.sm2State;
          if (newStatus === 'mastered' && !node.sm2State.nextReviewAt) {
            // First time mastered: schedule initial review tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            updatedSM2 = {
              ...node.sm2State,
              interval: 1,
              repetition: 1,
              lastReviewedAt: new Date().toISOString(),
              nextReviewAt: tomorrow.toISOString(),
            };
          }
          return {
            ...node,
            status: newStatus,
            sm2State: updatedSM2,
          };
        })
      );
    },
    [updateNodeInTree]
  );

  // SM-2 Review Rating Handler
  const handleRateNode = useCallback(
    (nodeId: string, rating: ReviewRating) => {
      setNodes((prev) =>
        updateNodeInTree(prev, nodeId, (node) => {
          const nextSM2 = calculateNextReview(node.sm2State, rating);
          const newStatus: SyllabusNodeStatus =
            rating === 'again' ? 'in_progress' : 'mastered';

          return {
            ...node,
            status: newStatus,
            sm2State: nextSM2,
          };
        })
      );
      recordStudyActivity();
    },
    [updateNodeInTree, recordStudyActivity]
  );

  // Import Handler
  const handleImportSyllabus = useCallback((importedNodes: SyllabusNode[]) => {
    setNodes(importedNodes);
  }, []);

  // Filter tree based on search query or selected tag
  const filteredNodes = useMemo(() => {
    if (!searchQuery && !selectedTag) {
      return nodes;
    }

    const query = searchQuery.toLowerCase().trim();

    function filterBranch(list: SyllabusNode[]): SyllabusNode[] {
      const results: SyllabusNode[] = [];
      for (const item of list) {
        const matchesQuery = !query || item.title.toLowerCase().includes(query);
        const matchesTag = !selectedTag || (item.tags && item.tags.includes(selectedTag));
        const filteredChildren = item.children ? filterBranch(item.children) : [];

        if ((matchesQuery && matchesTag) || filteredChildren.length > 0) {
          results.push({
            ...item,
            children: filteredChildren,
          });
        }
      }
      return results;
    }

    return filterBranch(nodes);
  }, [nodes, searchQuery, selectedTag]);

  // Export current syllabus to clipboard as Markdown
  const handleCopyMarkdown = () => {
    const md = exportToMarkdown(nodes);
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  // Reset to default sample
  const handleResetSample = () => {
    if (confirm('Reset to default syllabus template? This will replace current nodes.')) {
      setNodes(seedDefaultNodes());
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f1f5f9] selection:bg-[#06b6d4]/30 selection:text-[#f1f5f9] font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Dashboard Header with Brand, $0-AI Local-First pill, Actions, and KPI Cards */}
        <DashboardHeader
          metrics={metrics}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenReview={() => setIsReviewOpen(true)}
        />

        {/* Filter, Search & Export Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-[#12141c] border border-[#2d3246]">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter concepts or topics..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#1a1d28] border border-[#2d3246] focus:border-[#06b6d4] focus:outline-none rounded text-[#f1f5f9] placeholder-[#475569] font-sans transition-colors"
              />
            </div>
            {selectedTag && (
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="px-2 py-1 text-[11px] font-mono rounded bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 transition-colors shrink-0"
              >
                #{selectedTag} ✕
              </button>
            )}
          </div>

          {/* Quick Actions & Export */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {allTags.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-xs py-0.5">
                {allTags.slice(0, 4).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                      selectedTag === t
                        ? 'bg-[#06b6d4] text-[#090a0f] border-[#06b6d4] font-semibold'
                        : 'bg-[#1a1d28] text-[#94a3b8] border-[#2d3246] hover:text-[#f1f5f9]'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded bg-[#1a1d28] hover:bg-[#262a3b] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2d3246] transition-colors cursor-pointer"
              title="Copy syllabus as Markdown checklist"
            >
              {copiedMarkdown ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="text-[#10b981]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Export MD</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetSample}
              className="p-1.5 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#262a3b] border border-[#2d3246] transition-colors cursor-pointer"
              title="Reset to default sample"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Syllabus Hierarchy View */}
        <main>
          <SyllabusTreeView
            nodes={filteredNodes}
            onNodeStatusChange={handleNodeStatusChange}
          />
        </main>
      </div>

      {/* Markdown Import Split-Pane Modal */}
      <MarkdownImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportSyllabus}
      />

      {/* Active Recall SM-2 Review Drawer */}
      <ReviewDrawer
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        dueNodes={dueNodes}
        onRateNode={handleRateNode}
        allNodes={nodes}
      />
    </div>
  );
}

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
  Clock,
  CheckSquare,
  MinusSquare,
  Sparkles,
  Users,
  UserCheck,
} from 'lucide-react';
import type {
  SyllabusNode,
  SyllabusNodeStatus,
  DashboardMetrics,
  ReviewRating,
} from './types/syllabus';
import type { UserProfile } from './types/user';
import {
  loadUserProfiles,
  getActiveUserId,
  setActiveUserId,
  loadUserSyllabus,
  saveUserSyllabus,
  loadUserStreak,
  saveUserStreak,
  loadUserLastStudyDate,
  saveUserLastStudyDate,
  createUserProfile,
  INITIAL_USER_PROFILES,
} from './lib/userStore';
import { parseSyllabusText, flattenTree, exportToMarkdown } from './lib/parser';
import { calculateNextReview, createInitialSM2State } from './lib/sm2';
import { DashboardHeader } from './components/DashboardHeader';
import { SyllabusTreeView } from './components/SyllabusTreeView';
import { MarkdownImportModal } from './components/MarkdownImportModal';
import { ReviewDrawer } from './components/ReviewDrawer';

export default function App() {
  // Multi-user state
  const [users, setUsers] = useState<UserProfile[]>(() => loadUserProfiles());
  const [activeUserId, setActiveUserIdState] = useState<string>(() => getActiveUserId());

  const activeUser = useMemo(() => {
    return (
      users.find((u) => u.id === activeUserId) ||
      users[0] ||
      INITIAL_USER_PROFILES[0]
    );
  }, [users, activeUserId]);

  // Per-user syllabus state
  const [nodes, setNodes] = useState<SyllabusNode[]>(() =>
    loadUserSyllabus(activeUserId)
  );

  // Per-user active recall streak
  const [streakDays, setStreakDays] = useState<number>(() =>
    loadUserStreak(activeUserId)
  );

  // Modal & Drawer visibility
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);

  // Search & Filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'in_progress' | 'mastered'>('all');
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);

  // Switch Active User Profile Handler
  const handleSwitchUser = useCallback((newUserId: string) => {
    setActiveUserIdState(newUserId);
    setActiveUserId(newUserId);
    // Load that user's dedicated syllabus and streak
    const userNodes = loadUserSyllabus(newUserId);
    const userStreak = loadUserStreak(newUserId);
    setNodes(userNodes);
    setStreakDays(userStreak);
    setSearchQuery('');
    setSelectedTag(null);
    setStatusFilter('all');
  }, []);

  // Create New Student Profile Handler
  const handleCreateUser = useCallback(
    (name: string, focusArea: string, color: string) => {
      const newProfile = createUserProfile(name, focusArea, color);
      const updatedList = loadUserProfiles();
      setUsers(updatedList);
      handleSwitchUser(newProfile.id);
    },
    [handleSwitchUser]
  );

  // Persist current user's syllabus when nodes state changes
  useEffect(() => {
    if (activeUserId) {
      saveUserSyllabus(activeUserId, nodes);
    }
  }, [activeUserId, nodes]);

  // Persist current user's streak when streak changes
  useEffect(() => {
    if (activeUserId) {
      saveUserStreak(activeUserId, streakDays);
    }
  }, [activeUserId, streakDays]);

  const flatNodes = useMemo(() => flattenTree(nodes), [nodes]);

  // Nodes due for review for active user
  const dueNodes = useMemo(() => {
    const nowTime = Date.now();
    return flatNodes.filter((node) => {
      if (node.sm2State.nextReviewAt) {
        const nextTime = new Date(node.sm2State.nextReviewAt).getTime();
        return nextTime <= nowTime;
      }
      return node.status !== 'unstarted';
    });
  }, [flatNodes]);

  // Compute DashboardMetrics dynamically for active user
  const metrics = useMemo<DashboardMetrics>(() => {
    const totalNodes = flatNodes.length;
    const completedNodes = flatNodes.filter((n) => n.status === 'mastered').length;
    const dueForReviewCount = dueNodes.length;

    let retentionRate = 0.85;
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

  // Extract all unique tags in active user's syllabus
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

  // Study activity streak update for active user
  const recordStudyActivity = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = loadUserLastStudyDate(activeUserId);

    if (lastDate !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        setStreakDays((prev) => prev + 1);
      } else if (!lastDate) {
        setStreakDays(1);
      }
      saveUserLastStudyDate(activeUserId, todayStr);
    }
  }, [activeUserId]);

  // Recursive tree updater
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

  // Per-user Status Change Handler
  const handleNodeStatusChange = useCallback(
    (id: string, newStatus: SyllabusNodeStatus) => {
      setNodes((prev) =>
        updateNodeInTree(prev, id, (node) => {
          let updatedSM2 = node.sm2State;
          if (newStatus === 'mastered' && !node.sm2State.nextReviewAt) {
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

  // Per-user SM-2 Review Rating Handler
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

  // Per-user Import Handler
  const handleImportSyllabus = useCallback((importedNodes: SyllabusNode[]) => {
    setNodes(importedNodes);
  }, []);

  // Filter nodes based on search, tag, and status
  const filteredNodes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    function filterBranch(list: SyllabusNode[]): SyllabusNode[] {
      const results: SyllabusNode[] = [];
      for (const item of list) {
        const matchesQuery = !query || item.title.toLowerCase().includes(query);
        const matchesTag = !selectedTag || (item.tags && item.tags.includes(selectedTag));

        let matchesStatus = true;
        if (statusFilter === 'mastered') {
          matchesStatus = item.status === 'mastered';
        } else if (statusFilter === 'in_progress') {
          matchesStatus = item.status === 'in_progress';
        } else if (statusFilter === 'due') {
          const isDue =
            (item.sm2State.nextReviewAt &&
              new Date(item.sm2State.nextReviewAt).getTime() <= Date.now()) ||
            item.status !== 'unstarted';
          matchesStatus = Boolean(isDue);
        }

        const filteredChildren = item.children ? filterBranch(item.children) : [];

        if ((matchesQuery && matchesTag && matchesStatus) || filteredChildren.length > 0) {
          results.push({
            ...item,
            children: filteredChildren,
          });
        }
      }
      return results;
    }

    if (!query && !selectedTag && statusFilter === 'all') {
      return nodes;
    }

    return filterBranch(nodes);
  }, [nodes, searchQuery, selectedTag, statusFilter]);

  const handleCopyMarkdown = () => {
    const md = exportToMarkdown(nodes);
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleResetCurrentSyllabus = () => {
    if (confirm(`Reset syllabus for ${activeUser.name}? This will restore the user's initial curriculum.`)) {
      localStorage.removeItem(`learntree_user_${activeUserId}_nodes`);
      const freshNodes = loadUserSyllabus(activeUserId);
      setNodes(freshNodes);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f1f5f9] selection:bg-[#06b6d4]/30 selection:text-[#f1f5f9] font-sans antialiased">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Dashboard Header with Multi-User Profile Switcher, Badges & KPI Tiles */}
        <DashboardHeader
          metrics={metrics}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenReview={() => setIsReviewOpen(true)}
          users={users}
          activeUser={activeUser}
          onSwitchUser={handleSwitchUser}
          onCreateUser={handleCreateUser}
        />

        {/* Current Student Active Profile Context Ribbon */}
        <div className="flex items-center justify-between px-4 py-2 rounded-md bg-[#141722] border border-[#2a3045] text-xs font-mono text-[#94a3b8]">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeUser.avatarColor }}
            />
            <span className="text-[#f1f5f9] font-medium">{activeUser.name}</span>
            <span className="text-[#475569]">·</span>
            <span className="text-[#c0c1ff]">{activeUser.focusArea}</span>
          </div>
          <span className="text-[11px] text-[#10b981] hidden sm:inline">
            Isolated Local-First Database
          </span>
        </div>

        {/* Filter, Search & Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 p-3.5 rounded-lg bg-[#141722] border border-[#2a3045] shadow-sm">
          {/* Search Field & Tag Trigger */}
          <div className="flex items-center gap-2.5 flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeUser.name}'s concepts...`}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#1b1f2e] border border-[#2a3045] focus:border-[#06b6d4] focus:outline-none rounded-md text-[#f1f5f9] placeholder-[#475569] font-sans transition-all"
              />
            </div>
            {selectedTag && (
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="px-2.5 py-1 text-[11px] font-mono rounded-md bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 transition-colors shrink-0 cursor-pointer"
              >
                #{selectedTag} ✕
              </button>
            )}
          </div>

          {/* Status Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#1b1f2e] text-[#f1f5f9] border-[#06b6d4] font-semibold'
                  : 'bg-[#141722] text-[#94a3b8] border-[#2a3045] hover:text-[#f1f5f9]'
              }`}
            >
              All ({flatNodes.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('due')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                statusFilter === 'due'
                  ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b] font-semibold'
                  : 'bg-[#141722] text-[#94a3b8] border-[#2a3045] hover:text-[#f1f5f9]'
              }`}
            >
              Due ({dueNodes.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4] font-semibold'
                  : 'bg-[#141722] text-[#94a3b8] border-[#2a3045] hover:text-[#f1f5f9]'
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('mastered')}
              className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                statusFilter === 'mastered'
                  ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981] font-semibold'
                  : 'bg-[#141722] text-[#94a3b8] border-[#2a3045] hover:text-[#f1f5f9]'
              }`}
            >
              Mastered
            </button>
          </div>

          {/* Quick Actions & Export */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {allTags.length > 0 && (
              <div className="hidden xl:flex items-center gap-1.5 overflow-x-auto max-w-xs py-0.5">
                {allTags.slice(0, 3).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      selectedTag === t
                        ? 'bg-[#06b6d4] text-[#090a0f] border-[#06b6d4] font-semibold'
                        : 'bg-[#1b1f2e] text-[#94a3b8] border-[#2a3045] hover:text-[#f1f5f9]'
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-[#1b1f2e] hover:bg-[#23283b] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2a3045] transition-colors cursor-pointer"
              title="Copy active syllabus as Markdown checklist"
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
              onClick={handleResetCurrentSyllabus}
              className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#f1f5f9] bg-[#1b1f2e] hover:bg-[#23283b] border border-[#2a3045] transition-colors cursor-pointer"
              title="Reset current student's syllabus to starter defaults"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Tree Hierarchy */}
        <main>
          <SyllabusTreeView
            nodes={filteredNodes}
            onNodeStatusChange={handleNodeStatusChange}
          />
        </main>
      </div>

      {/* Split-Pane Markdown Import Modal */}
      <MarkdownImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportSyllabus}
      />

      {/* Active Recall Review Drawer */}
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

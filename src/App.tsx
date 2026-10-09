'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Zap,
  X,
  FolderGit2,
  Sparkles,
} from 'lucide-react';
import type {
  SyllabusNode,
  SyllabusNodeStatus,
  DashboardMetrics,
  ReviewRating,
} from './types/syllabus';
import type { UserProfile } from './types/user';
import type { SyllabusRepo } from './types/repo';
import {
  loadUserProfiles,
  getActiveUserId,
  setActiveUserId,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  loadUserRepos,
  saveUserRepos,
  getActiveRepoId,
  setActiveRepoId,
  createUserRepo,
  updateRepoNodes,
  loadUserStreak,
  saveUserStreak,
  loadUserLastStudyDate,
  saveUserLastStudyDate,
  INITIAL_USER_PROFILES,
} from './lib/userStore';
import { flattenTree, exportToMarkdown } from './lib/parser';
import { calculateNextReview, createInitialSM2State } from './lib/sm2';
import { TopNavbar } from './components/TopNavbar';
import { Sidebar } from './components/Sidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { SyllabusTreeView } from './components/SyllabusTreeView';
import { MarkdownImportModal } from './components/MarkdownImportModal';
import { ReviewDrawer } from './components/ReviewDrawer';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';

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

  // Per-user syllabus repos state (Google Drive model)
  const [repos, setRepos] = useState<SyllabusRepo[]>(() =>
    loadUserRepos(activeUserId)
  );

  const [activeRepoId, setActiveRepoIdState] = useState<string>(() =>
    getActiveRepoId(activeUserId)
  );

  const activeRepo = useMemo(() => {
    return repos.find((r) => r.id === activeRepoId) || repos[0] || null;
  }, [repos, activeRepoId]);

  // Per-user streak state
  const [streakDays, setStreakDays] = useState<number>(() =>
    loadUserStreak(activeUserId)
  );

  // Layout & Modal visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState<boolean>(false);
  const [isCreateRepoOpen, setIsCreateRepoOpen] = useState<boolean>(false);

  // Create repo form fields
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoCode, setNewRepoCode] = useState('SYS-101');

  // Create user form fields
  const [newUserName, setNewUserName] = useState('');
  const [newUserFocus, setNewUserFocus] = useState('');
  const [newUserColor, setNewUserColor] = useState('#10b981');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'in_progress' | 'mastered' | 'tags'>('all');

  // Switch Active User Profile
  const handleSwitchUser = useCallback((newUserId: string) => {
    setActiveUserIdState(newUserId);
    setActiveUserId(newUserId);

    // Load that user's personal repos and active repo ID
    const userRepos = loadUserRepos(newUserId);
    const userActiveRepoId = getActiveRepoId(newUserId);
    const userStreak = loadUserStreak(newUserId);

    setRepos(userRepos);
    setActiveRepoIdState(userActiveRepoId || userRepos[0]?.id || '');
    setStreakDays(userStreak);
    setSearchQuery('');
    setFilterMode('all');
  }, []);

  // Switch Active Syllabus Repo (within the SAME user's account - Google Drive model!)
  const handleSelectRepo = useCallback((repoId: string) => {
    setActiveRepoIdState(repoId);
    setActiveRepoId(activeUserId, repoId);
    setSearchQuery('');
    setFilterMode('all');
  }, [activeUserId]);

  // Create New Syllabus Repo for Active User
  const handleCreateRepo = useCallback(
    (name: string, code: string) => {
      const newRepo = createUserRepo(activeUserId, name, code);
      const updatedRepos = loadUserRepos(activeUserId);
      setRepos(updatedRepos);
      setActiveRepoIdState(newRepo.id);
      setIsCreateRepoOpen(false);
      setNewRepoName('');
    },
    [activeUserId]
  );

  // Update Profile Name & Color
  const handleUpdateUser = useCallback(
    (userId: string, updates: Partial<Pick<UserProfile, 'name' | 'avatarColor'>>) => {
      const updated = updateUserProfile(userId, updates);
      if (updated) {
        setUsers(loadUserProfiles());
      }
    },
    []
  );

  // Delete User Profile
  const handleDeleteUser = useCallback((userId: string) => {
    const { remainingUsers, nextActiveId } = deleteUserProfile(userId);
    setUsers(remainingUsers);
    handleSwitchUser(nextActiveId);
  }, [handleSwitchUser]);

  // Create New User Profile
  const handleCreateUser = useCallback(
    (name: string, focusArea: string, color: string) => {
      const newProfile = createUserProfile(name, focusArea, color);
      const updatedList = loadUserProfiles();
      setUsers(updatedList);
      handleSwitchUser(newProfile.id);
      setIsCreateUserOpen(false);
    },
    [handleSwitchUser]
  );

  // Current Nodes (from activeRepo)
  const nodes = useMemo(() => {
    return activeRepo?.nodes || [];
  }, [activeRepo]);

  const flatNodes = useMemo(() => flattenTree(nodes), [nodes]);

  // Nodes due for review in active repo
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

  // Compute DashboardMetrics dynamically for active repo
  const metrics = useMemo<DashboardMetrics>(() => {
    const totalNodes = flatNodes.length;
    const completedNodes = flatNodes.filter((n) => n.status === 'mastered').length;
    const dueForReviewCount = dueNodes.length;

    let retentionRate = 0.912;
    if (totalNodes > 0) {
      const matureNodes = flatNodes.filter((n) => n.sm2State.repetition >= 2).length;
      retentionRate = Math.min(
        0.98,
        Math.max(0.75, 0.78 + (matureNodes / totalNodes) * 0.18)
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

  // Study streak recording
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

  // Tree updater helper for active repo
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
      if (!activeRepo) return;
      const updatedNodes = updateNodeInTree(nodes, id, (node) => {
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
      });

      // Update repo in state and LocalStorage
      updateRepoNodes(activeUserId, activeRepo.id, updatedNodes);
      setRepos((prev) =>
        prev.map((r) => (r.id === activeRepo.id ? { ...r, nodes: updatedNodes } : r))
      );
    },
    [activeRepo, activeUserId, nodes, updateNodeInTree]
  );

  // Rate Review Node Handler
  const handleRateNode = useCallback(
    (nodeId: string, rating: ReviewRating) => {
      if (!activeRepo) return;
      const updatedNodes = updateNodeInTree(nodes, nodeId, (node) => {
        const nextSM2 = calculateNextReview(node.sm2State, rating);
        const newStatus: SyllabusNodeStatus =
          rating === 'again' ? 'in_progress' : 'mastered';

        return {
          ...node,
          status: newStatus,
          sm2State: nextSM2,
        };
      });

      updateRepoNodes(activeUserId, activeRepo.id, updatedNodes);
      setRepos((prev) =>
        prev.map((r) => (r.id === activeRepo.id ? { ...r, nodes: updatedNodes } : r))
      );
      recordStudyActivity();
    },
    [activeRepo, activeUserId, nodes, updateNodeInTree, recordStudyActivity]
  );

  // Import into Active Repo
  const handleImportSyllabus = useCallback(
    (importedNodes: SyllabusNode[]) => {
      if (!activeRepo) return;
      updateRepoNodes(activeUserId, activeRepo.id, importedNodes);
      setRepos((prev) =>
        prev.map((r) => (r.id === activeRepo.id ? { ...r, nodes: importedNodes } : r))
      );
    },
    [activeRepo, activeUserId]
  );

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    function filterBranch(list: SyllabusNode[]): SyllabusNode[] {
      const results: SyllabusNode[] = [];
      for (const item of list) {
        const matchesQuery =
          !query ||
          item.title.toLowerCase().includes(query) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(query)));

        let matchesFilter = true;
        if (filterMode === 'due') {
          matchesFilter =
            (item.sm2State.nextReviewAt &&
              new Date(item.sm2State.nextReviewAt).getTime() <= Date.now()) ||
            item.status !== 'unstarted';
        } else if (filterMode === 'in_progress') {
          matchesFilter = item.status === 'in_progress';
        } else if (filterMode === 'mastered') {
          matchesFilter = item.status === 'mastered';
        }

        const filteredChildren = item.children ? filterBranch(item.children) : [];

        if ((matchesQuery && matchesFilter) || filteredChildren.length > 0) {
          results.push({
            ...item,
            children: filteredChildren,
          });
        }
      }
      return results;
    }

    if (!query && filterMode === 'all') {
      return nodes;
    }

    return filterBranch(nodes);
  }, [nodes, searchQuery, filterMode]);

  // Global Hotkeys (⌘I, ⌘K, Space)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        setIsImportOpen(true);
      } else if (e.key === ' ' && !isImportOpen && !isReviewOpen && !isProfileSettingsOpen) {
        e.preventDefault();
        setIsReviewOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isImportOpen, isReviewOpen, isProfileSettingsOpen]);

  const completionPercentNumber =
    metrics.totalNodes > 0
      ? Math.round((metrics.completedNodes / metrics.totalNodes) * 100)
      : 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#090a0f] text-[#f1f5f9] overflow-hidden font-sans select-none antialiased">
      {/* Top Navigation Bar with activeRepo breadcrumb, search, triggers, and profile switcher */}
      <TopNavbar
        activeUser={activeUser}
        activeRepo={activeRepo}
        users={users}
        onSelectUser={handleSwitchUser}
        onOpenCreateUser={() => setIsCreateUserOpen(true)}
        onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
        dueCount={metrics.dueForReviewCount}
        completionPercent={completionPercentNumber}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenReview={() => setIsReviewOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((p) => !p)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Smart Queues & User's Syllabus Repos (Google Drive model) */}
        {isSidebarOpen && (
          <Sidebar
            repos={repos}
            activeRepoId={activeRepoId}
            onSelectRepo={handleSelectRepo}
            onOpenCreateRepo={() => setIsCreateRepoOpen(true)}
            dueCount={metrics.dueForReviewCount}
            masteredCount={metrics.completedNodes}
            totalCount={metrics.totalNodes}
            activeFilter={filterMode}
            onSelectQueue={(q) => setFilterMode(q as any)}
          />
        )}

        {/* Center / Right Workbench Reading Channel */}
        <main className="flex-1 overflow-y-auto bg-[#090a0f] p-4 sm:p-6 space-y-4 relative">
          <div className="max-w-6xl mx-auto space-y-4 pb-20">
            {/* Hero Syllabus & 4 KPI Cards */}
            <DashboardHeader
              metrics={metrics}
              activeUser={activeUser}
              activeRepo={activeRepo}
            />

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 px-3 rounded-lg bg-[#12141c] border border-[#1e2230]">
              {/* Search prompt */}
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-mono text-[#06b6d4]">&gt;</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter nodes by identifier, #tag"
                  className="bg-transparent text-xs font-mono text-[#f1f5f9] placeholder-[#475569] focus:outline-none flex-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] text-[#94a3b8]"
                  >
                    ESC
                  </button>
                )}
              </div>

              {/* Filter Pills & Actions */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1 bg-[#090a0f] p-0.5 rounded border border-[#1e2230]">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                      filterMode === 'all'
                        ? 'bg-[#181b26] text-[#f1f5f9] font-medium'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    All ({flatNodes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('due')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                      filterMode === 'due'
                        ? 'bg-[#f59e0b]/20 text-[#f59e0b] font-medium'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    Due Only ({dueNodes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('in_progress')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                      filterMode === 'in_progress'
                        ? 'bg-[#06b6d4]/20 text-[#06b6d4] font-medium'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    In Progress ({Math.max(0, flatNodes.length - metrics.completedNodes - dueNodes.length)})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const title = prompt('Enter new node title:');
                    if (title && activeRepo) {
                      const newNode: SyllabusNode = {
                        id: `node_${Date.now()}`,
                        title: title.trim(),
                        tags: [],
                        status: 'unstarted',
                        depth: 0,
                        children: [],
                        sm2State: createInitialSM2State(),
                      };
                      const updated = [...nodes, newNode];
                      updateRepoNodes(activeUserId, activeRepo.id, updated);
                      setRepos((prev) =>
                        prev.map((r) => (r.id === activeRepo.id ? { ...r, nodes: updated } : r))
                      );
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#181b26] hover:bg-[#202433] text-[#f1f5f9] border border-[#2d3246] text-[11px] font-mono cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-[#10b981]" />
                  <span>Add Node</span>
                  <kbd className="text-[9px] text-[#475569]">N</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReviewOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-mono font-bold text-[11px] transition-colors cursor-pointer shadow-sm"
                >
                  <span>Start Review ({metrics.dueForReviewCount})</span>
                  <kbd className="px-1 py-0.2 rounded text-[9px] bg-[#090a0f]/80 text-[#10b981]">
                    Space
                  </kbd>
                </button>
              </div>
            </div>

            {/* Curriculum Hierarchy Table (Screen 1) */}
            <SyllabusTreeView
              nodes={filteredNodes}
              onNodeStatusChange={handleNodeStatusChange}
              onOpenReview={() => setIsReviewOpen(true)}
            />
          </div>

          {/* Bottom Floating Banner: Queue Ready (Screen 1 bottom) */}
          {metrics.dueForReviewCount > 0 && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-full px-4 animate-in slide-in-from-bottom-3 duration-200">
              <div className="p-3 px-4 rounded-lg bg-[#0c121e] border border-[#06b6d4]/40 shadow-[0_8px_32px_rgba(6,182,212,0.2)] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded bg-[#06b6d4]/15 border border-[#06b6d4]/30 flex items-center justify-center text-[#06b6d4] shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#f1f5f9] font-mono truncate">
                      Queue Ready: {metrics.dueForReviewCount} cards scheduled for consolidation
                    </div>
                    <div className="text-[11px] text-[#94a3b8] font-mono truncate">
                      Estimated session length: 6 mins (SM-2 Interval Calculation)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => alert('Postponed for 2 hours.')}
                    className="px-2.5 py-1 text-[11px] font-mono rounded bg-[#181b26] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2d3246] cursor-pointer"
                  >
                    Postpone 2h
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsReviewOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-mono font-bold text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    <span>Consolidate Now</span>
                    <kbd className="px-1 py-0.2 rounded text-[9px] bg-[#090a0f]/80 text-[#10b981]">
                      Space
                    </kbd>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Screen 2: Split-Pane Markdown Import Modal */}
      <MarkdownImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportSyllabus}
      />

      {/* Screen 3: Spaced Repetition Active Recall Flashcard Review Queue */}
      <ReviewDrawer
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        dueNodes={dueNodes}
        onRateNode={handleRateNode}
        allNodes={nodes}
      />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        user={activeUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Add New Syllabus Repo Modal (Google Drive Model) */}
      {isCreateRepoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090a0f]/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-5 rounded-xl bg-[#141722] border border-[#2d3246] shadow-[0_20px_60px_rgba(0,0,0,0.9)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a3045] pb-2">
              <h3 className="text-sm font-bold text-[#f1f5f9] font-mono flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-[#10b981]" />
                New Syllabus Repo ({activeUser.name})
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateRepoOpen(false)}
                className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#94a3b8] mb-1">
                  Syllabus / Repository Name
                </label>
                <input
                  type="text"
                  required
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="e.g. Distributed Consensus & Raft"
                  className="w-full px-3 py-1.5 text-xs bg-[#1b1f2e] border border-[#2a3045] focus:border-[#06b6d4] focus:outline-none rounded text-[#f1f5f9] font-sans"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#94a3b8] mb-1">
                  Course / Module Code
                </label>
                <input
                  type="text"
                  value={newRepoCode}
                  onChange={(e) => setNewRepoCode(e.target.value)}
                  placeholder="e.g. CS-6824"
                  className="w-full px-3 py-1.5 text-xs bg-[#1b1f2e] border border-[#2a3045] focus:border-[#06b6d4] focus:outline-none rounded text-[#f1f5f9] font-mono uppercase"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#2a3045]">
              <button
                type="button"
                onClick={() => setIsCreateRepoOpen(false)}
                className="flex-1 py-1.5 text-xs font-mono rounded bg-[#1b1f2e] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2a3045] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newRepoName.trim()) {
                    handleCreateRepo(newRepoName.trim(), newRepoCode.trim() || 'SYS-101');
                  }
                }}
                className="flex-1 py-1.5 text-xs font-mono font-bold rounded bg-[#10b981] hover:bg-[#059669] text-[#090a0f] cursor-pointer"
              >
                Create Repo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Student Profile Modal */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090a0f]/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-5 rounded-xl bg-[#141722] border border-[#2a3045] shadow-[0_20px_60px_rgba(0,0,0,0.9)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a3045] pb-2">
              <h3 className="text-sm font-bold text-[#f1f5f9] font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#06b6d4]" />
                Add Student Account
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateUserOpen(false)}
                className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#94a3b8] mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full px-3 py-1.5 text-xs bg-[#1b1f2e] border border-[#2a3045] focus:border-[#06b6d4] focus:outline-none rounded text-[#f1f5f9] font-sans"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#94a3b8] mb-1">
                  Primary Track / Specialization
                </label>
                <input
                  type="text"
                  value={newUserFocus}
                  onChange={(e) => setNewUserFocus(e.target.value)}
                  placeholder="e.g. Cloud Infrastructure"
                  className="w-full px-3 py-1.5 text-xs bg-[#1b1f2e] border border-[#2a3045] focus:border-[#06b6d4] focus:outline-none rounded text-[#f1f5f9] font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#94a3b8] mb-1.5">
                  Avatar Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#f43f5e', '#a855f7'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewUserColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        newUserColor === c ? 'scale-125 ring-2 ring-[#f1f5f9]' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#2a3045]">
              <button
                type="button"
                onClick={() => setIsCreateUserOpen(false)}
                className="flex-1 py-1.5 text-xs font-mono rounded bg-[#1b1f2e] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2a3045] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newUserName.trim()) {
                    handleCreateUser(newUserName, newUserFocus, newUserColor);
                    setNewUserName('');
                    setNewUserFocus('');
                  }
                }}
                className="flex-1 py-1.5 text-xs font-mono font-bold rounded bg-[#10b981] hover:bg-[#059669] text-[#090a0f] cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

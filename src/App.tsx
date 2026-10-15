'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  Plus,
  Zap,
  X,
  FolderGit2,
  Sparkles,
  ArrowUpDown,
  Tag,
  Check,
  Bell,
  Clock,
  Flame,
  Brain,
  HelpCircle,
  Network,
  ListTree,
  Globe,
  Copy,
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
  updateUserRepoMeta,
  deleteUserRepo,
  loadUserStreak,
  loadUserLastStudyDate,
  saveUserLastStudyDate,
  loadUserDailyTarget,
  saveUserDailyTarget,
  loadUserTodayStudyMinutes,
  saveUserTodayStudyMinutes,
  addStudyMinutes,
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
import { NodeModal } from './components/NodeModal';
import { SettingsModal } from './components/SettingsModal';
import { SyllabusTreeGraph } from './components/SyllabusTreeGraph';
import { DailyGoalModal } from './components/DailyGoalModal';
import { AuthModal } from './components/AuthModal';
import { ShareModal } from './components/ShareModal';
import { syncEngine } from './lib/syncEngine';
import {
  pb,
  getSavedSessionUser,
  logoutUser,
  fetchRemoteUserRepos,
  fetchPublicSyllabus,
  pushRepoToRemote,
} from './lib/pocketbase';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState<boolean>(false);
  const [isCreateRepoOpen, setIsCreateRepoOpen] = useState<boolean>(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState<boolean>(false);
  const [isRetentionModalOpen, setIsRetentionModalOpen] = useState<boolean>(false);
  const [isDailyGoalModalOpen, setIsDailyGoalModalOpen] = useState<boolean>(false);

  // Multi-user & Cloud Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => pb.authStore.isValid);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Public Sharing & Preview State
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareTargetRepo, setShareTargetRepo] = useState<SyllabusRepo | null>(null);
  const [publicPreviewRepo, setPublicPreviewRepo] = useState<SyllabusRepo | null>(null);

  // Daily Study Goal tracking state (minutes)
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState<number>(() =>
    loadUserDailyTarget(activeUserId)
  );
  const [todayStudyMinutes, setTodayStudyMinutes] = useState<number>(() =>
    loadUserTodayStudyMinutes(activeUserId)
  );

  // Node editing & creation modal state
  const [isNodeModalOpen, setIsNodeModalOpen] = useState<boolean>(false);
  const [editingNode, setEditingNode] = useState<SyllabusNode | null>(null);
  const [nodeModalParentId, setNodeModalParentId] = useState<string | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search input ref for ⌘K focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Create repo form fields
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoCode, setNewRepoCode] = useState('SYS-101');

  // Create user form fields
  const [newUserName, setNewUserName] = useState('');
  const [newUserFocus, setNewUserFocus] = useState('');
  const [newUserColor, setNewUserColor] = useState('#10b981');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'in_progress' | 'mastered' | 'unstarted' | 'tags'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');

  // Show Toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Switch Active User Profile
  const handleSwitchUser = useCallback((newUserId: string) => {
    setActiveUserIdState(newUserId);
    setActiveUserId(newUserId);

    const userRepos = loadUserRepos(newUserId);
    const userActiveRepoId = getActiveRepoId(newUserId);
    const userStreak = loadUserStreak(newUserId);
    const userDailyTarget = loadUserDailyTarget(newUserId);
    const userTodayMinutes = loadUserTodayStudyMinutes(newUserId);

    setRepos(userRepos);
    setActiveRepoIdState(userActiveRepoId || userRepos[0]?.id || '');
    setStreakDays(userStreak);
    setDailyTargetMinutes(userDailyTarget);
    setTodayStudyMinutes(userTodayMinutes);
    setSearchQuery('');
    setSelectedTag(null);
    setFilterMode('all');
    showToast(`Switched account to ${newUserId.replace('user_', '')}`);
  }, [showToast]);

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

  // Daily Study Goal Handlers
  const handleUpdateDailyTarget = useCallback(
    (newTarget: number) => {
      saveUserDailyTarget(activeUserId, newTarget);
      setDailyTargetMinutes(newTarget);
      showToast(`Daily study target set to ${newTarget} mins`);
    },
    [activeUserId, showToast]
  );

  const handleAddStudyMinutes = useCallback(
    (deltaMinutes: number) => {
      const updated = addStudyMinutes(activeUserId, deltaMinutes);
      setTodayStudyMinutes(updated);
      recordStudyActivity();
      if (updated >= dailyTargetMinutes) {
        showToast(`🎉 Goal achieved! ${updated}/${dailyTargetMinutes} mins completed today.`);
      } else {
        showToast(`Logged +${deltaMinutes}m study time (${updated}/${dailyTargetMinutes}m)`);
      }
    },
    [activeUserId, dailyTargetMinutes, recordStudyActivity, showToast]
  );

  const handleResetStudyMinutes = useCallback(() => {
    saveUserTodayStudyMinutes(activeUserId, 0);
    setTodayStudyMinutes(0);
    showToast("Reset today's study time to 0m");
  }, [activeUserId, showToast]);

  // Save Repo Nodes Helper with Optimistic Local-First Storage & Background PocketBase Sync
  const handleSaveRepoNodes = useCallback(
    (updatedNodes: SyllabusNode[], toastText?: string) => {
      if (!activeRepo) return;
      const updatedRepo: SyllabusRepo = {
        ...activeRepo,
        nodes: updatedNodes,
        updatedAt: new Date().toISOString(),
      };
      updateRepoNodes(activeUserId, activeRepo.id, updatedNodes);
      setRepos((prev) => prev.map((r) => (r.id === activeRepo.id ? updatedRepo : r)));
      syncEngine.enqueueRepoMutation(updatedRepo, (merged) => {
        setRepos((prev) => prev.map((r) => (r.id === merged.id ? merged : r)));
      });
      if (toastText) showToast(toastText);
    },
    [activeRepo, activeUserId, showToast]
  );

  // Auth & Cloud Sync Lifecycle
  useEffect(() => {
    // 1. Check existing session
    const savedUser = getSavedSessionUser();
    if (savedUser && pb.authStore.isValid) {
      setIsAuthenticated(true);
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== savedUser.id);
        return [savedUser, ...filtered];
      });
      setActiveUserIdState(savedUser.id);
      setActiveUserId(savedUser.id);

      // Load remote repos from PocketBase
      fetchRemoteUserRepos(savedUser.id).then((remoteRepos) => {
        if (remoteRepos && remoteRepos.length > 0) {
          setRepos(remoteRepos);
          saveUserRepos(savedUser.id, remoteRepos);
          setActiveRepoIdState(remoteRepos[0].id);
        }
      });
    }

    // 2. Check for public shared syllabus permalink ?share=slug
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shareSlug = urlParams.get('share');
      if (shareSlug) {
        fetchPublicSyllabus(shareSlug).then((publicRepo) => {
          if (publicRepo) {
            setPublicPreviewRepo(publicRepo);
            setRepos((prev) => {
              const without = prev.filter((r) => r.id !== publicRepo.id);
              return [publicRepo, ...without];
            });
            setActiveRepoIdState(publicRepo.id);
            showToast(`Viewing shared syllabus: "${publicRepo.name}"`);
          }
        });
      }
    }

    // 3. Subscribe to sync engine conflict events
    const unsub = syncEngine.subscribe((state) => {
      if (state.status === 'merged' && state.lastConflict) {
        showToast(`Auto-merged ${state.lastConflict.mergedNodesCount} reviews from remote device`);
      }
    });

    return () => unsub();
  }, [showToast]);

  // Auth Success Handler
  const handleAuthSuccess = useCallback((user: UserProfile) => {
    setIsAuthenticated(true);
    setUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== user.id);
      return [user, ...filtered];
    });
    setActiveUserIdState(user.id);
    setActiveUserId(user.id);

    // Fetch or migrate user repos
    fetchRemoteUserRepos(user.id).then((remoteRepos) => {
      if (remoteRepos && remoteRepos.length > 0) {
        setRepos(remoteRepos);
        saveUserRepos(user.id, remoteRepos);
        setActiveRepoIdState(remoteRepos[0].id);
        showToast(`Signed in as ${user.name}. Loaded ${remoteRepos.length} syllabi.`);
      } else {
        // Push existing local repos to PocketBase cloud account
        const localRepos = loadUserRepos(activeUserId);
        const userMigratedRepos = localRepos.map((r) => ({
          ...r,
          userId: user.id,
          id: `repo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        }));
        setRepos(userMigratedRepos);
        saveUserRepos(user.id, userMigratedRepos);
        userMigratedRepos.forEach((r) => syncEngine.enqueueRepoMutation(r));
        showToast(`Welcome ${user.name}! Cloud sync active.`);
      }
    });
  }, [activeUserId, showToast]);

  // Logout Handler
  const handleLogout = useCallback(() => {
    logoutUser();
    setIsAuthenticated(false);
    handleSwitchUser(INITIAL_USER_PROFILES[0].id);
    showToast('Signed out. Switched to demo mode.');
  }, [handleSwitchUser, showToast]);

  // Fork / Clone Public Syllabus Handler
  const handleClonePublicSyllabus = useCallback(() => {
    if (!publicPreviewRepo) return;
    const cloned: SyllabusRepo = {
      ...publicPreviewRepo,
      id: `repo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: activeUserId,
      name: `${publicPreviewRepo.name} (My Copy)`,
      isPublic: false,
      shareSlug: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateRepoNodes(activeUserId, cloned.id, cloned.nodes);
    setRepos((prev) => [cloned, ...prev.filter((r) => r.id !== publicPreviewRepo.id)]);
    setActiveRepoIdState(cloned.id);
    syncEngine.enqueueRepoMutation(cloned);
    setPublicPreviewRepo(null);

    // Clean URL query param without refresh
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    showToast(`Cloned "${publicPreviewRepo.name}" to your workspace!`);
  }, [publicPreviewRepo, activeUserId, showToast]);

  // Update Repo from ShareModal (e.g. toggling public link)
  const handleUpdateRepoFromShare = useCallback((updated: SyllabusRepo) => {
    updateRepoNodes(activeUserId, updated.id, updated.nodes);
    setRepos((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    syncEngine.enqueueRepoMutation(updated);
    showToast(updated.isPublic ? 'Public sharing link activated' : 'Syllabus is now private');
  }, [activeUserId, showToast]);

  // Switch Active Syllabus Repo (within SAME user - Google Drive model)
  const handleSelectRepo = useCallback((repoId: string) => {
    setActiveRepoIdState(repoId);
    setActiveRepoId(activeUserId, repoId);
    setSearchQuery('');
    setSelectedTag(null);
    setFilterMode('all');
  }, [activeUserId]);

  // Create New Syllabus Repo
  const handleCreateRepo = useCallback(
    (name: string, code: string) => {
      const newRepo = createUserRepo(activeUserId, name, code);
      const updatedRepos = loadUserRepos(activeUserId);
      setRepos(updatedRepos);
      setActiveRepoIdState(newRepo.id);
      setIsCreateRepoOpen(false);
      setNewRepoName('');
      showToast(`Created repository "${name}"`);
    },
    [activeUserId, showToast]
  );

  // Delete Syllabus Repo
  const handleDeleteRepo = useCallback(
    (repoId: string) => {
      const { remainingRepos, nextActiveId } = deleteUserRepo(activeUserId, repoId);
      setRepos(remainingRepos);
      setActiveRepoIdState(nextActiveId);
      showToast('Deleted syllabus repository');
    },
    [activeUserId, showToast]
  );

  // Rename Syllabus Repo
  const handleRenameRepo = useCallback(
    (repoId: string, name: string, code: string) => {
      const updated = updateUserRepoMeta(activeUserId, repoId, { name, code });
      if (updated) {
        setRepos(loadUserRepos(activeUserId));
        showToast(`Renamed repository to "${name}"`);
      }
    },
    [activeUserId, showToast]
  );

  // Update Profile Name & Color
  const handleUpdateUser = useCallback(
    (userId: string, updates: Partial<Pick<UserProfile, 'name' | 'avatarColor'>>) => {
      const updated = updateUserProfile(userId, updates);
      if (updated) {
        setUsers(loadUserProfiles());
        showToast('Profile updated successfully');
      }
    },
    [showToast]
  );

  // Delete User Profile
  const handleDeleteUser = useCallback((userId: string) => {
    const { remainingUsers, nextActiveId } = deleteUserProfile(userId);
    setUsers(remainingUsers);
    handleSwitchUser(nextActiveId);
    showToast('Profile deleted');
  }, [handleSwitchUser, showToast]);

  // Create New User Profile
  const handleCreateUser = useCallback(
    (name: string, focusArea: string, color: string) => {
      const newProfile = createUserProfile(name, focusArea, color);
      const updatedList = loadUserProfiles();
      setUsers(updatedList);
      handleSwitchUser(newProfile.id);
      setIsCreateUserOpen(false);
      showToast(`Welcome ${name}! Profile created.`);
    },
    [handleSwitchUser, showToast]
  );

  // Reset to Factory Starter Data
  const handleResetFactoryData = useCallback(() => {
    localStorage.clear();
    setUsers(INITIAL_USER_PROFILES);
    handleSwitchUser(INITIAL_USER_PROFILES[0].id);
    showToast('Reset all database records to starter demo state.');
  }, [handleSwitchUser, showToast]);

  // Current Nodes (from activeRepo)
  const nodes = useMemo(() => {
    return activeRepo?.nodes || [];
  }, [activeRepo]);

  const flatNodes = useMemo(() => flattenTree(nodes), [nodes]);

  // All unique tags in active repo
  const allRepoTags = useMemo(() => {
    const set = new Set<string>();
    flatNodes.forEach((n) => {
      n.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [flatNodes]);

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

  // Status Change Handler (Checkbox toggle)
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

      handleSaveRepoNodes(updatedNodes);
    },
    [activeRepo, nodes, updateNodeInTree, handleSaveRepoNodes]
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

      handleSaveRepoNodes(updatedNodes);
      recordStudyActivity();
    },
    [activeRepo, nodes, updateNodeInTree, handleSaveRepoNodes, recordStudyActivity]
  );

  // Save/Create/Edit Node Handler
  const handleSaveNode = useCallback(
    (nodeData: {
      id?: string;
      parentId?: string | null;
      title: string;
      url?: string;
      tags: string[];
      status: SyllabusNodeStatus;
    }) => {
      if (!activeRepo) return;

      if (nodeData.id) {
        // Edit existing node
        const updatedNodes = updateNodeInTree(nodes, nodeData.id, (node) => ({
          ...node,
          title: nodeData.title,
          url: nodeData.url,
          tags: nodeData.tags,
          status: nodeData.status,
        }));
        handleSaveRepoNodes(updatedNodes, `Updated concept "${nodeData.title}"`);
      } else {
        // Create new node
        const newNode: SyllabusNode = {
          id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: nodeData.title,
          url: nodeData.url,
          tags: nodeData.tags,
          status: nodeData.status,
          depth: nodeData.parentId ? 1 : 0,
          children: [],
          sm2State: createInitialSM2State(),
        };

        let updatedNodes: SyllabusNode[];
        if (nodeData.parentId) {
          // Append as child
          updatedNodes = updateNodeInTree(nodes, nodeData.parentId, (parent) => ({
            ...parent,
            children: [...(parent.children || []), { ...newNode, depth: parent.depth + 1 }],
          }));
        } else {
          // Append at root level
          updatedNodes = [...nodes, newNode];
        }

        handleSaveRepoNodes(updatedNodes, `Added concept "${nodeData.title}"`);
      }
    },
    [activeRepo, nodes, updateNodeInTree, handleSaveRepoNodes]
  );

  // Delete Node Handler
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      if (!activeRepo) return;
      function removeRecursive(list: SyllabusNode[]): SyllabusNode[] {
        return list
          .filter((n) => n.id !== nodeId)
          .map((n) => ({
            ...n,
            children: n.children ? removeRecursive(n.children) : [],
          }));
      }
      const updatedNodes = removeRecursive(nodes);
      handleSaveRepoNodes(updatedNodes, 'Deleted node from syllabus.');
    },
    [activeRepo, nodes, handleSaveRepoNodes]
  );

  // Mark Node Due Now (Force review)
  const handleMarkDueNow = useCallback(
    (nodeId: string) => {
      if (!activeRepo) return;
      const updatedNodes = updateNodeInTree(nodes, nodeId, (node) => ({
        ...node,
        status: node.status === 'unstarted' ? 'in_progress' : node.status,
        sm2State: {
          ...node.sm2State,
          nextReviewAt: new Date().toISOString(),
        },
      }));
      handleSaveRepoNodes(updatedNodes, 'Concept scheduled as DUE TODAY.');
    },
    [activeRepo, nodes, updateNodeInTree, handleSaveRepoNodes]
  );

  // Postpone 2 Hours Handler
  const handlePostponeSession = useCallback(() => {
    if (!activeRepo) return;
    const nowPlus2h = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    function postponeRecursive(list: SyllabusNode[]): SyllabusNode[] {
      return list.map((n) => {
        let updatedSM2 = n.sm2State;
        const isCurrentlyDue =
          (n.sm2State.nextReviewAt &&
            new Date(n.sm2State.nextReviewAt).getTime() <= Date.now()) ||
          n.status !== 'unstarted';

        if (isCurrentlyDue) {
          updatedSM2 = {
            ...n.sm2State,
            nextReviewAt: nowPlus2h,
          };
        }

        return {
          ...n,
          sm2State: updatedSM2,
          children: n.children ? postponeRecursive(n.children) : [],
        };
      });
    }

    const updatedNodes = postponeRecursive(nodes);
    handleSaveRepoNodes(updatedNodes, 'Review session postponed by 2 hours.');
  }, [activeRepo, nodes, handleSaveRepoNodes]);

  // Import into Active Repo
  const handleImportSyllabus = useCallback(
    (importedNodes: SyllabusNode[]) => {
      if (!activeRepo) return;
      handleSaveRepoNodes(importedNodes, `Imported ${flattenTree(importedNodes).length} concepts into "${activeRepo.name}"`);
    },
    [activeRepo, handleSaveRepoNodes]
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
        } else if (filterMode === 'unstarted') {
          matchesFilter = item.status === 'unstarted';
        } else if (filterMode === 'tags' && selectedTag) {
          matchesFilter = Boolean(item.tags && item.tags.includes(selectedTag));
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

    if (!query && filterMode === 'all' && !selectedTag) {
      return nodes;
    }

    return filterBranch(nodes);
  }, [nodes, searchQuery, filterMode, selectedTag]);

  // Global Keyboard Shortcuts (Space, ⌘I, ⌘K, N, G D, Esc)
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Allow input typing without hotkeys triggering
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const now = Date.now();

      // G D -> Jump to Due Today queue
      if (e.key.toLowerCase() === 'd' && lastKey === 'g' && now - lastKeyTime < 1000) {
        e.preventDefault();
        setFilterMode('due');
        showToast('Switched to Due Today Queue');
        return;
      }
      lastKey = e.key.toLowerCase();
      lastKeyTime = now;

      // ⌘K or Ctrl+K -> Focus Search Bar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // ⌘I or Ctrl+I -> Open Import Modal
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsImportOpen(true);
        return;
      }

      // Space -> Open Review Drawer (if not already in modal)
      if (
        e.key === ' ' &&
        !isImportOpen &&
        !isReviewOpen &&
        !isProfileSettingsOpen &&
        !isSettingsModalOpen &&
        !isNodeModalOpen &&
        !isCreateRepoOpen &&
        !isCreateUserOpen
      ) {
        e.preventDefault();
        if (dueNodes.length > 0) {
          setIsReviewOpen(true);
        } else {
          showToast('No cards due for review right now.');
        }
        return;
      }

      // N -> Add New Concept Node
      if (
        e.key.toLowerCase() === 'n' &&
        !isImportOpen &&
        !isReviewOpen &&
        !isProfileSettingsOpen &&
        !isSettingsModalOpen &&
        !isNodeModalOpen
      ) {
        e.preventDefault();
        setEditingNode(null);
        setNodeModalParentId(null);
        setIsNodeModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    isImportOpen,
    isReviewOpen,
    isProfileSettingsOpen,
    isSettingsModalOpen,
    isNodeModalOpen,
    isCreateRepoOpen,
    isCreateUserOpen,
    dueNodes.length,
    showToast,
  ]);

  const completionPercentNumber =
    metrics.totalNodes > 0
      ? Math.round((metrics.completedNodes / metrics.totalNodes) * 100)
      : 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#090a0f] text-[#f1f5f9] overflow-hidden font-sans select-none antialiased">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-3 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#141722] border border-[#10b981] shadow-[0_8px_24px_rgba(16,185,129,0.25)] text-xs font-mono text-[#f1f5f9] animate-in fade-in slide-in-from-top-2 duration-150">
          <Check className="w-3.5 h-3.5 text-[#10b981]" />
          <span>{toastMessage}</span>
        </div>
      )}

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
        onOpenAuthModal={(m) => {
          setAuthModalMode(m);
          setIsAuthModalOpen(true);
        }}
        onOpenShareModal={() => {
          setShareTargetRepo(activeRepo);
          setIsShareModalOpen(true);
        }}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
      />

      {/* Public Shared Syllabus Banner */}
      {publicPreviewRepo && (
        <div className="bg-[#121524] border-b border-[#06b6d4]/40 px-4 py-2 flex items-center justify-between gap-3 text-xs z-30 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#06b6d4] shrink-0" />
            <span className="text-[#f1f5f9]">
              Viewing Public Syllabus:{' '}
              <span className="font-bold text-[#06b6d4]">{publicPreviewRepo.name}</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#06b6d4]/20 text-[#06b6d4] hidden sm:inline">
              Read-Only Preview
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClonePublicSyllabus}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-mono font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Clone into My Syllabex</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPublicPreviewRepo(null);
                if (typeof window !== 'undefined') {
                  window.history.replaceState({}, document.title, window.location.pathname);
                }
              }}
              className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] cursor-pointer"
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar: Smart Queues & User's Syllabus Repos (Google Drive model) */}
        {isSidebarOpen && (
          <div className="fixed inset-y-0 left-0 z-50 md:relative md:z-0 md:inset-auto h-full">
            <Sidebar
              repos={repos}
              activeRepoId={activeRepoId}
              activeUserName={activeUser.name}
              onSelectRepo={handleSelectRepo}
              onOpenCreateRepo={() => setIsCreateRepoOpen(true)}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              onDeleteRepo={handleDeleteRepo}
              onRenameRepo={handleRenameRepo}
              onOpenShareRepo={(repo) => {
                setShareTargetRepo(repo);
                setIsShareModalOpen(true);
              }}
              dueCount={metrics.dueForReviewCount}
              masteredCount={metrics.completedNodes}
              totalCount={metrics.totalNodes}
              activeFilter={filterMode}
              onSelectQueue={(q) => {
                if (q === 'tags') {
                  setFilterMode('tags');
                  if (allRepoTags.length > 0 && !selectedTag) {
                    setSelectedTag(allRepoTags[0]);
                  }
                } else {
                  setSelectedTag(null);
                  setFilterMode(q as any);
                }
              }}
              onCloseMobile={() => setIsSidebarOpen(false)}
            />
          </div>
        )}

        {/* Center / Right Workbench Reading Channel */}
        <main className="flex-1 overflow-y-auto bg-[#090a0f] p-4 sm:p-6 space-y-4 relative">
          <div className="max-w-6xl mx-auto space-y-4 pb-20">
            {/* Hero Syllabus & 5 KPI Cards (Screen 1) */}
            <DashboardHeader
              metrics={metrics}
              activeUser={activeUser}
              activeRepo={activeRepo}
              onOpenReview={() => setIsReviewOpen(true)}
              onFilterStatus={(s) => {
                setSelectedTag(null);
                setFilterMode(s);
              }}
              onOpenStreakModal={() => setIsStreakModalOpen(true)}
              onOpenRetentionModal={() => setIsRetentionModalOpen(true)}
              dailyTargetMinutes={dailyTargetMinutes}
              todayStudyMinutes={todayStudyMinutes}
              onOpenDailyGoalModal={() => setIsDailyGoalModalOpen(true)}
            />

            {/* Tags Explorer Bar (when tags filter active or tags clicked) */}
            {filterMode === 'tags' && (
              <div className="p-3 rounded-lg bg-[#141722] border border-[#2d3246] space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8]">
                  <span className="flex items-center gap-1.5 text-[#6366f1] font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    Tags & Backlinks Explorer ({allRepoTags.length} tags)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTag(null);
                      setFilterMode('all');
                    }}
                    className="text-[10px] text-[#475569] hover:text-[#f1f5f9] cursor-pointer"
                  >
                    Clear Filter ✕
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {allRepoTags.length === 0 ? (
                    <span className="text-xs text-[#475569] font-mono">No tags found in this syllabus.</span>
                  ) : (
                    allRepoTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTag(t)}
                        className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                          selectedTag === t
                            ? 'bg-[#6366f1] text-[#f1f5f9] border-[#6366f1] font-bold shadow-sm'
                            : 'bg-[#181b26] text-[#94a3b8] border-[#2d3246] hover:text-[#f1f5f9]'
                        }`}
                      >
                        #{t}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Filter Toolbar (Screen 1) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 px-3 rounded-lg bg-[#12141c] border border-[#1e2230]">
              {/* Search prompt */}
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-mono text-[#06b6d4]">&gt;</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter nodes by identifier, #tag (⌘K)"
                  className="bg-transparent text-xs font-mono text-[#f1f5f9] placeholder-[#475569] focus:outline-none flex-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] text-[#94a3b8] hover:text-[#f1f5f9] cursor-pointer"
                  >
                    ESC
                  </button>
                )}
                {selectedTag && (
                  <button
                    type="button"
                    onClick={() => setSelectedTag(null)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#6366f1]/20 text-[#c0c1ff] border border-[#6366f1]/40 flex items-center gap-1 cursor-pointer"
                  >
                    #{selectedTag} ✕
                  </button>
                )}
              </div>

              {/* Filter Pills & Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-[#090a0f] p-0.5 rounded border border-[#1e2230] overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTag(null);
                      setFilterMode('all');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer whitespace-nowrap ${
                      filterMode === 'all' && !selectedTag
                        ? 'bg-[#181b26] text-[#f1f5f9] font-medium'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    All ({flatNodes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTag(null);
                      setFilterMode('due');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer whitespace-nowrap ${
                      filterMode === 'due'
                        ? 'bg-[#f59e0b]/20 text-[#f59e0b] font-medium'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    Due ({dueNodes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTag(null);
                      setFilterMode('in_progress');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer whitespace-nowrap ${
                      filterMode === 'in_progress'
                        ? 'bg-[#06b6d4]/20 text-[#06b6d4] font-medium'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    In Progress ({Math.max(0, flatNodes.length - metrics.completedNodes - dueNodes.length)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTag(null);
                      setFilterMode('mastered');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer whitespace-nowrap ${
                      filterMode === 'mastered'
                        ? 'bg-[#10b981]/20 text-[#10b981] font-medium'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    Mastered ({metrics.completedNodes})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTag(null);
                      setFilterMode('unstarted');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer whitespace-nowrap ${
                      filterMode === 'unstarted'
                        ? 'bg-[#475569]/30 text-[#f1f5f9] font-medium'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    Unstarted ({flatNodes.filter((n) => n.status === 'unstarted').length})
                  </button>
                </div>

                {/* View Switcher: Table vs D3 Tree Graph */}
                <div className="flex items-center gap-0.5 bg-[#090a0f] p-0.5 rounded border border-[#1e2230] shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                      viewMode === 'table'
                        ? 'bg-[#181b26] text-[#f1f5f9] font-medium shadow-sm'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                    title="Curriculum Table View"
                  >
                    <ListTree className="w-3 h-3 text-[#38bdf8]" />
                    <span className="hidden sm:inline">Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('graph')}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                      viewMode === 'graph'
                        ? 'bg-[#6366f1]/20 text-[#c0c1ff] border border-[#6366f1]/40 font-medium shadow-sm'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                    title="D3 Hierarchical Tree Graph Visualization"
                  >
                    <Network className="w-3 h-3 text-[#6366f1]" />
                    <span>Tree Graph</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#6366f1]/30 text-[#e0e7ff] font-bold">D3</span>
                  </button>
                </div>

                {/* Add Node Button (N) */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingNode(null);
                    setNodeModalParentId(null);
                    setIsNodeModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#181b26] hover:bg-[#202433] text-[#f1f5f9] border border-[#2d3246] text-[11px] font-mono cursor-pointer transition-colors shrink-0"
                  title="Add concept node (N)"
                >
                  <Plus className="w-3 h-3 text-[#10b981]" />
                  <span>Add Node</span>
                  <kbd className="text-[9px] text-[#475569] hidden sm:inline">N</kbd>
                </button>

                {/* Start Review (Space) */}
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-mono font-bold text-[11px] transition-colors cursor-pointer shadow-sm shrink-0"
                >
                  <span>Start Review ({metrics.dueForReviewCount})</span>
                  <kbd className="px-1 py-0.2 rounded text-[9px] bg-[#090a0f]/80 text-[#10b981] hidden sm:inline">
                    Space
                  </kbd>
                </button>
              </div>
            </div>

            {/* Curriculum Hierarchy Table or D3 Tree Graph Visualizer */}
            {viewMode === 'table' ? (
              <SyllabusTreeView
                nodes={filteredNodes}
                onNodeStatusChange={handleNodeStatusChange}
                onEditNode={(node) => {
                  setEditingNode(node);
                  setIsNodeModalOpen(true);
                }}
                onAddChildNode={(parentId) => {
                  setEditingNode(null);
                  setNodeModalParentId(parentId);
                  setIsNodeModalOpen(true);
                }}
                onDeleteNode={handleDeleteNode}
                onMarkDueNow={handleMarkDueNow}
                onAppendRootSection={() => {
                  setEditingNode(null);
                  setNodeModalParentId(null);
                  setIsNodeModalOpen(true);
                }}
                onOpenReview={() => setIsReviewOpen(true)}
                onSelectTag={(tag) => {
                  setSelectedTag(tag);
                  setFilterMode('tags');
                }}
              />
            ) : (
              <SyllabusTreeGraph
                repoName={activeRepo?.name || 'Syllabus Repository'}
                repoCode={activeRepo?.code}
                nodes={filteredNodes}
                searchQuery={searchQuery}
                selectedTag={selectedTag}
                filterMode={filterMode}
                onNodeStatusChange={handleNodeStatusChange}
                onEditNode={(node) => {
                  setEditingNode(node);
                  setIsNodeModalOpen(true);
                }}
                onAddChildNode={(parentId) => {
                  setEditingNode(null);
                  setNodeModalParentId(parentId);
                  setIsNodeModalOpen(true);
                }}
                onDeleteNode={handleDeleteNode}
                onMarkDueNow={handleMarkDueNow}
                onOpenReview={() => setIsReviewOpen(true)}
              />
            )}
          </div>

          {/* Bottom Floating Banner: Queue Ready (Screen 1 bottom) */}
          {metrics.dueForReviewCount > 0 && (
            <div className="fixed bottom-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 z-30 sm:max-w-2xl sm:w-full animate-in slide-in-from-bottom-3 duration-200">
              <div className="p-2.5 sm:p-3 px-3 sm:px-4 rounded-lg bg-[#0c121e] border border-[#06b6d4]/40 shadow-[0_8px_32px_rgba(6,182,212,0.2)] flex items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded bg-[#06b6d4]/15 border border-[#06b6d4]/30 flex items-center justify-center text-[#06b6d4] shrink-0">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#f1f5f9] font-mono truncate text-[11px] sm:text-xs">
                      Queue Ready: {metrics.dueForReviewCount} cards scheduled
                    </div>
                    <div className="text-[10px] text-[#94a3b8] font-mono truncate hidden xs:block">
                      SM-2 Active Recall Scheduled
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handlePostponeSession}
                    className="px-2 py-1 text-[10px] sm:text-[11px] font-mono rounded bg-[#181b26] hover:bg-[#202433] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2d3246] transition-colors cursor-pointer"
                  >
                    Postpone
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsReviewOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-mono font-bold text-[11px] transition-colors cursor-pointer shadow-sm"
                  >
                    <span>Consolidate</span>
                    <kbd className="px-1 py-0.2 rounded text-[9px] bg-[#090a0f]/80 text-[#10b981] hidden sm:inline">
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

      {/* System Settings & Shortcuts Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        totalRepos={repos.length}
        totalNodes={flatNodes.length}
        totalUsers={users.length}
        onResetFactoryData={handleResetFactoryData}
      />

      {/* Node Create / Edit Modal */}
      <NodeModal
        isOpen={isNodeModalOpen}
        onClose={() => setIsNodeModalOpen(false)}
        onSaveNode={handleSaveNode}
        onDeleteNode={handleDeleteNode}
        editingNode={editingNode}
        allNodes={nodes}
        defaultParentId={nodeModalParentId}
      />

      {/* Streak Information Modal */}
      {isStreakModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090a0f]/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-5 rounded-xl bg-[#141722] border border-[#2d3246] shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-[#2d3246] pb-2">
              <span className="text-xs font-mono font-bold text-[#f59e0b] flex items-center gap-1.5 uppercase">
                <Flame className="w-4 h-4 text-[#f59e0b]" />
                Consolidation Streak
              </span>
              <button
                type="button"
                onClick={() => setIsStreakModalOpen(false)}
                className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xl font-bold font-mono text-[#f1f5f9]">
              {metrics.streakDays} Consecutive Days 🔥
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Consolidating active recall cards every 24–48 hours prevents Ebbinghaus memory decay and strengthens long-term synaptic stability.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsStreakModalOpen(false)}
                className="w-full py-1.5 text-xs font-mono font-bold rounded bg-[#10b981] text-[#090a0f] cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retention Rate Modal */}
      {isRetentionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090a0f]/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm p-5 rounded-xl bg-[#141722] border border-[#2d3246] shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-[#2d3246] pb-2">
              <span className="text-xs font-mono font-bold text-[#6366f1] flex items-center gap-1.5 uppercase">
                <Brain className="w-4 h-4 text-[#6366f1]" />
                SuperMemo-2 Retention Math
              </span>
              <button
                type="button"
                onClick={() => setIsRetentionModalOpen(false)}
                className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xl font-bold font-mono text-[#f1f5f9]">
              {(metrics.retentionRate * 100).toFixed(1)}% Estimated Retention
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Calculated using the SM-2 formulation: <code className="text-[#06b6d4] font-mono">EF&apos; = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))</code>. Items with repetition &gt;= 2 show ~32 day memory half-life.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsRetentionModalOpen(false)}
                className="w-full py-1.5 text-xs font-mono font-bold rounded bg-[#10b981] text-[#090a0f] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Daily Study Goal & Focus Session Modal */}
      <DailyGoalModal
        isOpen={isDailyGoalModalOpen}
        onClose={() => setIsDailyGoalModalOpen(false)}
        activeUser={activeUser}
        dailyTargetMinutes={dailyTargetMinutes}
        todayStudyMinutes={todayStudyMinutes}
        onUpdateDailyTarget={handleUpdateDailyTarget}
        onAddStudyMinutes={handleAddStudyMinutes}
        onResetStudyMinutes={handleResetStudyMinutes}
      />

      {/* PocketBase Multi-User Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
        hasLocalDataToMigrate={repos.length > 0}
      />

      {/* Public Share & Privacy Sanitization Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareTargetRepo(null);
        }}
        repo={shareTargetRepo || activeRepo}
        onUpdateRepo={handleUpdateRepoFromShare}
        onPreviewPublicShare={(slug) => {
          setIsShareModalOpen(false);
          fetchPublicSyllabus(slug).then((publicRepo) => {
            if (publicRepo) {
              setPublicPreviewRepo(publicRepo);
              setActiveRepoIdState(publicRepo.id);
            }
          });
        }}
      />
    </div>
  );
}

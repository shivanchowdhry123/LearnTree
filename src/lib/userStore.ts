import type { UserProfile } from '../types/user';
import type { SyllabusRepo } from '../types/repo';
import type { SyllabusNode } from '../types/syllabus';
import { parseSyllabusText } from './parser';

const STORAGE_KEY_USERS = 'learntree_multi_users';
const STORAGE_KEY_ACTIVE_USER = 'learntree_active_user_id';

export const INITIAL_USER_PROFILES: UserProfile[] = [];

// Sample Curricula Outlines for Repositories
const OUTLINE_DISTRIBUTED_SYSTEMS = `# Distributed Systems & Concurrency
- [x] Foundations of Distributed Systems #consensus #core
  - [x] Paxos vs Multi-Paxos (https://lamport.azurewebsites.net/paxos.html) #paxos #theory
  - [x] Raft Consensus Algorithm (https://raft.github.io) #raft #ongaro
    - [x] Leader Election [Heartbeats & Randomized Timeouts]
    - [x] Log Replication & Safety Invariants
- [ ] Distributed Transactions & Concurrency #transactions #2pc
  - [ ] Two-Phase Commit (2PC) (https://martinfowler.com) #concurrency
  - [ ] Spanner TrueTime & Consistency (https://research.google/pubs/spanner/) #truetime #spanner
  - [ ] Calvin: Fast Distributed Transactions (https://yale.edu/calvin) #calvin
  - [ ] Conflict-Free Replicated Data Types (CRDTs) #crdt #p2p
- [ ] Storage Engines & Indexing #storage #lsm
  - [ ] LSM-Trees and SSTables #storage
  - [ ] Write-Ahead Log (WAL) & Crash Recovery`;

const OUTLINE_COMPILERS = `# Compilers & Abstract Syntax Trees
- [x] Lexical Analysis & Tokenization #lexing
  - [x] Regular Expressions to DFAs #theory
  - [x] Maximum Munch Invariants
- Intermediate Representations (IR) #llvm
  - [x] Static Single Assignment (SSA) Form #optimization
  - [ ] Control Flow Graphs (CFG) & Dominator Trees
- Code Generation & Register Allocation #codegen
  - [ ] Graph Coloring Register Allocation
  - [ ] Instruction Selection via Tree Rewriting`;

const OUTLINE_KERNEL = `# Linux Kernel Architecture & eBPF
- Memory Subsystem & Virtual Memory #kernel #memory
  - [x] 4-Level Page Tables & TLB Shootdowns #mm
  - [ ] Slab & Slub Allocator Internals #memory
- Concurrency & Synchronization #concurrency
  - [x] Read-Copy-Update (RCU) Invariants #rcu
  - [ ] Lockless Ring Buffers
- Programmable Networking & Observability #ebpf
  - [ ] eBPF XDP Packet Processing #networking
  - [ ] Kernel Tracepoints & BPF Verifier`;

const OUTLINE_RUST = `# Rust Concurrency & Atomics
- Memory Model & Happens-Before #memory #atomics
  - [x] Sequentially Consistent (SeqCst) vs Acquire/Release #atomics
  - [ ] Relaxed Memory Ordering
- Safe Concurrency Abstractions #rust
  - [x] Send & Sync Trait Invariants #traits
  - [ ] Lock-Free Queues with Crossbeam #channels`;

const OUTLINE_WEB_REACT = `# Modern Web Engineering & React 19
- React 19 Core Invariants #react19 #frontend
  - [x] Server Components & Streaming SSR Protocol
  - [x] Server Actions & Mutation Lifecycle
  - [ ] Concurrent Transitions (\`useTransition\`)
- Local-First Architecture #localfirst
  - [ ] Conflict-Free Replicated Data Types (CRDTs)
  - [ ] Offline IndexedDB Cache Synchronization`;

const OUTLINE_DATABASES = `# Database Internals & Storage
- Storage Layout & Buffer Pool #storage #engines
  - [x] B+ Trees & Node Splitting
  - [ ] Slotted-Page Disk Representation
- Transaction Processing & Concurrency #acid
  - [ ] Multi-Version Concurrency Control (MVCC)
  - [ ] ARIES Recovery & Write-Ahead Logging (WAL)`;

function buildSeededRepo(
  userId: string,
  id: string,
  name: string,
  code: string,
  rawOutline: string
): SyllabusRepo {
  const nodes = parseSyllabusText(rawOutline);
  const now = new Date();

  // If there are nodes, schedule a couple to be due today for active recall queue
  if (nodes.length > 1 && nodes[1].children && nodes[1].children.length > 0) {
    const dueTime = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    nodes[1].children[0].sm2State = {
      interval: 1,
      repetition: 1,
      easeFactor: 2.35,
      lastReviewedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString(),
      nextReviewAt: dueTime,
    };
    if (nodes[1].children.length > 1) {
      nodes[1].children[1].sm2State = {
        interval: 1,
        repetition: 1,
        easeFactor: 2.4,
        lastReviewedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(),
        nextReviewAt: dueTime,
      };
    }
  }

  return {
    id,
    userId,
    name,
    code,
    nodes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// For brand new accounts: everything starts completely from 0 (no pre-defined or half-completed syllabus)
export function getInitialUserRepos(_userId: string): SyllabusRepo[] {
  return [];
}


// User Profile Operations
export function loadUserProfiles(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load user profiles:', err);
  }
  return [];
}

export function saveUserProfiles(users: UserProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save user profiles:', err);
  }
}

export function getActiveUserId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const active = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    if (active) return active;
  } catch {
    // fallback
  }
  const users = loadUserProfiles();
  return users[0]?.id || '';
}

export function setActiveUserId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, id);
  } catch (err) {
    console.error('Failed to set active user ID:', err);
  }
}

export function createUserProfile(
  name: string,
  focusArea: string,
  avatarColor: string = '#10b981'
): UserProfile {
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() || '')
      .slice(0, 2)
      .join('') || 'ST';

  const newProfile: UserProfile = {
    id,
    name: name.trim() || 'New Student',
    avatarColor,
    avatarInitials: initials,
    focusArea: focusArea.trim() || 'General Curriculum',
    createdAt: new Date().toISOString(),
  };

  const users = loadUserProfiles();
  const updated = [...users, newProfile];
  saveUserProfiles(updated);

  // Brand new account starts completely from 0: empty repos, 0 streak, 0 study minutes
  saveUserRepos(id, []);
  setActiveRepoId(id, '');
  saveUserStreak(id, 0);
  saveUserTodayStudyMinutes(id, 0);

  return newProfile;
}

export function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'name' | 'avatarColor' | 'focusArea'>>
): UserProfile | null {
  const users = loadUserProfiles();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const current = users[index];
  const newName = updates.name !== undefined ? updates.name.trim() : current.name;
  const initials = newName
    ? newName
        .split(/\s+/)
        .map((part) => part[0]?.toUpperCase() || '')
        .slice(0, 2)
        .join('')
    : current.avatarInitials;

  const updated: UserProfile = {
    ...current,
    name: newName || current.name,
    avatarColor: updates.avatarColor || current.avatarColor,
    avatarInitials: initials || current.avatarInitials,
    focusArea: updates.focusArea !== undefined ? updates.focusArea.trim() : current.focusArea,
  };

  users[index] = updated;
  saveUserProfiles(users);
  return updated;
}

export function deleteUserProfile(userId: string): { remainingUsers: UserProfile[]; nextActiveId: string } {
  const users = loadUserProfiles();
  const filtered = users.filter((u) => u.id !== userId);

  // Clean up all repos and streak for this user
  try {
    localStorage.removeItem(`learntree_user_${userId}_repos`);
    localStorage.removeItem(`learntree_user_${userId}_active_repo`);
    localStorage.removeItem(`learntree_user_${userId}_streak`);
    localStorage.removeItem(`learntree_user_${userId}_last_date`);
  } catch (e) {
    console.error('Error removing user data:', e);
  }

  if (filtered.length === 0) {
    saveUserProfiles([]);
    setActiveUserId('');
    return { remainingUsers: [], nextActiveId: '' };
  }

  saveUserProfiles(filtered);
  const nextActiveId = filtered[0].id;
  setActiveUserId(nextActiveId);
  return { remainingUsers: filtered, nextActiveId };
}

// User-Specific Syllabus Repositories (Google Drive Model)
export function loadUserRepos(userId: string): SyllabusRepo[] {
  if (typeof window === 'undefined' || !userId) return [];
  const key = `learntree_user_${userId}_repos`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Failed to load repos for user ${userId}:`, err);
  }

  // Brand new users start completely from 0
  return [];
}

export function saveUserRepos(userId: string, repos: SyllabusRepo[]): void {
  if (typeof window === 'undefined') return;
  const key = `learntree_user_${userId}_repos`;
  try {
    localStorage.setItem(key, JSON.stringify(repos));
  } catch (err) {
    console.error(`Failed to save repos for user ${userId}:`, err);
  }
}

export function getActiveRepoId(userId: string): string {
  if (typeof window === 'undefined') return '';
  const key = `learntree_user_${userId}_active_repo`;
  try {
    const val = localStorage.getItem(key);
    if (val) return val;
  } catch {
    // fallback
  }
  const repos = loadUserRepos(userId);
  return repos[0]?.id || '';
}

export function setActiveRepoId(userId: string, repoId: string): void {
  if (typeof window === 'undefined') return;
  const key = `learntree_user_${userId}_active_repo`;
  try {
    localStorage.setItem(key, repoId);
  } catch (err) {
    console.error(`Failed to set active repo for user ${userId}:`, err);
  }
}

export function createUserRepo(
  userId: string,
  name: string,
  code: string = 'SYS-101',
  rawOutline?: string
): SyllabusRepo {
  const id = `repo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const defaultOutline =
    rawOutline ||
    `# ${name}
- [ ] Core Foundations & Principles #core
  - [ ] Primary Definitions & Invariants
  - [ ] Operational Bounds & Edge Cases
- [ ] Advanced Topics & Patterns #advanced
  - [ ] Trade-Off Analysis & Case Studies`;

  const newRepo = buildSeededRepo(userId, id, name, code, defaultOutline);
  const repos = loadUserRepos(userId);
  const updated = [...repos, newRepo];
  saveUserRepos(userId, updated);
  setActiveRepoId(userId, id);
  return newRepo;
}

export function updateRepoNodes(userId: string, repoId: string, nodes: SyllabusNode[]): void {
  const repos = loadUserRepos(userId);
  const index = repos.findIndex((r) => r.id === repoId);
  if (index !== -1) {
    repos[index] = {
      ...repos[index],
      nodes,
      updatedAt: new Date().toISOString(),
    };
    saveUserRepos(userId, repos);
  }
}

export function updateUserRepoMeta(
  userId: string,
  repoId: string,
  updates: { name?: string; code?: string }
): SyllabusRepo | null {
  const repos = loadUserRepos(userId);
  const index = repos.findIndex((r) => r.id === repoId);
  if (index === -1) return null;

  const current = repos[index];
  const updated: SyllabusRepo = {
    ...current,
    name: updates.name !== undefined ? updates.name.trim() || current.name : current.name,
    code: updates.code !== undefined ? updates.code.trim().toUpperCase() || current.code : current.code,
    updatedAt: new Date().toISOString(),
  };

  repos[index] = updated;
  saveUserRepos(userId, repos);
  return updated;
}

export function deleteUserRepo(userId: string, repoId: string): { remainingRepos: SyllabusRepo[]; nextActiveId: string } {
  const repos = loadUserRepos(userId);
  const filtered = repos.filter((r) => r.id !== repoId);
  if (filtered.length === 0) {
    saveUserRepos(userId, []);
    setActiveRepoId(userId, '');
    return { remainingRepos: [], nextActiveId: '' };
  }
  saveUserRepos(userId, filtered);
  const nextActiveId = filtered[0].id;
  setActiveRepoId(userId, nextActiveId);
  return { remainingRepos: filtered, nextActiveId };
}

// User Streak & Last Study Date
export function loadUserStreak(userId: string): number {
  if (typeof window === 'undefined' || !userId) return 0;
  const key = `learntree_user_${userId}_streak`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {
    // fallback
  }
  return 0;
}

export function saveUserStreak(userId: string, streak: number): void {
  if (typeof window === 'undefined' || !userId) return;
  const key = `learntree_user_${userId}_streak`;
  try {
    localStorage.setItem(key, Math.max(0, streak).toString());
  } catch {
    // ignore
  }
}

export function loadUserLastStudyDate(userId: string): string | null {
  if (typeof window === 'undefined' || !userId) return null;
  const key = `learntree_user_${userId}_last_date`;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveUserLastStudyDate(userId: string, dateStr: string): void {
  if (typeof window === 'undefined' || !userId) return;
  const key = `learntree_user_${userId}_last_date`;
  try {
    localStorage.setItem(key, dateStr);
  } catch {
    // ignore
  }
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function loadUserDailyTarget(userId: string): number {
  if (typeof window === 'undefined' || !userId) return 30;
  const key = `learntree_user_${userId}_daily_target`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return 30;
}

export function saveUserDailyTarget(userId: string, targetMinutes: number): void {
  if (typeof window === 'undefined' || !userId) return;
  const key = `learntree_user_${userId}_daily_target`;
  try {
    localStorage.setItem(key, Math.max(1, targetMinutes).toString());
  } catch {
    // ignore
  }
}

export function loadUserTodayStudyMinutes(userId: string): number {
  if (typeof window === 'undefined' || !userId) return 0;
  const todayStr = getTodayDateString();
  const key = `learntree_user_${userId}_study_minutes_${todayStr}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {
    // fallback
  }
  return 0;
}

export function saveUserTodayStudyMinutes(userId: string, minutes: number): void {
  if (typeof window === 'undefined' || !userId) return;
  const todayStr = getTodayDateString();
  const key = `learntree_user_${userId}_study_minutes_${todayStr}`;
  try {
    localStorage.setItem(key, Math.max(0, minutes).toString());
  } catch {
    // ignore
  }
}

export function addStudyMinutes(userId: string, deltaMinutes: number): number {
  const current = loadUserTodayStudyMinutes(userId);
  const next = Math.max(0, current + deltaMinutes);
  saveUserTodayStudyMinutes(userId, next);
  return next;
}

// Export Profile & Specific Syllabus Data as Downloadable JSON
export function exportUserDataAsJSON(userId: string): string {
  const users = loadUserProfiles();
  const user = users.find((u) => u.id === userId);
  const repos = loadUserRepos(userId);
  const streak = loadUserStreak(userId);
  const lastStudyDate = loadUserLastStudyDate(userId);
  const dailyTarget = loadUserDailyTarget(userId);
  const todayStudyMinutes = loadUserTodayStudyMinutes(userId);

  const payload = {
    app: 'Syllabex',
    version: '1.4',
    exportedAt: new Date().toISOString(),
    profile: user,
    streak,
    lastStudyDate,
    dailyStudyGoal: {
      targetMinutes: dailyTarget,
      todayMinutes: todayStudyMinutes,
      isGoalMet: todayStudyMinutes >= dailyTarget,
    },
    repositories: repos,
  };

  return JSON.stringify(payload, null, 2);
}

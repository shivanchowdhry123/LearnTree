import type { UserProfile } from '../types/user';
import type { SyllabusRepo } from '../types/repo';
import type { SyllabusNode } from '../types/syllabus';
import { parseSyllabusText } from './parser';

const STORAGE_KEY_USERS = 'learntree_multi_users';
const STORAGE_KEY_ACTIVE_USER = 'learntree_active_user_id';

export const INITIAL_USER_PROFILES: UserProfile[] = [
  {
    id: 'user_alex',
    name: 'Alex Rivers',
    avatarColor: '#10b981',
    avatarInitials: 'AR',
    focusArea: 'Distributed Systems & Cloud',
    createdAt: '2026-09-15T08:00:00.000Z',
  },
  {
    id: 'user_elena',
    name: 'Elena Rostova',
    avatarColor: '#06b6d4',
    avatarInitials: 'ER',
    focusArea: 'Full-Stack & React 19',
    createdAt: '2026-09-20T10:30:00.000Z',
  },
  {
    id: 'user_marcus',
    name: 'Marcus Chen',
    avatarColor: '#6366f1',
    avatarInitials: 'MC',
    focusArea: 'Systems & Compilers',
    createdAt: '2026-09-28T14:15:00.000Z',
  },
];

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

function getInitialUserRepos(userId: string): SyllabusRepo[] {
  if (userId === 'user_alex') {
    return [
      buildSeededRepo(userId, 'repo_alex_sys', 'Distributed Systems & Concurrency', 'SYS-601', OUTLINE_DISTRIBUTED_SYSTEMS),
      buildSeededRepo(userId, 'repo_alex_comp', 'Compilers & AST Optimization', 'CS-530', OUTLINE_COMPILERS),
      buildSeededRepo(userId, 'repo_alex_kern', 'Linux Kernel & eBPF', 'OS-610', OUTLINE_KERNEL),
      buildSeededRepo(userId, 'repo_alex_rust', 'Rust Concurrency & Atomics', 'SYS-720', OUTLINE_RUST),
    ];
  } else if (userId === 'user_elena') {
    return [
      buildSeededRepo(userId, 'repo_elena_web', 'Modern Web & React 19', 'CS-142', OUTLINE_WEB_REACT),
      buildSeededRepo(userId, 'repo_elena_db', 'Database Internals & Storage', 'DB-301', OUTLINE_DATABASES),
    ];
  } else {
    return [
      buildSeededRepo(userId, 'repo_marcus_comp', 'Compilers & AST Optimization', 'CS-530', OUTLINE_COMPILERS),
      buildSeededRepo(userId, 'repo_marcus_rust', 'Rust Concurrency & Atomics', 'SYS-720', OUTLINE_RUST),
    ];
  }
}

// User Profile Operations
export function loadUserProfiles(): UserProfile[] {
  if (typeof window === 'undefined') return INITIAL_USER_PROFILES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load user profiles:', err);
  }
  saveUserProfiles(INITIAL_USER_PROFILES);
  return INITIAL_USER_PROFILES;
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
  if (typeof window === 'undefined') return INITIAL_USER_PROFILES[0].id;
  try {
    const active = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
    if (active) return active;
  } catch {
    // fallback
  }
  return INITIAL_USER_PROFILES[0].id;
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

  // Initialize a starter repo for the new user
  const initialRepo = buildSeededRepo(
    id,
    `repo_${id}_default`,
    newProfile.focusArea,
    'CURR-101',
    `# ${newProfile.focusArea}
- [ ] Core Fundamental Principles #fundamentals
  - [ ] Primary Invariants & Axioms
  - [ ] Operational Edge Cases
- Advanced Topics & Practical Application #advanced
  - [ ] System Evaluation & Trade-Offs`
  );

  saveUserRepos(id, [initialRepo]);
  setActiveRepoId(id, initialRepo.id);
  saveUserStreak(id, 1);

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
    // If last user was deleted, reset to initial default
    saveUserProfiles(INITIAL_USER_PROFILES);
    setActiveUserId(INITIAL_USER_PROFILES[0].id);
    return { remainingUsers: INITIAL_USER_PROFILES, nextActiveId: INITIAL_USER_PROFILES[0].id };
  }

  saveUserProfiles(filtered);
  const nextActiveId = filtered[0].id;
  setActiveUserId(nextActiveId);
  return { remainingUsers: filtered, nextActiveId };
}

// User-Specific Syllabus Repositories (Google Drive Model)
export function loadUserRepos(userId: string): SyllabusRepo[] {
  if (typeof window === 'undefined') return getInitialUserRepos(userId);
  const key = `learntree_user_${userId}_repos`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Failed to load repos for user ${userId}:`, err);
  }

  const initial = getInitialUserRepos(userId);
  saveUserRepos(userId, initial);
  return initial;
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

export function deleteUserRepo(userId: string, repoId: string): { remainingRepos: SyllabusRepo[]; nextActiveId: string } {
  const repos = loadUserRepos(userId);
  const filtered = repos.filter((r) => r.id !== repoId);
  if (filtered.length === 0) {
    const defaultRepo = buildSeededRepo(userId, `repo_${Date.now()}`, 'General Curriculum', 'GEN-101', '# General Curriculum\n- [ ] Getting Started');
    saveUserRepos(userId, [defaultRepo]);
    setActiveRepoId(userId, defaultRepo.id);
    return { remainingRepos: [defaultRepo], nextActiveId: defaultRepo.id };
  }
  saveUserRepos(userId, filtered);
  const nextActiveId = filtered[0].id;
  setActiveRepoId(userId, nextActiveId);
  return { remainingRepos: filtered, nextActiveId };
}

// User Streak & Last Study Date
export function loadUserStreak(userId: string): number {
  if (typeof window === 'undefined') return 3;
  const key = `learntree_user_${userId}_streak`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  if (userId === 'user_alex') return 19;
  if (userId === 'user_elena') return 7;
  if (userId === 'user_marcus') return 12;
  return 3;
}

export function saveUserStreak(userId: string, streak: number): void {
  if (typeof window === 'undefined') return;
  const key = `learntree_user_${userId}_streak`;
  try {
    localStorage.setItem(key, streak.toString());
  } catch {
    // ignore
  }
}

export function loadUserLastStudyDate(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  const key = `learntree_user_${userId}_last_date`;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveUserLastStudyDate(userId: string, dateStr: string): void {
  if (typeof window === 'undefined') return;
  const key = `learntree_user_${userId}_last_date`;
  try {
    localStorage.setItem(key, dateStr);
  } catch {
    // ignore
  }
}

// Export Profile & Specific Syllabus Data as Downloadable JSON
export function exportUserDataAsJSON(userId: string): string {
  const users = loadUserProfiles();
  const user = users.find((u) => u.id === userId);
  const repos = loadUserRepos(userId);
  const streak = loadUserStreak(userId);
  const lastStudyDate = loadUserLastStudyDate(userId);

  const payload = {
    app: 'Syllabex',
    version: '1.4',
    exportedAt: new Date().toISOString(),
    profile: user,
    streak,
    lastStudyDate,
    repositories: repos,
  };

  return JSON.stringify(payload, null, 2);
}

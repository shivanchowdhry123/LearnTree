import type { UserProfile } from '../types/user';
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
    focusArea: 'Distributed Systems & Infrastructure',
    createdAt: '2026-09-15T08:00:00.000Z',
  },
  {
    id: 'user_elena',
    name: 'Elena Rostova',
    avatarColor: '#06b6d4',
    avatarInitials: 'ER',
    focusArea: 'Full-Stack & React 19 Architecture',
    createdAt: '2026-09-20T10:30:00.000Z',
  },
  {
    id: 'user_marcus',
    name: 'Marcus Chen',
    avatarColor: '#6366f1',
    avatarInitials: 'MC',
    focusArea: 'Systems Programming & Compilers',
    createdAt: '2026-09-28T14:15:00.000Z',
  },
];

const ALEX_SYLLABUS = `# Distributed Systems & Cloud Infrastructure
- [x] [CAP Theorem & PACELC Invariants](https://en.wikipedia.org/wiki/CAP_theorem) #sysdesign #basics
  - [x] Linearizability vs Eventual Consistency Models #consistency
  - [ ] Byzantine Fault Tolerance (BFT) #consensus
- Consensus Algorithms & Leadership #consensus
  - [x] [Raft Protocol Mechanics](https://raft.github.io/) #algorithms
    - Leader Election & Term Transitions
    - Log Matching Property & Invariants
  - [ ] Multi-Paxos & Fast Paxos #math
- Distributed Storage Engines #storage
  - [x] LSM-Trees, Memtables & SSTables #storage
  - [ ] Raft-backed Replicated State Machines #databases
- [Kafka Event Log Semantics](https://kafka.apache.org/) #streaming
  - Partition Assignment & Zero-Copy Transfer
  - Idempotent Producers & Exactly-Once (EOS)`;

const ELENA_SYLLABUS = `# Modern Full-Stack & Frontend Architecture
- [x] [TypeScript Type Systems & Advanced Generics](https://www.typescriptlang.org/docs/) #typescript #types
  - [x] Discriminated Unions & Exhaustiveness #types
  - [ ] Conditional Types & \`infer\` Pattern Matching #advanced
- [x] [React 19 Core & Server Components](https://react.dev/) #react #frontend
  - [x] React Server Actions & Mutation Lifecycle #react19
  - [ ] Concurrent Transitions (\`useTransition\`) #performance
  - [ ] Optimistic UI State (\`useOptimistic\`) #ux
- Local-First Client Architecture #localfirst
  - [ ] Conflict-Free Replicated Data Types (CRDTs) #localfirst
  - [ ] Offline-First IndexedDB Storage Sync #storage
- High-Performance Web Protocols #networking
  - [x] [HTTP/3 & QUIC Transport](https://http3-explained.haxx.se/) #networking
  - [ ] Server-Sent Events (SSE) vs WebSockets #realtime`;

const MARCUS_SYLLABUS = `# Systems Programming, Compilers & Virtual Machines
- [x] [Rust Ownership & Lifetime Invariants](https://www.rust-lang.org/) #rust #systems
  - [x] Borrow Checker Rules & Aliasing XOR Mutability #memory
  - [ ] Unsafe Rust & Raw Pointer Invariants #advanced
- Compiler Architecture & Code Generation #compilers
  - [x] [LLVM Intermediate Representation (IR)](https://llvm.org/) #llvm
    - Static Single Assignment (SSA) Form
    - Dead Code Elimination & Inlining Passes
  - [ ] Abstract Syntax Tree (AST) Parsing & Lexing #ast
- Virtual Machines & Memory Layout #vm
  - [ ] WebAssembly Runtime & SIMD Vectorization #wasm
  - [ ] V8 Hidden Classes & TurboFan JIT Optimization #v8`;

function seedInitialSyllabus(userId: string): SyllabusNode[] {
  const rawText =
    userId === 'user_alex'
      ? ALEX_SYLLABUS
      : userId === 'user_elena'
      ? ELENA_SYLLABUS
      : MARCUS_SYLLABUS;

  const nodes = parseSyllabusText(rawText);
  const now = new Date();

  // Schedule due items for immediate review queue testing
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

/**
 * Loads the list of user profiles from LocalStorage or returns defaults.
 */
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
  // Initialize with defaults if empty
  saveUserProfiles(INITIAL_USER_PROFILES);
  return INITIAL_USER_PROFILES;
}

/**
 * Persists the user profiles array into LocalStorage.
 */
export function saveUserProfiles(users: UserProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save user profiles:', err);
  }
}

/**
 * Returns the currently active user profile ID.
 */
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

/**
 * Updates the currently active user profile ID.
 */
export function setActiveUserId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, id);
  } catch (err) {
    console.error('Failed to set active user ID:', err);
  }
}

/**
 * Loads the dedicated syllabus tree for a given user.
 */
export function loadUserSyllabus(userId: string): SyllabusNode[] {
  if (typeof window === 'undefined') return seedInitialSyllabus(userId);
  const key = `learntree_user_${userId}_nodes`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Failed to load syllabus for user ${userId}:`, err);
  }

  // Seed default syllabus for this user
  const seeded = seedInitialSyllabus(userId);
  saveUserSyllabus(userId, seeded);
  return seeded;
}

/**
 * Saves the dedicated syllabus tree for a given user.
 */
export function saveUserSyllabus(userId: string, nodes: SyllabusNode[]): void {
  if (typeof window === 'undefined') return;
  const key = `learntree_user_${userId}_nodes`;
  try {
    localStorage.setItem(key, JSON.stringify(nodes));
  } catch (err) {
    console.error(`Failed to save syllabus for user ${userId}:`, err);
  }
}

/**
 * Loads the dedicated active recall streak for a given user.
 */
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
  // Default streaks per initial user
  if (userId === 'user_alex') return 5;
  if (userId === 'user_elena') return 3;
  if (userId === 'user_marcus') return 12;
  return 1;
}

/**
 * Saves the dedicated active recall streak for a given user.
 */
export function saveUserStreak(userId: string, streak: number): void {
  if (typeof window === 'undefined') return;
  const key = `learntree_user_${userId}_streak`;
  try {
    localStorage.setItem(key, streak.toString());
  } catch (err) {
    console.error(`Failed to save streak for user ${userId}:`, err);
  }
}

/**
 * Loads the last recorded study date for a given user.
 */
export function loadUserLastStudyDate(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  const key = `learntree_user_${userId}_last_date`;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Saves the last recorded study date for a given user.
 */
export function saveUserLastStudyDate(userId: string, dateStr: string): void {
  if (typeof window === 'undefined') return;
  const key = `learntree_user_${userId}_last_date`;
  try {
    localStorage.setItem(key, dateStr);
  } catch {
    // fallback
  }
}

/**
 * Creates and stores a new user profile.
 */
export function createUserProfile(
  name: string,
  focusArea: string,
  avatarColor: string = '#10b981'
): UserProfile {
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const initials = name
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

  const currentUsers = loadUserProfiles();
  const updatedUsers = [...currentUsers, newProfile];
  saveUserProfiles(updatedUsers);

  // Initialize fresh syllabus for the new user
  const initialNodes = parseSyllabusText(
    `# ${newProfile.focusArea}
- [ ] Core Fundamental Principles #fundamentals
  - [ ] Key Axioms & Definitions
  - [ ] Practical Edge Cases & Applications
- Advanced Topics & Trade-Offs #advanced
  - [ ] Systematic Evaluation & Rubrics`
  );
  saveUserSyllabus(id, initialNodes);
  saveUserStreak(id, 1);

  return newProfile;
}

import { pb, pushRepoToRemote, fetchRemoteUserRepos } from './pocketbase';
import type { SyllabusRepo } from '../types/repo';
import type { SyllabusNode } from '../types/syllabus';
import { isDueForReview } from './sm2';

export type SyncStatus = 'synced' | 'syncing' | 'merged' | 'offline' | 'error';

export interface SyncConflictInfo {
  repoId: string;
  repoName: string;
  mergedNodesCount: number;
  timestamp: string;
}

export interface SyncEngineState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  lastConflict: SyncConflictInfo | null;
  error?: string | null;
}

type SyncListener = (state: SyncEngineState) => void;

class SyncEngine {
  private state: SyncEngineState = {
    status: 'synced',
    lastSyncedAt: null,
    pendingCount: 0,
    lastConflict: null,
    error: null,
  };

  private listeners: Set<SyncListener> = new Set();
  private queue: Map<string, SyllabusRepo> = new Map();
  private debounceTimer: any = null;
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueueFromStorage();
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      // Periodic background check every 30 seconds
      setInterval(() => {
        if (this.queue.size > 0 && navigator.onLine) {
          this.flushQueue();
        }
      }, 30000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }

  private updateState(partial: Partial<SyncEngineState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private handleNetworkChange(isOnline: boolean) {
    if (!isOnline) {
      this.updateState({ status: 'offline' });
    } else {
      this.updateState({ status: this.queue.size > 0 ? 'syncing' : 'synced' });
      this.flushQueue();
    }
  }

  private loadQueueFromStorage() {
    try {
      const stored = localStorage.getItem('syllabex_sync_queue');
      if (stored) {
        const parsed: SyllabusRepo[] = JSON.parse(stored);
        parsed.forEach((repo) => this.queue.set(repo.id, repo));
        this.updateState({ pendingCount: this.queue.size });
      }
    } catch (e) {
      console.warn('Failed to load sync queue from localStorage', e);
    }
  }

  private persistQueueToStorage() {
    try {
      const array = Array.from(this.queue.values());
      localStorage.setItem('syllabex_sync_queue', JSON.stringify(array));
      this.updateState({ pendingCount: this.queue.size });
    } catch (e) {
      console.warn('Failed to save sync queue to localStorage', e);
    }
  }

  /**
   * Computes lightweight denormalized summary metrics across all nodes in a syllabus tree:
   * 1. Total nodes count
   * 2. Mastered nodes count
   * 3. Due reviews count (nodes needing SM-2 spaced repetition today)
   * 4. Next upcoming review ISO timestamp
   */
  public computeDenormalizedStats(nodes: SyllabusNode[]) {
    let totalNodesCount = 0;
    let masteredCount = 0;
    let dueReviewsCount = 0;
    let nextDueDate: string | null = null;

    const now = new Date();

    function traverse(items: SyllabusNode[]) {
      for (const item of items) {
        totalNodesCount++;
        if (item.status === 'mastered') {
          masteredCount++;
        }

        if (isDueForReview(item)) {
          dueReviewsCount++;
        } else if (item.sm2State?.nextReviewAt) {
          const dueTime = new Date(item.sm2State.nextReviewAt).getTime();
          if (dueTime > now.getTime()) {
            if (!nextDueDate || dueTime < new Date(nextDueDate).getTime()) {
              nextDueDate = item.sm2State.nextReviewAt;
            }
          }
        }

        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    }

    traverse(nodes);

    return {
      totalNodesCount,
      masteredCount,
      dueReviewsCount,
      nextDueDate,
    };
  }

  /**
   * Enqueues a syllabus mutation with instant local persistence and denormalized recalculations.
   */
  public enqueueRepoMutation(repo: SyllabusRepo, onComplete?: (mergedRepo: SyllabusRepo) => void) {
    const stats = this.computeDenormalizedStats(repo.nodes);
    const enrichedRepo: SyllabusRepo = {
      ...repo,
      ...stats,
      updatedAt: new Date().toISOString(),
      revision: (repo.revision || 1) + 1,
    };

    this.queue.set(repo.id, enrichedRepo);
    this.persistQueueToStorage();

    // Trigger debounced flush
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.flushQueue(onComplete);
    }, 1200);

    return enrichedRepo;
  }

  /**
   * Recursively merges two node trees with non-destructive SM-2 progress union:
   * - Retains client node hierarchy and newly added/edited titles
   * - Reconciles SM-2 review progress: chooses the higher repetition and latest review date
   */
  private mergeNodeTrees(clientNodes: SyllabusNode[], serverNodes: SyllabusNode[]): { merged: SyllabusNode[]; conflictsResolved: number } {
    let conflictsResolved = 0;
    const serverMap = new Map<string, SyllabusNode>();

    function indexServer(items: SyllabusNode[]) {
      for (const it of items) {
        serverMap.set(it.id, it);
        if (it.children) indexServer(it.children);
      }
    }
    indexServer(serverNodes);

    function mergeList(clients: SyllabusNode[]): SyllabusNode[] {
      return clients.map((cNode) => {
        const sNode = serverMap.get(cNode.id);
        if (!sNode) return cNode;

        const cRep = cNode.sm2State?.repetition || 0;
        const sRep = sNode.sm2State?.repetition || 0;
        const cLastReview = cNode.sm2State?.lastReviewedAt ? new Date(cNode.sm2State.lastReviewedAt).getTime() : 0;
        const sLastReview = sNode.sm2State?.lastReviewedAt ? new Date(sNode.sm2State.lastReviewedAt).getTime() : 0;

        let mergedSm2 = cNode.sm2State;
        let mergedStatus = cNode.status;

        // If server has more recent or higher SM-2 reviews, adopt server's retention state
        if (sRep > cRep || sLastReview > cLastReview) {
          mergedSm2 = sNode.sm2State;
          mergedStatus = sNode.status;
          conflictsResolved++;
        }

        const mergedChildren = cNode.children && cNode.children.length > 0 ? mergeList(cNode.children) : [];

        return {
          ...cNode,
          status: mergedStatus,
          sm2State: mergedSm2,
          children: mergedChildren,
        };
      });
    }

    const merged = mergeList(clientNodes);
    return { merged, conflictsResolved };
  }

  /**
   * Flushes the mutation queue to PocketBase with conflict resolution
   */
  public async flushQueue(onComplete?: (mergedRepo: SyllabusRepo) => void): Promise<void> {
    if (this.isProcessing || this.queue.size === 0) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateState({ status: 'offline' });
      return;
    }

    if (!pb.authStore.isValid || !pb.authStore.record) {
      // Demo / guest mode: keep items queued locally without network error
      this.updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
      return;
    }

    this.isProcessing = true;
    this.updateState({ status: 'syncing', error: null });

    const queueEntries = Array.from(this.queue.entries());

    for (const [repoId, clientRepo] of queueEntries) {
      try {
        let repoToPush = clientRepo;

        // 1. Fetch remote record to check server timestamp (LWW check)
        try {
          const remoteRecord = await pb.collection('repositories').getOne(repoId);
          if (remoteRecord) {
            const serverTimestamp = new Date(remoteRecord.updated).getTime();
            const clientTimestamp = new Date(clientRepo.updatedAt).getTime();

            // Conflict detected: server record has been modified by another device (e.g. mobile review)
            if (serverTimestamp > clientTimestamp && remoteRecord.nodes_data) {
              const serverNodes = remoteRecord.nodes_data as SyllabusNode[];
              const { merged, conflictsResolved } = this.mergeNodeTrees(clientRepo.nodes, serverNodes);

              if (conflictsResolved > 0) {
                const recomputed = this.computeDenormalizedStats(merged);
                repoToPush = {
                  ...clientRepo,
                  ...recomputed,
                  nodes: merged,
                  updatedAt: new Date().toISOString(),
                };

                this.updateState({
                  status: 'merged',
                  lastConflict: {
                    repoId,
                    repoName: clientRepo.name,
                    mergedNodesCount: conflictsResolved,
                    timestamp: new Date().toLocaleTimeString(),
                  },
                });

                if (onComplete) onComplete(repoToPush);
              }
            }
          }
        } catch (fetchErr) {
          // Record doesn't exist yet on remote, proceed to create
        }

        // 2. Push to PocketBase
        const result = await pushRepoToRemote(repoToPush);
        if (result) {
          this.queue.delete(repoId);
          this.persistQueueToStorage();
          if (onComplete) onComplete(result);
        }
      } catch (err: any) {
        console.error('Sync error on repo:', repoId, err);
        this.updateState({
          status: 'error',
          error: err?.message || 'Sync failed. Will retry automatically.',
        });
        this.isProcessing = false;
        return;
      }
    }

    this.isProcessing = false;
    this.updateState({
      status: this.state.status === 'merged' ? 'merged' : 'synced',
      lastSyncedAt: new Date().toLocaleTimeString(),
      pendingCount: this.queue.size,
    });
  }
}

export const syncEngine = new SyncEngine();

import PocketBase from 'pocketbase';
import type { UserProfile } from '../types/user';
import type { SyllabusRepo } from '../types/repo';
import type { SyllabusNode } from '../types/syllabus';

// PocketBase instance defaults to origin (Express proxy/server) or custom env URL
const POCKETBASE_URL =
  (typeof window !== 'undefined' && (import.meta as any).env?.VITE_POCKETBASE_URL) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export const pb = new PocketBase(POCKETBASE_URL);

// Disable auto-cancellation so multiple background sync requests don't cancel each other
pb.autoCancellation(false);

export interface PBAuthResponse {
  token: string;
  record: {
    id: string;
    email: string;
    name?: string;
    focusArea?: string;
    avatarColor?: string;
    avatarInitials?: string;
    daily_target_minutes?: number;
    created?: string;
    updated?: string;
  };
}

/**
 * Normalizes PocketBase auth record into Syllabex UserProfile
 */
export function formatUserProfile(record: any, token?: string): UserProfile {
  const name = record.name || record.email?.split('@')[0] || 'Learner';
  const initials = name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SB';

  return {
    id: record.id,
    email: record.email,
    name,
    avatarColor: record.avatarColor || '#6366f1',
    avatarInitials: initials,
    focusArea: record.focusArea || 'Computer Science & Systems',
    createdAt: record.created || new Date().toISOString(),
    dailyTargetMinutes: record.daily_target_minutes || 30,
    token: token || pb.authStore.token,
  };
}

/**
 * Checks if an authenticated session is currently stored and valid
 */
export function getSavedSessionUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;

  // 1. Direct PocketBase authStore check
  if (pb.authStore.record) {
    return formatUserProfile(pb.authStore.record, pb.authStore.token);
  }

  // 2. PocketBase default localStorage check ('pocketbase_auth')
  try {
    const rawPb = localStorage.getItem('pocketbase_auth');
    if (rawPb) {
      const parsed = JSON.parse(rawPb);
      if (parsed?.token && parsed?.record) {
        pb.authStore.save(parsed.token, parsed.record);
        if (pb.authStore.record) {
          return formatUserProfile(pb.authStore.record, parsed.token);
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. Syllabex cached session user
  try {
    const cached = localStorage.getItem('syllabex_active_session_user');
    if (cached) {
      const user = JSON.parse(cached);
      if (user && user.id) {
        return user;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Log in with Email and Password via PocketBase
 */
export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const authData = await pb.collection('users').authWithPassword(email.trim(), password);
  const profile = formatUserProfile(authData.record, authData.token);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('syllabex_active_session_user', JSON.stringify(profile));
      localStorage.setItem('learntree_active_user', profile.id);
    } catch {
      // ignore
    }
  }

  return profile;
}

/**
 * Register a new user in PocketBase
 */
export async function registerWithEmail(
  email: string,
  password: string,
  name: string,
  focusArea: string = 'Software Engineering'
): Promise<UserProfile> {
  const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SB';

  // 1. Create record
  await pb.collection('users').create({
    email: email.trim().toLowerCase(),
    password,
    passwordConfirm: password,
    name: name.trim(),
    focusArea: focusArea.trim(),
    avatarColor,
    avatarInitials: initials,
    daily_target_minutes: 30,
  });

  // 2. Auth immediately
  return await loginWithEmail(email, password);
}

/**
 * Log out and clear active session
 */
export function logoutUser(): void {
  pb.authStore.clear();
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('pocketbase_auth');
      localStorage.removeItem('syllabex_active_session_user');
      localStorage.removeItem('learntree_active_user');
    } catch {
      // ignore
    }
  }
}

/**
 * Permanently delete user account and all cloud syllabi from the database
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  try {
    await pb.collection('users').delete(userId);
  } catch (err) {
    console.warn('pb.collection delete failed, attempting direct fetch:', err);
    try {
      const resp = await fetch(`/api/collections/users/records/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
        },
      });
      if (!resp.ok && resp.status !== 404) {
        throw new Error(`Failed to delete user: ${resp.statusText}`);
      }
    } catch (fetchErr) {
      console.error('Account deletion on server failed:', fetchErr);
      return false;
    }
  }

  logoutUser();
  return true;
}

/**
 * Fetch repositories belonging to the authenticated user from PocketBase
 */
export async function fetchRemoteUserRepos(userId: string): Promise<SyllabusRepo[]> {
  try {
    const records = await pb.collection('repositories').getFullList({
      filter: `user = "${userId}"`,
      sort: '-updated',
    });

    return records.map((r: any) => ({
      id: r.id,
      userId: r.user,
      name: r.title || r.name,
      code: r.code || 'SYS-101',
      description: r.description || '',
      category: r.category || 'General',
      isPublic: Boolean(r.is_public),
      shareSlug: r.share_slug || '',
      nodes: (r.nodes_data as SyllabusNode[]) || [],
      dueReviewsCount: r.due_reviews_count || 0,
      nextDueDate: r.next_due_date || null,
      masteredCount: r.mastered_count || 0,
      totalNodesCount: r.total_nodes_count || 0,
      revision: r.revision || 1,
      createdAt: r.created,
      updatedAt: r.updated,
      syncedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('PocketBase fetchRemoteUserRepos failed, falling back to local cache', err);
    return [];
  }
}

/**
 * Fetch a public syllabus by its unique share slug
 */
export async function fetchPublicSyllabus(shareSlug: string): Promise<SyllabusRepo | null> {
  try {
    const record = await pb.collection('repositories').getFirstListItem(
      `share_slug = "${shareSlug}" && is_public = true`
    );

    return {
      id: record.id,
      userId: record.user,
      name: record.title || record.name,
      code: record.code || 'SYS-PUB',
      description: record.description || '',
      category: record.category || 'Public Curriculum',
      isPublic: true,
      shareSlug: record.share_slug,
      nodes: (record.nodes_data as SyllabusNode[]) || [],
      dueReviewsCount: 0,
      nextDueDate: null,
      masteredCount: record.mastered_count || 0,
      totalNodesCount: record.total_nodes_count || 0,
      revision: record.revision || 1,
      createdAt: record.created,
      updatedAt: record.updated,
      syncedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Failed to fetch public syllabus with slug:', shareSlug, err);
    return null;
  }
}

/**
 * Push an updated or new repository to PocketBase
 */
export async function pushRepoToRemote(repo: SyllabusRepo): Promise<SyllabusRepo | null> {
  if (!pb.authStore.isValid || !pb.authStore.record) {
    return null;
  }

  const payload = {
    user: repo.userId,
    title: repo.name,
    code: repo.code,
    description: repo.description || '',
    category: repo.category || 'General',
    is_public: Boolean(repo.isPublic),
    share_slug: repo.shareSlug || '',
    nodes_data: repo.nodes,
    due_reviews_count: repo.dueReviewsCount || 0,
    next_due_date: repo.nextDueDate || '',
    mastered_count: repo.masteredCount || 0,
    total_nodes_count: repo.totalNodesCount || 0,
    revision: (repo.revision || 1) + 1,
  };

  try {
    // Check if record exists
    let record: any;
    try {
      record = await pb.collection('repositories').getOne(repo.id);
    } catch {
      record = null;
    }

    if (record) {
      record = await pb.collection('repositories').update(repo.id, payload);
    } else {
      record = await pb.collection('repositories').create({ id: repo.id, ...payload });
    }

    return {
      ...repo,
      revision: record.revision,
      updatedAt: record.updated,
      syncedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('pushRepoToRemote error:', err);
    throw err;
  }
}

/**
 * Delete a repository from PocketBase
 */
export async function deleteRemoteRepo(repoId: string): Promise<boolean> {
  if (!pb.authStore.isValid) return false;
  try {
    await pb.collection('repositories').delete(repoId);
    return true;
  } catch (err) {
    console.warn('deleteRemoteRepo error:', err);
    return false;
  }
}

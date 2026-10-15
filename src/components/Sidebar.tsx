'use client';

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  FileCode2,
  Tag,
  Plus,
  Settings,
  FolderGit2,
  X,
  Trash2,
  Edit2,
  MoreVertical,
  Check,
  Share2,
  Globe,
} from 'lucide-react';
import type { SyllabusRepo } from '../types/repo';

interface SidebarProps {
  repos: SyllabusRepo[];
  activeRepoId: string;
  activeUserName?: string;
  onSelectRepo: (repoId: string) => void;
  onOpenCreateRepo: () => void;
  onOpenSettings: () => void;
  onDeleteRepo?: (repoId: string) => void;
  onRenameRepo?: (repoId: string, name: string, code: string) => void;
  onOpenShareRepo?: (repo: SyllabusRepo) => void;
  dueCount: number;
  masteredCount: number;
  totalCount: number;
  unstartedCount?: number;
  activeFilter: string;
  onSelectQueue: (queue: string) => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  repos,
  activeRepoId,
  activeUserName,
  onSelectRepo,
  onOpenCreateRepo,
  onOpenSettings,
  onDeleteRepo,
  onRenameRepo,
  onOpenShareRepo,
  dueCount,
  masteredCount,
  totalCount,
  unstartedCount = 0,
  activeFilter,
  onSelectQueue,
  onCloseMobile,
}) => {
  const [editingRepoId, setEditingRepoId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [confirmDeleteRepoId, setConfirmDeleteRepoId] = useState<string | null>(null);

  const startRename = (repo: SyllabusRepo, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRepoId(repo.id);
    setEditName(repo.name);
    setEditCode(repo.code);
    setConfirmDeleteRepoId(null);
  };

  const saveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRepoId && onRenameRepo && editName.trim()) {
      onRenameRepo(editingRepoId, editName.trim(), editCode.trim() || 'SYS-101');
    }
    setEditingRepoId(null);
  };

  return (
    <aside className="w-64 sm:w-60 shrink-0 bg-[#0c0e16] border-r border-[#1e2230] flex flex-col justify-between select-none h-full text-[#94a3b8] font-sans shadow-2xl md:shadow-none">
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between px-2 pb-2 border-b border-[#1e2230] md:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#f1f5f9] text-sm font-sans">Syllabex</span>
            <span className="text-[10px] font-mono text-[#10b981] px-1.5 py-0.2 rounded bg-[#10b981]/15">
              Workspace
            </span>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#181b26] cursor-pointer"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* SMART QUEUES */}
        <div>
          <div className="px-2.5 pb-1.5 flex items-center justify-between text-[10px] font-mono font-semibold tracking-wider text-[#475569] uppercase">
            <span>Smart Queues</span>
            <span className="hidden sm:inline">Hotkeys</span>
          </div>

          <div className="space-y-0.5">
            {/* All Vertices */}
            <button
              type="button"
              onClick={() => {
                onSelectQueue('all');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 sm:py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#181b26] text-[#f1f5f9] font-medium border border-[#2d3246]'
                  : 'hover:bg-[#141722] hover:text-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-3.5 h-3.5 text-[#f1f5f9]" />
                <span>All Concepts</span>
              </div>
              <span className="text-[10px] font-mono text-[#475569] tabular-nums">
                {totalCount}
              </span>
            </button>

            {/* Due Today */}
            <button
              type="button"
              onClick={() => {
                onSelectQueue('due');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 sm:py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeFilter === 'due'
                  ? 'bg-[#181b26] text-[#f1f5f9] font-medium border border-[#2d3246]'
                  : 'hover:bg-[#141722] hover:text-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>Due Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#f59e0b]/20 text-[#f59e0b]">
                  {dueCount}
                </span>
                <span className="text-[10px] font-mono text-[#475569] hidden sm:inline">G D</span>
              </div>
            </button>

            {/* Mastered */}
            <button
              type="button"
              onClick={() => {
                onSelectQueue('mastered');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 sm:py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeFilter === 'mastered'
                  ? 'bg-[#181b26] text-[#f1f5f9] font-medium border border-[#2d3246]'
                  : 'hover:bg-[#141722] hover:text-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Mastered</span>
              </div>
              <span className="text-[10px] font-mono text-[#10b981] font-semibold tabular-nums">
                {masteredCount}
              </span>
            </button>

            {/* In Progress */}
            <button
              type="button"
              onClick={() => {
                onSelectQueue('in_progress');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 sm:py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeFilter === 'in_progress'
                  ? 'bg-[#181b26] text-[#f1f5f9] font-medium border border-[#2d3246]'
                  : 'hover:bg-[#141722] hover:text-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-[#06b6d4]" />
                <span>In Progress</span>
              </div>
              <span className="text-[10px] font-mono text-[#06b6d4] tabular-nums">
                {Math.max(0, totalCount - masteredCount - dueCount)}
              </span>
            </button>

            {/* Tags & Backlinks */}
            <button
              type="button"
              onClick={() => {
                onSelectQueue('tags');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 sm:py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeFilter === 'tags'
                  ? 'bg-[#181b26] text-[#f1f5f9] font-medium border border-[#2d3246]'
                  : 'hover:bg-[#141722] hover:text-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#6366f1]" />
                <span>Tags & Backlinks</span>
              </div>
              <span className="text-[10px] font-mono text-[#6366f1] tabular-nums">
                Browse
              </span>
            </button>
          </div>
        </div>

        {/* SYLLABI REPOS (Google Drive model: multiple syllabi per user) */}
        <div>
          <div className="px-2.5 pb-1.5 flex items-center justify-between text-[10px] font-mono font-semibold tracking-wider text-[#475569] uppercase">
            <span className="truncate">
              {activeUserName ? `${activeUserName}'s Syllabi` : 'Syllabi Repos'}
            </span>
            <button
              type="button"
              onClick={onOpenCreateRepo}
              className="p-1 hover:text-[#10b981] hover:bg-[#181b26] transition-colors rounded cursor-pointer"
              title="Create New Syllabus Repo in your workspace"
            >
              <Plus className="w-3.5 h-3.5 text-[#10b981]" />
            </button>
          </div>

          <div className="space-y-1">
            {repos.map((repo) => {
              const isActive = repo.id === activeRepoId;
              const flat = repo.nodes ? repo.nodes.reduce((acc, c) => acc + 1 + (c.children?.length || 0), 0) : 0;
              const mastered = repo.nodes
                ? repo.nodes.filter((n) => n.status === 'mastered').length
                : 0;
              const pct = flat > 0 ? Math.round((mastered / flat) * 100) : 0;
              const isEditingThis = editingRepoId === repo.id;
              const isConfirmingDel = confirmDeleteRepoId === repo.id;

              if (isEditingThis) {
                return (
                  <form
                    key={repo.id}
                    onSubmit={saveRename}
                    className="p-2 rounded bg-[#181b26] border border-[#06b6d4] space-y-1.5 animate-in fade-in"
                  >
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-[#12141c] border border-[#2d3246] rounded text-[#f1f5f9] focus:outline-none focus:border-[#06b6d4]"
                      autoFocus
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        placeholder="CODE"
                        className="w-20 px-1.5 py-0.5 text-[10px] font-mono bg-[#12141c] border border-[#2d3246] rounded text-[#94a3b8] uppercase"
                      />
                      <button
                        type="submit"
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#10b981] text-[#090a0f] rounded cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRepoId(null)}
                        className="px-1.5 py-0.5 text-[10px] font-mono text-[#94a3b8] hover:text-[#f1f5f9] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={repo.id}
                  className={`group relative rounded transition-colors ${
                    isActive
                      ? 'bg-[#181b26] text-[#f1f5f9] font-medium border-l-2 border-[#10b981]'
                      : 'hover:bg-[#141722] hover:text-[#f1f5f9]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectRepo(repo.id);
                      onCloseMobile?.();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 sm:py-1.5 text-xs cursor-pointer text-left"
                    title={`${repo.name} (${repo.code})`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <FolderGit2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#10b981]' : 'text-[#475569]'}`} />
                      <span className="truncate">{repo.name}</span>
                      {repo.isPublic && (
                        <span title="Publicly Shared Syllabus">
                          <Globe className="w-3 h-3 text-[#10b981] shrink-0" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-[10px] font-mono ${
                          isActive ? 'text-[#10b981] font-semibold' : 'text-[#475569]'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </button>

                  {/* Actions for repo (Share / Edit / Delete) */}
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-[#181b26] p-0.5 rounded shadow-sm">
                    {onOpenShareRepo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenShareRepo(repo);
                        }}
                        className="p-1 text-[#94a3b8] hover:text-[#06b6d4] rounded cursor-pointer"
                        title="Share Syllabus Link"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => startRename(repo, e)}
                      className="p-1 text-[#94a3b8] hover:text-[#06b6d4] rounded cursor-pointer"
                      title="Rename Syllabus Repo"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    {repos.length > 1 && onDeleteRepo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isConfirmingDel) {
                            onDeleteRepo(repo.id);
                            setConfirmDeleteRepoId(null);
                          } else {
                            setConfirmDeleteRepoId(repo.id);
                            setTimeout(() => setConfirmDeleteRepoId(null), 4000);
                          }
                        }}
                        className={`p-1 rounded cursor-pointer ${
                          isConfirmingDel
                            ? 'bg-[#f43f5e] text-[#090a0f] font-bold'
                            : 'text-[#94a3b8] hover:text-[#f43f5e]'
                        }`}
                        title={isConfirmingDel ? 'Click again to confirm delete' : 'Delete Syllabus Repo'}
                      >
                        {isConfirmingDel ? (
                          <span className="text-[9px] font-mono px-1">Del?</span>
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer System Telemetry & Settings Button */}
      <div className="p-2.5 border-t border-[#1e2230] text-[10px] font-mono space-y-1 bg-[#090a0f]">
        <div className="flex items-center justify-between text-[#94a3b8]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            Local-First Storage
          </span>
          <span className="text-[#475569]">SQLite (WASM)</span>
        </div>
        <div className="flex items-center justify-between text-[#475569]">
          <span>Synced locally</span>
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onCloseMobile?.();
            }}
            className="hover:text-[#f1f5f9] transition-colors cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#181b26]"
            title="Open System Settings & Shortcuts"
          >
            <Settings className="w-3 h-3 text-[#06b6d4]" />
            <span className="text-[#94a3b8] font-semibold">Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};


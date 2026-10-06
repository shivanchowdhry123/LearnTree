'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  FileCode2,
  Tag,
  Plus,
  HardDrive,
  Settings,
  Layers,
  ChevronRight,
  Database,
  User,
} from 'lucide-react';
import type { UserProfile } from '../types/user';

interface SidebarProps {
  users: UserProfile[];
  activeUser: UserProfile;
  onSelectUser: (userId: string) => void;
  onOpenCreateUser: () => void;
  dueCount: number;
  masteredCount: number;
  totalCount: number;
  activeFilter: string;
  onSelectQueue: (queue: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  users,
  activeUser,
  onSelectUser,
  onOpenCreateUser,
  dueCount,
  masteredCount,
  totalCount,
  activeFilter,
  onSelectQueue,
}) => {
  return (
    <aside className="w-60 shrink-0 bg-[#0c0e16] border-r border-[#1e2230] flex flex-col justify-between select-none h-full text-[#94a3b8] font-sans">
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {/* SMART QUEUES */}
        <div>
          <div className="px-2.5 pb-1.5 flex items-center justify-between text-[10px] font-mono font-semibold tracking-wider text-[#475569] uppercase">
            <span>Smart Queues</span>
            <span>Hotkeys</span>
          </div>

          <div className="space-y-0.5">
            {/* Due Today */}
            <button
              type="button"
              onClick={() => onSelectQueue('due')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
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
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#10b981]/20 text-[#10b981]">
                  {dueCount}
                </span>
                <span className="text-[10px] font-mono text-[#475569]">G D</span>
              </div>
            </button>

            {/* Mastered */}
            <button
              type="button"
              onClick={() => onSelectQueue('mastered')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeFilter === 'mastered'
                  ? 'bg-[#181b26] text-[#f1f5f9] font-medium border border-[#2d3246]'
                  : 'hover:bg-[#141722] hover:text-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Mastered</span>
              </div>
              <span className="text-[10px] font-mono text-[#475569] tabular-nums">
                {masteredCount}
              </span>
            </button>

            {/* Drafts */}
            <button
              type="button"
              onClick={() => onSelectQueue('in_progress')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeFilter === 'in_progress'
                  ? 'bg-[#181b26] text-[#f1f5f9] font-medium border border-[#2d3246]'
                  : 'hover:bg-[#141722] hover:text-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCode2 className="w-3.5 h-3.5 text-[#06b6d4]" />
                <span>In Progress / Drafts</span>
              </div>
              <span className="text-[10px] font-mono text-[#475569] tabular-nums">
                {Math.max(0, totalCount - masteredCount - dueCount)}
              </span>
            </button>

            {/* Tags & Backlinks */}
            <button
              type="button"
              onClick={() => onSelectQueue('tags')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeFilter === 'tags'
                  ? 'bg-[#181b26] text-[#f1f5f9] font-medium border border-[#2d3246]'
                  : 'hover:bg-[#141722] hover:text-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#6366f1]" />
                <span>Tags & Backlinks</span>
              </div>
              <span className="text-[10px] font-mono text-[#475569] tabular-nums">
                32
              </span>
            </button>
          </div>
        </div>

        {/* SYLLABI REPOS (Multi-User Curriculum Tracks) */}
        <div>
          <div className="px-2.5 pb-1.5 flex items-center justify-between text-[10px] font-mono font-semibold tracking-wider text-[#475569] uppercase">
            <span>Syllabi Repos</span>
            <button
              type="button"
              onClick={onOpenCreateUser}
              className="p-0.5 hover:text-[#f1f5f9] transition-colors rounded hover:bg-[#1e2230]"
              title="Add Syllabus Repo / Student Track"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-0.5">
            {users.map((user) => {
              const isActive = user.id === activeUser.id;
              // Synthetic completion percentage preview per repo
              const percentage =
                user.id === 'user_alex'
                  ? '68%'
                  : user.id === 'user_elena'
                  ? '42%'
                  : user.id === 'user_marcus'
                  ? '89%'
                  : '15%';

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onSelectUser(user.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#181b26] text-[#f1f5f9] font-medium border-l-2 border-[#10b981]'
                      : 'hover:bg-[#141722] hover:text-[#f1f5f9]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: user.avatarColor }}
                    />
                    <span className="truncate">{user.focusArea}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono shrink-0 ml-1.5 ${
                      isActive ? 'text-[#10b981] font-semibold' : 'text-[#475569]'
                    }`}
                  >
                    {percentage}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer System Telemetry */}
      <div className="p-2.5 border-t border-[#1e2230] text-[10px] font-mono space-y-1 bg-[#090a0f]">
        <div className="flex items-center justify-between text-[#94a3b8]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            Local-First Storage
          </span>
          <span className="text-[#475569]">SQLite (WASM)</span>
        </div>
        <div className="flex items-center justify-between text-[#475569]">
          <span>24.8 MB / 500 MB</span>
          <button
            type="button"
            className="hover:text-[#94a3b8] transition-colors cursor-pointer flex items-center gap-1"
          >
            <Settings className="w-2.5 h-2.5" />
            Settings
          </button>
        </div>
      </div>
    </aside>
  );
};

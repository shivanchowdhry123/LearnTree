'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Upload,
  BookOpen,
  Check,
  UserPlus,
  PanelLeft,
  Settings,
  FolderGit2,
} from 'lucide-react';
import type { UserProfile } from '../types/user';
import type { SyllabusRepo } from '../types/repo';

interface TopNavbarProps {
  activeUser: UserProfile;
  activeRepo: SyllabusRepo | null;
  users: UserProfile[];
  onSelectUser: (userId: string) => void;
  onOpenCreateUser: () => void;
  onOpenProfileSettings: () => void;
  dueCount: number;
  completionPercent: number;
  onOpenImport: () => void;
  onOpenReview: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeUser,
  activeRepo,
  users,
  onSelectUser,
  onOpenCreateUser,
  onOpenProfileSettings,
  dueCount,
  completionPercent,
  onOpenImport,
  onOpenReview,
  searchQuery,
  onSearchChange,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  return (
    <nav className="h-12 w-full bg-[#090a0f] border-b border-[#1e2230] px-3 sm:px-4 flex items-center justify-between gap-3 text-xs select-none shrink-0 z-40">
      {/* Left: Brand + Breadcrumbs + Status */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Logo and Version Badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#181b26] transition-colors cursor-pointer mr-0.5"
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>

          <span className="font-bold text-[#f1f5f9] text-sm tracking-tight font-sans">
            Syllabex
          </span>
          <span className="px-1 py-0.2 rounded text-[10px] font-mono font-semibold bg-[#181b26] text-[#6366f1] border border-[#2d3246]">
            v1.4
          </span>
        </div>

        {/* Separator */}
        <span className="text-[#3c445c] hidden sm:inline">|</span>

        {/* Breadcrumb Trail: Syllabi / [Active Repo Name] */}
        <div className="hidden md:flex items-center gap-1.5 text-[#94a3b8] font-mono text-[11px] truncate">
          <span>Syllabi</span>
          <span className="text-[#475569]">/</span>
          <span className="text-[#f1f5f9] font-medium truncate flex items-center gap-1">
            <FolderGit2 className="w-3 h-3 text-[#10b981]" />
            {activeRepo?.name || 'General Curriculum'}
          </span>
        </div>

        {/* Mastery Percentage Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] font-mono text-[10px] font-semibold">
          <span>{completionPercent}%</span>
          <span className="text-[9px] font-normal uppercase opacity-90">Mastered</span>
        </div>

        {/* Local-First Sync Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono text-[#94a3b8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          <span>Local-First (Synced 2s ago)</span>
        </div>
      </div>

      {/* Right: Search + Action Buttons + Profile Switcher */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search Bar with ⌘K Badge */}
        <div className="relative hidden sm:block w-48 md:w-60">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#475569]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search topics or jump to node..."
            className="w-full pl-7 pr-8 py-1 bg-[#12141c] border border-[#2d3246] focus:border-[#06b6d4] focus:outline-none rounded text-xs text-[#f1f5f9] placeholder-[#475569] font-mono transition-colors"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 py-0.2 rounded text-[9px] font-mono bg-[#181b26] text-[#475569] border border-[#2d3246]">
            ⌘K
          </kbd>
        </div>

        {/* Import Syllabus with ⌘I */}
        <button
          type="button"
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181b26] hover:bg-[#202433] text-[#f1f5f9] border border-[#2d3246] hover:border-[#94a3b8] transition-colors cursor-pointer text-xs font-mono font-medium shadow-sm"
        >
          <Upload className="w-3 h-3 text-[#06b6d4]" />
          <span>Import</span>
          <kbd className="hidden md:inline px-1 py-0.2 rounded text-[9px] font-mono bg-[#12141c] text-[#475569] border border-[#2d3246]">
            ⌘I
          </kbd>
        </button>

        {/* Review Due Button with Space hotkey badge */}
        <button
          type="button"
          onClick={onOpenReview}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-mono font-bold text-xs transition-colors cursor-pointer shadow-sm"
        >
          <BookOpen className="w-3 h-3" />
          <span>Review Due: {dueCount}</span>
          <kbd className="px-1 py-0.2 rounded text-[9px] font-mono bg-[#090a0f]/80 text-[#10b981]">
            Space
          </kbd>
        </button>

        {/* User Profile Avatar Dropdown */}
        <div className="relative ml-1" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((p) => !p)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full bg-[#141722] border border-[#2d3246] hover:border-[#10b981] transition-all cursor-pointer shadow-sm"
            title={`Account: ${activeUser.name}`}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-[#090a0f] shadow-sm shrink-0"
              style={{ backgroundColor: activeUser.avatarColor }}
            >
              {activeUser.avatarInitials}
            </div>
            <span className="text-xs font-medium text-[#f1f5f9] max-w-[80px] truncate hidden md:inline">
              {activeUser.name}
            </span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-lg bg-[#141722] border border-[#2d3246] shadow-[0_16px_40px_rgba(0,0,0,0.85)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 border-b border-[#1e2230] bg-[#1a1d28] flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#f1f5f9] truncate">{activeUser.name}</div>
                  <div className="text-[10px] font-mono text-[#10b981] truncate">Active Student Account</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenProfileSettings();
                  }}
                  className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#202433] transition-colors cursor-pointer"
                  title="Profile Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Profiles list */}
              <div className="p-1 space-y-0.5 max-h-48 overflow-y-auto">
                <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-[#475569]">
                  Switch Account
                </div>
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onSelectUser(u.id);
                      setIsProfileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                      u.id === activeUser.id
                        ? 'bg-[#1b1f2e] text-[#f1f5f9] font-medium'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#181b26]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: u.avatarColor }}
                      />
                      <span className="truncate">{u.name}</span>
                    </div>
                    {u.id === activeUser.id && (
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="p-1.5 border-t border-[#1e2230] space-y-1 bg-[#12141c]">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenProfileSettings();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-mono text-[#f1f5f9] hover:bg-[#181b26] cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#94a3b8]" />
                  <span>Profile Settings & Backup</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenCreateUser();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-mono text-[#06b6d4] hover:bg-[#181b26] cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Student Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

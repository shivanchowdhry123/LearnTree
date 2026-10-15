'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FolderGit2, ChevronDown, Check, UserPlus, Settings } from 'lucide-react';
import type { UserProfile } from '../types/user';
import type { SyllabusRepo } from '../types/repo';

interface MobileTopBarProps {
  activeUser: UserProfile;
  activeRepo: SyllabusRepo | null;
  repos: SyllabusRepo[];
  onSelectRepo: (repoId: string) => void;
  onOpenCreateRepo: () => void;
  users: UserProfile[];
  onSelectUser: (userId: string) => void;
  onOpenCreateUser: () => void;
  onOpenProfileSettings: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  activeUser,
  activeRepo,
  repos,
  onSelectRepo,
  onOpenCreateRepo,
  users,
  onSelectUser,
  onOpenCreateUser,
  onOpenProfileSettings,
}) => {
  const [isRepoMenuOpen, setIsRepoMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const repoMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (repoMenuRef.current && !repoMenuRef.current.contains(e.target as Node)) {
        setIsRepoMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const repoTitle = activeRepo?.name || 'General Curriculum';
  const repoCode = activeRepo?.code || 'SYS-601';

  return (
    <div className="w-full bg-[#090a0f] border-b border-[#1e2230] px-3.5 pt-2.5 pb-2 shrink-0 select-none space-y-2">
      {/* Top Header Row: Repo Dropdown & User Avatar */}
      <div className="flex items-center justify-between gap-2">
        {/* Repo Picker Dropdown */}
        <div className="relative flex-1 min-w-0" ref={repoMenuRef}>
          <button
            type="button"
            onClick={() => setIsRepoMenuOpen((p) => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141722] border border-[#2d3246] text-xs font-mono text-[#f1f5f9] max-w-[220px] truncate cursor-pointer shadow-sm active:scale-98"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
            <span className="truncate font-semibold">{repoTitle}</span>
            <ChevronDown className="w-3 h-3 text-[#94a3b8] shrink-0 ml-0.5" />
          </button>

          {isRepoMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 rounded-lg bg-[#141722] border border-[#2d3246] shadow-[0_16px_40px_rgba(0,0,0,0.9)] z-50 py-1 font-mono text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] uppercase text-[#475569] font-bold tracking-wider">
                Syllabi Repositories
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5 p-1">
                {repos.map((r) => {
                  const isActive = r.id === activeRepo?.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        onSelectRepo(r.id);
                        setIsRepoMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#1b1f2e] text-[#10b981] font-bold'
                          : 'text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#181b26]'
                      }`}
                    >
                      <span className="truncate">{r.name}</span>
                      {isActive && <Check className="w-3 h-3 text-[#10b981] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
              <div className="p-1 border-t border-[#1e2230]">
                <button
                  type="button"
                  onClick={() => {
                    setIsRepoMenuOpen(false);
                    onOpenCreateRepo();
                  }}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-[#10b981] hover:bg-[#181b26] cursor-pointer"
                >
                  <span>+ Create New Repo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="relative shrink-0" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((p) => !p)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold text-[#090a0f] shadow-sm cursor-pointer ring-1 ring-[#2d3246]"
            style={{ backgroundColor: activeUser.avatarColor }}
            title={`Account: ${activeUser.name}`}
          >
            {activeUser.avatarInitials}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 rounded-lg bg-[#141722] border border-[#2d3246] shadow-[0_16px_40px_rgba(0,0,0,0.9)] z-50 py-1 font-mono text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-[#1e2230] bg-[#1a1d28]">
                <div className="font-bold text-[#f1f5f9]">{activeUser.name}</div>
                <div className="text-[10px] text-[#10b981]">{activeUser.focusArea}</div>
              </div>

              <div className="p-1 space-y-0.5 max-h-40 overflow-y-auto">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onSelectUser(u.id);
                      setIsUserMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors cursor-pointer ${
                      u.id === activeUser.id
                        ? 'bg-[#1b1f2e] text-[#f1f5f9] font-bold'
                        : 'text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#181b26]'
                    }`}
                  >
                    <span className="truncate">{u.name}</span>
                    {u.id === activeUser.id && <Check className="w-3 h-3 text-[#10b981] shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="p-1 border-t border-[#1e2230] space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenProfileSettings();
                  }}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#181b26] cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#06b6d4]" />
                  <span>Profile Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenCreateUser();
                  }}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-[#10b981] hover:bg-[#181b26] cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Student Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Badges Row (Screen 1 & 2): Code · Local-First Node | SM-2 Engine Active */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#94a3b8] pt-0.5">
        <span className="px-2 py-0.5 rounded bg-[#141722] border border-[#2d3246] text-[#c0c1ff]">
          {repoCode} · Local-First Node
        </span>
        <span className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          SM-2 Engine Active
        </span>
      </div>
    </div>
  );
};

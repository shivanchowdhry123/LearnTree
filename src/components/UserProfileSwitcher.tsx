'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  ChevronDown,
  Check,
  UserPlus,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import type { UserProfile } from '../types/user';

interface UserProfileSwitcherProps {
  users: UserProfile[];
  activeUser: UserProfile;
  onSwitchUser: (userId: string) => void;
  onCreateUser: (name: string, focusArea: string, color: string) => void;
}

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
];

export const UserProfileSwitcher: React.FC<UserProfileSwitcherProps> = ({
  users,
  activeUser,
  onSwitchUser,
  onCreateUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFocus, setNewFocus] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectUser = (id: string) => {
    onSwitchUser(id);
    setIsOpen(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateUser(newName.trim(), newFocus.trim() || 'General Curriculum', selectedColor);
    setNewName('');
    setNewFocus('');
    setIsCreating(false);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Active Profile Pill / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-[#141722] hover:bg-[#1b1f2e] border border-[#2a3045] hover:border-[#06b6d4] transition-all cursor-pointer text-left shadow-sm group"
        title="Switch student profile"
      >
        {/* Avatar Circle */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-[#090a0f] shrink-0 shadow-sm"
          style={{ backgroundColor: activeUser.avatarColor }}
        >
          {activeUser.avatarInitials}
        </div>

        <div className="hidden sm:block">
          <div className="text-xs font-semibold text-[#f1f5f9] leading-tight flex items-center gap-1.5">
            <span>{activeUser.name}</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#1b1f2e] text-[#10b981] border border-[#2a3045]">
              Active
            </span>
          </div>
          <div className="text-[10px] text-[#94a3b8] font-mono truncate max-w-[140px]">
            {activeUser.focusArea}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#94a3b8] group-hover:text-[#f1f5f9] transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Profile Switcher Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-72 rounded-lg bg-[#141722] border border-[#2a3045] shadow-[0_16px_40px_rgba(0,0,0,0.85)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-[#2a3045] bg-[#1b1f2e] flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5 font-semibold">
              <Users className="w-3.5 h-3.5 text-[#06b6d4]" />
              Student Profiles
            </span>
            <span className="text-[10px] font-mono text-[#94a3b8]">
              {users.length} accounts
            </span>
          </div>

          {!isCreating ? (
            /* User Account List */
            <div className="p-1.5 space-y-1 max-h-60 overflow-y-auto">
              {users.map((user) => {
                const isActive = user.id === activeUser.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-md transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#1b1f2e] border border-[#2a3045] text-[#f1f5f9]'
                        : 'hover:bg-[#1b1f2e]/70 border border-transparent text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-[#090a0f] shrink-0"
                        style={{ backgroundColor: user.avatarColor }}
                      >
                        {user.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{user.name}</div>
                        <div className="text-[10px] font-mono text-[#94a3b8] truncate">
                          {user.focusArea}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-[#10b981] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}

              {/* Add New Profile Trigger */}
              <div className="pt-1.5 border-t border-[#2a3045] mt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono font-medium rounded-md bg-[#1b1f2e] hover:bg-[#23283b] text-[#06b6d4] hover:text-[#4cd7f6] border border-[#2a3045] transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Student Profile</span>
                </button>
              </div>
            </div>
          ) : (
            /* Add Profile Form */
            <form onSubmit={handleCreateSubmit} className="p-3.5 space-y-3 bg-[#141722]">
              <div className="flex items-center justify-between text-xs font-mono text-[#f1f5f9] pb-1 border-b border-[#2a3045]">
                <span className="font-semibold flex items-center gap-1.5 text-[#06b6d4]">
                  <Sparkles className="w-3.5 h-3.5" />
                  New Student Profile
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#1b1f2e]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#94a3b8] mb-1">
                  Full Name / Student Handle
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jordan Hayes"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#1b1f2e] border border-[#2a3045] focus:border-[#06b6d4] focus:outline-none rounded text-[#f1f5f9] font-sans"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#94a3b8] mb-1">
                  Study Focus / Track
                </label>
                <input
                  type="text"
                  value={newFocus}
                  onChange={(e) => setNewFocus(e.target.value)}
                  placeholder="e.g. Machine Learning Engineering"
                  className="w-full px-2.5 py-1.5 text-xs bg-[#1b1f2e] border border-[#2a3045] focus:border-[#06b6d4] focus:outline-none rounded text-[#f1f5f9] font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#94a3b8] mb-1">
                  Avatar Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                        selectedColor === c ? 'scale-125 ring-2 ring-[#f1f5f9]' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-1.5 text-xs font-mono rounded bg-[#1b1f2e] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2a3045]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 text-xs font-mono font-semibold rounded bg-[#10b981] hover:bg-[#059669] text-[#090a0f]"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Palette,
  Download,
  Trash2,
  Check,
  AlertTriangle,
  HardDrive,
  FileJson,
} from 'lucide-react';
import type { UserProfile } from '../types/user';
import { exportUserDataAsJSON } from '../lib/userStore';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (
    userId: string,
    updates: Partial<Pick<UserProfile, 'name' | 'avatarColor'>>
  ) => void;
  onDeleteUser: (userId: string) => void;
}

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Purple
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [name, setName] = useState(user.name);
  const [avatarColor, setAvatarColor] = useState(user.avatarColor);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setName(user.name);
    setAvatarColor(user.avatarColor);
    setIsConfirmingDelete(false);
    setSaveSuccess(false);
  }, [user, isOpen]);

  // Handle Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onUpdateUser(user.id, {
      name: name.trim(),
      avatarColor,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleExportJSON = () => {
    const jsonString = exportUserDataAsJSON(user.id);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = user.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `syllabex-backup-${safeName}-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteConfirm = () => {
    onDeleteUser(user.id);
    onClose();
  };

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() || '')
      .slice(0, 2)
      .join('') || 'ST';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090a0f]/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-[#12141c] border border-[#2d3246] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2230] bg-[#181b26]">
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold text-[#090a0f] shadow-sm shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f1f5f9] tracking-tight">
                Profile Settings
              </h2>
              <span className="text-[11px] font-mono text-[#94a3b8]">
                Student Account & Data Management
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#202433] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-5 bg-[#12141c]">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-[#94a3b8] font-medium">
              Student / Profile Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivers"
              className="w-full px-3 py-2 text-xs bg-[#181b26] border border-[#2d3246] focus:border-[#06b6d4] focus:outline-none rounded-md text-[#f1f5f9] font-sans transition-colors"
            />
          </div>

          {/* Theme Color Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-[#94a3b8] font-medium">
              Theme / Avatar Color
            </label>
            <div className="flex items-center gap-2.5 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                    avatarColor === c
                      ? 'scale-110 ring-2 ring-[#f1f5f9] ring-offset-2 ring-offset-[#12141c]'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {avatarColor === c && (
                    <Check className="w-3.5 h-3.5 text-[#090a0f] stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Export Specific Syllabus Data as JSON */}
          <div className="pt-2 border-t border-[#1e2230] space-y-2">
            <label className="block text-xs font-mono text-[#94a3b8] font-medium">
              Backup & Data Portability
            </label>
            <button
              type="button"
              onClick={handleExportJSON}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono font-medium rounded-md bg-[#181b26] hover:bg-[#202433] text-[#06b6d4] hover:text-[#4cd7f6] border border-[#2d3246] hover:border-[#06b6d4] transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Syllabus Data (JSON Backup)</span>
            </button>
            <p className="text-[10px] text-[#475569] font-mono leading-tight">
              Downloads complete syllabus trees, SM-2 stability curves, review history, and streaks for {user.name}.
            </p>
          </div>

          {/* Danger Zone: Delete Profile */}
          <div className="pt-2 border-t border-[#1e2230] space-y-2">
            <label className="block text-xs font-mono text-[#f43f5e] font-medium">
              Danger Zone
            </label>
            {!isConfirmingDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-mono font-medium rounded-md bg-[#f43f5e]/10 hover:bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Profile</span>
              </button>
            ) : (
              <div className="p-3 rounded bg-[#f43f5e]/10 border border-[#f43f5e]/40 space-y-2.5 animate-in fade-in">
                <div className="text-xs text-[#ffb4ab] font-sans flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#f43f5e] shrink-0 mt-0.5" />
                  <span>
                    Permanently delete <strong>{user.name}</strong> and all associated syllabus repositories? This cannot be undone.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="flex-1 py-1 text-xs font-mono rounded bg-[#181b26] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2d3246]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    className="flex-1 py-1 text-xs font-mono font-bold rounded bg-[#f43f5e] text-[#090a0f] hover:bg-[#e11d48]"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Save Controls */}
          <div className="pt-3 border-t border-[#1e2230] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-mono rounded-md bg-[#181b26] hover:bg-[#202433] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2d3246] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-bold rounded-md bg-[#10b981] hover:bg-[#059669] text-[#090a0f] transition-all cursor-pointer shadow-sm"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

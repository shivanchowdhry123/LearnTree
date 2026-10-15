'use client';

import React, { useEffect } from 'react';
import {
  X,
  Settings,
  HardDrive,
  Keyboard,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Database,
  Check,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalRepos: number;
  totalNodes: number;
  totalUsers: number;
  onResetFactoryData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  totalRepos,
  totalNodes,
  totalUsers,
  onResetFactoryData,
}) => {
  const [isConfirmingReset, setIsConfirmingReset] = React.useState(false);

  useEffect(() => {
    setIsConfirmingReset(false);
  }, [isOpen]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090a0f]/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-[#12141c] border border-[#2d3246] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2230] bg-[#181b26]">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-[#06b6d4]" />
            <h2 className="text-sm font-bold text-[#f1f5f9] tracking-tight">
              System Settings & Keyboard Shortcuts
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#202433] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 bg-[#12141c] overflow-y-auto max-h-[75vh]">
          {/* Storage Telemetry */}
          <div className="space-y-2.5">
            <div className="text-xs font-mono font-semibold text-[#10b981] flex items-center gap-1.5 uppercase tracking-wider">
              <Database className="w-3.5 h-3.5" />
              Local-First Database & Telemetry
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg bg-[#181b26] border border-[#2d3246]">
                <div className="text-[10px] font-mono text-[#94a3b8]">Active Profiles</div>
                <div className="text-lg font-bold font-mono text-[#f1f5f9] mt-0.5">{totalUsers}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#181b26] border border-[#2d3246]">
                <div className="text-[10px] font-mono text-[#94a3b8]">Syllabi Repos</div>
                <div className="text-lg font-bold font-mono text-[#f1f5f9] mt-0.5">{totalRepos}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#181b26] border border-[#2d3246]">
                <div className="text-[10px] font-mono text-[#94a3b8]">Indexed Vertices</div>
                <div className="text-lg font-bold font-mono text-[#10b981] mt-0.5">{totalNodes}</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#181b26] border border-[#2d3246] flex items-center justify-between text-xs font-mono text-[#94a3b8]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span>SQLite (WASM) / Client-Authoritative</span>
              </div>
              <span className="text-[#06b6d4]">Zero-Cloud Latency</span>
            </div>
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="space-y-2 pt-2 border-t border-[#1e2230]">
            <div className="text-xs font-mono font-semibold text-[#06b6d4] flex items-center gap-1.5 uppercase tracking-wider">
              <Keyboard className="w-3.5 h-3.5" />
              Keyboard Shortcuts Cheat Sheet
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-[#181b26] border border-[#2d3246] flex items-center justify-between">
                <span className="text-[#94a3b8]">Start Review / Reveal</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#12141c] text-[#10b981] border border-[#2d3246] font-bold">Space</kbd>
              </div>
              <div className="p-2 rounded bg-[#181b26] border border-[#2d3246] flex items-center justify-between">
                <span className="text-[#94a3b8]">Recall Ratings</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#12141c] text-[#06b6d4] border border-[#2d3246] font-bold">1 - 4</kbd>
              </div>
              <div className="p-2 rounded bg-[#181b26] border border-[#2d3246] flex items-center justify-between">
                <span className="text-[#94a3b8]">Import Syllabus</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#12141c] text-[#94a3b8] border border-[#2d3246]">⌘I</kbd>
              </div>
              <div className="p-2 rounded bg-[#181b26] border border-[#2d3246] flex items-center justify-between">
                <span className="text-[#94a3b8]">Focus Search</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#12141c] text-[#94a3b8] border border-[#2d3246]">⌘K</kbd>
              </div>
              <div className="p-2 rounded bg-[#181b26] border border-[#2d3246] flex items-center justify-between">
                <span className="text-[#94a3b8]">Jump to Due Queue</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#12141c] text-[#94a3b8] border border-[#2d3246]">G D</kbd>
              </div>
              <div className="p-2 rounded bg-[#181b26] border border-[#2d3246] flex items-center justify-between">
                <span className="text-[#94a3b8]">Add New Concept</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[#12141c] text-[#94a3b8] border border-[#2d3246]">N</kbd>
              </div>
            </div>
          </div>

          {/* Factory Reset */}
          <div className="space-y-2 pt-2 border-t border-[#1e2230]">
            <div className="text-xs font-mono font-semibold text-[#f43f5e] uppercase tracking-wider">
              Factory Reset
            </div>
            <p className="text-[11px] text-[#94a3b8] font-sans">
              Re-seeds starter student profiles (Alex, Elena, Marcus) and all default curricula repositories.
            </p>
            {!isConfirmingReset ? (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#f43f5e] hover:bg-[#f43f5e]/15 border border-[#f43f5e]/30 rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Starter Factory Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetFactoryData();
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-[#f43f5e] text-[#090a0f] hover:bg-[#e11d48] rounded-md cursor-pointer"
                >
                  Confirm Reset All Data
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  className="px-2.5 py-1.5 text-xs font-mono text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2d3246] rounded-md cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1e2230] bg-[#181b26] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono rounded-md bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

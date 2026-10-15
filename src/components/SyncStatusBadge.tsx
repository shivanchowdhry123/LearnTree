'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  GitMerge,
  AlertCircle,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { syncEngine, type SyncEngineState } from '../lib/syncEngine';

interface SyncStatusBadgeProps {
  onManualSync?: () => void;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ onManualSync }) => {
  const [syncState, setSyncState] = useState<SyncEngineState>({
    status: 'synced',
    lastSyncedAt: 'Just now',
    pendingCount: 0,
    lastConflict: null,
    error: null,
  });

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSyncClick = () => {
    syncEngine.flushQueue();
    if (onManualSync) onManualSync();
  };

  const getStatusBadge = () => {
    switch (syncState.status) {
      case 'syncing':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#f59e0b]/15 border border-[#f59e0b]/30 text-[#f59e0b] font-mono text-[10px] font-medium">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Syncing ({syncState.pendingCount})...</span>
          </div>
        );
      case 'merged':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#06b6d4]/15 border border-[#06b6d4]/30 text-[#06b6d4] font-mono text-[10px] font-semibold">
            <GitMerge className="w-3 h-3" />
            <span>Auto-Merged</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#64748b]/15 border border-[#64748b]/30 text-[#94a3b8] font-mono text-[10px]">
            <CloudOff className="w-3 h-3" />
            <span>Offline (Cached)</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] font-mono text-[10px]">
            <AlertCircle className="w-3 h-3" />
            <span>Sync Error</span>
          </div>
        );
      case 'synced':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] font-mono text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <span>Synced</span>
          </div>
        );
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer hover:opacity-85 transition-opacity"
        title="PocketBase Cloud &amp; Local-First Sync Engine Status"
      >
        {getStatusBadge()}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-[#12141c] border border-[#232738] shadow-[0_16px_40px_rgba(0,0,0,0.85)] z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-100 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2230]">
            <span className="font-semibold text-[#f1f5f9] flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-[#06b6d4]" />
              Database Sync Engine
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] text-[#94a3b8] border border-[#2d3246]">
              PocketBase
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between text-[#94a3b8]">
              <span>Last Synced:</span>
              <span className="text-[#f1f5f9]">{syncState.lastSyncedAt || 'Recent'}</span>
            </div>
            <div className="flex items-center justify-between text-[#94a3b8]">
              <span>Pending Queue:</span>
              <span className={syncState.pendingCount > 0 ? 'text-[#f59e0b]' : 'text-[#10b981]'}>
                {syncState.pendingCount} mutation{syncState.pendingCount === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#94a3b8]">
              <span>Conflict Policy:</span>
              <span className="text-[#06b6d4]">LWW + SM-2 Merge</span>
            </div>
          </div>

          {syncState.lastConflict && (
            <div className="p-2 rounded bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[10px] text-[#06b6d4] font-mono space-y-0.5">
              <div className="font-bold flex items-center gap-1">
                <GitMerge className="w-3 h-3" />
                <span>Multi-Device Collision Resolved</span>
              </div>
              <div>
                Auto-merged {syncState.lastConflict.mergedNodesCount} reviews at{' '}
                {syncState.lastConflict.timestamp}.
              </div>
            </div>
          )}

          {syncState.error && (
            <div className="p-2 rounded bg-[#ef4444]/15 border border-[#ef4444]/30 text-[10px] text-[#fca5a5]">
              {syncState.error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSyncClick}
            className="w-full py-1.5 px-2.5 rounded bg-[#181b26] hover:bg-[#202434] text-[#f1f5f9] border border-[#2d3246] hover:border-[#6366f1] transition-colors font-mono text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-[#6366f1]" />
            <span>Force Sync Now</span>
          </button>
        </div>
      )}
    </div>
  );
};

'use client';

import React from 'react';
import {
  Upload,
  BookOpen,
  Flame,
  Target,
  Clock,
  CheckCircle2,
  GitBranch,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { DashboardMetrics } from '../types/syllabus';
import type { UserProfile } from '../types/user';
import { UserProfileSwitcher } from './UserProfileSwitcher';

interface DashboardHeaderProps {
  metrics: DashboardMetrics;
  onOpenImport: () => void;
  onOpenReview: () => void;
  users: UserProfile[];
  activeUser: UserProfile;
  onSwitchUser: (userId: string) => void;
  onCreateUser: (name: string, focusArea: string, color: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  metrics,
  onOpenImport,
  onOpenReview,
  users,
  activeUser,
  onSwitchUser,
  onCreateUser,
}) => {
  const completionPercent =
    metrics.totalNodes > 0
      ? Math.round((metrics.completedNodes / metrics.totalNodes) * 100)
      : 0;

  const retentionPercent =
    metrics.retentionRate <= 1
      ? Math.round(metrics.retentionRate * 100)
      : Math.round(metrics.retentionRate);

  const hasDueReviews = metrics.dueForReviewCount > 0;

  return (
    <header className="w-full space-y-6">
      {/* Top Application Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2a3045]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#141722] border border-[#2a3045] flex items-center justify-center text-[#10b981] shadow-[0_0_16px_rgba(16,185,129,0.15)] relative shrink-0">
            <GitBranch className="w-5 h-5 text-[#10b981]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#06b6d4] ring-2 ring-[#090a0f]" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-[#f1f5f9]">
                LearnTree
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#1b1f2e] border border-[#2a3045] text-[#10b981]">
                <ShieldCheck className="w-3 h-3 text-[#10b981]" />
                $0-AI Local-First
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Hierarchical syllabus tree with SuperMemo-2 active recall scheduling
            </p>
          </div>
        </div>

        {/* Global Controls & Multi-User Profile Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Multi-User Switcher Component */}
          <UserProfileSwitcher
            users={users}
            activeUser={activeUser}
            onSwitchUser={onSwitchUser}
            onCreateUser={onCreateUser}
          />

          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-[#141722] hover:bg-[#1b1f2e] text-[#f1f5f9] border border-[#2a3045] hover:border-[#06b6d4] transition-all cursor-pointer shadow-sm active:scale-98"
          >
            <Upload className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span className="hidden md:inline">Import Syllabus</span>
            <span className="md:hidden">Import</span>
          </button>

          <button
            type="button"
            onClick={onOpenReview}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium rounded-md transition-all cursor-pointer shadow-md active:scale-98 ${
              hasDueReviews
                ? 'bg-[#f59e0b] hover:bg-[#d97706] text-[#090a0f] font-semibold shadow-[0_0_16px_rgba(245,158,11,0.3)]'
                : 'bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-semibold shadow-[0_0_16px_rgba(16,185,129,0.25)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Review Queue</span>
            <span
              className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                hasDueReviews
                  ? 'bg-[#090a0f] text-[#f59e0b]'
                  : 'bg-[#090a0f] text-[#10b981]'
              }`}
            >
              {metrics.dueForReviewCount}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Grid: 4 High-Utility Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Nodes Completed */}
        <div className="p-4 rounded-lg bg-[#141722] border border-[#2a3045] hover:border-[#3c445c] transition-all">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-2 font-mono">
            <span className="uppercase tracking-wider text-[11px]">Nodes Completed</span>
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-2xl font-bold text-[#f1f5f9] font-mono tabular-nums">
              {metrics.completedNodes}
              <span className="text-xs text-[#94a3b8] font-normal ml-1.5">
                / {metrics.totalNodes}
              </span>
            </div>
            <span className="text-xs font-mono text-[#10b981] font-semibold bg-[#10b981]/10 px-1.5 py-0.5 rounded border border-[#10b981]/20">
              {completionPercent}%
            </span>
          </div>

          {/* Dual-tone gradient progress bar */}
          <div className="w-full h-2 bg-[#1b1f2e] rounded-full overflow-hidden border border-[#2a3045]/80 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, completionPercent))}%` }}
            />
          </div>
        </div>

        {/* Card 2: Due for Review */}
        <div
          className={`p-4 rounded-lg bg-[#141722] border transition-all ${
            hasDueReviews
              ? 'border-[#f59e0b] bg-[#f59e0b]/5 shadow-[0_0_18px_rgba(245,158,11,0.2)]'
              : 'border-[#2a3045]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-2 font-mono">
            <span className="uppercase tracking-wider text-[11px]">Due for Review</span>
            {hasDueReviews ? (
              <AlertTriangle className="w-4 h-4 text-[#f59e0b] animate-pulse" />
            ) : (
              <Clock className="w-4 h-4 text-[#94a3b8]" />
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                hasDueReviews ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'
              }`}
            >
              {metrics.dueForReviewCount}
            </div>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded border font-medium ${
                hasDueReviews
                  ? 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30'
                  : 'bg-[#1b1f2e] text-[#94a3b8] border-[#2a3045]'
              }`}
            >
              {hasDueReviews ? 'Action Required' : 'All Clear'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#94a3b8]">
            {hasDueReviews ? 'Decaying concepts ready for recall' : 'No overdue reviews right now'}
          </div>
        </div>

        {/* Card 3: Consolidation Streak */}
        <div className="p-4 rounded-lg bg-[#141722] border border-[#2a3045] hover:border-[#3c445c] transition-all">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-2 font-mono">
            <span className="uppercase tracking-wider text-[11px]">Consolidation Streak</span>
            <Flame className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-[#f1f5f9] font-mono tabular-nums">
              {metrics.streakDays}
              <span className="text-xs text-[#94a3b8] font-normal ml-1.5">days</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 font-medium">
              🔥 Active
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#94a3b8]">
            Continuous memory reinforcement
          </div>
        </div>

        {/* Card 4: Retention Rate Projection */}
        <div className="p-4 rounded-lg bg-[#141722] border border-[#2a3045] hover:border-[#3c445c] transition-all">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-2 font-mono">
            <span className="uppercase tracking-wider text-[11px]">Retention Rate Projection</span>
            <Target className="w-4 h-4 text-[#06b6d4]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-[#f1f5f9] font-mono tabular-nums">
              {retentionPercent}%
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/30 font-medium">
              SM-2 Math
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#94a3b8]">
            Estimated long-term retrieval stability
          </div>
        </div>
      </div>
    </header>
  );
};

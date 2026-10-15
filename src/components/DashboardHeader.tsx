'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  Brain,
  FolderGit2,
  Target,
} from 'lucide-react';
import type { DashboardMetrics } from '../types/syllabus';
import type { UserProfile } from '../types/user';
import type { SyllabusRepo } from '../types/repo';

interface DashboardHeaderProps {
  metrics: DashboardMetrics;
  activeUser: UserProfile;
  activeRepo: SyllabusRepo | null;
  onOpenReview?: () => void;
  onFilterStatus?: (status: 'mastered' | 'due' | 'in_progress' | 'unstarted' | 'all') => void;
  onOpenStreakModal?: () => void;
  onOpenRetentionModal?: () => void;
  dailyTargetMinutes?: number;
  todayStudyMinutes?: number;
  onOpenDailyGoalModal?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  metrics,
  activeUser,
  activeRepo,
  onOpenReview,
  onFilterStatus,
  onOpenStreakModal,
  onOpenRetentionModal,
  dailyTargetMinutes = 30,
  todayStudyMinutes = 0,
  onOpenDailyGoalModal,
}) => {
  const targetMinutes = Math.max(1, dailyTargetMinutes);
  const isGoalMet = todayStudyMinutes >= targetMinutes;
  const goalPercent = Math.min(100, Math.round((todayStudyMinutes / targetMinutes) * 100));

  const completionPercent =
    metrics.totalNodes > 0
      ? ((metrics.completedNodes / metrics.totalNodes) * 100).toFixed(1)
      : '0.0';

  const inProgressCount = Math.max(
    0,
    metrics.totalNodes - metrics.completedNodes - metrics.dueForReviewCount
  );

  const unstartedCount = Math.max(
    0,
    metrics.totalNodes - metrics.completedNodes - metrics.dueForReviewCount - inProgressCount
  );

  const repoTitle = activeRepo?.name || 'General Curriculum';
  const repoCode = activeRepo?.code || 'SYS-601';

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hero Syllabus Banner (Screen 1) */}
      <div className="p-4 sm:p-5 rounded-lg bg-[#12141c] border border-[#1e2230] shadow-sm relative overflow-hidden">
        {/* Ambient Gradient Glow */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#10b981]/5 via-[#06b6d4]/5 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#181b26] text-[#6366f1] border border-[#2d3246] uppercase">
                ACTIVE SYLLABUS {repoCode}
              </span>
              <span className="text-xs font-mono text-[#94a3b8]">
                Student: <strong className="text-[#f1f5f9]">{activeUser.name}</strong>
              </span>

              {/* Quick Daily Goal Badge */}
              <button
                type="button"
                onClick={() => onOpenDailyGoalModal && onOpenDailyGoalModal()}
                className="text-xs font-mono px-2 py-0.5 rounded bg-[#181b26] border border-[#2d3246] hover:border-[#06b6d4]/50 flex items-center gap-1.5 text-[#94a3b8] hover:text-[#f1f5f9] cursor-pointer transition-colors"
                title="Configure Daily Study Goal"
              >
                <Target className="w-3.5 h-3.5 text-[#06b6d4]" />
                <span>Goal:</span>
                <strong className={isGoalMet ? 'text-[#10b981]' : 'text-[#f1f5f9]'}>
                  {todayStudyMinutes}/{targetMinutes}m
                </strong>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                    isGoalMet
                      ? 'bg-[#10b981]/20 text-[#10b981]'
                      : 'bg-[#06b6d4]/20 text-[#06b6d4]'
                  }`}
                >
                  {isGoalMet ? '✓ Met' : `${goalPercent}%`}
                </span>
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#f1f5f9] font-sans flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-[#10b981] hidden sm:inline" />
              <span>{repoTitle}</span>
            </h1>
          </div>

          {/* Mastered percentage badge */}
          <div
            onClick={() => onFilterStatus && onFilterStatus('mastered')}
            className="flex items-baseline gap-2 sm:text-right shrink-0 cursor-pointer group"
            title="Filter to Mastered concepts"
          >
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#f1f5f9] tabular-nums group-hover:text-[#10b981] transition-colors">
              {completionPercent}%
            </span>
            <span className="text-xs font-mono text-[#94a3b8] font-medium">
              Mastered
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-semibold border border-[#10b981]/20">
              SM-2 Synced
            </span>
          </div>
        </div>

        {/* Long Progress Bar */}
        <div className="mt-3 sm:mt-4 mb-2.5 w-full h-1.5 bg-[#181b26] rounded-full overflow-hidden border border-[#2d3246]/60">
          <div
            className="h-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, parseFloat(completionPercent)))}%` }}
          />
        </div>

        {/* Sub-status counts - clickable quick filters */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#94a3b8] pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => onFilterStatus && onFilterStatus('mastered')}
              className="flex items-center gap-1.5 text-[#f1f5f9] hover:underline cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <strong className="text-[#10b981]">{metrics.completedNodes}</strong> Mastered
            </button>
            <button
              type="button"
              onClick={() => onFilterStatus && onFilterStatus('due')}
              className="flex items-center gap-1.5 text-[#f1f5f9] hover:underline cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              <strong className="text-[#f59e0b]">{metrics.dueForReviewCount}</strong> Due Today
            </button>
            <button
              type="button"
              onClick={() => onFilterStatus && onFilterStatus('in_progress')}
              className="flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#06b6d4]" />
              <strong className="text-[#06b6d4]">{inProgressCount}</strong> In Progress
            </button>
            <button
              type="button"
              onClick={() => onFilterStatus && onFilterStatus('unstarted')}
              className="flex items-center gap-1.5 text-[#94a3b8] hover:underline cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#475569]" />
              <span>{unstartedCount} Unstarted</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onFilterStatus && onFilterStatus('all')}
            className="text-[#475569] hover:text-[#94a3b8] cursor-pointer"
          >
            {metrics.totalNodes} Total Concepts
          </button>
        </div>
      </div>

      {/* 5 Segmented Interactive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* KPI 1: Nodes Completed */}
        <div
          onClick={() => onFilterStatus && onFilterStatus('mastered')}
          className="p-3 sm:p-3.5 rounded-lg bg-[#12141c] hover:bg-[#151824] border border-[#1e2230] hover:border-[#10b981]/50 space-y-1.5 sm:space-y-2 cursor-pointer transition-all group"
          title="Click to filter Mastered nodes"
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
            <span className="flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
              <span className="truncate">Completed</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 hidden sm:inline">
              +4 this cycle
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#f1f5f9] group-hover:text-[#10b981] tabular-nums transition-colors">
            {metrics.completedNodes} <span className="text-xs text-[#94a3b8] font-normal">/ {metrics.totalNodes}</span>
          </div>
          <div className="flex gap-1 h-1">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 rounded-xs ${
                  idx < Math.ceil((metrics.completedNodes / Math.max(1, metrics.totalNodes)) * 8)
                    ? 'bg-[#10b981]'
                    : 'bg-[#1e2230]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* KPI 2: Due for Review */}
        <div
          onClick={() => onOpenReview && onOpenReview()}
          className={`p-3 sm:p-3.5 rounded-lg bg-[#12141c] hover:bg-[#151824] border space-y-1.5 sm:space-y-2 cursor-pointer transition-all group ${
            metrics.dueForReviewCount > 0
              ? 'border-[#f59e0b]/40 hover:border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : 'border-[#1e2230] hover:border-[#f59e0b]/40'
          }`}
          title="Click to launch Review Queue"
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
            <span className="flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
              <span className="truncate">Due Review</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] text-[#f59e0b] border border-[#f59e0b]/30 group-hover:bg-[#f59e0b] group-hover:text-[#090a0f] font-semibold transition-colors hidden sm:inline">
              Start
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#f59e0b] tabular-nums">
            {metrics.dueForReviewCount} <span className="text-xs text-[#94a3b8] font-normal">cards</span>
          </div>
          <div className="flex gap-1 h-1">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 rounded-xs ${
                  idx < Math.min(8, metrics.dueForReviewCount)
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#1e2230]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* KPI 3: Daily Study Goal */}
        <div
          onClick={() => onOpenDailyGoalModal && onOpenDailyGoalModal()}
          className={`p-3 sm:p-3.5 rounded-lg bg-[#12141c] hover:bg-[#151824] border space-y-1.5 sm:space-y-2 cursor-pointer transition-all group ${
            isGoalMet
              ? 'border-[#10b981]/50 shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:border-[#10b981]'
              : 'border-[#1e2230] hover:border-[#06b6d4]/50'
          }`}
          title="Click to track study time & configure Daily Goal"
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
            <span className="flex items-center gap-1.5 truncate">
              <Target className={`w-3.5 h-3.5 shrink-0 ${isGoalMet ? 'text-[#10b981]' : 'text-[#06b6d4]'}`} />
              <span className="truncate">Daily Goal</span>
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                isGoalMet
                  ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                  : 'bg-[#06b6d4]/15 text-[#06b6d4] border-[#06b6d4]/30'
              }`}
            >
              {isGoalMet ? 'Goal Met' : `${goalPercent}%`}
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#f1f5f9] group-hover:text-[#06b6d4] tabular-nums transition-colors">
            {todayStudyMinutes}m{' '}
            <span className="text-xs text-[#94a3b8] font-normal">/ {targetMinutes}m</span>
          </div>
          <div className="flex gap-1 h-1">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 rounded-xs transition-colors ${
                  idx < Math.ceil((todayStudyMinutes / targetMinutes) * 8)
                    ? isGoalMet
                      ? 'bg-[#10b981]'
                      : 'bg-[#06b6d4]'
                    : 'bg-[#1e2230]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* KPI 4: Consolidation Streak */}
        <div
          onClick={() => onOpenStreakModal && onOpenStreakModal()}
          className="p-3 sm:p-3.5 rounded-lg bg-[#12141c] hover:bg-[#151824] border border-[#1e2230] hover:border-[#f59e0b]/50 space-y-1.5 sm:space-y-2 cursor-pointer transition-all group"
          title="Click to view Streak & Recall Cadence"
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
            <span className="flex items-center gap-1.5 truncate">
              <Flame className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
              <span className="truncate">Streak</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] text-[#94a3b8] border border-[#2d3246] hidden sm:inline">
              Active
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#f1f5f9] group-hover:text-[#f59e0b] tabular-nums transition-colors">
            {metrics.streakDays} <span className="text-xs text-[#94a3b8] font-normal">Days</span>
          </div>
          <div className="flex gap-1 h-1">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 rounded-xs ${
                  idx < Math.min(8, metrics.streakDays)
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#1e2230]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* KPI 4: SM-2 Projected Recall */}
        <div
          onClick={() => onOpenRetentionModal && onOpenRetentionModal()}
          className="p-3 sm:p-3.5 rounded-lg bg-[#12141c] hover:bg-[#151824] border border-[#1e2230] hover:border-[#6366f1]/50 space-y-1.5 sm:space-y-2 cursor-pointer transition-all group"
          title="Click to view SM-2 Retention Math"
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
            <span className="flex items-center gap-1.5 truncate">
              <Brain className="w-3.5 h-3.5 text-[#6366f1] shrink-0" />
              <span className="truncate">Retention</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] text-[#6366f1] border border-[#6366f1]/30 hidden sm:inline">
              SM-2 Math
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-[#f1f5f9] group-hover:text-[#6366f1] tabular-nums transition-colors">
            {(metrics.retentionRate * 100).toFixed(1)}%
          </div>
          <div className="flex gap-1 h-1">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 rounded-xs ${
                  idx < Math.round(metrics.retentionRate * 8)
                    ? 'bg-[#6366f1]'
                    : 'bg-[#1e2230]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

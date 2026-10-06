'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  Brain,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import type { DashboardMetrics } from '../types/syllabus';
import type { UserProfile } from '../types/user';

interface DashboardHeaderProps {
  metrics: DashboardMetrics;
  activeUser: UserProfile;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  metrics,
  activeUser,
}) => {
  const completionPercent =
    metrics.totalNodes > 0
      ? ((metrics.completedNodes / metrics.totalNodes) * 100).toFixed(1)
      : '0.0';

  const inProgressCount = Math.max(
    0,
    metrics.totalNodes - metrics.completedNodes - metrics.dueForReviewCount
  );

  return (
    <div className="space-y-4">
      {/* Hero Syllabus Banner */}
      <div className="p-5 rounded-lg bg-[#12141c] border border-[#1e2230] shadow-sm relative overflow-hidden">
        {/* Subtle ambient gradient */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#10b981]/5 via-[#06b6d4]/5 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#181b26] text-[#6366f1] border border-[#2d3246] uppercase">
                Active Syllabus SYS-601
              </span>
              <span className="text-xs font-mono text-[#94a3b8]">
                Student: {activeUser.name}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#f1f5f9] font-sans">
              {activeUser.focusArea}
            </h1>
          </div>

          {/* Mastered percentage badge */}
          <div className="flex items-baseline gap-2 sm:text-right shrink-0">
            <span className="text-2xl font-bold font-mono text-[#f1f5f9] tabular-nums">
              {completionPercent}%
            </span>
            <span className="text-xs font-mono text-[#94a3b8] font-medium">
              Mastered
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] font-semibold border border-[#10b981]/20">
              +3.2% vs last cycle
            </span>
          </div>
        </div>

        {/* Long Progress Bar */}
        <div className="mt-4 mb-2.5 w-full h-1.5 bg-[#181b26] rounded-full overflow-hidden border border-[#2d3246]/60">
          <div
            className="h-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, parseFloat(completionPercent)))}%` }}
          />
        </div>

        {/* Sub-status counts */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#94a3b8] pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[#f1f5f9]">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              <strong className="text-[#10b981]">{metrics.completedNodes}</strong> Mastered
            </span>
            <span className="flex items-center gap-1.5 text-[#f1f5f9]">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              <strong className="text-[#f59e0b]">{metrics.dueForReviewCount}</strong> Due Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#06b6d4]" />
              {inProgressCount} In Progress
            </span>
            <span className="flex items-center gap-1.5 text-[#475569]">
              <span className="w-2 h-2 rounded-full bg-[#2d3246]" />
              20 Backlog
            </span>
          </div>

          <span className="text-[#475569]">
            {metrics.totalNodes} Total Concept Vertices
          </span>
        </div>
      </div>

      {/* 4 Segmented KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Nodes Completed */}
        <div className="p-3.5 rounded-lg bg-[#12141c] border border-[#1e2230] space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
              Nodes Completed
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
              +4 this week
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[#f1f5f9] tabular-nums">
            {metrics.completedNodes} <span className="text-xs text-[#94a3b8] font-normal">/ {metrics.totalNodes}</span>
          </div>
          {/* Segmented Progress Blocks */}
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
          className={`p-3.5 rounded-lg bg-[#12141c] border space-y-2 ${
            metrics.dueForReviewCount > 0
              ? 'border-[#f59e0b]/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              : 'border-[#1e2230]'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
              Due for Review
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] text-[#94a3b8] border border-[#2d3246]">
              Space to start
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[#f59e0b] tabular-nums">
            {metrics.dueForReviewCount} <span className="text-xs text-[#94a3b8] font-normal">nodes</span>
          </div>
          {/* Segmented Ticks */}
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

        {/* KPI 3: Consolidation Streak */}
        <div className="p-3.5 rounded-lg bg-[#12141c] border border-[#1e2230] space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />
              Consolidation Streak
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] text-[#94a3b8] border border-[#2d3246]">
              Best: {Math.max(24, metrics.streakDays + 5)}d
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[#f1f5f9] tabular-nums">
            {metrics.streakDays} <span className="text-xs text-[#94a3b8] font-normal">Days</span>
          </div>
          {/* Streak Ticks */}
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
        <div className="p-3.5 rounded-lg bg-[#12141c] border border-[#1e2230] space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
            <span className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-[#6366f1]" />
              SM-2 Projected Recall
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] text-[#94a3b8] border border-[#2d3246]">
              Half-life ~32d
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-[#f1f5f9] tabular-nums">
            {(metrics.retentionRate * 100).toFixed(1)}%
          </div>
          {/* Retention Ticks */}
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

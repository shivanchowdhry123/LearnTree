'use client';

import React from 'react';
import { 
  Upload, 
  BookOpen, 
  Flame, 
  Target, 
  Clock, 
  CheckCircle2, 
  Layers, 
  ShieldCheck,
  AlertTriangle 
} from 'lucide-react';
import type { DashboardMetrics } from '../types/syllabus';

interface DashboardHeaderProps {
  metrics: DashboardMetrics;
  onOpenImport: () => void;
  onOpenReview: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  metrics,
  onOpenImport,
  onOpenReview,
}) => {
  const completionPercent = metrics.totalNodes > 0
    ? Math.round((metrics.completedNodes / metrics.totalNodes) * 100)
    : 0;

  const retentionPercent = metrics.retentionRate <= 1 
    ? Math.round(metrics.retentionRate * 100) 
    : Math.round(metrics.retentionRate);

  const hasDueReviews = metrics.dueForReviewCount > 0;

  return (
    <header className="w-full space-y-6">
      {/* Top Application Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d3246]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight text-[#f1f5f9] font-sans">
                LearnTree
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium tracking-wide bg-[#1a1d28] border border-[#2d3246] text-[#4edea3]">
                <ShieldCheck className="w-3 h-3 text-[#10b981]" />
                $0-AI Local-First
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] font-sans">
              Hierarchical syllabus tracker with SuperMemo-2 spaced repetition
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded bg-[#1a1d28] hover:bg-[#262a3b] text-[#f1f5f9] border border-[#2d3246] hover:border-[#94a3b8] transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#06b6d4]" />
            Import Syllabus
          </button>

          <button
            type="button"
            onClick={onOpenReview}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded transition-all cursor-pointer shadow-sm ${
              hasDueReviews
                ? 'bg-[#f59e0b] hover:bg-[#d97706] text-[#090a0f] font-semibold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-medium shadow-[0_0_12px_rgba(16,185,129,0.25)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Review Queue</span>
            <span
              className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                hasDueReviews
                  ? 'bg-[#090a0f]/80 text-[#f59e0b]'
                  : 'bg-[#090a0f]/80 text-[#10b981]'
              }`}
            >
              {metrics.dueForReviewCount}
            </span>
          </button>
        </div>
      </div>

      {/* KPI 4-Card Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Nodes Completed */}
        <div className="p-3.5 rounded bg-[#12141c] border border-[#2d3246] hover:border-[#3c445c] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-1.5">
            <span className="font-medium">Nodes Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-xl font-semibold text-[#f1f5f9] font-mono tabular-nums">
              {metrics.completedNodes}
              <span className="text-xs text-[#94a3b8] font-normal ml-1">/ {metrics.totalNodes}</span>
            </div>
            <span className="text-xs font-mono text-[#10b981] font-medium">
              {completionPercent}%
            </span>
          </div>
          {/* Segmented / Smooth Progress Bar */}
          <div className="w-full h-1.5 bg-[#1a1d28] rounded-full overflow-hidden border border-[#2d3246]">
            <div
              className="h-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, completionPercent))}%` }}
            />
          </div>
        </div>

        {/* Card 2: Due for Review */}
        <div
          className={`p-3.5 rounded bg-[#12141c] border transition-all ${
            hasDueReviews
              ? 'border-[#f59e0b]/50 bg-[#f59e0b]/5 shadow-[0_0_12px_-2px_rgba(245,158,11,0.15)]'
              : 'border-[#2d3246]'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-1.5">
            <span className="font-medium">Due for Review</span>
            {hasDueReviews ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b]" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-[#94a3b8]" />
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <div
              className={`text-xl font-semibold font-mono tabular-nums ${
                hasDueReviews ? 'text-[#f59e0b]' : 'text-[#f1f5f9]'
              }`}
            >
              {metrics.dueForReviewCount}
            </div>
            <span
              className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${
                hasDueReviews
                  ? 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30'
                  : 'bg-[#1a1d28] text-[#94a3b8] border-[#2d3246]'
              }`}
            >
              {hasDueReviews ? 'Action Required' : 'All Clear'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#94a3b8]">
            {hasDueReviews ? 'Nodes ready for SM-2 recall' : 'Next reviews scheduled'}
          </div>
        </div>

        {/* Card 3: Active Recall Streak */}
        <div className="p-3.5 rounded bg-[#12141c] border border-[#2d3246] hover:border-[#3c445c] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-1.5">
            <span className="font-medium">Recall Streak</span>
            <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-semibold text-[#f1f5f9] font-mono tabular-nums">
              {metrics.streakDays}
              <span className="text-xs text-[#94a3b8] font-normal ml-1">days</span>
            </div>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
              🔥 Active
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#94a3b8]">
            Consecutive study cadence
          </div>
        </div>

        {/* Card 4: Retention Rate */}
        <div className="p-3.5 rounded bg-[#12141c] border border-[#2d3246] hover:border-[#3c445c] transition-colors">
          <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-1.5">
            <span className="font-medium">Retention Rate</span>
            <Target className="w-3.5 h-3.5 text-[#06b6d4]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-semibold text-[#f1f5f9] font-mono tabular-nums">
              {retentionPercent}%
            </div>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#06b6d4]/10 text-[#06b6d4] border border-[#06b6d4]/20">
              SM-2 Stability
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#94a3b8]">
            Estimated long-term recall
          </div>
        </div>
      </div>
    </header>
  );
};

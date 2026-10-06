'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Square,
  MinusSquare,
  CheckSquare,
  Clock,
  Sparkles,
  MoreHorizontal,
  Plus,
  BookOpen,
} from 'lucide-react';
import type { SyllabusNode, SyllabusNodeStatus, SM2State } from '../types/syllabus';

interface SyllabusTreeViewProps {
  nodes: SyllabusNode[];
  onNodeStatusChange: (id: string, status: SyllabusNodeStatus) => void;
  onNodeToggleExpand?: (id: string) => void;
  onOpenReview?: () => void;
}

const NEXT_STATUS: Record<SyllabusNodeStatus, SyllabusNodeStatus> = {
  unstarted: 'in_progress',
  in_progress: 'mastered',
  mastered: 'unstarted',
};

function formatSM2Interval(sm2State: SM2State): { label: string; isDue: boolean; ef?: string } {
  if (!sm2State.nextReviewAt) {
    return { label: 'Unscheduled', isDue: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewDate = new Date(sm2State.nextReviewAt);
  reviewDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { label: 'DUE TODAY', isDue: true };
  } else if (diffDays === 1) {
    return { label: 'In 1d', isDue: false, ef: `EF ${sm2State.easeFactor.toFixed(1)}` };
  } else {
    return { label: `In ${diffDays}d`, isDue: false, ef: `EF ${sm2State.easeFactor.toFixed(1)}` };
  }
}

export const SyllabusTreeView: React.FC<SyllabusTreeViewProps> = ({
  nodes,
  onNodeStatusChange,
  onNodeToggleExpand,
  onOpenReview,
}) => {
  const [internalExpanded, setInternalExpanded] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    function seed(list: SyllabusNode[]) {
      for (const item of list) {
        map[item.id] = true;
        if (item.children) seed(item.children);
      }
    }
    seed(nodes);
    return map;
  });

  const handleToggle = (id: string) => {
    if (onNodeToggleExpand) {
      onNodeToggleExpand(id);
    }
    setInternalExpanded((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  };

  const renderNodeRows = (items: SyllabusNode[], depth: number = 0): React.ReactNode => {
    return items.map((node, index) => {
      const isExpanded = internalExpanded[node.id] ?? true;
      const hasChildren = node.children && node.children.length > 0;
      const isRoot = depth === 0;
      const sm2Info = formatSM2Interval(node.sm2State);

      // Compute cluster stats for root nodes
      const totalChildren = node.children ? node.children.length : 0;
      const masteredChildren = node.children
        ? node.children.filter((c) => c.status === 'mastered').length
        : 0;
      const clusterPercent =
        totalChildren > 0
          ? Math.round((masteredChildren / totalChildren) * 100)
          : node.status === 'mastered'
          ? 100
          : 0;

      return (
        <React.Fragment key={node.id}>
          <div
            className={`flex items-center px-3 py-2 text-xs border-b border-[#1e2230] hover:bg-[#151824] transition-colors group select-none ${
              isRoot ? 'bg-[#12141c] font-medium' : 'bg-[#0e1017]'
            }`}
          >
            {/* ST Column: Checkbox / Status */}
            <div className="w-8 shrink-0 flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeStatusChange(node.id, NEXT_STATUS[node.status] || 'unstarted');
                }}
                className="p-0.5 rounded text-[#94a3b8] hover:text-[#f1f5f9] transition-transform active:scale-95 cursor-pointer"
                title={`Status: ${node.status} (Click to cycle)`}
              >
                {node.status === 'mastered' ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#10b981] fill-[#10b981]/20" />
                ) : node.status === 'in_progress' ? (
                  <MinusSquare className="w-3.5 h-3.5 text-[#06b6d4] fill-[#06b6d4]/20" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-[#475569] group-hover:text-[#94a3b8]" />
                )}
              </button>
            </div>

            {/* CONCEPT HIERARCHY & ARTIFACTS Column */}
            <div
              className="flex-1 min-w-0 pr-4 flex items-center gap-2"
              style={{ paddingLeft: `${depth * 20}px` }}
            >
              {/* Expand Chevron */}
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => handleToggle(node.id)}
                    className="p-0.5 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2d3246]" />
                )}
              </div>

              {/* Title & Cluster Badges */}
              <div className="min-w-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <span
                  onClick={() => hasChildren && handleToggle(node.id)}
                  className={`truncate font-sans ${
                    isRoot
                      ? 'font-bold text-[#f1f5f9] text-[13px]'
                      : node.status === 'mastered'
                      ? 'text-[#94a3b8] line-through decoration-[#475569]'
                      : node.status === 'in_progress'
                      ? 'text-[#f1f5f9] font-medium'
                      : 'text-[#e1e1ed]'
                  } ${hasChildren ? 'cursor-pointer' : ''}`}
                >
                  {node.title}
                </span>

                {/* Root level cluster badge */}
                {isRoot && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 font-semibold border ${
                      clusterPercent === 100
                        ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                        : clusterPercent > 0
                        ? 'bg-[#06b6d4]/15 text-[#06b6d4] border-[#06b6d4]/30'
                        : 'bg-[#1e2230] text-[#94a3b8] border-[#2d3246]'
                    }`}
                  >
                    {clusterPercent}% {clusterPercent === 100 ? 'Mastered' : 'Consolidated'}
                  </span>
                )}

                {/* Sub-node flashcard counts preview */}
                {depth === 2 && (
                  <span className="text-[10px] font-mono text-[#6366f1] shrink-0">
                    card count: {node.sm2State.repetition + 4}
                  </span>
                )}
              </div>
            </div>

            {/* TAGS Column */}
            <div className="hidden md:flex items-center gap-1.5 w-36 shrink-0 truncate">
              {node.tags && node.tags.length > 0 ? (
                node.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] border border-[#2d3246] text-[#94a3b8]"
                  >
                    #{t}
                  </span>
                ))
              ) : isRoot ? (
                <span className="text-[10px] font-mono text-[#475569]">
                  {totalChildren} concepts
                </span>
              ) : null}
            </div>

            {/* PRIMARY SOURCE Column */}
            <div className="hidden lg:flex items-center gap-1.5 w-44 shrink-0 text-[11px] font-mono text-[#06b6d4] truncate">
              {node.url ? (
                <a
                  href={node.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1 truncate text-[#06b6d4] hover:text-[#4cd7f6]"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {node.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 20)}
                  </span>
                </a>
              ) : isRoot ? (
                <span className="text-[#475569]">Cluster Source</span>
              ) : (
                <span className="text-[#475569]">Section 5.{index + 1}</span>
              )}
            </div>

            {/* SM-2 SPACED RECALL Column */}
            <div className="w-32 shrink-0 flex items-center justify-end font-mono text-[11px] tabular-nums">
              {sm2Info.isDue ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                  <Clock className="w-2.5 h-2.5" />
                  {sm2Info.label}
                </span>
              ) : isRoot && clusterPercent === 100 ? (
                <span className="text-[#10b981] font-semibold text-[10px]">
                  All Retained
                </span>
              ) : isRoot && sm2Info.isDue ? (
                <span className="text-[#f59e0b] font-semibold text-[10px]">
                  Requires Review
                </span>
              ) : isRoot && clusterPercent === 0 ? (
                <span className="text-[#475569] text-[10px]">Queue Idle</span>
              ) : (
                <span className="text-[#94a3b8] text-[10px]">
                  {sm2Info.label} {sm2Info.ef && <span className="text-[#475569]">({sm2Info.ef})</span>}
                </span>
              )}
            </div>

            {/* ACTIONS Column */}
            <div className="w-8 shrink-0 flex items-center justify-end">
              <button
                type="button"
                className="p-1 rounded text-[#475569] hover:text-[#f1f5f9] hover:bg-[#181b26] transition-colors cursor-pointer"
                title="Node actions"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Render Children Recursively */}
          {hasChildren && isExpanded && renderNodeRows(node.children, depth + 1)}
        </React.Fragment>
      );
    });
  };

  const totalVertices = nodes.reduce((acc, curr) => acc + 1 + (curr.children?.length || 0), 0);

  return (
    <div className="rounded-lg bg-[#0e1017] border border-[#1e2230] overflow-hidden shadow-sm">
      {/* Table Header Row */}
      <div className="flex items-center px-3 py-2 text-[10px] font-mono font-bold tracking-wider text-[#475569] uppercase bg-[#090a0f] border-b border-[#1e2230] select-none">
        <div className="w-8 shrink-0 text-center">ST</div>
        <div className="flex-1 min-w-0 pl-2">Concept Hierarchy & Artifacts</div>
        <div className="hidden md:block w-36 shrink-0">Tags</div>
        <div className="hidden lg:block w-44 shrink-0">Primary Source</div>
        <div className="w-32 shrink-0 text-right">SM-2 Spaced Recall</div>
        <div className="w-8 shrink-0 text-right">Actions</div>
      </div>

      {/* Table Body Rows */}
      <div className="divide-y divide-[#1e2230]/40">
        {nodes.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[#94a3b8]">
            No syllabus vertices found. Click &quot;Import&quot; or &quot;+ Add Node&quot; to begin.
          </div>
        ) : (
          renderNodeRows(nodes, 0)
        )}
      </div>

      {/* Table Footer Controls */}
      <div className="p-2.5 px-4 bg-[#090a0f] border-t border-[#1e2230] flex items-center justify-between text-[11px] font-mono text-[#475569]">
        <button
          type="button"
          onClick={() => {
            const title = prompt('Enter Root Cluster / Module Title:');
            if (title) {
              // App handles creation or prompt
            }
          }}
          className="flex items-center gap-1.5 text-[#06b6d4] hover:text-[#4cd7f6] transition-colors cursor-pointer font-medium"
        >
          <Plus className="w-3 h-3" />
          <span>Append Root Section (Level 0)</span>
          <kbd className="px-1 py-0.2 rounded text-[9px] bg-[#181b26] text-[#475569] border border-[#2d3246]">
            ⌘+Enter
          </kbd>
        </button>

        <span>
          Showing {nodes.length} Root Clusters · {totalVertices} Displayed Vertices
        </span>
      </div>
    </div>
  );
};

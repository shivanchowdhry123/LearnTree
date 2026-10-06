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
} from 'lucide-react';
import type { SyllabusNode, SyllabusNodeStatus, SM2State } from '../types/syllabus';

interface SyllabusTreeViewProps {
  nodes: SyllabusNode[];
  onNodeStatusChange: (id: string, status: SyllabusNodeStatus) => void;
  onNodeToggleExpand?: (id: string) => void;
}

const NEXT_STATUS: Record<SyllabusNodeStatus, SyllabusNodeStatus> = {
  unstarted: 'in_progress',
  in_progress: 'mastered',
  mastered: 'unstarted',
};

function formatSM2Badge(sm2State: SM2State): { label: string; style: string } {
  if (!sm2State.nextReviewAt) {
    return {
      label: 'New',
      style: 'bg-[#1a1d28] text-[#94a3b8] border-[#2d3246]',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reviewDate = new Date(sm2State.nextReviewAt);
  reviewDate.setHours(0, 0, 0, 0);

  const diffTime = reviewDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      label: 'Due Today',
      style: 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30 shadow-[0_0_8px_rgba(245,158,11,0.15)] font-semibold',
    };
  } else if (diffDays === 1) {
    return {
      label: 'In 1d',
      style: 'bg-[#6366f1]/10 text-[#c0c1ff] border-[#6366f1]/30',
    };
  } else {
    return {
      label: `In ${diffDays}d`,
      style: 'bg-[#1a1d28] text-[#94a3b8] border-[#2d3246]',
    };
  }
}

interface NodeRowProps {
  node: SyllabusNode;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onStatusChange: (id: string, status: SyllabusNodeStatus) => void;
}

const NodeRow: React.FC<NodeRowProps> = ({
  node,
  isExpanded,
  onToggleExpand,
  onStatusChange,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const sm2Badge = formatSM2Badge(node.sm2State);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = NEXT_STATUS[node.status] || 'unstarted';
    onStatusChange(node.id, next);
  };

  const handleRowClick = () => {
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group flex items-center justify-between gap-3 px-2.5 py-1.5 rounded transition-colors cursor-pointer select-none ${
        node.status === 'mastered'
          ? 'hover:bg-[#12141c]/60'
          : node.status === 'in_progress'
          ? 'hover:bg-[#06b6d4]/5'
          : 'hover:bg-[#1a1d28]/70'
      }`}
    >
      {/* Left Column: Chevron + 3-State Checkbox + Title & URL */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Expand / Collapse Chevron */}
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
              className="p-0.5 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors rounded"
              title={isExpanded ? 'Collapse' : 'Expand'}
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

        {/* 3-State Status Toggle Trigger */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          className="shrink-0 p-0.5 rounded text-[#94a3b8] hover:text-[#f1f5f9] transition-transform active:scale-95 cursor-pointer"
          title={`Status: ${node.status} (click to cycle)`}
        >
          {node.status === 'mastered' ? (
            <CheckSquare className="w-4 h-4 text-[#10b981] fill-[#10b981]/20" />
          ) : node.status === 'in_progress' ? (
            <MinusSquare className="w-4 h-4 text-[#06b6d4] fill-[#06b6d4]/20" />
          ) : (
            <Square className="w-4 h-4 text-[#475569] group-hover:text-[#94a3b8]" />
          )}
        </button>

        {/* Node Title & Optional External URL */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-sm tracking-tight truncate font-sans ${
              node.status === 'mastered'
                ? 'text-[#94a3b8] line-through decoration-[#475569]'
                : node.status === 'in_progress'
                ? 'text-[#f1f5f9] font-medium'
                : 'text-[#e1e1ed]'
            }`}
          >
            {node.title}
          </span>

          {node.url && (
            <a
              href={node.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 p-0.5 text-[#06b6d4] hover:text-[#4cd7f6] hover:bg-[#06b6d4]/10 rounded transition-colors inline-flex items-center"
              title={`Open link: ${node.url}`}
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Right Column: Tags + Monospace SM-2 Countdown Badge */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Hashtags */}
        {node.tags && node.tags.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5">
            {node.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#1a1d28] border border-[#2d3246] text-[#94a3b8]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* SM-2 Interval Status Badge */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border tabular-nums ${sm2Badge.style}`}
        >
          {sm2Badge.label === 'Due Today' ? (
            <Clock className="w-2.5 h-2.5 text-[#f59e0b]" />
          ) : sm2Badge.label === 'New' ? (
            <Sparkles className="w-2.5 h-2.5 text-[#94a3b8]" />
          ) : null}
          {sm2Badge.label}
        </span>
      </div>
    </div>
  );
};

export const SyllabusTreeView: React.FC<SyllabusTreeViewProps> = ({
  nodes,
  onNodeStatusChange,
  onNodeToggleExpand,
}) => {
  // Local expanded tracking state if parent doesn't manage it directly
  const [internalExpanded, setInternalExpanded] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    function seed(list: SyllabusNode[]) {
      for (const item of list) {
        initialMap[item.id] = true; // default expanded for effortless navigation
        if (item.children) seed(item.children);
      }
    }
    seed(nodes);
    return initialMap;
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

  const renderRecursiveTree = (items: SyllabusNode[], depth: number = 0) => {
    if (!items || items.length === 0) return null;

    return (
      <div className={`space-y-0.5 ${depth > 0 ? 'ml-4 pl-2.5 border-l border-[#1e2230]' : ''}`}>
        {items.map((node) => {
          const isExpanded = internalExpanded[node.id] ?? true;
          const hasChildren = node.children && node.children.length > 0;

          return (
            <div key={node.id} className="relative">
              <NodeRow
                node={node}
                isExpanded={isExpanded}
                onToggleExpand={handleToggle}
                onStatusChange={onNodeStatusChange}
              />

              {hasChildren && isExpanded && (
                <div className="pt-0.5">
                  {renderRecursiveTree(node.children, depth + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-12 text-center rounded border border-[#2d3246] bg-[#12141c]">
        <p className="text-sm text-[#94a3b8]">No syllabus nodes found.</p>
        <p className="text-xs text-[#475569] mt-1">
          Import a Markdown syllabus or paste indented bullet points to populate the tree.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded bg-[#12141c] border border-[#2d3246] p-3 sm:p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1e2230] text-xs text-[#94a3b8]">
        <span className="font-mono uppercase tracking-wider text-[11px] text-[#4edea3]">
          Curriculum Hierarchy
        </span>
        <span className="text-[11px] font-mono">
          Click checkbox to cycle state · Click row to toggle
        </span>
      </div>
      {renderRecursiveTree(nodes, 0)}
    </div>
  );
};

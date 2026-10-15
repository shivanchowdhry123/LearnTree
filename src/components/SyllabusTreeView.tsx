'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Edit2,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { SyllabusNode, SyllabusNodeStatus, SM2State } from '../types/syllabus';

interface SyllabusTreeViewProps {
  nodes: SyllabusNode[];
  onNodeStatusChange: (id: string, status: SyllabusNodeStatus) => void;
  onEditNode: (node: SyllabusNode) => void;
  onAddChildNode: (parentId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onMarkDueNow: (nodeId: string) => void;
  onAppendRootSection: () => void;
  onOpenReview?: () => void;
  onSelectTag?: (tag: string) => void;
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
  onEditNode,
  onAddChildNode,
  onDeleteNode,
  onMarkDueNow,
  onAppendRootSection,
  onOpenReview,
  onSelectTag,
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

  const [activeMenuNodeId, setActiveMenuNodeId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuNodeId(null);
        setConfirmDeleteId(null);
      }
    }
    if (activeMenuNodeId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuNodeId]);

  const handleToggle = (id: string) => {
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
      const isMenuOpen = activeMenuNodeId === node.id;

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
            className={`flex items-center px-3 py-2 text-xs border-b border-[#1e2230] hover:bg-[#151824] transition-colors group select-none relative ${
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
                  onClick={() => onEditNode(node)}
                  className={`truncate font-sans hover:underline cursor-pointer ${
                    isRoot
                      ? 'font-bold text-[#f1f5f9] text-[13px]'
                      : node.status === 'mastered'
                      ? 'text-[#94a3b8] line-through decoration-[#475569]'
                      : node.status === 'in_progress'
                      ? 'text-[#f1f5f9] font-medium'
                      : 'text-[#e1e1ed]'
                  }`}
                  title="Click to edit concept details"
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
                  <button
                    key={t}
                    type="button"
                    onClick={() => onSelectTag && onSelectTag(t)}
                    className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] border border-[#2d3246] text-[#94a3b8] hover:text-[#06b6d4] hover:border-[#06b6d4]/40 transition-colors cursor-pointer"
                    title={`Filter by #${t}`}
                  >
                    #{t}
                  </button>
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
                <button
                  type="button"
                  onClick={() => onOpenReview && onOpenReview()}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#f59e0b] border border-[#f59e0b]/40 shadow-[0_0_8px_rgba(245,158,11,0.2)] cursor-pointer transition-colors"
                  title="Click to review due cards now"
                >
                  <Clock className="w-2.5 h-2.5" />
                  {sm2Info.label}
                </button>
              ) : isRoot && clusterPercent === 100 ? (
                <span className="text-[#10b981] font-semibold text-[10px]">
                  All Retained
                </span>
              ) : isRoot && sm2Info.isDue ? (
                <button
                  type="button"
                  onClick={() => onOpenReview && onOpenReview()}
                  className="text-[#f59e0b] hover:underline font-semibold text-[10px] cursor-pointer"
                >
                  Requires Review
                </button>
              ) : isRoot && clusterPercent === 0 ? (
                <span className="text-[#475569] text-[10px]">Queue Idle</span>
              ) : (
                <span className="text-[#94a3b8] text-[10px]">
                  {sm2Info.label} {sm2Info.ef && <span className="text-[#475569]">({sm2Info.ef})</span>}
                </span>
              )}
            </div>

            {/* ACTIONS Column (Interactive Dropdown Menu) */}
            <div className="w-8 shrink-0 flex items-center justify-end relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuNodeId(isMenuOpen ? null : node.id);
                }}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isMenuOpen
                    ? 'text-[#f1f5f9] bg-[#181b26]'
                    : 'text-[#475569] hover:text-[#f1f5f9] hover:bg-[#181b26]'
                }`}
                title="Node actions menu"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Action Context Popover */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-[#141722] border border-[#2d3246] shadow-[0_16px_40px_rgba(0,0,0,0.9)] z-50 py-1 font-mono text-xs text-[#f1f5f9] animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuNodeId(null);
                      onEditNode(node);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#1b1f2e] text-[#f1f5f9] cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#06b6d4]" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuNodeId(null);
                      onAddChildNode(node.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#1b1f2e] text-[#f1f5f9] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#10b981]" />
                    <span>Add Child Node</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenuNodeId(null);
                      onMarkDueNow(node.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[#1b1f2e] text-[#f59e0b] cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span>Schedule Due Today</span>
                  </button>

                  <div className="my-1 border-t border-[#1e2230]" />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirmDeleteId === node.id) {
                        setActiveMenuNodeId(null);
                        setConfirmDeleteId(null);
                        onDeleteNode(node.id);
                      } else {
                        setConfirmDeleteId(node.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left cursor-pointer transition-colors ${
                      confirmDeleteId === node.id
                        ? 'bg-[#f43f5e] text-[#090a0f] font-bold'
                        : 'hover:bg-[#f43f5e]/15 text-[#f43f5e]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{confirmDeleteId === node.id ? 'Confirm Delete?' : 'Delete Node'}</span>
                    </div>
                  </button>
                </div>
              )}
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
          <div className="p-8 text-center text-xs font-mono text-[#94a3b8] space-y-2">
            <div>No syllabus vertices found in this repository.</div>
            <button
              type="button"
              onClick={onAppendRootSection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-bold text-xs cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Root Section</span>
            </button>
          </div>
        ) : (
          renderNodeRows(nodes, 0)
        )}
      </div>

      {/* Table Footer Controls */}
      <div className="p-2.5 px-4 bg-[#090a0f] border-t border-[#1e2230] flex items-center justify-between text-[11px] font-mono text-[#475569]">
        <button
          type="button"
          onClick={onAppendRootSection}
          className="flex items-center gap-1.5 text-[#06b6d4] hover:text-[#4cd7f6] transition-colors cursor-pointer font-medium hover:bg-[#141722] px-2 py-1 rounded"
        >
          <Plus className="w-3.5 h-3.5" />
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

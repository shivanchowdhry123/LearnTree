'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  ExternalLink,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';
import type { SyllabusNode, ReviewRating } from '../types/syllabus';

interface ReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dueNodes: SyllabusNode[];
  onRateNode: (nodeId: string, rating: ReviewRating) => void;
  allNodes?: SyllabusNode[];
}

/**
 * Finds the breadcrumb path from the root down to the target node ID.
 */
function findNodePath(tree: SyllabusNode[], targetId: string): string[] {
  function search(nodes: SyllabusNode[], currentPath: string[]): string[] | null {
    for (const node of nodes) {
      const nextPath = [...currentPath, node.title];
      if (node.id === targetId) {
        return nextPath;
      }
      if (node.children && node.children.length > 0) {
        const found = search(node.children, nextPath);
        if (found) return found;
      }
    }
    return null;
  }
  return search(tree, []) || [];
}

export const ReviewDrawer: React.FC<ReviewDrawerProps> = ({
  isOpen,
  onClose,
  dueNodes,
  onRateNode,
  allNodes = [],
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [reviewedSessionCount, setReviewedSessionCount] = useState<number>(0);

  // Reset or adjust index when dueNodes changes
  useEffect(() => {
    if (currentIndex >= dueNodes.length) {
      setCurrentIndex(Math.max(0, dueNodes.length - 1));
    }
  }, [dueNodes.length, currentIndex]);

  // Reset state when drawer opens
  useEffect(() => {
    if (isOpen) {
      setIsRevealed(false);
      setReviewedSessionCount(0);
    }
  }, [isOpen]);

  const currentNode = dueNodes[currentIndex] || null;

  // Breadcrumb calculation
  const breadcrumbs = useMemo(() => {
    if (!currentNode) return [];
    if (allNodes.length > 0) {
      const path = findNodePath(allNodes, currentNode.id);
      if (path.length > 0) return path.slice(0, -1);
    }
    return currentNode.tags || [];
  }, [currentNode, allNodes]);

  const handleRate = useCallback(
    (rating: ReviewRating) => {
      if (!currentNode) return;
      onRateNode(currentNode.id, rating);
      setReviewedSessionCount((c) => c + 1);
      setIsRevealed(false);
      // Index automatically advances or stays within bounds
      if (currentIndex >= dueNodes.length - 1) {
        setCurrentIndex(0);
      }
    },
    [currentNode, onRateNode, currentIndex, dueNodes.length]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen || !currentNode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsRevealed((prev) => !prev);
        return;
      }

      // Ratings hotkeys (1, 2, 3, 4)
      if (e.key === '1') {
        e.preventDefault();
        handleRate('again');
      } else if (e.key === '2') {
        e.preventDefault();
        handleRate('hard');
      } else if (e.key === '3') {
        e.preventDefault();
        handleRate('good');
      } else if (e.key === '4') {
        e.preventDefault();
        handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentNode, isRevealed, handleRate, onClose]);

  if (!isOpen) return null;

  const totalInBatch = dueNodes.length;
  const isQueueComplete = totalInBatch === 0 || !currentNode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#090a0f]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#12141c] border border-[#2d3246] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2d3246] bg-[#1a1d28]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b]">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#f1f5f9] tracking-tight">
                Active Recall Drill
              </h2>
              <span className="text-[11px] font-mono text-[#94a3b8]">
                SuperMemo-2 Spaced Repetition Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isQueueComplete && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#12141c] border border-[#2d3246] text-[#4edea3] tabular-nums">
                Item {currentIndex + 1} of {totalInBatch}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#262a3b] transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Content Surface */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-[#12141c]">
          {isQueueComplete ? (
            /* Queue Cleared Celebration State */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shadow-[0_0_24px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-[#f1f5f9]">
                  Review Queue Cleared!
                </h3>
                <p className="text-xs text-[#94a3b8] max-w-sm">
                  All due syllabus concepts have been reviewed and spaced into memory. Good job!
                </p>
              </div>
              {reviewedSessionCount > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#1a1d28] border border-[#2d3246] text-xs font-mono text-[#4edea3]">
                  <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                  {reviewedSessionCount} concepts consolidated in this session
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded bg-[#1a1d28] hover:bg-[#262a3b] text-[#f1f5f9] border border-[#2d3246] transition-colors cursor-pointer"
                >
                  Return to Syllabus Tree
                </button>
              </div>
            </div>
          ) : (
            /* Flashcard Active Recall Surface */
            <div className="space-y-5">
              {/* Breadcrumb Trail */}
              {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#94a3b8] flex-wrap">
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                      <span className="hover:text-[#f1f5f9] transition-colors">
                        {crumb}
                      </span>
                      {idx < breadcrumbs.length - 1 && (
                        <span className="text-[#475569]">/</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Node Title & Direct Resource Link */}
              <div className="p-4 rounded-lg bg-[#1a1d28] border border-[#2d3246] space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[#f1f5f9] leading-snug">
                    {currentNode.title}
                  </h3>
                  {currentNode.url && (
                    <a
                      href={currentNode.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded bg-[#06b6d4]/10 text-[#06b6d4] hover:bg-[#06b6d4]/20 border border-[#06b6d4]/20 transition-colors"
                      title="Open reference resource"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Reference</span>
                    </a>
                  )}
                </div>

                {/* SM-2 Current Telemetry */}
                <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-[#94a3b8] flex-wrap border-t border-[#2d3246]/60">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#f59e0b]" />
                    Interval: {currentNode.sm2State.interval}d
                  </span>
                  <span>•</span>
                  <span>Reps: {currentNode.sm2State.repetition}</span>
                  <span>•</span>
                  <span>EF: {currentNode.sm2State.easeFactor.toFixed(2)}</span>
                  {currentNode.tags && currentNode.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {currentNode.tags.map((t) => (
                          <span key={t} className="text-[#06b6d4]">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Recall Prompt / Active Retrieval Area */}
              <div className="p-5 rounded-lg border border-[#2d3246] bg-[#12141c] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8]">
                  <span className="flex items-center gap-1.5 text-[#06b6d4]">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Recall Prompt
                  </span>
                  <span className="text-[10px] text-[#475569]">
                    Press <kbd className="px-1 py-0.5 rounded bg-[#1a1d28] border border-[#2d3246] text-[#94a3b8]">Space</kbd> to toggle
                  </span>
                </div>

                <p className="text-sm text-[#e1e1ed] font-sans leading-relaxed">
                  Can you retrieve and articulate the core mental model, operational invariants, and edge cases of &quot;{currentNode.title}&quot; from pure recall?
                </p>

                {/* Show Answer / Evaluation Toggle */}
                {!isRevealed ? (
                  <button
                    type="button"
                    onClick={() => setIsRevealed(true)}
                    className="w-full py-3 px-4 rounded bg-[#1a1d28] hover:bg-[#262a3b] text-xs font-medium text-[#f1f5f9] border border-[#2d3246] hover:border-[#94a3b8] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Show Concept Evaluation & Recall Rubric</span>
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#12141c] border border-[#2d3246] text-[#94a3b8]">
                      Space
                    </kbd>
                  </button>
                ) : (
                  <div className="pt-3 border-t border-dashed border-[#2d3246] space-y-2.5 animate-in fade-in duration-150">
                    <div className="text-xs font-mono text-[#4edea3] flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      Self-Evaluation Checklist:
                    </div>
                    <ul className="text-xs text-[#94a3b8] space-y-1.5 list-disc list-inside">
                      <li>Did you accurately define the primary objective and mechanics?</li>
                      <li>Can you explain trade-offs versus adjacent techniques?</li>
                      <li>Did you recall without checking external documentation?</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fixed SM-2 Action Bar with 4 Rating Buttons & Hotkeys */}
        {!isQueueComplete && (
          <div className="p-4 border-t border-[#2d3246] bg-[#1a1d28]/90">
            <div className="text-[11px] font-mono text-[#94a3b8] mb-2 flex items-center justify-between">
              <span>Rate Your Retrieval (SM-2 Interval Calculation)</span>
              <span>Hotkeys: 1 - 4</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Rating 1: Again (Rose / Red) */}
              <button
                type="button"
                onClick={() => handleRate('again')}
                className="group p-2.5 rounded bg-[#12141c] hover:bg-[#f43f5e]/10 text-left border border-[#2d3246] hover:border-[#f43f5e] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-[#f43f5e]">
                  <span>Again</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1a1d28] text-[#f43f5e] border border-[#f43f5e]/30">
                    1
                  </kbd>
                </div>
                <div className="text-[10px] text-[#94a3b8] group-hover:text-[#f1f5f9] mt-1 font-mono">
                  Reset interval (1d)
                </div>
              </button>

              {/* Rating 2: Hard (Amber / Yellow) */}
              <button
                type="button"
                onClick={() => handleRate('hard')}
                className="group p-2.5 rounded bg-[#12141c] hover:bg-[#f59e0b]/10 text-left border border-[#2d3246] hover:border-[#f59e0b] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-[#f59e0b]">
                  <span>Hard</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1a1d28] text-[#f59e0b] border border-[#f59e0b]/30">
                    2
                  </kbd>
                </div>
                <div className="text-[10px] text-[#94a3b8] group-hover:text-[#f1f5f9] mt-1 font-mono">
                  Slight interval boost
                </div>
              </button>

              {/* Rating 3: Good (Cyan / Blue) */}
              <button
                type="button"
                onClick={() => handleRate('good')}
                className="group p-2.5 rounded bg-[#12141c] hover:bg-[#06b6d4]/10 text-left border border-[#2d3246] hover:border-[#06b6d4] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-[#06b6d4]">
                  <span>Good</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1a1d28] text-[#06b6d4] border border-[#06b6d4]/30">
                    3
                  </kbd>
                </div>
                <div className="text-[10px] text-[#94a3b8] group-hover:text-[#f1f5f9] mt-1 font-mono">
                  Standard SM-2 curve
                </div>
              </button>

              {/* Rating 4: Easy (Emerald / Green) */}
              <button
                type="button"
                onClick={() => handleRate('easy')}
                className="group p-2.5 rounded bg-[#12141c] hover:bg-[#10b981]/10 text-left border border-[#2d3246] hover:border-[#10b981] transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-[#10b981]">
                  <span>Easy</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1a1d28] text-[#10b981] border border-[#10b981]/30">
                    4
                  </kbd>
                </div>
                <div className="text-[10px] text-[#94a3b8] group-hover:text-[#f1f5f9] mt-1 font-mono">
                  Higher ease & jump
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

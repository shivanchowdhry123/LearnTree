'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { SyllabusNode, ReviewRating } from '../types/syllabus';

interface ReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dueNodes: SyllabusNode[];
  onRateNode: (nodeId: string, rating: ReviewRating) => void;
  allNodes?: SyllabusNode[];
}

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
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [reviewedSessionCount, setReviewedSessionCount] = useState<number>(0);

  useEffect(() => {
    if (currentIndex >= dueNodes.length) {
      setCurrentIndex(Math.max(0, dueNodes.length - 1));
    }
  }, [dueNodes.length, currentIndex]);

  useEffect(() => {
    if (isOpen) {
      setIsRevealed(false);
      setShowNotes(false);
      setReviewedSessionCount(0);
    }
  }, [isOpen]);

  const currentNode = dueNodes[currentIndex] || null;

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
      setShowNotes(false);
      if (currentIndex >= dueNodes.length - 1) {
        setCurrentIndex(0);
      }
    },
    [currentNode, onRateNode, currentIndex, dueNodes.length]
  );

  useEffect(() => {
    if (!isOpen || !currentNode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [isOpen, currentNode, handleRate, onClose]);

  if (!isOpen) return null;

  const totalInBatch = dueNodes.length;
  const isQueueComplete = totalInBatch === 0 || !currentNode;

  const formattedCardCounter = `Card ${String(currentIndex + 1).padStart(2, '0')} / ${String(
    totalInBatch
  ).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#090a0f]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#141722] border border-[#2a3045] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a3045] bg-[#1b1f2e]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f1f5f9] tracking-tight">
                Active Recall Drill
              </h2>
              <span className="text-[11px] font-mono text-[#94a3b8]">
                SuperMemo-2 Spaced Retrieval
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isQueueComplete && (
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-[#141722] border border-[#2a3045] text-[#10b981] tabular-nums">
                {formattedCardCounter}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#23283b] transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Focused Card Surface */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 bg-[#141722]">
          {isQueueComplete ? (
            /* Queue Cleared State */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shadow-[0_0_24px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#f1f5f9]">
                  Review Queue Cleared!
                </h3>
                <p className="text-xs text-[#94a3b8] max-w-sm font-sans">
                  All active syllabus items are consolidated into memory. Your next review interval has been scheduled.
                </p>
              </div>
              {reviewedSessionCount > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#1b1f2e] border border-[#2a3045] text-xs font-mono text-[#10b981]">
                  <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                  {reviewedSessionCount} concepts consolidated in this session
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-mono font-medium rounded-md bg-[#1b1f2e] hover:bg-[#23283b] text-[#f1f5f9] border border-[#2a3045] transition-colors cursor-pointer"
                >
                  Return to Syllabus Tree
                </button>
              </div>
            </div>
          ) : (
            /* Active Card Surface */
            <div className="space-y-4">
              {/* Topic Breadcrumbs */}
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

              {/* Main Topic Banner */}
              <div className="p-4 rounded-lg bg-[#1b1f2e] border border-[#2a3045] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-[#f1f5f9] leading-snug">
                    {currentNode.title}
                  </h3>
                  {currentNode.url && (
                    <a
                      href={currentNode.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-[#06b6d4]/10 text-[#06b6d4] hover:bg-[#06b6d4]/20 border border-[#06b6d4]/30 transition-colors"
                      title="Open external documentation"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Docs</span>
                    </a>
                  )}
                </div>

                {/* SM-2 Telemetry Parameters */}
                <div className="flex items-center gap-3 pt-2 text-[11px] font-mono text-[#94a3b8] flex-wrap border-t border-[#2a3045]">
                  <span className="flex items-center gap-1 text-[#f59e0b]">
                    <Clock className="w-3 h-3" />
                    Interval: {currentNode.sm2State.interval}d
                  </span>
                  <span>•</span>
                  <span>Reps: {currentNode.sm2State.repetition}</span>
                  <span>•</span>
                  <span>Ease Factor: {currentNode.sm2State.easeFactor.toFixed(2)}</span>
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

              {/* Recall Prompt / Retrieval Area */}
              <div className="p-5 rounded-lg border border-[#2a3045] bg-[#141722] space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8]">
                  <span className="flex items-center gap-1.5 text-[#06b6d4] font-medium">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Recall Prompt
                  </span>
                  <span className="text-[10px] text-[#475569]">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-[#1b1f2e] border border-[#2a3045] text-[#94a3b8]">Space</kbd>
                  </span>
                </div>

                <p className="text-sm text-[#e1e1ed] font-sans leading-relaxed">
                  Can you retrieve and describe the core architecture, operational guarantees, and failure modes of &quot;{currentNode.title}&quot; from pure memory?
                </p>

                {/* Show Answer / Recall Rubric Button */}
                {!isRevealed ? (
                  <button
                    type="button"
                    onClick={() => setIsRevealed(true)}
                    className="w-full py-3 px-4 rounded-md bg-[#1b1f2e] hover:bg-[#23283b] text-xs font-mono font-medium text-[#f1f5f9] border border-[#2a3045] hover:border-[#94a3b8] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-99"
                  >
                    <span>Show Recall Rubric & Evaluation</span>
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#141722] border border-[#2a3045] text-[#94a3b8]">
                      Space
                    </kbd>
                  </button>
                ) : (
                  <div className="pt-3 border-t border-dashed border-[#2a3045] space-y-3 animate-in fade-in duration-150">
                    <div className="text-xs font-mono text-[#10b981] flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        Self-Evaluation Rubric:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNotes((p) => !p)}
                        className="text-[11px] text-[#06b6d4] hover:text-[#4cd7f6] flex items-center gap-1 cursor-pointer"
                      >
                        {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {showNotes ? 'Hide Notes' : 'Expand Notes'}
                      </button>
                    </div>

                    <ul className="text-xs text-[#94a3b8] space-y-1.5 list-disc list-inside">
                      <li>Did you accurately recall the defining mechanic without documentation?</li>
                      <li>Can you explain edge cases, trade-offs, and boundary invariants?</li>
                      <li>How quickly did retrieval happen (instantaneous vs effortful)?</li>
                    </ul>

                    {showNotes && (
                      <div className="p-3 rounded bg-[#1b1f2e] border border-[#2a3045] text-xs text-[#bbcabf] font-mono space-y-1 animate-in fade-in">
                        <div className="text-[10px] uppercase text-[#6366f1] font-bold">Concept Meta Notes</div>
                        <div>Target Depth: {currentNode.depth}</div>
                        <div>Associated Tags: {currentNode.tags?.join(', ') || 'None'}</div>
                        {currentNode.url && <div>Canonical URL: {currentNode.url}</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* High-Contrast Rating Action Bar with Exact Color Tokens */}
        {!isQueueComplete && (
          <div className="p-4 border-t border-[#2a3045] bg-[#1b1f2e]">
            <div className="text-[11px] font-mono text-[#94a3b8] mb-2 flex items-center justify-between">
              <span>Rate Your Retrieval Accuracy (SuperMemo-2)</span>
              <span className="text-[#6366f1]">Keys: 1 · 2 · 3 · 4</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Rating 1: Again (Rose #f43f5e) */}
              <button
                type="button"
                onClick={() => handleRate('again')}
                className="group p-2.5 rounded-md bg-[#141722] hover:bg-[#f43f5e]/15 text-left border border-[#2a3045] hover:border-[#f43f5e] transition-all cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#f43f5e] font-mono">
                  <span>Again</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1b1f2e] text-[#f43f5e] border border-[#f43f5e]/30">
                    1
                  </kbd>
                </div>
                <div className="text-[10px] text-[#94a3b8] group-hover:text-[#f1f5f9] mt-1 font-mono">
                  Lapse · Reset (1d)
                </div>
              </button>

              {/* Rating 2: Hard (Amber #f59e0b) */}
              <button
                type="button"
                onClick={() => handleRate('hard')}
                className="group p-2.5 rounded-md bg-[#141722] hover:bg-[#f59e0b]/15 text-left border border-[#2a3045] hover:border-[#f59e0b] transition-all cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#f59e0b] font-mono">
                  <span>Hard</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1b1f2e] text-[#f59e0b] border border-[#f59e0b]/30">
                    2
                  </kbd>
                </div>
                <div className="text-[10px] text-[#94a3b8] group-hover:text-[#f1f5f9] mt-1 font-mono">
                  Effortful · Small interval
                </div>
              </button>

              {/* Rating 3: Good (Cyan #06b6d4) */}
              <button
                type="button"
                onClick={() => handleRate('good')}
                className="group p-2.5 rounded-md bg-[#141722] hover:bg-[#06b6d4]/15 text-left border border-[#2a3045] hover:border-[#06b6d4] transition-all cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#06b6d4] font-mono">
                  <span>Good</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1b1f2e] text-[#06b6d4] border border-[#06b6d4]/30">
                    3
                  </kbd>
                </div>
                <div className="text-[10px] text-[#94a3b8] group-hover:text-[#f1f5f9] mt-1 font-mono">
                  Correct · Standard jump
                </div>
              </button>

              {/* Rating 4: Easy (Emerald #10b981) */}
              <button
                type="button"
                onClick={() => handleRate('easy')}
                className="group p-2.5 rounded-md bg-[#141722] hover:bg-[#10b981]/15 text-left border border-[#2a3045] hover:border-[#10b981] transition-all cursor-pointer active:scale-98"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#10b981] font-mono">
                  <span>Easy</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#1b1f2e] text-[#10b981] border border-[#10b981]/30">
                    4
                  </kbd>
                </div>
                <div className="text-[10px] text-[#94a3b8] group-hover:text-[#f1f5f9] mt-1 font-mono">
                  Effortless · +0.1 EF
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

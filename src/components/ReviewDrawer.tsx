'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  Check,
  ChevronRight,
  Code2,
  ArrowRight,
  ShieldAlert,
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
  const [sessionSeconds, setSessionSeconds] = useState<number>(142); // simulated timer elapsed
  const [lapsesCount, setLapsesCount] = useState<number>(1);
  const [inFlightCount, setInFlightCount] = useState<number>(2);

  // Timer counter
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (currentIndex >= dueNodes.length) {
      setCurrentIndex(Math.max(0, dueNodes.length - 1));
    }
  }, [dueNodes.length, currentIndex]);

  useEffect(() => {
    if (isOpen) {
      setIsRevealed(false);
    }
  }, [isOpen]);

  const currentNode = dueNodes[currentIndex] || null;

  const breadcrumbs = useMemo(() => {
    if (!currentNode) return [];
    if (allNodes.length > 0) {
      const path = findNodePath(allNodes, currentNode.id);
      if (path.length > 0) return path;
    }
    return currentNode.tags || [];
  }, [currentNode, allNodes]);

  const handleRate = useCallback(
    (rating: ReviewRating) => {
      if (!currentNode) return;
      if (rating === 'again') {
        setLapsesCount((c) => c + 1);
      } else {
        setInFlightCount((c) => Math.max(0, c - 1));
      }
      onRateNode(currentNode.id, rating);
      setIsRevealed(false);
      if (currentIndex >= dueNodes.length - 1) {
        setCurrentIndex(0);
      }
    },
    [currentNode, onRateNode, currentIndex, dueNodes.length]
  );

  // Hotkeys: Space to reveal, 1-4 to rate, Esc to close
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

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${String(s).padStart(2, '0')}s elapsed`;
  };

  const cardCounter = String(currentIndex + 1).padStart(2, '0');
  const batchTotal = String(totalInBatch).padStart(2, '0');

  // Next nodes in batch queue ticker
  const nextNodes = dueNodes.slice(currentIndex + 1, currentIndex + 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#090a0f]/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[92vh] bg-[#0c0e16] border border-[#2d3246] rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col">
        {/* Top Queue Sequence Bar (Screen 3) */}
        <div className="px-5 py-3 border-b border-[#1e2230] bg-[#12141c] flex items-center justify-between text-xs select-none">
          {/* Left: Card Sequence Number */}
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#475569]">
                Queue Sequence
              </div>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-xl font-bold text-[#f1f5f9]">{cardCounter}</span>
                <span className="text-xs text-[#475569]">/ {batchTotal}</span>
              </div>
            </div>

            {/* Segmented Queue Progress Bar */}
            <div className="hidden sm:flex gap-1 w-32 h-1.5">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-xs ${
                    idx <= Math.floor((currentIndex / Math.max(1, totalInBatch)) * 8)
                      ? 'bg-[#06b6d4]'
                      : 'bg-[#1e2230]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right: Metrics & Controls */}
          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="hidden md:flex items-center gap-3 text-[11px]">
              <span className="text-[#94a3b8]">
                QUEUE <strong className="text-[#f43f5e]">{lapsesCount} Lapse</strong>{' '}
                <strong className="text-[#f59e0b]">{inFlightCount} In-Flight</strong>{' '}
                <strong className="text-[#10b981]">11 Stable</strong>
              </span>
              <span>·</span>
              <span className="text-[#94a3b8] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#06b6d4]" />
                {formatTimer(sessionSeconds)}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#475569]">
              <span>Hotkeys:</span>
              <kbd className="px-1 py-0.2 rounded bg-[#181b26] text-[#94a3b8] border border-[#2d3246]">
                Space
              </kbd>
              <span>reveal</span>
              <kbd className="px-1 py-0.2 rounded bg-[#181b26] text-[#94a3b8] border border-[#2d3246]">
                1-4
              </kbd>
              <span>rate</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 text-[#94a3b8] hover:text-[#f1f5f9] px-2 py-1 rounded hover:bg-[#181b26] transition-colors cursor-pointer"
            >
              <span>Exit</span>
              <kbd className="text-[10px] text-[#475569]">Esc</kbd>
            </button>
          </div>
        </div>

        {/* Card Body Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#0c0e16]">
          {isQueueComplete ? (
            /* Queue Cleared Celebration */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shadow-[0_0_24px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#f1f5f9] font-sans">
                  Active Recall Queue Cleared!
                </h3>
                <p className="text-xs text-[#94a3b8] max-w-sm font-sans">
                  All due syllabus items are consolidated. Next intervals calculated via SuperMemo-2 math.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-4 py-2 text-xs font-mono font-bold rounded bg-[#10b981] text-[#090a0f] hover:bg-[#059669] cursor-pointer"
              >
                Return to Curriculum Workbench
              </button>
            </div>
          ) : (
            /* Active Card Recall Surface */
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Breadcrumb & Telemetry Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[#94a3b8] border-b border-[#1e2230] pb-2.5">
                <div className="flex items-center gap-1.5 truncate">
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                      <span className="truncate">{crumb}</span>
                      {idx < breadcrumbs.length - 1 && (
                        <span className="text-[#3c445c]">/</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[#475569] shrink-0">
                  <span className="text-[#f1f5f9] font-semibold">SM-2: Rnd {currentNode.sm2State.repetition + 1}</span>
                  <span>•</span>
                  <span>Interval: {currentNode.sm2State.interval}d</span>
                  <span>•</span>
                  <span>EF: {currentNode.sm2State.easeFactor.toFixed(2)}</span>
                  <span>•</span>
                  <span className="text-[#06b6d4]">Due 2h ago</span>
                </div>
              </div>

              {/* Target Concept Heading */}
              <div>
                <div className="text-[10px] font-mono font-bold text-[#6366f1] tracking-wider uppercase mb-1">
                  Target Concept #N-{currentNode.id.slice(-4)} · Linearizability Primitive
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#f1f5f9] tracking-tight font-sans">
                  {currentNode.title}
                </h2>
              </div>

              {/* Active Recall Challenge Box */}
              <div className="p-4 rounded-lg bg-[#12141c] border border-[#1e2230] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#06b6d4] font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#06b6d4]" />
                  Active Recall Challenge
                </div>
                <p className="text-sm text-[#e1e1ed] font-sans leading-relaxed">
                  How does Google Spanner&apos;s TrueTime API guarantee external consistency (strict serializability) across distributed commit nodes without requiring distributed coordination or locks for read-only multi-version transactions?
                </p>
              </div>

              {/* Show Embedded Notes & Proof Button */}
              {!isRevealed ? (
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() => setIsRevealed(true)}
                    className="w-full py-3.5 px-4 rounded-lg bg-[#181b26] hover:bg-[#202433] border border-[#2d3246] hover:border-[#06b6d4] text-[#f1f5f9] text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                  >
                    <Eye className="w-4 h-4 text-[#06b6d4] group-hover:scale-110 transition-transform" />
                    <span>Show Embedded Notes & Proof</span>
                    <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#12141c] text-[#94a3b8] border border-[#2d3246]">
                      Space
                    </kbd>
                  </button>
                </div>
              ) : (
                /* Revealed Proof & Code Block (Screen 3) */
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-mono border-b border-[#1e2230] pb-2">
                    <span className="flex items-center gap-1.5 text-[#10b981] font-bold">
                      <Check className="w-3.5 h-3.5" />
                      Verified Solution / Syllabus Extract
                    </span>
                    <span className="text-[#475569]">Complexity: Level 3 Concept</span>
                  </div>

                  {/* 2 Invariant Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                    <div className="p-3.5 rounded bg-[#12141c] border border-[#1e2230] space-y-1.5">
                      <div className="text-[11px] font-mono font-bold text-[#06b6d4]">
                        Invariant #01 Bounded Clock Uncertainty (2ε)
                      </div>
                      <p className="text-[#94a3b8] leading-relaxed text-xs">
                        TrueTime exposes <code className="text-[#f1f5f9] font-mono">TT.now()</code>, returning an absolute time range <code className="text-[#f1f5f9] font-mono">[t.earliest, t.latest]</code> where the uncertainty boundary guarantees: <code className="text-[#10b981] font-mono">latest - earliest ≤ 2ε</code> (typically 1ms – 7ms).
                      </p>
                    </div>

                    <div className="p-3.5 rounded bg-[#12141c] border border-[#1e2230] space-y-1.5">
                      <div className="text-[11px] font-mono font-bold text-[#06b6d4]">
                        Invariant #02 The Commit Wait Rule
                      </div>
                      <p className="text-[#94a3b8] leading-relaxed text-xs">
                        The coordinator node assigns an absolute commit timestamp <code className="text-[#f1f5f9] font-mono">s ≥ TT.now().latest</code>. The leader explicitly delays releasing transaction locks until: <code className="text-[#10b981] font-mono">TT.now().earliest &gt; s</code> (guaranteed in past).
                      </p>
                    </div>
                  </div>

                  {/* Rust / Code Snippet */}
                  <div className="rounded-lg bg-[#090a0f] border border-[#1e2230] overflow-hidden">
                    <div className="px-3.5 py-1.5 bg-[#12141c] border-b border-[#1e2230] flex items-center justify-between text-[10px] font-mono text-[#94a3b8]">
                      <span>consensus_invariant_spanner.rs</span>
                      <span className="text-[#10b981]">Verified Mathematical Guarantee</span>
                    </div>
                    <pre className="p-4 text-[11px] font-mono text-[#f1f5f9] leading-relaxed overflow-x-auto">
{`impl TrueTimeCommitEngine {
    // External Consistency Rule: If T2 begins after T1 commits, then s2 > s1.
    pub fn commit_with_wait(&self, txn: &Transaction) -> Timestamp {
        let s = self.tt.now().latest;
        while self.tt.now().earliest <= s {
            std::thread::yield_now(); // Wait out 2ε interval window
        }
        return s; // Safe to release locks and serve concurrent read snapshots
    }
}`}
                    </pre>
                  </div>

                  {/* Source Footer */}
                  <div className="text-[10px] font-mono text-[#475569] flex items-center justify-between">
                    <span>Source Artifact: Spanner: Google&apos;s Globally-Distributed Database (OSDI &apos;12)</span>
                    <span>Section 4.1: TrueTime Architecture</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Spaced Recall Self-Assessment Bar (Screen 3) */}
        {!isQueueComplete && (
          <div className="border-t border-[#1e2230] bg-[#12141c] p-4 select-none">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#94a3b8] mb-2.5">
              <span>Spaced Recall Self-Assessment</span>
              <span className="text-[#6366f1]">Target SM-2 Ease Multiplier</span>
            </div>

            {/* 4 Rating Action Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Rating 1: Again */}
              <button
                type="button"
                onClick={() => handleRate('again')}
                className="p-3 rounded-lg bg-[#0c0e16] hover:bg-[#f43f5e]/15 border border-[#2d3246] hover:border-[#f43f5e] transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#f43f5e] font-mono">
                  <span>Again</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] bg-[#181b26] text-[#f43f5e] border border-[#f43f5e]/30">
                    1
                  </kbd>
                </div>
                <div className="text-sm font-bold font-mono text-[#f1f5f9] mt-1">10 min</div>
                <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">Blackout / Forgot rule</div>
              </button>

              {/* Rating 2: Hard */}
              <button
                type="button"
                onClick={() => handleRate('hard')}
                className="p-3 rounded-lg bg-[#0c0e16] hover:bg-[#f59e0b]/15 border border-[#2d3246] hover:border-[#f59e0b] transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#f59e0b] font-mono">
                  <span>Hard</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] bg-[#181b26] text-[#f59e0b] border border-[#f59e0b]/30">
                    2
                  </kbd>
                </div>
                <div className="text-sm font-bold font-mono text-[#f1f5f9] mt-1">2 days</div>
                <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">Recalled with hesitation</div>
              </button>

              {/* Rating 3: Good */}
              <button
                type="button"
                onClick={() => handleRate('good')}
                className="p-3 rounded-lg bg-[#0c0e16] hover:bg-[#06b6d4]/15 border border-[#2d3246] hover:border-[#06b6d4] transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#06b6d4] font-mono">
                  <span>Good</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] bg-[#181b26] text-[#06b6d4] border border-[#06b6d4]/30">
                    3
                  </kbd>
                </div>
                <div className="text-sm font-bold font-mono text-[#f1f5f9] mt-1">6 days</div>
                <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">Reasonable recall effort</div>
              </button>

              {/* Rating 4: Easy */}
              <button
                type="button"
                onClick={() => handleRate('easy')}
                className="p-3 rounded-lg bg-[#0c0e16] hover:bg-[#10b981]/15 border border-[#2d3246] hover:border-[#10b981] transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#10b981] font-mono">
                  <span>Easy</span>
                  <kbd className="px-1.5 py-0.2 rounded text-[10px] bg-[#181b26] text-[#10b981] border border-[#10b981]/30">
                    4
                  </kbd>
                </div>
                <div className="text-sm font-bold font-mono text-[#f1f5f9] mt-1">14 days</div>
                <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">Instant mental model</div>
              </button>
            </div>

            {/* Next In Batch Queue Ticker (Screen 3 bottom) */}
            <div className="mt-3 pt-2.5 border-t border-[#1e2230] flex items-center justify-between text-[10px] font-mono text-[#475569]">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-[#94a3b8] font-semibold shrink-0">NEXT IN BATCH QUEUE</span>
                <span className="text-[#475569]">({Math.max(0, totalInBatch - currentIndex - 1)} nodes remaining)</span>

                {nextNodes.map((n, idx) => (
                  <span
                    key={n.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0c0e16] border border-[#1e2230] text-[#94a3b8] shrink-0"
                  >
                    <span>{84 + idx} {n.title.slice(0, 24)}</span>
                    <span className="text-[#6366f1]">L{n.depth}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

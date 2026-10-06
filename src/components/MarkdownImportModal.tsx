'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Upload,
  Code2,
  ListTree,
  CheckCircle2,
  FileText,
  Sparkles,
  ExternalLink,
  Layers,
  Terminal,
} from 'lucide-react';
import type { SyllabusNode } from '../types/syllabus';
import { parseSyllabusText, flattenTree } from '../lib/parser';

interface MarkdownImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (nodes: SyllabusNode[]) => void;
  initialText?: string;
}

const DEFAULT_SAMPLE_SYLLABUS = `# Distributed Systems & Consensus
- [x] [CAP Theorem Fundamentals](https://en.wikipedia.org/wiki/CAP_theorem) #sysdesign #basics
  - [x] Consistency Models (Linearizability vs Eventual) #consistency
  - [ ] Availability & Network Partition Tolerances
- Consensus Algorithms #consensus
  - [ ] [Raft Distributed Consensus](https://raft.github.io/) #algorithms
    - Leader Election & Heartbeats
    - Log Replication & Safety Invariants
  - [ ] Paxos Core Mechanics #math
- Storage Engines & Key-Value Stores #storage
  - [x] LSM-Trees & MemTable Flushing #databases
  - [ ] B-Tree Indexing vs Write-Ahead Log (WAL)
- [Event-Driven Streaming Architectures](https://kafka.apache.org/) #streaming
  - Producer Idempotence & Exactly-Once Semantics
  - Consumer Group Rebalances & Partition Assignments`;

export const MarkdownImportModal: React.FC<MarkdownImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  initialText = '',
}) => {
  const [inputText, setInputText] = useState<string>(
    initialText || DEFAULT_SAMPLE_SYLLABUS
  );

  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Real-time AST parsing
  const parsedNodes = useMemo(() => {
    return parseSyllabusText(inputText);
  }, [inputText]);

  const flatNodes = useMemo(() => {
    return flattenTree(parsedNodes);
  }, [parsedNodes]);

  const maxDepth = useMemo(() => {
    if (flatNodes.length === 0) return 0;
    return Math.max(...flatNodes.map((n) => n.depth));
  }, [flatNodes]);

  const completedCount = useMemo(() => {
    return flatNodes.filter((n) => n.status === 'mastered').length;
  }, [flatNodes]);

  const unstartedCount = flatNodes.length - completedCount;

  if (!isOpen) return null;

  const handleImportClick = () => {
    if (parsedNodes.length === 0) return;
    onImport(parsedNodes);
    onClose();
  };

  const handleLoadSample = () => {
    setInputText(DEFAULT_SAMPLE_SYLLABUS);
  };

  const renderASTPreviewItem = (node: SyllabusNode) => {
    return (
      <div key={node.id} className="relative">
        <div
          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[#1b1f2e] text-xs font-mono select-none transition-colors"
          style={{ paddingLeft: `${node.depth * 18 + 8}px` }}
        >
          {/* Depth AST Badge in Indigo */}
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#6366f1]/15 text-[#c0c1ff] border border-[#6366f1]/30 shrink-0">
            L{node.depth}
          </span>

          {/* Status Indicator */}
          <span
            className={`w-2.5 h-2.5 rounded-xs shrink-0 border ${
              node.status === 'mastered'
                ? 'bg-[#10b981] border-[#10b981]'
                : 'bg-[#141722] border-[#2a3045]'
            }`}
          />

          {/* Title */}
          <span
            className={`truncate font-sans text-xs ${
              node.status === 'mastered'
                ? 'text-[#94a3b8] line-through decoration-[#475569]'
                : 'text-[#f1f5f9]'
            }`}
          >
            {node.title}
          </span>

          {node.url && (
            <span className="text-[#06b6d4] inline-flex items-center shrink-0">
              <ExternalLink className="w-2.5 h-2.5" />
            </span>
          )}

          {/* Tags */}
          {node.tags && node.tags.length > 0 && (
            <div className="flex items-center gap-1 shrink-0 ml-auto pl-2">
              {node.tags.map((t) => (
                <span
                  key={t}
                  className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#1b1f2e] text-[#94a3b8] border border-[#2a3045]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {node.children && node.children.length > 0 && (
          <div>{node.children.map((child) => renderASTPreviewItem(child))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#090a0f]/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-5xl h-[85vh] flex flex-col bg-[#141722] border border-[#2a3045] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a3045] bg-[#1b1f2e]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-[#06b6d4]/10 border border-[#06b6d4]/30 flex items-center justify-center text-[#06b6d4]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f1f5f9] tracking-tight">
                Import Syllabus Outline
              </h2>
              <span className="text-[11px] font-mono text-[#94a3b8]">
                Markdown & Tabular Indentation AST Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-mono text-[#06b6d4] hover:text-[#4cd7f6] inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#06b6d4]/10 border border-[#06b6d4]/20 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Load Sample
            </button>
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

        {/* Split-Pane: Editor (Left) & Real-time AST Tree Preview (Right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#2a3045] min-h-0 bg-[#090a0f]">
          {/* Left Pane: Textarea Editor */}
          <div className="flex flex-col h-full bg-[#141722]/60">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a3045] text-[11px] font-mono text-[#94a3b8] bg-[#1b1f2e]/60">
              <span className="flex items-center gap-1.5 text-[#06b6d4]">
                <Code2 className="w-3.5 h-3.5" />
                Raw Indented Text / Markdown
              </span>
              <span>2/4 spaces or tabs · [x] · #tags</span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="- [ ] Topic Title #tag&#10;  - [x] Subtopic [Reference](https://...)&#10;    - Detail item"
              className="flex-1 w-full p-4 bg-[#090a0f] text-[#f1f5f9] font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[#06b6d4] border-0 placeholder-[#475569]"
              spellCheck={false}
              autoFocus
            />
          </div>

          {/* Right Pane: Real-time Live AST Tree Preview */}
          <div className="flex flex-col h-full bg-[#141722]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a3045] text-[11px] font-mono text-[#94a3b8] bg-[#1b1f2e]/60">
              <span className="flex items-center gap-1.5 text-[#10b981]">
                <ListTree className="w-3.5 h-3.5" />
                AST Live Tree Preview
              </span>
              <span className="text-[#10b981] font-semibold">
                {flatNodes.length} parsed · {maxDepth + 1} max depth
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-1 bg-[#141722]">
              {parsedNodes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#94a3b8]">
                  <FileText className="w-8 h-8 text-[#2a3045] mb-2" />
                  <p className="text-xs font-mono">No valid syllabus nodes detected.</p>
                  <p className="text-[11px] text-[#475569] font-mono mt-1">
                    Paste an outline or click &quot;Load Sample&quot; to test.
                  </p>
                </div>
              ) : (
                parsedNodes.map((root) => renderASTPreviewItem(root))
              )}
            </div>

            {/* Node Validation Status Bar */}
            <div className="px-4 py-2 border-t border-[#2a3045] bg-[#1b1f2e] flex items-center justify-between text-[11px] font-mono text-[#94a3b8]">
              <span className="flex items-center gap-1.5 text-[#10b981]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {completedCount} pre-mastered · {unstartedCount} queued
              </span>
              <span className="text-[#c0c1ff]">SuperMemo-2 parameters initialized</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#2a3045] bg-[#1b1f2e]">
          <span className="text-xs text-[#94a3b8] font-mono hidden sm:inline">
            Press Esc to dismiss
          </span>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-mono font-medium rounded-md bg-[#141722] hover:bg-[#23283b] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2a3045] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={parsedNodes.length === 0}
              onClick={handleImportClick}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-semibold rounded-md bg-[#10b981] hover:bg-[#059669] text-[#090a0f] transition-all shadow-[0_0_16px_rgba(16,185,129,0.25)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import {flatNodes.length > 0 ? `(${flatNodes.length} Nodes)` : 'Syllabus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

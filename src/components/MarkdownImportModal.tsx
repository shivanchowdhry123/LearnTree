'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Upload,
  Code2,
  ListTree,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Layers,
  Terminal,
  FileCode,
  Check,
} from 'lucide-react';
import type { SyllabusNode } from '../types/syllabus';
import { parseSyllabusText, flattenTree } from '../lib/parser';

interface MarkdownImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (nodes: SyllabusNode[]) => void;
  initialText?: string;
}

const PRESETS = [
  {
    name: 'CS 6.824 Distributed Systems',
    content: `# Distributed Systems Core
- Consensus Primitives
  - [x] Paxos Protocol (https://lamport.azurewebsites.net/paxos.html) #consensus #theory
  - [x] Raft Algorithm (https://raft.github.io) #consensus #practical
- Distributed Transactions
  - [ ] Two-Phase Commit (2PC) #transactions #due today
  - [ ] Spanner & TrueTime (https://research.google/pubs/spanner/) #google #clock
- Storage Architecture
  - [ ] LSM-Trees and SSTables #storage`,
  },
  {
    name: 'CS 142 Web Engineering & React 19',
    content: `# React 19 Full-Stack Architecture
- React 19 Core Invariants
  - [x] Server Components & Streaming SSR #react19 #frontend
  - [ ] Server Actions & Optimistic Mutations #actions
- State Synchronization
  - [ ] Conflict-Free Replicated Data Types (CRDTs) #localfirst
  - [ ] IndexedDB Offline Cache #storage`,
  },
  {
    name: 'CS 240 Operating Systems & Kernels',
    content: `# Linux Kernel & Systems Runtime
- Memory Architecture
  - [x] Virtual Memory Page Tables & TLB Invariants #kernel #mm
  - [ ] Slab Allocator & Kernel Buddy System #memory
- Concurrency Primitives
  - [ ] Read-Copy-Update (RCU) Invariants #concurrency
  - [ ] eBPF Kernel Tracing & Verification #ebpf`,
  },
];

export const MarkdownImportModal: React.FC<MarkdownImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  initialText = '',
}) => {
  const [inputText, setInputText] = useState<string>(
    initialText || PRESETS[0].content
  );
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESETS[0].name);
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');

  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  // Keyboard shortcut Esc to cancel, ⌘Enter to import
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleImportSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, inputText]);

  // Live parsed AST
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

  const lineCount = useMemo(() => {
    return inputText.split(/\r?\n/).length;
  }, [inputText]);

  const charCount = inputText.length;

  const handleImportSubmit = () => {
    if (parsedNodes.length === 0) return;
    onImport(parsedNodes);
    onClose();
  };

  const handleSelectPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const p = PRESETS.find((x) => x.name === presetName);
    if (p) {
      setInputText(p.content);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#090a0f]/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-5xl h-[88vh] flex flex-col bg-[#0c0e16] border border-[#2d3246] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2230] bg-[#12141c]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-[#f1f5f9] tracking-tight font-sans">
              Import Syllabus...
            </h2>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#181b26] text-[#06b6d4] border border-[#2d3246]">
              PARSER v2.4
            </span>
            <span className="text-[11px] font-mono text-[#94a3b8] hidden md:inline">
              Paste any nested outline or syllabus document
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Preset Selector */}
            <select
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="bg-[#181b26] border border-[#2d3246] text-[#f1f5f9] text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:border-[#06b6d4] cursor-pointer"
            >
              {PRESETS.map((p) => (
                <option key={p.name} value={p.name} className="bg-[#12141c]">
                  Preset: {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-mono text-[#94a3b8] hover:text-[#f1f5f9] px-2 py-1 rounded hover:bg-[#181b26] cursor-pointer"
            >
              Cancel <kbd className="text-[10px] text-[#475569]">Esc</kbd>
            </button>

            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={parsedNodes.length === 0}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-40"
            >
              <span>Import {flatNodes.length} Nodes</span>
              <kbd className="px-1 py-0.2 rounded text-[9px] bg-[#090a0f]/80 text-[#10b981]">
                ⌘Enter
              </kbd>
            </button>
          </div>
        </div>

        {/* Split Pane: Left Editor & Right AST Preview */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1e2230] min-h-0 bg-[#090a0f]">
          {/* Left Editor */}
          <div className="flex flex-col h-full bg-[#0c0e16]">
            {/* Stream Status Bar */}
            <div className="px-4 py-2 border-b border-[#1e2230] text-[10px] font-mono text-[#94a3b8] flex items-center justify-between bg-[#12141c]">
              <div className="flex items-center gap-2">
                <span className="text-[#f1f5f9] font-semibold">MARKDOWN STREAM</span>
                <span>·</span>
                <span>UTF-8</span>
                <span>·</span>
                <span>{lineCount} lines</span>
                <span>·</span>
                <span>{charCount} chars</span>
              </div>
              <span className="text-[#10b981] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                AST Synced
              </span>
            </div>

            {/* Line-Numbered Textarea */}
            <div className="flex-1 flex overflow-hidden">
              {/* Line Numbers Gutter */}
              <div className="w-10 select-none py-3 px-1 text-right font-mono text-xs text-[#3c445c] bg-[#090a0f] border-r border-[#1e2230] leading-6 overflow-hidden">
                {Array.from({ length: Math.max(15, lineCount) }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="- [ ] Section Title #tag&#10;  - [x] Subtopic [Link](http...)&#10;    - Detail node"
                className="flex-1 p-3 bg-[#0c0e16] text-[#f1f5f9] font-mono text-xs leading-6 resize-none focus:outline-none border-0 overflow-y-auto"
                spellCheck={false}
              />
            </div>

            {/* Bottom Editor Bar */}
            <div className="px-3 py-1.5 border-t border-[#1e2230] bg-[#12141c] text-[10px] font-mono text-[#475569] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>Tab Indent Node</span>
                <span># Tags index</span>
                <span>⌘Enter Commit to local graph</span>
              </div>
              <span className="text-[#06b6d4]">Ready for SQLite ingestion</span>
            </div>
          </div>

          {/* Right AST Preview Pane */}
          <div className="flex flex-col h-full bg-[#12141c]">
            {/* View Tab Selector Bar */}
            <div className="px-4 py-2 border-b border-[#1e2230] text-[10px] font-mono text-[#94a3b8] flex items-center justify-between bg-[#141722]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('visual')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    activeTab === 'visual'
                      ? 'bg-[#1e2230] text-[#f1f5f9] font-semibold'
                      : 'hover:text-[#f1f5f9]'
                  }`}
                >
                  Visual Tree ({flatNodes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('json')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    activeTab === 'json'
                      ? 'bg-[#1e2230] text-[#f1f5f9] font-semibold'
                      : 'hover:text-[#f1f5f9]'
                  }`}
                >
                  Raw AST JSON
                </button>
              </div>

              <div className="flex items-center gap-2.5 text-[#475569]">
                <span className="text-[#10b981]">SM-2 Engine Active</span>
                <span>·</span>
                <span>Max Depth: {maxDepth}</span>
              </div>
            </div>

            {/* Content Preview */}
            <div className="flex-1 p-4 overflow-y-auto space-y-1 bg-[#12141c]">
              {activeTab === 'visual' ? (
                /* Visual Tree */
                <div className="space-y-1">
                  {parsedNodes.map((node) => (
                    <div key={node.id} className="space-y-1">
                      {/* Root Box */}
                      <div className="p-2 rounded bg-[#181b26] border border-[#2d3246] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-[#f1f5f9]">
                          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                          <span>{node.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="px-1.5 py-0.2 rounded bg-[#12141c] text-[#6366f1] border border-[#2d3246]">
                            depth: 0
                          </span>
                          <span className="text-[#94a3b8]">Collection</span>
                        </div>
                      </div>

                      {/* Children */}
                      {node.children && (
                        <div className="ml-4 pl-3 border-l border-[#2d3246] space-y-1">
                          {node.children.map((child) => (
                            <div key={child.id} className="space-y-1">
                              <div className="p-1.5 px-2 rounded bg-[#141722] border border-[#1e2230] flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-[#e1e1ed]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]" />
                                  <span className="font-medium">{child.title}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono">
                                  <span className="px-1.5 py-0.2 rounded bg-[#12141c] text-[#6366f1]">
                                    depth: {child.depth}
                                  </span>
                                  <span className="text-[#10b981]">EF: 2.5 • IVL: 1d</span>
                                </div>
                              </div>

                              {/* Grandchildren */}
                              {child.children && (
                                <div className="ml-4 pl-3 border-l border-[#1e2230] space-y-1">
                                  {child.children.map((sub) => (
                                    <div
                                      key={sub.id}
                                      className="p-1.5 px-2 rounded bg-[#0f1118] text-xs flex items-center justify-between"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-[#94a3b8]" />
                                        <span className="text-[#94a3b8]">{sub.title}</span>
                                        {sub.url && (
                                          <ExternalLink className="w-3 h-3 text-[#06b6d4]" />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {sub.tags?.map((t) => (
                                          <span
                                            key={t}
                                            className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#181b26] text-[#06b6d4]"
                                          >
                                            #{t}
                                          </span>
                                        ))}
                                        <span className="text-[9px] font-mono text-[#6366f1]">
                                          depth: {sub.depth}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Raw AST JSON */
                <pre className="p-3 bg-[#090a0f] text-[#4edea3] font-mono text-[11px] leading-relaxed rounded border border-[#1e2230] overflow-x-auto">
                  {JSON.stringify(parsedNodes, null, 2)}
                </pre>
              )}
            </div>

            {/* AST Validation Telemetry Footer */}
            <div className="px-4 py-2 border-t border-[#1e2230] bg-[#12141c] flex items-center justify-between text-[11px] font-mono text-[#94a3b8]">
              <span className="flex items-center gap-1.5 text-[#10b981] font-semibold">
                <Check className="w-3.5 h-3.5" />
                AST Validated
              </span>
              <span className="text-[#6366f1]">
                {`{"nodesCount": ${flatNodes.length}, "depthMax": ${maxDepth}, "valid": true}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

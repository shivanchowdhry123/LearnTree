'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  FileText,
  HelpCircle,
  Copy,
  Check,
  FolderGit2,
  Brain,
  Layers,
  ArrowRight,
  Code,
} from 'lucide-react';

interface EmptyWorkspaceProps {
  userName: string;
  onOpenCreateRepo: () => void;
  onOpenImport: () => void;
  onOpenWalkthrough: () => void;
  onImportExample?: (name: string, code: string, markdown: string) => void;
}

const SAMPLE_MARKDOWN = `# Distributed Systems & Concurrency
- [ ] Unit 1: Foundations & Time Models #fundamentals
  - [ ] Physical Clocks vs Lamport Logical Clocks
  - [ ] Vector Clocks & Causal Invariants
  - [ ] State Machine Replication Principles
- [ ] Unit 2: Consensus Protocols #consensus
  - [ ] Paxos Single-Decree Invariants
  - [ ] Raft Leader Election & Log Matching
  - [ ] Byzantine Fault Tolerance (PBFT)`;

export const EmptyWorkspace: React.FC<EmptyWorkspaceProps> = ({
  userName,
  onOpenCreateRepo,
  onOpenImport,
  onOpenWalkthrough,
  onImportExample,
}) => {
  const [copied, setCopied] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SAMPLE_MARKDOWN);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#10131e] border border-[#23283c] relative overflow-hidden shadow-xl">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#10b981]/10 via-[#6366f1]/10 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181b28] border border-[#2d3246] text-xs font-mono text-[#10b981]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clean Slate Workspace · Starting from 0</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-[#f1f5f9]">
              Welcome to Syllabex, <span className="text-[#10b981]">{userName}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed max-w-xl">
              Your account starts completely fresh with zero pre-defined courses or half-completed
              syllabi. Add the real subjects, papers, and roadmaps you want to master.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Create Blank */}
            <button
              type="button"
              onClick={onOpenCreateRepo}
              className="p-4 rounded-xl bg-[#141724] hover:bg-[#1a1e30] border border-[#2d3246] hover:border-[#10b981] text-left transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 text-[#10b981] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="font-mono font-bold text-xs text-[#f1f5f9] group-hover:text-[#10b981] transition-colors">
                  Create First Syllabus
                </h4>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                  Start blank and design your curriculum units and topics interactively.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1.5 text-[11px] font-mono text-[#10b981] font-semibold">
                <span>New Syllabus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Import Markdown */}
            <button
              type="button"
              onClick={onOpenImport}
              className="p-4 rounded-xl bg-[#141724] hover:bg-[#1a1e30] border border-[#2d3246] hover:border-[#6366f1] text-left transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#6366f1]/15 text-[#6366f1] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="font-mono font-bold text-xs text-[#f1f5f9] group-hover:text-[#6366f1] transition-colors">
                  Import from Markdown
                </h4>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                  Paste any indented markdown syllabus or GitHub README checklist.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1.5 text-[11px] font-mono text-[#6366f1] font-semibold">
                <span>Import File</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Walkthrough */}
            <button
              type="button"
              onClick={onOpenWalkthrough}
              className="p-4 rounded-xl bg-[#141724] hover:bg-[#1a1e30] border border-[#2d3246] hover:border-[#38bdf8] text-left transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 text-[#38bdf8] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h4 className="font-mono font-bold text-xs text-[#f1f5f9] group-hover:text-[#38bdf8] transition-colors">
                  Interactive Tour
                </h4>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                  Review how hierarchical trees, SM-2 recall, and streak metrics operate.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1.5 text-[11px] font-mono text-[#38bdf8] font-semibold">
                <span>View Walkthrough</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Markdown Format Guide & Starter Outline */}
      <div className="rounded-xl bg-[#0e1017] border border-[#1e2230] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-[#06b6d4]" />
            <h3 className="font-mono font-semibold text-xs text-[#f1f5f9]">
              Standard Markdown Syllabus Format
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowExample((prev) => !prev)}
            className="text-xs font-mono text-[#6366f1] hover:text-[#818cf8] cursor-pointer"
          >
            {showExample ? 'Hide Outline Example ▲' : 'Show Outline Example ▼'}
          </button>
        </div>

        <p className="text-xs text-[#94a3b8]">
          Syllabex automatically parses any hierarchical markdown outline with bullet points (`- [ ]`)
          or headings (`#`, `##`, `###`). Tags prefixed with `#tag` are indexed for quick filtering.
        </p>

        {showExample && (
          <div className="space-y-3 pt-2 animate-in fade-in">
            <div className="relative rounded-lg bg-[#08090e] border border-[#23283c] p-3.5 font-mono text-xs text-[#cbd5e1] overflow-x-auto">
              <pre className="whitespace-pre">{SAMPLE_MARKDOWN}</pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-[#181b28] hover:bg-[#23283c] border border-[#2d3246] text-[11px] font-mono text-[#94a3b8] hover:text-[#f1f5f9] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10b981]" />
                    <span className="text-[#10b981]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>
            </div>

            {onImportExample && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    onImportExample(
                      'Distributed Systems & Concurrency',
                      'SYS-101',
                      SAMPLE_MARKDOWN
                    )
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#090a0f] font-mono font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import This Example Outline</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

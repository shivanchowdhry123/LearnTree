'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Brain,
  Rocket,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  BookOpen,
  Plus,
  FileText,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateRepo?: () => void;
  onOpenImport?: () => void;
  userId?: string;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateRepo,
  onOpenImport,
  userId,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const handleFinish = (action?: 'create' | 'import') => {
    if (userId && typeof window !== 'undefined') {
      try {
        if (dontShowAgain) {
          localStorage.setItem(`syllabex_walkthrough_seen_${userId}`, 'true');
        }
      } catch {
        // ignore
      }
    }
    onClose();
    if (action === 'create' && onOpenCreateRepo) {
      onOpenCreateRepo();
    } else if (action === 'import' && onOpenImport) {
      onOpenImport();
    }
  };

  const steps = [
    {
      badge: 'CLEAN SLATE · TRUE ZERO',
      title: 'Welcome to Syllabex',
      subtitle: 'Starting completely from 0: No fake progress or pre-filled clutter.',
      icon: <Sparkles className="w-6 h-6 text-[#10b981]" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-[#cbd5e1] leading-relaxed">
            In Syllabex, your account begins as a clean slate. We don't pre-populate half-completed
            syllabi or artificial review queues. Every percentage of progress and every streak day is
            100% earned by you.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-lg bg-[#141724] border border-[#23283c] flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-[#10b981] uppercase tracking-wider">
                0% Starting Progress
              </span>
              <p className="text-[11px] text-[#94a3b8] mt-1">
                Your metrics reflect genuine learning rather than dummy placeholder data.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#141724] border border-[#23283c] flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-[#6366f1] uppercase tracking-wider">
                Cloud Sync
              </span>
              <p className="text-[11px] text-[#94a3b8] mt-1">
                All changes sync automatically across your devices with revision tracking.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#141724] border border-[#23283c] flex flex-col justify-between">
              <span className="text-[10px] font-mono font-bold text-[#06b6d4] uppercase tracking-wider">
                Multi-Curricula
              </span>
              <p className="text-[11px] text-[#94a3b8] mt-1">
                Manage separate syllabi like files in Google Drive for each course or exam.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: 'CURRICULA ARCHITECTURE',
      title: 'Hierarchical Knowledge Trees',
      subtitle: 'Break complex subjects down into structured, digestible concept nodes.',
      icon: <Layers className="w-6 h-6 text-[#6366f1]" />,
      content: (
        <div className="space-y-4">
          <p className="text-xs text-[#cbd5e1] leading-relaxed">
            Instead of flat to-do lists, Syllabex models technical knowledge as deep hierarchical trees.
            Units contain chapters, chapters contain topics, and topics contain granular concepts.
          </p>

          <div className="p-3.5 rounded-lg bg-[#0a0c13] border border-[#23283c] font-mono text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#38bdf8] font-bold">
              <span>📁 Distributed Systems & Concurrency</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/30">Level 0</span>
            </div>
            <div className="pl-4 border-l border-[#1e2230] space-y-1.5 text-[#cbd5e1]">
              <div className="flex items-center gap-2">
                <span className="text-[#94a3b8]">├── 📂 Unit 1: Consensus Protocols</span>
                <span className="text-[9px] text-[#94a3b8]">Level 1</span>
              </div>
              <div className="pl-6 border-l border-[#1e2230] space-y-1 text-[#94a3b8]">
                <div className="flex items-center gap-2">
                  <span className="text-white">├── 📄 Raft Leader Election</span>
                  <span className="text-[9px] text-[#06b6d4] bg-[#06b6d4]/10 px-1 rounded">#raft</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white">└── 📄 Multi-Paxos Invariants</span>
                  <span className="text-[9px] text-[#6366f1] bg-[#6366f1]/10 px-1 rounded">#paxos</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#94a3b8]">
            Switch between the tabular curriculum view and the interactive D3 visual dependency tree graph anytime!
          </p>
        </div>
      ),
    },
    {
      badge: 'SCIENTIFIC RETENTION',
      title: 'SuperMemo SM-2 Active Recall',
      subtitle: 'Optimally spaced review sessions prevent the Ebbinghaus forgetting curve.',
      icon: <Brain className="w-6 h-6 text-[#ec4899]" />,
      content: (
        <div className="space-y-3.5">
          <p className="text-xs text-[#cbd5e1] leading-relaxed">
            When you complete a topic, Syllabex schedules daily reviews using the proven SuperMemo SM-2
            algorithm. Rate your honest recall quality each time you review:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
            <div className="p-2 rounded bg-[#141724] border border-[#f43f5e]/30 text-xs font-mono">
              <span className="text-[#f43f5e] font-bold">0 · Blackout</span>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">Complete memory lapse. Resets interval.</p>
            </div>
            <div className="p-2 rounded bg-[#141724] border border-[#f97316]/30 text-xs font-mono">
              <span className="text-[#f97316] font-bold">1-2 · Incorrect</span>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">Remembered partially upon seeing answer.</p>
            </div>
            <div className="p-2 rounded bg-[#141724] border border-[#eab308]/30 text-xs font-mono">
              <span className="text-[#eab308] font-bold">3 · Hard</span>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">Recalled with significant effort.</p>
            </div>
            <div className="p-2 rounded bg-[#141724] border border-[#10b981]/30 text-xs font-mono">
              <span className="text-[#10b981] font-bold">4 · Good</span>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">Correct recall with slight hesitation.</p>
            </div>
            <div className="p-2 rounded bg-[#141724] border border-[#06b6d4]/30 text-xs font-mono">
              <span className="text-[#06b6d4] font-bold">5 · Effortless</span>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">Perfect instant recall. Maximum interval.</p>
            </div>
            <div className="p-2 rounded bg-[#141724] border border-[#8b5cf6]/30 text-xs font-mono">
              <span className="text-[#8b5cf6] font-bold">Daily Streak</span>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">Track your consecutive days of active study.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: 'READY TO BUILD',
      title: 'Create or Import Your First Syllabus',
      subtitle: 'Your workspace is ready. Choose how you want to add your first syllabus:',
      icon: <Rocket className="w-6 h-6 text-[#06b6d4]" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Blank Option */}
            <button
              type="button"
              onClick={() => handleFinish('create')}
              className="p-4 rounded-xl bg-[#141724] hover:bg-[#1a1e30] border border-[#2d3246] hover:border-[#10b981] text-left transition-all cursor-pointer group space-y-2 shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 text-[#10b981] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <h4 className="font-mono font-bold text-xs text-[#f1f5f9] group-hover:text-[#10b981] transition-colors">
                Create Blank Syllabus
              </h4>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                Start from scratch with a custom title (e.g. Distributed Systems, Biology 101) and add units interactively.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-[11px] font-mono text-[#10b981] font-semibold">
                <span>Start Blank</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Import Markdown Option */}
            <button
              type="button"
              onClick={() => handleFinish('import')}
              className="p-4 rounded-xl bg-[#141724] hover:bg-[#1a1e30] border border-[#2d3246] hover:border-[#6366f1] text-left transition-all cursor-pointer group space-y-2 shadow-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-[#6366f1]/15 text-[#6366f1] flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-mono font-bold text-xs text-[#f1f5f9] group-hover:text-[#6366f1] transition-colors">
                Import from Markdown
              </h4>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                Paste an existing syllabus, GitHub README checklist, or markdown course notes to parse immediately.
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-[11px] font-mono text-[#6366f1] font-semibold">
                <span>Open Importer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-[#0c0e15] border border-[#1e2230] text-[11px] text-[#94a3b8] font-mono flex items-center justify-between">
            <span>You can also explore the empty workspace first.</span>
            <button
              type="button"
              onClick={() => handleFinish()}
              className="text-[#38bdf8] hover:underline cursor-pointer"
            >
              Skip to Workspace →
            </button>
          </div>
        </div>
      ),
    },
  ];

  const activeStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#0e1017] border border-[#23283c] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e2230] bg-[#12141e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#181b28] border border-[#2d3246] flex items-center justify-center shadow-inner">
              {activeStepData.icon}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#6366f1] uppercase">
                {activeStepData.badge}
              </span>
              <h3 className="font-mono font-bold text-base text-[#f1f5f9]">
                {activeStepData.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleFinish()}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#181b28] transition-colors cursor-pointer"
            title="Close walkthrough"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <h4 className="text-xs font-mono font-semibold text-[#38bdf8]">
            {activeStepData.subtitle}
          </h4>
          {activeStepData.content}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#1e2230] bg-[#10121b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Stepper Dots & Checkbox */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? 'w-6 bg-[#6366f1]'
                      : 'w-2 bg-[#2d3246] hover:bg-[#475569]'
                  }`}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748b] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-[#2d3246] bg-[#0c0e15] text-[#6366f1] focus:ring-0 w-3 h-3 cursor-pointer"
              />
              <span>Don't show again</span>
            </label>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-[#2d3246] hover:bg-[#181b28] text-xs font-mono text-[#94a3b8] hover:text-[#f1f5f9] transition-colors cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="px-4 py-1.5 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] text-xs font-mono font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish()}
                className="px-4 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-xs font-mono font-bold text-[#090a0f] transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span>Get Started</span>
                <Rocket className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

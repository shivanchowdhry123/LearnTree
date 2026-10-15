'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Globe,
  Lock,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Eye,
  Sparkles,
} from 'lucide-react';
import type { SyllabusRepo } from '../types/repo';
import { sanitizeRepoForPublicShare, generateShareSlug } from '../lib/shareSanitizer';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: SyllabusRepo | null;
  onUpdateRepo: (updatedRepo: SyllabusRepo) => void;
  onPreviewPublicShare?: (shareSlug: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  repo,
  onUpdateRepo,
  onPreviewPublicShare,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isOpen || !repo) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://syllabex.dev';
  const shareSlug = repo.shareSlug || generateShareSlug(repo.name);
  const shareUrl = `${origin}?share=${shareSlug}`;

  const handleTogglePublic = async () => {
    setIsPublishing(true);
    try {
      if (repo.isPublic) {
        // Toggle off
        const updated: SyllabusRepo = {
          ...repo,
          isPublic: false,
          updatedAt: new Date().toISOString(),
        };
        onUpdateRepo(updated);
      } else {
        // Toggle on with client-side sanitization
        const sanitizedData = sanitizeRepoForPublicShare(repo);
        const updated: SyllabusRepo = {
          ...repo,
          ...sanitizedData,
          isPublic: true,
          updatedAt: new Date().toISOString(),
        };
        onUpdateRepo(updated);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-xl bg-[#12141d] border border-[#232738] shadow-[0_24px_50px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2230] bg-[#161925]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/20 border border-[#06b6d4]/30 flex items-center justify-center text-[#06b6d4]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f1f5f9] tracking-tight">
                Share Syllabus: {repo.name}
              </h2>
              <p className="text-[11px] text-[#94a3b8] font-mono">
                Public read-only link &amp; cloneable curriculum
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#202433] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Public Toggle Card */}
          <div className="p-4 rounded-xl bg-[#0c0e15] border border-[#1e2230] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  repo.isPublic
                    ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30'
                    : 'bg-[#1e2230] text-[#94a3b8]'
                }`}
              >
                {repo.isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xs font-semibold text-[#f1f5f9] flex items-center gap-2">
                  <span>{repo.isPublic ? 'Publicly Accessible' : 'Private to Your Account'}</span>
                  {repo.isPublic && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40">
                      LIVE LINK
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">
                  {repo.isPublic
                    ? 'Anyone with the link can view and fork this syllabus into their account.'
                    : 'Only you can view and edit this syllabus while signed in.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isPublishing}
              onClick={handleTogglePublic}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                repo.isPublic ? 'bg-[#10b981]' : 'bg-[#2d3246]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  repo.isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Share Link Row (If Public) */}
          {repo.isPublic && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94a3b8]">
                Shareable Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 bg-[#0c0e15] border border-[#2d3246] rounded-lg text-xs text-[#06b6d4] font-mono truncate focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-lg bg-[#181b27] hover:bg-[#202434] border border-[#2d3246] hover:border-[#06b6d4] text-xs font-mono font-medium text-[#f1f5f9] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                      <span className="text-[#10b981]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#94a3b8]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                {onPreviewPublicShare && (
                  <button
                    type="button"
                    onClick={() => onPreviewPublicShare(shareSlug)}
                    className="p-2 rounded-lg bg-[#181b27] hover:bg-[#202434] border border-[#2d3246] hover:border-[#10b981] text-[#94a3b8] hover:text-[#f1f5f9] transition-colors cursor-pointer shrink-0"
                    title="Preview Public View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Privacy & Sanitization Assurance */}
          <div className="p-3.5 rounded-lg bg-[#0c0e15] border border-[#1e2230] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f1f5f9]">
              <ShieldCheck className="w-4 h-4 text-[#10b981]" />
              <span>Automated Client-Side Sanitization Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
              <div className="p-2 rounded bg-[#131620] border border-[#1e2230]">
                <div className="font-medium text-[#10b981] mb-1">✓ What is Shared</div>
                <ul className="text-[#94a3b8] space-y-0.5 list-disc list-inside">
                  <li>Syllabus topic hierarchy</li>
                  <li>Concept titles &amp; URLs</li>
                  <li>Public subject tags</li>
                </ul>
              </div>
              <div className="p-2 rounded bg-[#131620] border border-[#1e2230]">
                <div className="font-medium text-[#ef4444] mb-1">✗ What is Scrubbed</div>
                <ul className="text-[#94a3b8] space-y-0.5 list-disc list-inside">
                  <li>Personal card ratings &amp; SM-2 dates</li>
                  <li>Private learner notes</li>
                  <li>Account identity &amp; session tokens</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[#1e2230] bg-[#161925]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#1e2230] hover:bg-[#282d3f] text-xs font-mono text-[#f1f5f9] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

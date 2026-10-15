'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Tag, Link as LinkIcon, Check, FolderTree } from 'lucide-react';
import type { SyllabusNode, SyllabusNodeStatus } from '../types/syllabus';
import { createInitialSM2State } from '../lib/sm2';

interface NodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNode: (nodeData: {
    id?: string;
    parentId?: string | null;
    title: string;
    url?: string;
    tags: string[];
    status: SyllabusNodeStatus;
  }) => void;
  onDeleteNode?: (nodeId: string) => void;
  editingNode?: SyllabusNode | null;
  allNodes: SyllabusNode[];
  defaultParentId?: string | null;
}

export const NodeModal: React.FC<NodeModalProps> = ({
  isOpen,
  onClose,
  onSaveNode,
  onDeleteNode,
  editingNode,
  allNodes,
  defaultParentId = null,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<SyllabusNodeStatus>('unstarted');
  const [parentId, setParentId] = useState<string | null>(defaultParentId);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
    if (editingNode) {
      setTitle(editingNode.title);
      setUrl(editingNode.url || '');
      setTagsInput(editingNode.tags?.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ') || '');
      setStatus(editingNode.status);
      setParentId(defaultParentId);
    } else {
      setTitle('');
      setUrl('');
      setTagsInput('');
      setStatus('unstarted');
      setParentId(defaultParentId);
    }
  }, [editingNode, defaultParentId, isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Parse tags: split by spaces or commas, strip #
    const tags = tagsInput
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, '').trim().toLowerCase())
      .filter(Boolean);

    onSaveNode({
      id: editingNode?.id,
      parentId,
      title: title.trim(),
      url: url.trim() || undefined,
      tags,
      status,
    });
    onClose();
  };

  const isEditing = Boolean(editingNode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090a0f]/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-[#12141c] border border-[#2d3246] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2230] bg-[#181b26]">
          <div className="flex items-center gap-2.5">
            {isEditing ? (
              <Edit2 className="w-4 h-4 text-[#06b6d4]" />
            ) : (
              <Plus className="w-4 h-4 text-[#10b981]" />
            )}
            <h2 className="text-sm font-bold text-[#f1f5f9] tracking-tight">
              {isEditing ? 'Edit Concept Node' : 'Add Syllabus Concept'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#202433] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-[#12141c]">
          {/* Title Input */}
          <div className="space-y-1">
            <label className="block text-xs font-mono text-[#94a3b8] font-medium">
              Concept / Section Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Raft Leader Election & Heartbeats"
              className="w-full px-3 py-2 text-xs bg-[#181b26] border border-[#2d3246] focus:border-[#06b6d4] focus:outline-none rounded-md text-[#f1f5f9] font-sans"
              autoFocus
            />
          </div>

          {/* Parent Node Selection (if creating) */}
          {!isEditing && (
            <div className="space-y-1">
              <label className="block text-xs font-mono text-[#94a3b8] font-medium">
                Parent Cluster / Hierarchy Position
              </label>
              <select
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#181b26] border border-[#2d3246] focus:border-[#06b6d4] focus:outline-none rounded-md text-[#f1f5f9] font-mono cursor-pointer"
              >
                <option value="">(Root Level Cluster - Level 0)</option>
                {allNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    ↳ Under: {n.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reference URL */}
          <div className="space-y-1">
            <label className="block text-xs font-mono text-[#94a3b8] font-medium flex items-center gap-1.5">
              <LinkIcon className="w-3 h-3 text-[#06b6d4]" />
              Primary Source / Documentation URL (Optional)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://raft.github.io"
              className="w-full px-3 py-1.5 text-xs bg-[#181b26] border border-[#2d3246] focus:border-[#06b6d4] focus:outline-none rounded-md text-[#f1f5f9] font-mono"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="block text-xs font-mono text-[#94a3b8] font-medium flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-[#6366f1]" />
              Tags (Separated by space or comma)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#consensus #algorithms #theory"
              className="w-full px-3 py-1.5 text-xs bg-[#181b26] border border-[#2d3246] focus:border-[#06b6d4] focus:outline-none rounded-md text-[#f1f5f9] font-mono"
            />
          </div>

          {/* Initial Status */}
          <div className="space-y-1">
            <label className="block text-xs font-mono text-[#94a3b8] font-medium">
              Initial Recall Status
            </label>
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setStatus('unstarted')}
                className={`py-1.5 px-2 text-xs font-mono rounded border transition-colors cursor-pointer ${
                  status === 'unstarted'
                    ? 'bg-[#181b26] text-[#f1f5f9] border-[#94a3b8] font-semibold'
                    : 'bg-[#12141c] text-[#475569] border-[#2d3246] hover:text-[#94a3b8]'
                }`}
              >
                Unstarted
              </button>
              <button
                type="button"
                onClick={() => setStatus('in_progress')}
                className={`py-1.5 px-2 text-xs font-mono rounded border transition-colors cursor-pointer ${
                  status === 'in_progress'
                    ? 'bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4] font-semibold'
                    : 'bg-[#12141c] text-[#475569] border-[#2d3246] hover:text-[#06b6d4]'
                }`}
              >
                In Progress
              </button>
              <button
                type="button"
                onClick={() => setStatus('mastered')}
                className={`py-1.5 px-2 text-xs font-mono rounded border transition-colors cursor-pointer ${
                  status === 'mastered'
                    ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981] font-semibold'
                    : 'bg-[#12141c] text-[#475569] border-[#2d3246] hover:text-[#10b981]'
                }`}
              >
                Mastered
              </button>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="pt-3 border-t border-[#1e2230] flex items-center justify-between gap-2">
            {isEditing && onDeleteNode && editingNode ? (
              !isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#f43f5e] hover:bg-[#f43f5e]/15 border border-[#f43f5e]/30 rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteNode(editingNode.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold bg-[#f43f5e] text-[#090a0f] hover:bg-[#e11d48] rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-mono rounded-md bg-[#181b26] hover:bg-[#202433] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2d3246] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-bold rounded-md bg-[#10b981] hover:bg-[#059669] text-[#090a0f] transition-all cursor-pointer shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Save Changes' : 'Create Node'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

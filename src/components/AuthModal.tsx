'use client';

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { loginWithEmail, registerWithEmail, pb } from '../lib/pocketbase';
import type { UserProfile } from '../types/user';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
  hasLocalDataToMigrate?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  hasLocalDataToMigrate = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [focusArea, setFocusArea] = useState('Computer Science & Distributed Systems');
  const [migrateLocalData, setMigrateLocalData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'login') {
        const user = await loginWithEmail(email, password);
        onAuthSuccess(user);
        onClose();
      } else {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name or handle.');
          setIsLoading(false);
          return;
        }
        const user = await registerWithEmail(email, password, name.trim(), focusArea);
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg = err?.data?.message || err?.message || 'Authentication failed. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-xl bg-[#12141d] border border-[#232738] shadow-[0_24px_50px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2230] bg-[#161925]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center text-[#6366f1]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f1f5f9] tracking-tight">
                {mode === 'login' ? 'Sign In to Syllabex' : 'Create Student Account'}
              </h2>
              <p className="text-[11px] text-[#94a3b8] font-mono">
                Multi-User Cloud Sync with PocketBase
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

        {/* Tab Switcher */}
        <div className="flex border-b border-[#1e2230] bg-[#0f1118]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs font-mono font-medium transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-[#6366f1] text-[#f1f5f9] bg-[#161925]/60'
                : 'border-transparent text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs font-mono font-medium transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-[#6366f1] text-[#f1f5f9] bg-[#161925]/60'
                : 'border-transparent text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#fca5a5] text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#ef4444]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94a3b8] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full pl-9 pr-3 py-2 bg-[#0c0e15] border border-[#2d3246] focus:border-[#6366f1] focus:outline-none rounded-lg text-xs text-[#f1f5f9] placeholder-[#475569] font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94a3b8] mb-1">
                  Primary Focus / Major
                </label>
                <input
                  type="text"
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  placeholder="e.g. Distributed Systems & Rust"
                  className="w-full px-3 py-2 bg-[#0c0e15] border border-[#2d3246] focus:border-[#6366f1] focus:outline-none rounded-lg text-xs text-[#f1f5f9] placeholder-[#475569] font-sans"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94a3b8] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full pl-9 pr-3 py-2 bg-[#0c0e15] border border-[#2d3246] focus:border-[#6366f1] focus:outline-none rounded-lg text-xs text-[#f1f5f9] placeholder-[#475569] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94a3b8] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-[#0c0e15] border border-[#2d3246] focus:border-[#6366f1] focus:outline-none rounded-lg text-xs text-[#f1f5f9] placeholder-[#475569] font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white font-mono text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In & Sync' : 'Register & Create Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="p-3 border-t border-[#1e2230] bg-[#0c0e15] flex items-center justify-between text-[11px] text-[#94a3b8] font-mono">
          <span>{mode === 'login' ? "Don't have an account?" : 'Already registered?'}</span>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setErrorMessage(null);
            }}
            className="text-[#6366f1] hover:text-[#818cf8] font-medium transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'Create one now' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

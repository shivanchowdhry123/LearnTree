'use client';

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  Brain,
  Share2,
  Zap,
  BookOpen,
} from 'lucide-react';
import { loginWithEmail, registerWithEmail } from '../lib/pocketbase';
import type { UserProfile } from '../types/user';

interface AuthPageProps {
  onAuthSuccess: (user: UserProfile) => void;
}

const PRESET_FOCUS_AREAS = [
  'Distributed Systems & Concurrency',
  'Modern Web Engineering & React 19',
  'Systems & Compilers',
  'Linux Kernel Architecture & eBPF',
  'Machine Learning & Neural Architectures',
  'Database Internals & Storage',
];

const PRESET_COLORS = [
  { hex: '#6366f1', label: 'Indigo' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#06b6d4', label: 'Cyan' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#8b5cf6', label: 'Purple' },
];

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [focusArea, setFocusArea] = useState('Distributed Systems & Concurrency');
  const [avatarColor, setAvatarColor] = useState('#6366f1');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() || '')
      .slice(0, 2)
      .join('') || (email ? email[0].toUpperCase() : 'SB');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'login') {
        const user = await loginWithEmail(email.trim(), password);
        onAuthSuccess(user);
      } else {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name or handle.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters.');
          setIsLoading(false);
          return;
        }
        const user = await registerWithEmail(
          email.trim(),
          password,
          name.trim(),
          focusArea.trim() || 'Software Engineering'
        );
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg =
        err?.data?.message ||
        err?.message ||
        'Authentication failed. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f1f5f9] flex flex-col justify-between selection:bg-[#6366f1]/30 selection:text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-[#6366f1]/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-[#10b981]/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e2230_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-10 border-b border-[#1e2230] bg-[#0c0e15]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6366f1] to-[#10b981] flex items-center justify-center font-mono font-bold text-black text-sm shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            SY
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm tracking-tight text-[#f1f5f9]">
                Syllabex
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#6366f1]/20 text-[#a5b4fc] border border-[#6366f1]/40">
                Cloud
              </span>
            </div>
            <p className="text-[11px] text-[#94a3b8] font-mono hidden sm:block">
              Interactive Tree Curricula & Active Recall Spaced Repetition
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[#94a3b8]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161925] border border-[#232738]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Encrypted Multi-User Storage</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14">
        {/* Left Column: Product Value Narrative */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161925] border border-[#2d3246] text-xs font-mono text-[#a5b4fc]">
              <Zap className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>Production Multi-User Edition</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#f8fafc] leading-[1.15]">
              Master deep engineering with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#818cf8] via-[#38bdf8] to-[#34d399]">
                structured recall.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed max-w-xl">
              Turn unstructured reading lists, research papers, and complex technical syllabi into
              interactive hierarchical trees powered by the SuperMemo SM-2 algorithm.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-3.5 rounded-xl bg-[#12141d]/90 border border-[#232738] space-y-1.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-[#6366f1]/15 text-[#818cf8] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-[#f1f5f9]">Hierarchical Tree Repos</div>
              <div className="text-[11px] text-[#94a3b8] leading-normal">
                Organize learning topics like file systems with subtrees, depth tracking, and tags.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#12141d]/90 border border-[#232738] space-y-1.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-[#10b981]/15 text-[#34d399] flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-[#f1f5f9]">SuperMemo SM-2 Interval</div>
              <div className="text-[11px] text-[#94a3b8] leading-normal">
                Active recall review sessions compute retention curves and automatically schedule intervals.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#12141d]/90 border border-[#232738] space-y-1.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-[#06b6d4]/15 text-[#38bdf8] flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-[#f1f5f9]">Public Sharing & Forking</div>
              <div className="text-[11px] text-[#94a3b8] leading-normal">
                Publish any syllabus with a single click. Teammates can preview and clone your exact tree.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#12141d]/90 border border-[#232738] space-y-1.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-[#f59e0b]/15 text-[#fbbf24] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-[#f1f5f9]">Cloud Persistence</div>
              <div className="text-[11px] text-[#94a3b8] leading-normal">
                Multi-user profiles, revisions, and study logs synced to PocketBase with conflict resolution.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Auth Card */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="rounded-2xl bg-[#12141d] border border-[#232738] shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden">
            {/* Tab Selector */}
            <div className="flex border-b border-[#1e2230] bg-[#0c0e15]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-3 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer ${
                  mode === 'login'
                    ? 'border-[#6366f1] text-[#f1f5f9] bg-[#161925]'
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
                className={`flex-1 py-3 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer ${
                  mode === 'register'
                    ? 'border-[#6366f1] text-[#f1f5f9] bg-[#161925]'
                    : 'border-transparent text-[#94a3b8] hover:text-[#f1f5f9]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#f1f5f9] tracking-tight">
                  {mode === 'login' ? 'Sign in to your account' : 'Setup your Syllabex profile'}
                </h2>
                <p className="text-xs text-[#94a3b8] font-mono mt-0.5">
                  {mode === 'login'
                    ? 'Enter your credentials to access your cloud workspace.'
                    : 'Create a personal workspace with multi-device sync.'}
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 flex items-start gap-2.5 text-xs text-[#fca5a5] animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94a3b8] mb-1">
                      Full Name / Handle
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Maya Lin"
                        className="w-full pl-9 pr-3 py-2 bg-[#0c0e15] border border-[#2d3246] focus:border-[#6366f1] focus:outline-none rounded-lg text-xs text-[#f1f5f9] placeholder-[#475569] font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94a3b8] mb-1">
                      Focus Area / Major
                    </label>
                    <select
                      value={focusArea}
                      onChange={(e) => setFocusArea(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0c0e15] border border-[#2d3246] focus:border-[#6366f1] focus:outline-none rounded-lg text-xs text-[#f1f5f9] font-sans cursor-pointer"
                    >
                      {PRESET_FOCUS_AREAS.map((area) => (
                        <option key={area} value={area} className="bg-[#12141d] text-[#f1f5f9]">
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#94a3b8] mb-1.5">
                      Avatar Theme
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold text-[#090a0f] shadow-sm shrink-0"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initials}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setAvatarColor(c.hex)}
                            title={c.label}
                            className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                              avatarColor === c.hex ? 'border-white scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>
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
                    placeholder="user@university.edu"
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
                {mode === 'register' && (
                  <span className="text-[10px] text-[#64748b] font-mono mt-0.5 block">
                    Minimum 6 characters
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 text-white font-mono text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md mt-2"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === 'login' ? 'Sign In & Access Syllabi' : 'Create Account & Open Workspace'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Footer switcher */}
            <div className="px-6 py-3.5 border-t border-[#1e2230] bg-[#0c0e15] flex items-center justify-between text-xs text-[#94a3b8] font-mono">
              <span>{mode === 'login' ? "Don't have an account yet?" : 'Already have an account?'}</span>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setErrorMessage(null);
                }}
                className="text-[#6366f1] hover:text-[#818cf8] font-medium transition-colors cursor-pointer"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1e2230] bg-[#0c0e15]/70 py-4 px-6 text-center text-xs font-mono text-[#64748b]">
        <span>Syllabex Multi-User Architecture • Real Profiles Only • Powered by PocketBase</span>
      </footer>
    </div>
  );
};

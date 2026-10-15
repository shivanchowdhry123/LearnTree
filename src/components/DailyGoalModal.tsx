'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Target,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Check,
  Clock,
  Sparkles,
  Flame,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import type { UserProfile } from '../types/user';

interface DailyGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: UserProfile;
  dailyTargetMinutes: number;
  todayStudyMinutes: number;
  onUpdateDailyTarget: (newTarget: number) => void;
  onAddStudyMinutes: (minutes: number) => void;
  onResetStudyMinutes: () => void;
}

const PRESET_TARGETS = [
  { label: '15m (Brisk)', value: 15 },
  { label: '25m (Pomodoro)', value: 25 },
  { label: '30m (Standard)', value: 30 },
  { label: '45m (Deep Work)', value: 45 },
  { label: '60m (Mastery)', value: 60 },
  { label: '90m (Intensive)', value: 90 },
];

export const DailyGoalModal: React.FC<DailyGoalModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  dailyTargetMinutes,
  todayStudyMinutes,
  onUpdateDailyTarget,
  onAddStudyMinutes,
  onResetStudyMinutes,
}) => {
  // Target editing state
  const [targetInput, setTargetInput] = useState<string>(dailyTargetMinutes.toString());
  const [customAddInput, setCustomAddInput] = useState<string>('15');
  const [isConfirmingReset, setIsConfirmingReset] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Live Focus Session Stopwatch state
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync target input when prop changes
  useEffect(() => {
    setTargetInput(dailyTargetMinutes.toString());
  }, [dailyTargetMinutes]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Stopwatch interval timer
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Save new daily target
  const handleSaveTarget = useCallback(
    (targetVal: number) => {
      if (isNaN(targetVal) || targetVal < 1) return;
      onUpdateDailyTarget(targetVal);
      setTargetInput(targetVal.toString());
      setFeedbackMsg(`Daily target saved: ${targetVal} minutes`);
      setTimeout(() => setFeedbackMsg(null), 2500);
    },
    [onUpdateDailyTarget]
  );

  // Finish / Log live timer session
  const handleLogTimerSession = useCallback(() => {
    if (timerSeconds <= 0) return;
    const elapsedMinutes = Math.max(1, Math.round(timerSeconds / 60));
    onAddStudyMinutes(elapsedMinutes);
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setFeedbackMsg(`Logged +${elapsedMinutes}m from live focus session!`);
    setTimeout(() => setFeedbackMsg(null), 2500);
  }, [timerSeconds, onAddStudyMinutes]);

  // Reset live stopwatch without logging
  const handleResetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  }, []);

  if (!isOpen) return null;

  const isGoalMet = todayStudyMinutes >= dailyTargetMinutes;
  const progressPercent = Math.min(
    100,
    Math.round((todayStudyMinutes / Math.max(1, dailyTargetMinutes)) * 100)
  );
  const remainingMinutes = Math.max(0, dailyTargetMinutes - todayStudyMinutes);

  // Format timer MM:SS
  const timerMins = Math.floor(timerSeconds / 60);
  const timerSecs = timerSeconds % 60;
  const formattedTimer = `${timerMins.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#090a0f]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-xl bg-[#12141c] border border-[#2d3246] shadow-[0_24px_60px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e2230] flex items-center justify-between gap-3 bg-[#0d0f17]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/15 border border-[#06b6d4]/30 flex items-center justify-center text-[#06b6d4]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#f1f5f9] font-sans">
                  Daily Study Goal
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181b26] text-[#06b6d4] border border-[#2d3246]">
                  {activeUser.name}
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] font-mono">
                Track study time & maintain daily consolidation consistency
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] hover:bg-[#181b26] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1 font-sans">
          {/* Temporary Feedback Banner */}
          {feedbackMsg && (
            <div className="p-2.5 px-3 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 text-xs font-mono text-[#10b981] flex items-center gap-2 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Today's Goal Progress Hero Card */}
          <div className="p-4 rounded-xl bg-[#090a0f] border border-[#1e2230] relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">
                  Today's Study Progress
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#f1f5f9] tracking-tight mt-0.5">
                  {todayStudyMinutes}{' '}
                  <span className="text-sm font-normal text-[#94a3b8]">
                    / {dailyTargetMinutes} mins
                  </span>
                </div>
              </div>

              {/* Status Pill Badge */}
              <div className="shrink-0">
                {isGoalMet ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 text-xs font-mono font-bold">
                    <Award className="w-3.5 h-3.5" />
                    <span>Goal Reached ({progressPercent}%)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06b6d4]/15 text-[#06b6d4] border border-[#06b6d4]/30 text-xs font-mono font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{remainingMinutes}m remaining ({progressPercent}%)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Continuous Progress Bar */}
            <div className="mt-3.5 w-full h-2.5 bg-[#181b26] rounded-full overflow-hidden border border-[#2d3246]/60">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isGoalMet
                    ? 'bg-gradient-to-r from-[#06b6d4] to-[#10b981]'
                    : 'bg-gradient-to-r from-[#3b82f6] to-[#06b6d4]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Subtext info */}
            <div className="mt-2 text-[11px] font-mono text-[#64748b] flex items-center justify-between">
              <span>{progressPercent}% completed today</span>
              <span>
                {isGoalMet
                  ? 'Target exceeded! Keep reinforcing recall.'
                  : `${remainingMinutes} mins left to lock in today's streak`}
              </span>
            </div>
          </div>

          {/* Section 1: User-Defined Target Configuration */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-[#f1f5f9] uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#06b6d4]" />
                <span>Configure Daily Target (Minutes)</span>
              </label>
              <span className="text-[11px] font-mono text-[#94a3b8]">
                Current: <strong className="text-[#06b6d4]">{dailyTargetMinutes}m</strong>
              </span>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_TARGETS.map((p) => {
                const isActive = dailyTargetMinutes === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSaveTarget(p.value)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer text-left flex items-center justify-between ${
                      isActive
                        ? 'bg-[#06b6d4]/15 border-[#06b6d4] text-[#f1f5f9] font-bold shadow-sm'
                        : 'bg-[#181b26] hover:bg-[#202538] border-[#2d3246] text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    <span>{p.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-[#06b6d4]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Minutes Input */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="Custom target in minutes"
                  className="w-full bg-[#090a0f] border border-[#2d3246] focus:border-[#06b6d4] rounded-lg px-3 py-1.5 text-xs font-mono text-[#f1f5f9] placeholder-[#475569] focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#64748b]">
                  mins
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSaveTarget(parseInt(targetInput, 10))}
                className="px-3.5 py-1.5 rounded-lg bg-[#06b6d4] hover:bg-[#0891b2] text-[#090a0f] text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Set Target
              </button>
            </div>
          </div>

          {/* Section 2: Live Focus Stopwatch */}
          <div className="p-3.5 rounded-xl bg-[#090a0f] border border-[#1e2230] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#f1f5f9] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>Live Focus Session Stopwatch</span>
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  isTimerRunning
                    ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 animate-pulse'
                    : 'bg-[#181b26] text-[#64748b] border-[#2d3246]'
                }`}
              >
                {isTimerRunning ? 'Session Running' : 'Idle'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12141c] p-3 rounded-lg border border-[#1e2230]">
              {/* Timer Display */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold font-mono text-[#f1f5f9] tracking-wider tabular-nums">
                  {formattedTimer}
                </span>
                <span className="text-xs font-mono text-[#94a3b8]">
                  ({timerMins}m {timerSecs}s)
                </span>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {!isTimerRunning ? (
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#090a0f] text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Timer</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f59e0b] hover:bg-[#d97706] text-[#090a0f] text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </button>
                )}

                {timerSeconds > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleLogTimerSession}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#06b6d4] hover:bg-[#0891b2] text-[#090a0f] text-xs font-mono font-bold transition-colors cursor-pointer"
                      title="Log this session's time to today's study goal"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log (+{Math.max(1, Math.round(timerSeconds / 60))}m)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetTimer}
                      className="p-1.5 rounded-lg bg-[#181b26] hover:bg-[#202538] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#2d3246] transition-colors cursor-pointer"
                      title="Reset stopwatch"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Manual Time Log & Quick Add */}
          <div className="space-y-2.5">
            <label className="text-xs font-mono font-semibold text-[#f1f5f9] uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Quick Add Study Time</span>
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onAddStudyMinutes(5)}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-[#181b26] hover:bg-[#202538] text-[#f1f5f9] border border-[#2d3246] transition-colors cursor-pointer"
              >
                +5 mins
              </button>
              <button
                type="button"
                onClick={() => onAddStudyMinutes(15)}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-[#181b26] hover:bg-[#202538] text-[#f1f5f9] border border-[#2d3246] transition-colors cursor-pointer"
              >
                +15 mins
              </button>
              <button
                type="button"
                onClick={() => onAddStudyMinutes(30)}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-[#181b26] hover:bg-[#202538] text-[#f1f5f9] border border-[#2d3246] transition-colors cursor-pointer"
              >
                +30 mins
              </button>
              <button
                type="button"
                onClick={() => onAddStudyMinutes(45)}
                className="px-2.5 py-1 text-xs font-mono rounded-lg bg-[#181b26] hover:bg-[#202538] text-[#f1f5f9] border border-[#2d3246] transition-colors cursor-pointer"
              >
                +45 mins
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#1e2230] bg-[#0d0f17] flex items-center justify-between gap-3 text-xs font-mono">
          <div>
            {!isConfirmingReset ? (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="text-[#94a3b8] hover:text-[#f43f5e] transition-colors cursor-pointer"
              >
                Reset Today's Log
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[#f43f5e]">Reset to 0m?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetStudyMinutes();
                    setIsConfirmingReset(false);
                  }}
                  className="px-2 py-0.5 rounded bg-[#f43f5e] text-[#090a0f] font-bold cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  className="px-2 py-0.5 rounded bg-[#181b26] text-[#94a3b8] cursor-pointer"
                >
                  No
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#181b26] hover:bg-[#222738] text-[#f1f5f9] border border-[#2d3246] font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

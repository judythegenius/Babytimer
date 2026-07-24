import React, { useState, useEffect } from 'react';
import { ActivityLog, SleepType } from '../types';
import { triggerHaptic, addLog, updateLog, formatDuration, formatTimeAgo } from '../utils';
import { getAgeGuide } from '../data/guides';
import { SLEEPING_BABY_IMAGE } from '../data/avatars';
import { Moon, Sun, Play, Square, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';

interface SleepPanelProps {
  babyId: string;
  birthDate: string;
  sleepLogs: ActivityLog[];
  isCurrentlySleeping: boolean;
  activeSleepLog?: ActivityLog;
  awakeMinutes: number;
  onLogAdded: () => void;
}

export const SleepPanel: React.FC<SleepPanelProps> = ({
  babyId,
  birthDate,
  sleepLogs,
  isCurrentlySleeping,
  activeSleepLog,
  awakeMinutes,
  onLogAdded,
}) => {
  // Determine default sleep type based on hour
  const currentHour = new Date().getHours();
  const defaultType: SleepType = currentHour >= 20 || currentHour < 6 ? 'night' : 'nap';

  const [sleepType, setSleepType] = useState<SleepType>(defaultType);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [elapsedSleepSecs, setElapsedSleepSecs] = useState<number>(0);

  // Active sleep counter timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCurrentlySleeping && activeSleepLog) {
      const startMs = new Date(activeSleepLog.startTime).getTime();
      interval = setInterval(() => {
        const secs = Math.floor((Date.now() - startMs) / 1000);
        setElapsedSleepSecs(Math.max(0, secs));
      }, 1000);
    } else {
      setElapsedSleepSecs(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCurrentlySleeping, activeSleepLog]);

  // Start sleep
  const handleStartSleep = () => {
    triggerHaptic();
    addLog({
      babyId,
      type: 'sleep',
      sleepType,
      startTime: new Date().toISOString(),
    });
    onLogAdded();
  };

  // Wake up (Finish sleep)
  const handleWakeUp = () => {
    triggerHaptic();
    if (!activeSleepLog) return;
    const nowIso = new Date().toISOString();
    const startMs = new Date(activeSleepLog.startTime).getTime();
    const durationSecs = Math.floor((Date.now() - startMs) / 1000);

    updateLog(activeSleepLog.id, {
      endTime: nowIso,
      durationSeconds: durationSecs,
    });
    onLogAdded();
  };

  const ageGuide = getAgeGuide(birthDate);
  const lastFinishedLog = sleepLogs.find((l) => l.endTime);

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      {/* Visual Character Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-2xl border border-indigo-100 flex items-center gap-3">
        <img
          src={SLEEPING_BABY_IMAGE}
          alt="수면 아이콘"
          referrerPolicy="no-referrer"
          className="w-12 h-12 rounded-xl object-cover border border-indigo-200/80 shadow-xs"
        />
        <div>
          <div className="text-xs font-bold text-slate-800">포근한 수면 관리 🌙</div>
          <div className="text-[11px] text-slate-500">
            낮잠과 밤잠을 재울 때 버튼 하나로 타이머를 작동하세요.
          </div>
        </div>
      </div>

      {/* Current Awake Time Indicator */}
      <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
            ⚡
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500">깨어있는 시간 (활동)</div>
            <div className="text-sm font-extrabold text-indigo-900">
              {isCurrentlySleeping
                ? '현재 수면 중 🌙'
                : `기상 후 ${Math.floor(awakeMinutes / 60)}시간 ${awakeMinutes % 60}분째`}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-100/80 px-2 py-0.5 rounded-full">
            권장: {ageGuide.awakeWindowMinutes}
          </span>
        </div>
      </div>

      {/* Main Sleep Status Card */}
      {isCurrentlySleeping && activeSleepLog ? (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-300">
            <Moon className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>
              {activeSleepLog.sleepType === 'night' ? '🌙 밤잠 진행 중' : '☀️ 낮잠 진행 중'}
            </span>
          </div>

          <div className="text-4xl font-black text-amber-200 tracking-tight">
            {formatDuration(elapsedSleepSecs)}
          </div>

          <p className="text-xs text-indigo-200">
            아이가 깨어나면 아래 버튼을 눌러 수면 시간을 완료하세요.
          </p>

          <button
            type="button"
            onClick={handleWakeUp}
            className="w-full py-3.5 bg-amber-400 text-slate-950 rounded-xl text-sm font-black shadow-md hover:bg-amber-300 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sun className="w-4 h-4 fill-current" />
            <span>아기가 깨어났어요 (기상 기록)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sleep Type Selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            <button
              onClick={() => {
                triggerHaptic();
                setSleepType('nap');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                sleepType === 'nap'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>낮잠</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic();
                setSleepType('night');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                sleepType === 'night'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>밤잠</span>
            </button>
          </div>

          {/* Start Sleep Button */}
          <button
            type="button"
            onClick={handleStartSleep}
            className="w-full py-4 bg-[#A78BFA] text-white rounded-2xl text-sm font-bold shadow-md hover:bg-[#9061F9] active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Moon className="w-5 h-5 fill-current" />
            <span>{sleepType === 'nap' ? '낮잠' : '밤잠'} 재우기 시작 (타이머)</span>
          </button>
        </div>
      )}

      {/* Collapsible Age Guide Banner */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <button
          onClick={() => {
            triggerHaptic();
            setShowGuide(!showGuide);
          }}
          className="w-full bg-slate-50 p-3 text-left flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
        >
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-500" />
            <span>시기별 권장 수면 가이드 ({ageGuide.title})</span>
          </div>
          {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showGuide && (
          <div className="p-4 bg-white text-xs space-y-2 border-t border-slate-200 text-slate-600 leading-relaxed">
            <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-slate-400 block">총 수면:</span>
                <strong className="text-slate-800">{ageGuide.totalSleepHours}</strong>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-slate-400 block">낮잠 횟수:</span>
                <strong className="text-slate-800">{ageGuide.napCount}</strong>
              </div>
            </div>
            <p className="text-slate-700 font-medium">💡 {ageGuide.tip}</p>
            <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
              * 출처: 대한소아청소년과학회 가이드라인 (개인차가 존재합니다)
            </p>
          </div>
        )}
      </div>

      {/* Last Sleep Footer */}
      {lastFinishedLog && (
        <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>최근 기상:</span>
            <strong className="text-slate-700">
              {formatTimeAgo(lastFinishedLog.endTime!)}
            </strong>
          </div>
          <div>
            {lastFinishedLog.sleepType === 'nap' ? '낮잠' : '밤잠'}{' '}
            {Math.floor((lastFinishedLog.durationSeconds || 0) / 3600)}시간{' '}
            {Math.floor(((lastFinishedLog.durationSeconds || 0) % 3600) / 60)}분 수면
          </div>
        </div>
      )}
    </div>
  );
};

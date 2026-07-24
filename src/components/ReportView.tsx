import React, { useState } from 'react';
import { ActivityLog, Baby } from '../types';
import {
  formatTimeOnly,
  formatDuration,
  deleteLog,
  triggerHaptic,
  formatDateWithDay,
} from '../utils';
import { BackfillModal } from './BackfillModal';
import {
  Calendar,
  Clock,
  Trash2,
  Plus,
  BarChart2,
  Sparkles,
  TrendingUp,
  Droplets,
  Moon,
  Milk,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react';

interface ReportViewProps {
  baby: Baby;
  logs: ActivityLog[];
  onLogUpdated: () => void;
}

type PeriodTab = 'today' | 'week' | 'two_weeks';

// Helper to format Date into YYYY-MM-DD in local time
const getLocalDateStr = (dateObj: Date | string) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ReportView: React.FC<ReportViewProps> = ({
  baby,
  logs,
  onLogUpdated,
}) => {
  const [period, setPeriod] = useState<PeriodTab>('today');
  const [showBackfillModal, setShowBackfillModal] = useState<boolean>(false);
  const [selectedBackfillTime, setSelectedBackfillTime] = useState<string | undefined>(
    undefined
  );
  const [showLogList, setShowLogList] = useState<boolean>(false);

  // Filter logs for active baby
  const babyLogs = logs.filter((l) => l.babyId === baby.id);

  // Today Logs in Local Date
  const todayStr = getLocalDateStr(new Date());
  const todayLogs = babyLogs.filter((l) => getLocalDateStr(l.startTime) === todayStr);
  todayLogs.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  // Calculate Today Statistics
  const todayFeeds = todayLogs.filter((l) =>
    ['breast', 'formula', 'weaning'].includes(l.type)
  );
  const todayFeedCount = todayFeeds.length;
  const todayFormulaMl = todayFeeds.reduce((acc, l) => acc + (l.amountMl || 0), 0);

  const todaySleeps = todayLogs.filter((l) => l.type === 'sleep');
  const todaySleepSecs = todaySleeps.reduce(
    (acc, l) => acc + (l.durationSeconds || 0),
    0
  );

  const todayDiapers = todayLogs.filter((l) => l.type === 'diaper');
  const todayPeeCount = todayDiapers.filter((l) => l.diaperType === 'pee').length;
  const todayPoopCount = todayDiapers.filter((l) => l.diaperType === 'poop').length;
  const todayDiaperCount = todayDiapers.length;

  const todayCryLogs = todayLogs.filter((l) => l.type === 'cry');
  const todayCryCount = todayCryLogs.length;

  // --- Insight Interval Calculations ---
  // 1) Average Feeding Interval
  const sortedFeedsAsc = [...todayFeeds].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  let avgFeedIntervalStr = '기록 2회 이상 필요';
  if (sortedFeedsAsc.length >= 2) {
    let totalDiffMs = 0;
    for (let i = 1; i < sortedFeedsAsc.length; i++) {
      totalDiffMs +=
        new Date(sortedFeedsAsc[i].startTime).getTime() -
        new Date(sortedFeedsAsc[i - 1].startTime).getTime();
    }
    const avgMs = totalDiffMs / (sortedFeedsAsc.length - 1);
    const avgMins = Math.round(avgMs / (1000 * 60));
    const h = Math.floor(avgMins / 60);
    const m = avgMins % 60;
    avgFeedIntervalStr = h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  }

  // 2) Average Sleep Interval (Wake window between sleep starts or sleep end-to-start)
  const sortedSleepsAsc = [...todaySleeps].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  let avgSleepIntervalStr = '기록 2회 이상 필요';
  if (sortedSleepsAsc.length >= 2) {
    let totalSleepDiffMs = 0;
    for (let i = 1; i < sortedSleepsAsc.length; i++) {
      totalSleepDiffMs +=
        new Date(sortedSleepsAsc[i].startTime).getTime() -
        new Date(sortedSleepsAsc[i - 1].startTime).getTime();
    }
    const avgMs = totalSleepDiffMs / (sortedSleepsAsc.length - 1);
    const avgMins = Math.round(avgMs / (1000 * 60));
    const h = Math.floor(avgMins / 60);
    const m = avgMins % 60;
    avgSleepIntervalStr = h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  }

  // 3) Longest Sleep Duration Today
  let longestSleepStr = '기록 없음';
  const sleepsWithDuration = todaySleeps.filter((s) => (s.durationSeconds || 0) > 0);
  if (sleepsWithDuration.length > 0) {
    const maxSecs = Math.max(...sleepsWithDuration.map((s) => s.durationSeconds || 0));
    const h = Math.floor(maxSecs / 3600);
    const m = Math.floor((maxSecs % 3600) / 60);
    longestSleepStr = h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  }

  // --- 24-Hour Grid Heatmap Helper ---
  // Returns true if an activity of type `cat` occurred during hour `h` (0..23)
  const isActivityActiveInHour = (cat: 'feed' | 'sleep' | 'diaper' | 'cry', hour: number) => {
    return todayLogs.some((log) => {
      const logStart = new Date(log.startTime);
      const startH = logStart.getHours();

      if (cat === 'feed' && ['breast', 'formula', 'weaning'].includes(log.type)) {
        return startH === hour;
      }
      if (cat === 'diaper' && log.type === 'diaper') {
        return startH === hour;
      }
      if (cat === 'cry' && log.type === 'cry') {
        return startH === hour;
      }
      if (cat === 'sleep' && log.type === 'sleep') {
        if (log.endTime) {
          const endH = new Date(log.endTime).getHours();
          if (startH <= endH) {
            return hour >= startH && hour <= endH;
          } else {
            // Span overnight
            return hour >= startH || hour <= endH;
          }
        }
        return startH === hour;
      }
      return false;
    });
  };

  // handleDelete
  const handleDelete = (logId: string) => {
    triggerHaptic();
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      deleteLog(logId);
      onLogUpdated();
    }
  };

  // 7 days / 14 days chart data calculation
  const daysCount = period === 'week' ? 7 : 14;
  const dailyStats = Array.from({ length: daysCount }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysCount - 1 - idx));
    const dStr = getLocalDateStr(d);
    const dayLogs = babyLogs.filter((l) => getLocalDateStr(l.startTime) === dStr);

    const feedCnt = dayLogs.filter((l) =>
      ['breast', 'formula', 'weaning'].includes(l.type)
    ).length;
    const formulaVol = dayLogs.reduce((acc, l) => acc + (l.amountMl || 0), 0);

    const napSecs = dayLogs
      .filter((l) => l.type === 'sleep' && l.sleepType === 'nap')
      .reduce((acc, l) => acc + (l.durationSeconds || 0), 0);
    const nightSecs = dayLogs
      .filter((l) => l.type === 'sleep' && l.sleepType === 'night')
      .reduce((acc, l) => acc + (l.durationSeconds || 0), 0);
    const totalSleepSecs = dayLogs
      .filter((l) => l.type === 'sleep')
      .reduce((acc, l) => acc + (l.durationSeconds || 0), 0);

    const peeCnt = dayLogs.filter(
      (l) => l.type === 'diaper' && l.diaperType === 'pee'
    ).length;
    const poopCnt = dayLogs.filter(
      (l) => l.type === 'diaper' && l.diaperType === 'poop'
    ).length;
    const diaperCnt = dayLogs.filter((l) => l.type === 'diaper').length;

    return {
      dateStr: dStr,
      displayDay: `${d.getMonth() + 1}/${d.getDate()}`,
      feedCnt,
      formulaVol,
      napHours: +(napSecs / 3600).toFixed(1),
      nightHours: +(nightSecs / 3600).toFixed(1),
      sleepHours: +(totalSleepSecs / 3600).toFixed(1),
      peeCnt,
      poopCnt,
      diaperCnt,
    };
  });

  // Weekly Insights
  const maxWeeklyFeed = Math.max(1, ...dailyStats.map((d) => d.feedCnt));
  const maxWeeklySleep = Math.max(
    1,
    ...dailyStats.map((d) => Math.max(d.napHours, d.nightHours, d.sleepHours))
  );
  const maxWeeklyDiaper = Math.max(
    1,
    ...dailyStats.map((d) => Math.max(d.peeCnt, d.poopCnt, d.diaperCnt))
  );

  const avgFeedCount = (
    dailyStats.reduce((acc, d) => acc + d.feedCnt, 0) / daysCount
  ).toFixed(1);
  const avgSleepHours = (
    dailyStats.reduce((acc, d) => acc + d.sleepHours, 0) / daysCount
  ).toFixed(1);

  // Heatmap helper for sleep
  const getSleepTypeInHour = (hour: number): 'night' | 'nap' | null => {
    const sleepLogs = todayLogs.filter((l) => l.type === 'sleep');
    let hasNight = false;
    let hasNap = false;

    for (const log of sleepLogs) {
      const startH = new Date(log.startTime).getHours();
      let isMatch = false;
      if (log.endTime) {
        const endH = new Date(log.endTime).getHours();
        if (startH <= endH) {
          isMatch = hour >= startH && hour <= endH;
        } else {
          isMatch = hour >= startH || hour <= endH;
        }
      } else {
        isMatch = startH === hour;
      }

      if (isMatch) {
        if (log.sleepType === 'night') hasNight = true;
        else hasNap = true;
      }
    }

    if (hasNight) return 'night';
    if (hasNap) return 'nap';
    return null;
  };

  const getRowStatusInHour = (rowId: string, hour: number) => {
    if (rowId === 'feed') {
      return todayLogs.some(
        (l) =>
          ['breast', 'formula', 'weaning'].includes(l.type) &&
          new Date(l.startTime).getHours() === hour
      );
    }
    if (rowId === 'pee') {
      return todayLogs.some(
        (l) =>
          l.type === 'diaper' &&
          l.diaperType === 'pee' &&
          new Date(l.startTime).getHours() === hour
      );
    }
    if (rowId === 'poop') {
      return todayLogs.some(
        (l) =>
          l.type === 'diaper' &&
          l.diaperType === 'poop' &&
          new Date(l.startTime).getHours() === hour
      );
    }
    if (rowId === 'cry') {
      return todayLogs.some(
        (l) => l.type === 'cry' && new Date(l.startTime).getHours() === hour
      );
    }
    return false;
  };

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto px-4 font-sans text-slate-800">
      {/* Period Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1 mt-3">
        {[
          { id: 'today', label: '오늘 통계' },
          { id: 'week', label: '1주 분석' },
          { id: 'two_weeks', label: '2주 분석' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              triggerHaptic();
              setPeriod(tab.id as PeriodTab);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              period === tab.id
                ? 'bg-white text-slate-900 shadow-xs scale-102'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TODAY TAB CONTENT */}
      {period === 'today' && (
        <div className="space-y-4">
          {/* Header Date Banner */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
              <BarChart2 className="w-4 h-4 text-[#FF6B6B]" />
              <span>오늘 {baby.name}의 활동 Statistics</span>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {formatDateWithDay(new Date().toISOString())}
            </span>
          </div>

          {/* 1) 2x2 Summary Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Feeding Summary */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>수유 횟수</span>
                <img src="/icons/feed.png" alt="먹기" className="w-5 h-5 object-contain" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {todayFeedCount}
                <span className="text-xs font-bold text-slate-500 ml-1">회</span>
              </div>
              <div className="text-[11px] text-[#FF6B6B] font-bold">
                {todayFormulaMl > 0 ? `총 ${todayFormulaMl}mL 수유` : '모유/이유식 포함'}
              </div>
            </div>

            {/* Total Sleep */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>총 수면 시간</span>
                <img src="/icons/sleep.png" alt="잠자기" className="w-5 h-5 object-contain" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {Math.floor(todaySleepSecs / 3600)}
                <span className="text-xs font-bold text-slate-500 ml-0.5">h</span>{' '}
                {Math.floor((todaySleepSecs % 3600) / 60)}
                <span className="text-xs font-bold text-slate-500 ml-0.5">m</span>
              </div>
              <div className="text-[11px] text-[#A78BFA] font-bold">
                낮잠 {todaySleeps.filter((s) => s.sleepType === 'nap').length}회 · 밤잠 포함
              </div>
            </div>

            {/* Diaper */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>기저귀 교체</span>
                <img src="/icons/diaper.png" alt="소변" className="w-5 h-5 object-contain" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {todayDiaperCount}
                <span className="text-xs font-bold text-slate-500 ml-1">회</span>
              </div>
              <div className="text-[11px] text-[#34D399] font-bold flex items-center gap-1">
                <span>소변 {todayPeeCount}회</span>
                <span>·</span>
                <span>대변 {todayPoopCount}회</span>
              </div>
            </div>

            {/* Cry Diagnoses */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>울음 진단</span>
                <img src="/icons/cry.png" alt="울음" className="w-5 h-5 object-contain" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {todayCryCount}
                <span className="text-xs font-bold text-slate-500 ml-1">회</span>
              </div>
              <div className="text-[11px] text-amber-500 font-bold">
                패턴 분석 감지 기록
              </div>
            </div>
          </div>

          {/* 2) Insights Horizontal Scrollable Banner */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>오늘 육아 요약 패턴</span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
              {/* Feeding Interval */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-[150px] flex-shrink-0 space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <img src="/icons/feed.png" alt="먹기" className="w-3.5 h-3.5 object-contain" /> 평균 수유 간격
                </div>
                <div className="text-sm font-black text-[#FF6B6B]">
                  {avgFeedIntervalStr}
                </div>
              </div>

              {/* Sleep Interval */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-[150px] flex-shrink-0 space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <img src="/icons/sleep.png" alt="잠자기" className="w-3.5 h-3.5 object-contain" /> 평균 수면 텀
                </div>
                <div className="text-sm font-black text-[#A78BFA]">
                  {avgSleepIntervalStr}
                </div>
              </div>

              {/* Longest Sleep */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-[150px] flex-shrink-0 space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <img src="/icons/sleep.png" alt="잠자기" className="w-3.5 h-3.5 object-contain" /> 오늘 가장 긴 수면
                </div>
                <div className="text-sm font-black text-indigo-600">
                  {longestSleepStr}
                </div>
              </div>
            </div>
          </div>

          {/* 3) 24-Hour Activity Grid Heatmap */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <span>📊</span> 시간대별 활동 히트맵 (0시 ~ 23시)
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">
                1칸 = 1시간
              </span>
            </div>

            {/* Time Labels */}
            <div className="grid grid-cols-[55px_1fr] items-center gap-2">
              <div />
              <div className="grid grid-cols-12 gap-0.5 text-[9px] text-slate-400 font-bold text-center">
                <span>00</span>
                <span>02</span>
                <span>04</span>
                <span>06</span>
                <span>08</span>
                <span>10</span>
                <span>12</span>
                <span>14</span>
                <span>16</span>
                <span>18</span>
                <span>20</span>
                <span>22</span>
              </div>
            </div>

            {/* Heatmap Rows */}
            <div className="space-y-2.5 pt-1">
              {[
                { id: 'feed', label: '먹', icon: '/icons/feed.png', color: 'bg-[#FF6B6B]' },
                { id: 'sleep', label: '잠', icon: '/icons/sleep.png', color: '' },
                { id: 'pee', label: '소변', icon: '/icons/diaper.png', color: 'bg-[#86EFAC]' },
                { id: 'poop', label: '대변', icon: '/icons/poop.png', color: 'bg-[#FCD34D]' },
                { id: 'cry', label: '울음', icon: '/icons/cry.png', color: 'bg-[#FBBF24]' },
              ].map((row) => (
                <div key={row.id} className="grid grid-cols-[55px_1fr] items-center gap-2">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <img src={row.icon} alt={row.label} className="w-4 h-4 object-contain" />
                    <span>{row.label}</span>
                  </div>

                  {/* 24 Cell Blocks */}
                  <div className="grid grid-cols-24 gap-0.5">
                    {Array.from({ length: 24 }).map((_, hour) => {
                      if (row.id === 'sleep') {
                        const sleepType = getSleepTypeInHour(hour);
                        const isNight = sleepType === 'night';
                        const isNap = sleepType === 'nap';
                        const bgClass = isNight
                          ? 'bg-[#6D28D9] shadow-2xs scale-105'
                          : isNap
                          ? 'bg-[#C4B5FD] shadow-2xs scale-105'
                          : 'bg-slate-100 border border-slate-200/50';

                        return (
                          <div
                            key={hour}
                            title={`${hour}시 - 수면 (${
                              isNight ? '밤잠' : isNap ? '낮잠' : '없음'
                            })`}
                            className={`h-6 rounded-md transition-all ${bgClass}`}
                          />
                        );
                      }

                      const isActive = getRowStatusInHour(row.id, hour);

                      return (
                        <div
                          key={hour}
                          title={`${hour}시 - ${row.label} ${
                            isActive ? '기록 있음' : '없음'
                          }`}
                          className={`h-6 rounded-md transition-all ${
                            isActive
                              ? `${row.color} shadow-2xs scale-105`
                              : 'bg-slate-100 border border-slate-200/50'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Heatmap Legend */}
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-[10px] text-slate-500 font-semibold pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-200" />
                <span>활동 없음</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/icons/sleep.png" alt="낮잠" className="w-3 h-3 object-contain" />
                <div className="w-2.5 h-2.5 rounded-xs bg-[#C4B5FD]" />
                <span>낮잠</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-xs bg-[#6D28D9]" />
                <span>밤잠</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/icons/diaper.png" alt="소변" className="w-3 h-3 object-contain" />
                <div className="w-2.5 h-2.5 rounded-xs bg-[#86EFAC]" />
                <span>소변</span>
              </div>
              <div className="flex items-center gap-1">
                <img src="/icons/poop.png" alt="대변" className="w-3 h-3 object-contain" />
                <div className="w-2.5 h-2.5 rounded-xs bg-[#FCD34D]" />
                <span>대변</span>
              </div>
            </div>
          </div>

          {/* Collapsible Timeline / Manual Log Action */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowLogList(!showLogList)}
                className="font-bold text-xs text-slate-800 flex items-center gap-1.5 hover:text-slate-900"
              >
                <span>📝 상세 기록 목록 ({todayLogs.length}건)</span>
                {showLogList ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              <button
                onClick={() => {
                  triggerHaptic();
                  setSelectedBackfillTime(undefined);
                  setShowBackfillModal(true);
                }}
                className="px-3 py-1.5 bg-[#FF6B6B]/10 text-[#FF6B6B] rounded-xl text-xs font-bold hover:bg-[#FF6B6B]/20 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>소급(수동) 기록</span>
              </button>
            </div>

            {showLogList && (
              <div className="pt-2 border-t border-slate-100 space-y-2 max-h-60 overflow-y-auto pr-1">
                {todayLogs.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400 font-medium">
                    오늘 기록이 아직 없습니다.
                  </div>
                ) : (
                  todayLogs.map((log) => {
                    const timeStr = formatTimeOnly(log.startTime);
                    let title = '기록';
                    let detail = log.memo || '';

                    if (['breast', 'formula', 'weaning'].includes(log.type)) {
                      title =
                        log.type === 'breast'
                          ? '모유'
                          : log.type === 'formula'
                          ? '분유'
                          : '이유식';
                      detail =
                        log.type === 'formula'
                          ? `${log.amountMl}mL`
                          : log.type === 'breast'
                          ? `${Math.ceil((log.durationSeconds || 0) / 60)}분`
                          : `${log.weaningFood || ''} ${log.weaningAmount || ''}`;
                    } else if (log.type === 'sleep') {
                      title = log.sleepType === 'nap' ? '낮잠' : '밤잠';
                      detail = log.durationSeconds
                        ? `${Math.floor(log.durationSeconds / 3600)}시간 ${Math.floor(
                            (log.durationSeconds % 3600) / 60
                          )}분`
                        : '진행 중';
                    } else if (log.type === 'diaper') {
                      title = log.diaperType === 'pee' ? '소변' : '대변';
                      detail = log.poopConsistency ? `상태: ${log.poopConsistency}` : '';
                    }

                    return (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs font-medium"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800">{title}</span>
                          <span className="text-slate-400 text-[11px]">{timeStr}</span>
                          <span className="text-slate-600 font-bold">{detail}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(log.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4-4. WEEKLY & 2-WEEK ANALYTICS TABS WITH DIV BAR CHARTS */}
      {(period === 'week' || period === 'two_weeks') && (
        <div className="space-y-4">
          {/* Pattern Insights Summary */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-3xl space-y-2 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{period === 'week' ? '1주간' : '2주간'} 평균 패턴 분석</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">일 평균 수유 횟수</span>
                <strong className="text-lg font-black text-[#FF6B6B]">
                  {avgFeedCount} 회
                </strong>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">일 평균 수면 시간</span>
                <strong className="text-lg font-black text-[#A78BFA]">
                  {avgSleepHours} 시간
                </strong>
              </div>
            </div>
          </div>

          {/* 1. Daily Feeding Count Bar Chart */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <img src="/icons/feed.png" alt="수유" className="w-4 h-4 object-contain" />
                <span>일별 수유 횟수 (회)</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">목표: 5~8회</span>
            </div>

            <div className="flex items-end justify-between gap-1.5 pt-6 h-40 px-1 border-b border-slate-100">
              {dailyStats.map((d) => {
                const pct =
                  d.feedCnt > 0
                    ? Math.max(12, Math.round((d.feedCnt / maxWeeklyFeed) * 100))
                    : 4;

                return (
                  <div
                    key={d.dateStr}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-1 group"
                  >
                    <span className="text-[9px] font-bold text-slate-600 transition-opacity">
                      {d.feedCnt > 0 ? `${d.feedCnt}회` : ''}
                    </span>
                    <div
                      className="w-full max-w-[22px] bg-[#FF6B6B] rounded-t-lg transition-all group-hover:bg-[#FF5252] shadow-2xs"
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[9px] font-semibold text-slate-400 mt-1">
                      {d.displayDay}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Daily Sleep Hours Bar Chart (Nap & Night Grouped) */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <img src="/icons/sleep.png" alt="수면" className="w-4 h-4 object-contain" />
                <span>일별 수면 시간 (시간)</span>
              </h4>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-[#A78BFA]" /> 낮잠
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-[#6D28D9]" /> 밤잠
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-1.5 pt-6 h-40 px-1 border-b border-slate-100">
              {dailyStats.map((d) => {
                const maxVal = maxWeeklySleep || 1;
                const napPct = d.napHours > 0 ? Math.max(10, Math.round((d.napHours / maxVal) * 100)) : 4;
                const nightPct = d.nightHours > 0 ? Math.max(10, Math.round((d.nightHours / maxVal) * 100)) : 4;

                return (
                  <div
                    key={d.dateStr}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-1 group"
                  >
                    <span className="text-[8px] font-bold text-slate-600 transition-opacity">
                      {d.sleepHours > 0 ? `${d.sleepHours}h` : ''}
                    </span>
                    <div className="flex items-end gap-0.5 w-full justify-center">
                      <div
                        title={`낮잠: ${d.napHours}시간`}
                        className="w-1/2 max-w-[10px] bg-[#A78BFA] rounded-t-sm transition-all group-hover:bg-[#9061F9]"
                        style={{ height: `${napPct}%` }}
                      />
                      <div
                        title={`밤잠: ${d.nightHours}시간`}
                        className="w-1/2 max-w-[10px] bg-[#6D28D9] rounded-t-sm transition-all group-hover:bg-[#5B21B6]"
                        style={{ height: `${nightPct}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 mt-1">
                      {d.displayDay}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Daily Diaper Count Bar Chart (Pee & Poop Grouped) */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <img src="/icons/diaper.png" alt="기저귀" className="w-4 h-4 object-contain" />
                <span>일별 기저귀 교체 (소변/대변)</span>
              </h4>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <img src="/icons/diaper.png" alt="소변" className="w-3 h-3 object-contain" />
                  <span className="w-2 h-2 rounded-xs bg-[#34D399]" /> 소변
                </span>
                <span className="flex items-center gap-1">
                  <img src="/icons/poop.png" alt="대변" className="w-3 h-3 object-contain" />
                  <span className="w-2 h-2 rounded-xs bg-[#F59E0B]" /> 대변
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-1.5 pt-6 h-40 px-1 border-b border-slate-100">
              {dailyStats.map((d) => {
                const maxVal = maxWeeklyDiaper || 1;
                const peePct = d.peeCnt > 0 ? Math.max(10, Math.round((d.peeCnt / maxVal) * 100)) : 4;
                const poopPct = d.poopCnt > 0 ? Math.max(10, Math.round((d.poopCnt / maxVal) * 100)) : 4;

                return (
                  <div
                    key={d.dateStr}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-1 group"
                  >
                    <span className="text-[8px] font-bold text-slate-600 transition-opacity">
                      {d.diaperCnt > 0 ? `${d.diaperCnt}회` : ''}
                    </span>
                    <div className="flex items-end gap-0.5 w-full justify-center">
                      <div
                        title={`소변: ${d.peeCnt}회`}
                        className="w-1/2 max-w-[10px] bg-[#34D399] rounded-t-sm transition-all group-hover:bg-emerald-500"
                        style={{ height: `${peePct}%` }}
                      />
                      <div
                        title={`대변: ${d.poopCnt}회`}
                        className="w-1/2 max-w-[10px] bg-[#F59E0B] rounded-t-sm transition-all group-hover:bg-amber-600"
                        style={{ height: `${poopPct}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 mt-1">
                      {d.displayDay}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Backfill Modal */}
      {showBackfillModal && (
        <BackfillModal
          babyId={baby.id}
          initialTimeISO={selectedBackfillTime}
          onClose={() => setShowBackfillModal(false)}
          onSave={onLogUpdated}
        />
      )}
    </div>
  );
};


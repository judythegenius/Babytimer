import React, { useState } from 'react';
import { ActivityLog, Baby } from '../types';
import {
  formatTimeOnly,
  deleteLog,
  triggerHaptic,
  formatDateWithDay,
} from '../utils';
import { BackfillModal } from './BackfillModal';
import {
  BarChart2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from 'lucide-react';

interface ReportViewProps {
  baby: Baby;
  logs: ActivityLog[];
  onLogUpdated: () => void;
}

type PeriodTab = 'today' | 'week' | 'two_weeks';

const getLocalDateStr = (dateObj: Date | string) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ReportView: React.FC<ReportViewProps> = ({ baby, logs, onLogUpdated }) => {
  const [period, setPeriod] = useState<PeriodTab>('today');
  const [showBackfillModal, setShowBackfillModal] = useState(false);
  const [selectedBackfillTime, setSelectedBackfillTime] = useState<string | undefined>(undefined);
  const [showLogList, setShowLogList] = useState(false);

  const babyLogs = logs.filter((l) => l.babyId === baby.id);
  const todayStr = getLocalDateStr(new Date());
  const todayLogs = babyLogs
    .filter((l) => getLocalDateStr(l.startTime) === todayStr)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // Today stats
  const todayFeeds = todayLogs.filter((l) => ['breast', 'formula', 'weaning'].includes(l.type));
  const todayFeedCount = todayFeeds.length;
  const todayFormulaMl = todayFeeds.reduce((acc, l) => acc + (l.amountMl || 0), 0);

  const todaySleeps = todayLogs.filter((l) => l.type === 'sleep');
  const todaySleepSecs = todaySleeps.reduce((acc, l) => acc + (l.durationSeconds || 0), 0);

  const todayDiapers = todayLogs.filter((l) => l.type === 'diaper');
  const todayPeeCount = todayDiapers.filter((l) => l.diaperType === 'pee').length;
  const todayPoopCount = todayDiapers.filter((l) => l.diaperType === 'poop').length;
  const todayDiaperCount = todayDiapers.length;

  const todayCryCount = todayLogs.filter((l) => l.type === 'cry').length;

  // Insight: 평균 수유 간격
  const sortedFeedsAsc = [...todayFeeds].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  let avgFeedIntervalStr = '기록 2회 이상 필요';
  if (sortedFeedsAsc.length >= 2) {
    let total = 0;
    for (let i = 1; i < sortedFeedsAsc.length; i++) {
      total += new Date(sortedFeedsAsc[i].startTime).getTime() - new Date(sortedFeedsAsc[i - 1].startTime).getTime();
    }
    const avgMins = Math.round(total / (sortedFeedsAsc.length - 1) / 60000);
    const h = Math.floor(avgMins / 60);
    const m = avgMins % 60;
    avgFeedIntervalStr = h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  }

  // Insight: 평균 수면 텀
  const sortedSleepsAsc = [...todaySleeps].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  let avgSleepIntervalStr = '기록 2회 이상 필요';
  if (sortedSleepsAsc.length >= 2) {
    let total = 0;
    for (let i = 1; i < sortedSleepsAsc.length; i++) {
      total += new Date(sortedSleepsAsc[i].startTime).getTime() - new Date(sortedSleepsAsc[i - 1].startTime).getTime();
    }
    const avgMins = Math.round(total / (sortedSleepsAsc.length - 1) / 60000);
    const h = Math.floor(avgMins / 60);
    const m = avgMins % 60;
    avgSleepIntervalStr = h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  }

  // Insight: 가장 긴 수면
  let longestSleepStr = '기록 없음';
  const sleepsWithDuration = todaySleeps.filter((s) => (s.durationSeconds || 0) > 0);
  if (sleepsWithDuration.length > 0) {
    const maxSecs = Math.max(...sleepsWithDuration.map((s) => s.durationSeconds || 0));
    const h = Math.floor(maxSecs / 3600);
    const m = Math.floor((maxSecs % 3600) / 60);
    longestSleepStr = h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  }

  // 히트맵: 수면 타입
  const getSleepTypeInHour = (hour: number): 'night' | 'nap' | null => {
    let hasNight = false;
    let hasNap = false;
    for (const log of todayLogs.filter((l) => l.type === 'sleep')) {
      const startH = new Date(log.startTime).getHours();
      let isMatch = false;
      if (log.endTime) {
        const endH = new Date(log.endTime).getHours();
        isMatch = startH <= endH
          ? hour >= startH && hour <= endH
          : hour >= startH || hour <= endH;
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

  // 히트맵: 행별 시간당 횟수
const hasActivityInMinutes = (rowId: string, hour: number, minStart: number, minEnd: number): boolean => {
  return todayLogs.some((l) => {
    const d = new Date(l.startTime);
    const h = d.getHours();
    const m = d.getMinutes();
    if (h !== hour) return false;
    if (m < minStart || m > minEnd) return false;
    if (rowId === 'feed') return ['breast', 'formula', 'weaning'].includes(l.type);
    if (rowId === 'pee') return l.type === 'diaper' && l.diaperType === 'pee';
    if (rowId === 'poop') return l.type === 'diaper' && l.diaperType === 'poop';
    if (rowId === 'cry') return l.type === 'cry';
    return false;
  });
};

  const handleDelete = (logId: string) => {
    triggerHaptic();
    if (confirm('이 기록을 삭제하시겠습니까?')) {
      deleteLog(logId);
      onLogUpdated();
    }
  };

  // 주간/2주 데이터
  const daysCount = period === 'week' ? 7 : 14;
  const dailyStats = Array.from({ length: daysCount }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysCount - 1 - idx));
    const dStr = getLocalDateStr(d);
    const dayLogs = babyLogs.filter((l) => getLocalDateStr(l.startTime) === dStr);

    const feedCnt = dayLogs.filter((l) => ['breast', 'formula', 'weaning'].includes(l.type)).length;
    const napSecs = dayLogs.filter((l) => l.type === 'sleep' && l.sleepType === 'nap').reduce((acc, l) => acc + (l.durationSeconds || 0), 0);
    const nightSecs = dayLogs.filter((l) => l.type === 'sleep' && l.sleepType === 'night').reduce((acc, l) => acc + (l.durationSeconds || 0), 0);
    const totalSleepSecs = dayLogs.filter((l) => l.type === 'sleep').reduce((acc, l) => acc + (l.durationSeconds || 0), 0);
    const peeCnt = dayLogs.filter((l) => l.type === 'diaper' && l.diaperType === 'pee').length;
    const poopCnt = dayLogs.filter((l) => l.type === 'diaper' && l.diaperType === 'poop').length;
    const diaperCnt = dayLogs.filter((l) => l.type === 'diaper').length;

    return {
      dateStr: dStr,
      displayDay: `${d.getMonth() + 1}/${d.getDate()}`,
      feedCnt,
      napHours: +(napSecs / 3600).toFixed(1),
      nightHours: +(nightSecs / 3600).toFixed(1),
      sleepHours: +(totalSleepSecs / 3600).toFixed(1),
      peeCnt,
      poopCnt,
      diaperCnt,
    };
  });

const maxWeeklyFeed = Math.max(1, ...dailyStats.map((d) => d.feedCnt));
const maxNapHours = Math.max(0.1, ...dailyStats.map((d) => d.napHours));
const maxNightHours = Math.max(0.1, ...dailyStats.map((d) => d.nightHours));
const maxWeeklyDiaper = Math.max(1, ...dailyStats.map((d) => d.diaperCnt));
const maxWeeklyPee = Math.max(1, ...dailyStats.map((d) => d.peeCnt));
const maxWeeklyPoop = Math.max(1, ...dailyStats.map((d) => d.poopCnt));

  const daysWithFeedData = dailyStats.filter((d) => d.feedCnt > 0).length;
  const avgFeedCount = daysWithFeedData > 0
    ? (dailyStats.reduce((acc, d) => acc + d.feedCnt, 0) / daysWithFeedData).toFixed(1)
    : '0.0';
  const daysWithSleepData = dailyStats.filter((d) => d.sleepHours > 0).length;
  const avgSleepHours = daysWithSleepData > 0
    ? (dailyStats.reduce((acc, d) => acc + d.sleepHours, 0) / daysWithSleepData).toFixed(1)
    : '0.0';

  const heatmapRows = [
    { id: 'feed',  label: '먹',  icon: '/icons/feed.png',  color: 'bg-[#FF6B6B]' },
    { id: 'sleep', label: '잠',  icon: '/icons/sleep.png', color: '' },
    { id: 'pee',   label: '소변', icon: '/icons/diaper.png', color: 'bg-[#86EFAC]' },
    { id: 'poop',  label: '대변', icon: '/icons/poop.png',  color: 'bg-[#FCD34D]' },
    { id: 'cry',   label: '울음', icon: '/icons/cry.png',   color: 'bg-[#FBBF24]' },
  ];

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto px-4 text-slate-800">
      {/* 기간 탭 */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1 mt-3">
        {[
          { id: 'today', label: '오늘 통계' },
          { id: 'week', label: '1주 분석' },
          { id: 'two_weeks', label: '2주 분석' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { triggerHaptic(); setPeriod(tab.id as PeriodTab); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              period === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== 오늘 탭 ===== */}
      {period === 'today' && (
        <div className="space-y-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
              <BarChart2 className="w-4 h-4 text-[#FF6B6B]" />
              <span>오늘 {baby.name}의 활동 분석</span>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {formatDateWithDay(new Date().toISOString())}
            </span>
          </div>

          {/* 2x2 요약 카드 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>수유 횟수</span>
                <img src="/icons/feed.png" alt="먹기" className="w-5 h-5 object-contain" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {todayFeedCount}<span className="text-xs font-bold text-slate-500 ml-1">회</span>
              </div>
              <div className="text-[11px] text-[#FF6B6B] font-bold">
                {todayFormulaMl > 0 ? `총 ${todayFormulaMl}mL` : '모유/이유식 포함'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>총 수면 시간</span>
                <img src="/icons/sleep.png" alt="잠자기" className="w-5 h-5 object-contain" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {Math.floor(todaySleepSecs / 3600)}<span className="text-xs font-bold text-slate-500 ml-0.5">h</span>{' '}
                {Math.floor((todaySleepSecs % 3600) / 60)}<span className="text-xs font-bold text-slate-500 ml-0.5">m</span>
              </div>
              <div className="text-[11px] text-[#A78BFA] font-bold">
                낮잠 {todaySleeps.filter((s) => s.sleepType === 'nap').length}회 포함
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>기저귀 교체</span>
                <img src="/icons/diaper.png" alt="소변" className="w-5 h-5 object-contain" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {todayDiaperCount}<span className="text-xs font-bold text-slate-500 ml-1">회</span>
              </div>
              <div className="text-[11px] text-[#34D399] font-bold">
                소변 {todayPeeCount}회 · 대변 {todayPoopCount}회
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>울음 진단</span>
                <img src="/icons/cry.png" alt="울음" className="w-5 h-5 object-contain" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {todayCryCount}<span className="text-xs font-bold text-slate-500 ml-1">회</span>
              </div>
              <div className="text-[11px] text-amber-500 font-bold">패턴 분석 기록</div>
            </div>
          </div>

          {/* 인사이트 가로 스크롤 */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>오늘 육아 요약 패턴</span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto py-1" style={{ scrollbarWidth: 'none' }}>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-[150px] flex-shrink-0 space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <img src="/icons/feed.png" alt="" className="w-3.5 h-3.5 object-contain" /> 평균 수유 간격
                </div>
                <div className="text-sm font-black text-[#FF6B6B]">{avgFeedIntervalStr}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-[150px] flex-shrink-0 space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <img src="/icons/sleep.png" alt="" className="w-3.5 h-3.5 object-contain" /> 평균 수면 텀
                </div>
                <div className="text-sm font-black text-[#A78BFA]">{avgSleepIntervalStr}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 min-w-[150px] flex-shrink-0 space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <img src="/icons/sleep.png" alt="" className="w-3.5 h-3.5 object-contain" /> 가장 긴 수면
                </div>
                <div className="text-sm font-black text-indigo-600">{longestSleepStr}</div>
              </div>
            </div>
          </div>

          {/* 히트맵 */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                📊 시간대별 활동 히트맵
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">위/아래 = 30분</span>
            </div>

            {/* 시간 라벨 */}
            <div className="grid gap-2" style={{ gridTemplateColumns: '48px 1fr' }}>
              <div />
            <div className="flex text-[9px] text-slate-400 font-bold">
              {Array.from({ length: 24 }).map((_, hour) => (
                <div key={hour} className="flex-1 text-center">
                  {hour % 2 === 0 ? String(hour).padStart(2, '0') : ''}
                </div>
              ))}
            </div>
            </div>

            {/* 히트맵 행 */}
            <div className="space-y-2">
              {heatmapRows.map((row) => (
                <div key={row.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: '48px 1fr' }}>
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <img src={row.icon} alt={row.label} className="w-4 h-4 object-contain" />
                    <span>{row.label}</span>
                  </div>
                  <div className="flex gap-0.5 items-end" style={{ height: '28px' }}>
                    {Array.from({ length: 24 }).map((_, hour) => {
              if (row.id === 'sleep') {
                const sleepType = getSleepTypeInHour(hour);
                const bgClass = sleepType === 'night'
                  ? 'bg-[#6D28D9]'
                  : sleepType === 'nap'
                  ? 'bg-[#C4B5FD]'
                  : 'bg-slate-100 border border-slate-200/50';
                return (
                  <div key={hour} className="flex-1 flex flex-col gap-0.5 self-center">
                    <div className={`h-3 rounded-sm ${bgClass}`} />
                    <div className={`h-3 rounded-sm ${bgClass}`} />
                  </div>
                );
              }

              const firstHalf = hasActivityInMinutes(row.id, hour, 0, 29);
              const secondHalf = hasActivityInMinutes(row.id, hour, 30, 59);
              return (
                <div key={hour} className="flex-1 flex flex-col gap-0.5 self-center">
                  <div className={`h-3 rounded-sm ${firstHalf ? row.color : 'bg-slate-100'}`} />
                  <div className={`h-3 rounded-sm ${secondHalf ? row.color : 'bg-slate-100'}`} />
                </div>
              );
            })}
                  </div>
                </div>
              ))}
            </div>

            {/* 범례 */}
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] text-slate-500 font-semibold pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200" />
                <span>활동 없음</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#C4B5FD]" />
                <span>낮잠</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#6D28D9]" />
                <span>밤잠</span>
              </div>
            </div>
          </div>

          {/* 상세 기록 목록 */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowLogList(!showLogList)}
                className="font-bold text-xs text-slate-800 flex items-center gap-1.5"
              >
                <span>📝 상세 기록 목록 ({todayLogs.length}건)</span>
                {showLogList ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              <button
                onClick={() => { triggerHaptic(); setSelectedBackfillTime(undefined); setShowBackfillModal(true); }}
                className="px-3 py-1.5 bg-[#FF6B6B]/10 text-[#FF6B6B] rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>소급 기록</span>
              </button>
            </div>

            {showLogList && (
              <div className="pt-2 border-t border-slate-100 space-y-2 max-h-60 overflow-y-auto">
                {todayLogs.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">오늘 기록이 없습니다.</div>
                ) : (
                  todayLogs.map((log) => {
                    const timeStr = formatTimeOnly(log.startTime);
                    let title = '기록';
                    let detail = '';
                    if (['breast', 'formula', 'weaning'].includes(log.type)) {
                      title = log.type === 'breast' ? '모유' : log.type === 'formula' ? '분유' : '이유식';
                      detail = log.type === 'formula' ? `${log.amountMl}mL` : log.type === 'breast' ? `${Math.ceil((log.durationSeconds || 0) / 60)}분` : '';
                    } else if (log.type === 'sleep') {
                      title = log.sleepType === 'nap' ? '낮잠' : '밤잠';
                      detail = log.durationSeconds ? `${Math.floor(log.durationSeconds / 3600)}시간 ${Math.floor((log.durationSeconds % 3600) / 60)}분` : '진행 중';
                    } else if (log.type === 'diaper') {
                      title = log.diaperType === 'pee' ? '소변' : '대변';
                    }
                    return (
                      <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800">{title}</span>
                          <span className="text-slate-400 text-[11px]">{timeStr}</span>
                          <span className="text-slate-600 font-bold">{detail}</span>
                        </div>
                        <button type="button" onClick={() => handleDelete(log.id)} className="text-slate-400 hover:text-red-500 p-1">
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

      {/* ===== 주간/2주 탭 ===== */}
      {(period === 'week' || period === 'two_weeks') && (
        <div className="space-y-4">
          {/* 요약 배너 */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-3xl space-y-2 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{period === 'week' ? '1주간' : '2주간'} 평균 패턴 분석</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">일 평균 수유 횟수</span>
                <strong className="text-lg font-black text-[#FF6B6B]">{avgFeedCount} 회</strong>
                <span className="text-[9px] text-slate-500 block">기록된 날 기준</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px]">일 평균 수면 시간</span>
                <strong className="text-lg font-black text-[#A78BFA]">{avgSleepHours} 시간</strong>
                <span className="text-[9px] text-slate-500 block">기록된 날 기준</span>
              </div>
            </div>
          </div>

          {/* 수유 횟수 차트 */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <img src="/icons/feed.png" alt="" className="w-4 h-4 object-contain" />
                <span>일별 수유 횟수 (회)</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">목표: 5~8회</span>
            </div>
            <div className="flex items-end justify-between gap-1 h-36 px-1 border-b border-slate-100">
              {dailyStats.map((d) => {
                const pct = d.feedCnt > 0 ? Math.max(12, Math.round((d.feedCnt / maxWeeklyFeed) * 100)) : 3;
                return (
                  <div key={d.dateStr} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                    <span className="text-[9px] font-bold text-slate-600">{d.feedCnt > 0 ? `${d.feedCnt}` : ''}</span>
                    <div className="w-full max-w-[18px] bg-[#FF6B6B] rounded-t-md" style={{ height: `${pct}%` }} />
                    <span className="text-[9px] text-slate-400">{d.displayDay}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 수면 시간 차트 */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <img src="/icons/sleep.png" alt="" className="w-4 h-4 object-contain" />
                <span>일별 수면 시간</span>
              </h4>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-[#A78BFA] inline-block" /> 낮잠</span>
                <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-[#6D28D9] inline-block" /> 밤잠</span>
              </div>
            </div>
            <div className="flex items-end justify-between gap-1 h-36 px-1 border-b border-slate-100">
                    {dailyStats.map((d) => {
                  const napPct = d.napHours > 0
                    ? Math.max(25, Math.round((d.napHours / maxNapHours) * 85))
                    : 0;
                  const nightPct = d.nightHours > 0
                    ? Math.max(25, Math.round((d.nightHours / maxNightHours) * 85))
                    : 0;
                return (
                  <div key={d.dateStr} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                    <span className="text-[8px] font-bold text-slate-600">{d.sleepHours > 0 ? `${d.sleepHours}h` : ''}</span>
                    <div className="flex items-end gap-0.5 w-full justify-center">
                      <div className="w-1/2 max-w-[9px] bg-[#A78BFA] rounded-t-sm" style={{ height: `${napPct}%` }} />
                      <div className="w-1/2 max-w-[9px] bg-[#6D28D9] rounded-t-sm" style={{ height: `${nightPct}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400">{d.displayDay}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 기저귀 차트 */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <img src="/icons/diaper.png" alt="" className="w-4 h-4 object-contain" />
                <span>일별 기저귀 교체</span>
              </h4>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-[#34D399] inline-block" /> 소변</span>
                <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-sm bg-[#F59E0B] inline-block" /> 대변</span>
              </div>
            </div>
            <div className="flex items-end justify-between gap-1 h-36 px-1 border-b border-slate-100">
              {dailyStats.map((d) => {
                // 교체
const peePct = d.peeCnt > 0
  ? Math.max(25, Math.round((d.peeCnt / maxWeeklyPee) * 85))
  : 0;
const poopPct = d.poopCnt > 0
  ? Math.max(25, Math.round((d.poopCnt / maxWeeklyPoop) * 85))
  : 0;
            return (
                  <div key={d.dateStr} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                    <span className="text-[8px] font-bold text-slate-600">{d.diaperCnt > 0 ? `${d.diaperCnt}` : ''}</span>
                    <div className="flex items-end gap-0.5 w-full justify-center">
                      <div className="w-1/2 max-w-[9px] bg-[#34D399] rounded-t-sm" style={{ height: `${peePct}%` }} />
                      <div className="w-1/2 max-w-[9px] bg-[#F59E0B] rounded-t-sm" style={{ height: `${poopPct}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400">{d.displayDay}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
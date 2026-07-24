import React, { useState, useEffect, useRef } from 'react';
import { ActivityLog, WeaningUnit } from '../types';
import { triggerHaptic, addLog, formatDuration, formatTimeAgo, getAgeGuideInfo } from '../utils';
import { FEEDING_BABY_IMAGE } from '../data/avatars';
import { Play, Pause, Check, Plus, Minus, Clock, Utensils, Heart, ChevronDown, ChevronUp, Sparkles, BookOpen } from 'lucide-react';

interface FeedPanelProps {
  babyId: string;
  birthDate?: string;
  feedingLogs: ActivityLog[];
  weaningStarted: boolean;
  onLogAdded: () => void;
}

type FeedSubTab = 'breast' | 'formula' | 'weaning';

export const FeedPanel: React.FC<FeedPanelProps> = ({
  babyId,
  birthDate,
  feedingLogs,
  weaningStarted,
  onLogAdded,
}) => {
  const [subTab, setSubTab] = useState<FeedSubTab>('breast');
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const ageGuide = getAgeGuideInfo(birthDate || new Date().toISOString());

  // --- BREAST FEEDING STOPWATCH ---
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);
  const [leftSeconds, setLeftSeconds] = useState<number>(0);
  const [rightSeconds, setRightSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning && activeSide) {
      timerRef.current = setInterval(() => {
        if (activeSide === 'left') {
          setLeftSeconds((prev) => prev + 1);
        } else if (activeSide === 'right') {
          setRightSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, activeSide]);

  const handleStartBreast = (side: 'left' | 'right') => {
    triggerHaptic();
    if (activeSide === side && isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      setActiveSide(side);
      setIsTimerRunning(true);
    }
  };

  const handleFinishBreast = () => {
    triggerHaptic();
    const totalSecs = leftSeconds + rightSeconds;
    if (totalSecs === 0) return;

    let breastSide: 'left' | 'right' | 'both' = 'both';
    if (leftSeconds > 0 && rightSeconds === 0) breastSide = 'left';
    if (rightSeconds > 0 && leftSeconds === 0) breastSide = 'right';

    addLog({
      babyId,
      type: 'breast',
      startTime: new Date().toISOString(),
      breastSide,
      durationSeconds: totalSecs,
      memo: `좌: ${Math.floor(leftSeconds / 60)}분 / 우: ${Math.floor(rightSeconds / 60)}분`,
    });

    setLeftSeconds(0);
    setRightSeconds(0);
    setIsTimerRunning(false);
    setActiveSide(null);
    onLogAdded();
  };

  // --- FORMULA FEEDING ---
  const [formulaMl, setFormulaMl] = useState<number>(120);

  const handleAdjustFormula = (delta: number) => {
    triggerHaptic();
    setFormulaMl((prev) => Math.max(10, Math.min(350, prev + delta)));
  };

  const handleSaveFormula = () => {
    triggerHaptic();
    addLog({
      babyId,
      type: 'formula',
      startTime: new Date().toISOString(),
      amountMl: formulaMl,
    });
    onLogAdded();
  };

  // --- WEANING FOOD ---
  const [weaningFood, setWeaningFood] = useState<string>('소고기미음');
  const [weaningAmount, setWeaningAmount] = useState<number>(60);
  const [weaningUnit, setWeaningUnit] = useState<WeaningUnit>('g');

  const handleSaveWeaning = () => {
    triggerHaptic();
    addLog({
      babyId,
      type: 'weaning',
      startTime: new Date().toISOString(),
      weaningFood: weaningFood || '이유식',
      weaningAmount,
      weaningUnit,
    });
    onLogAdded();
  };

  // Last feed log
  const lastLog = feedingLogs[0];

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      {/* Visual Character Header */}
      <div className="bg-gradient-to-r from-rose-50 to-orange-50 p-3 rounded-2xl border border-rose-100 flex items-center gap-3">
        <img
          src={FEEDING_BABY_IMAGE}
          alt="수유 아이콘"
          referrerPolicy="no-referrer"
          className="w-12 h-12 rounded-xl object-cover border border-rose-200/80 shadow-xs"
        />
        <div>
          <div className="text-xs font-bold text-slate-800">맛있는 수유 타임 🍼</div>
          <div className="text-[11px] text-slate-500">
            원터치로 간편하게 기록하고 수유 간격을 관리하세요.
          </div>
        </div>
      </div>

      {/* Sub Tab Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
        <button
          onClick={() => {
            triggerHaptic();
            setSubTab('breast');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'breast'
              ? 'bg-white text-[#FF6B6B] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🤱 모유 수유
        </button>
        <button
          onClick={() => {
            triggerHaptic();
            setSubTab('formula');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            subTab === 'formula'
              ? 'bg-white text-[#FF6B6B] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🍼 분유 수유
        </button>
        {(weaningStarted || subTab === 'weaning') && (
          <button
            onClick={() => {
              triggerHaptic();
              setSubTab('weaning');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              subTab === 'weaning'
                ? 'bg-white text-[#FF6B6B] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🥣 이유식
          </button>
        )}
      </div>

      {/* BREAST PANEL */}
      {subTab === 'breast' && (
        <div className="space-y-4 pt-1">
          {/* Stopwatch Controls */}
          <div className="grid grid-cols-2 gap-3">
            {/* Left Breast */}
            <div
              className={`p-4 rounded-2xl border text-center transition-all ${
                activeSide === 'left' && isTimerRunning
                  ? 'border-[#FF6B6B] bg-[#FF6B6B]/5 ring-2 ring-[#FF6B6B]/20'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-500 mb-1">👈 왼쪽 가슴</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight my-1">
                {formatDuration(leftSeconds)}
              </div>
              <button
                type="button"
                onClick={() => handleStartBreast('left')}
                className={`mt-2 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  activeSide === 'left' && isTimerRunning
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-[#FF6B6B] text-white hover:bg-[#FF5252]'
                }`}
              >
                {activeSide === 'left' && isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>일시정지</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{leftSeconds > 0 ? '이어서 측정' : '시작'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Breast */}
            <div
              className={`p-4 rounded-2xl border text-center transition-all ${
                activeSide === 'right' && isTimerRunning
                  ? 'border-[#FF6B6B] bg-[#FF6B6B]/5 ring-2 ring-[#FF6B6B]/20'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-500 mb-1">오른쪽 가슴 👉</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight my-1">
                {formatDuration(rightSeconds)}
              </div>
              <button
                type="button"
                onClick={() => handleStartBreast('right')}
                className={`mt-2 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  activeSide === 'right' && isTimerRunning
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-[#FF6B6B] text-white hover:bg-[#FF5252]'
                }`}
              >
                {activeSide === 'right' && isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>일시정지</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{rightSeconds > 0 ? '이어서 측정' : '시작'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Record button */}
          {(leftSeconds > 0 || rightSeconds > 0) && (
            <button
              type="button"
              onClick={handleFinishBreast}
              className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-md hover:bg-slate-800 active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>
                수유 완료 (총 {Math.ceil((leftSeconds + rightSeconds) / 60)}분 기록)
              </span>
            </button>
          )}
        </div>
      )}

      {/* FORMULA PANEL */}
      {subTab === 'formula' && (
        <div className="space-y-4 pt-1">
          {/* Main Display */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
            <div className="text-xs font-bold text-slate-400 mb-1">1회 분유 섭취량</div>
            <div className="text-4xl font-black text-[#FF6B6B] tracking-tight">
              {formulaMl} <span className="text-xl font-bold text-slate-500">mL</span>
            </div>

            {/* Adjustment Controls */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => handleAdjustFormula(-20)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center"
              >
                -20
              </button>
              <button
                onClick={() => handleAdjustFormula(-10)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center"
              >
                -10
              </button>
              <button
                onClick={() => handleAdjustFormula(10)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center"
              >
                +10
              </button>
              <button
                onClick={() => handleAdjustFormula(20)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center"
              >
                +20
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-200/60">
              {[80, 100, 120, 150, 180, 200, 240].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    triggerHaptic();
                    setFormulaMl(preset);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    formulaMl === preset
                      ? 'bg-[#FF6B6B] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {preset}mL
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveFormula}
            className="w-full py-3.5 bg-[#FF6B6B] text-white rounded-2xl text-sm font-bold shadow-md hover:bg-[#FF5252] active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{formulaMl}mL 즉시 기록하기</span>
          </button>
        </div>
      )}

      {/* WEANING PANEL */}
      {subTab === 'weaning' && (
        <div className="space-y-4 pt-1">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                이유식 종류 (음식명)
              </label>
              <input
                type="text"
                value={weaningFood}
                onChange={(e) => setWeaningFood(e.target.value)}
                placeholder="예) 소고기미음"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#FF6B6B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                섭취량 및 단위
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={weaningAmount}
                  onChange={(e) => setWeaningAmount(Number(e.target.value) || 0)}
                  className="w-28 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF6B6B]"
                />
                <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
                  {(['g', 'spoon', 'cup'] as WeaningUnit[]).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => {
                        triggerHaptic();
                        setWeaningUnit(unit);
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                        weaningUnit === unit
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      {unit === 'g' ? 'g' : unit === 'spoon' ? '스푼' : '컵'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveWeaning}
            className="w-full py-3.5 bg-[#FF6B6B] text-white rounded-2xl text-sm font-bold shadow-md hover:bg-[#FF5252] active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>
              {weaningFood} {weaningAmount}
              {weaningUnit === 'g' ? 'g' : weaningUnit === 'spoon' ? '스푼' : '컵'} 기록하기
            </span>
          </button>
        </div>
      )}

      {/* Age-based Feeding Guide Collapsible Banner */}
      <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3.5 space-y-2.5 transition-all">
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setShowGuide(!showGuide);
          }}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-[#FF6B6B] flex items-center justify-center font-extrabold text-sm shadow-2xs">
              🍼
            </div>
            <div>
              <div className="text-xs font-black text-rose-950 flex items-center gap-1.5">
                <span>{ageGuide.title} 수유 가이드</span>
                <span className="text-[10px] bg-rose-200/80 text-rose-800 font-bold px-1.5 py-0.2 rounded-md">
                  맞춤
                </span>
              </div>
              {!showGuide && (
                <div className="text-[11px] text-rose-700 font-medium truncate max-w-[210px] mt-0.5">
                  간격 {ageGuide.feedIntervalHours} · 1회 {ageGuide.feedVolumeMl}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-white/80 px-2.5 py-1 rounded-xl border border-rose-200 shadow-2xs">
            <span>{showGuide ? '접기' : '더보기'}</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showGuide && (
          <div className="pt-2.5 border-t border-rose-200/60 space-y-2.5 text-xs text-rose-950">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200/60 space-y-0.5">
                <div className="text-[10px] font-bold text-rose-500">⏱️ 권장 수유 간격</div>
                <div className="font-extrabold text-slate-900">{ageGuide.feedIntervalHours}</div>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200/60 space-y-0.5">
                <div className="text-[10px] font-bold text-rose-500">🍼 1회 권장량(mL)</div>
                <div className="font-extrabold text-slate-900">{ageGuide.feedVolumeMl}</div>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200/60 space-y-0.5">
                <div className="text-[10px] font-bold text-rose-500">📊 하루 수유 횟수</div>
                <div className="font-extrabold text-slate-900">{ageGuide.dailyFeedCount || '5~8회'}</div>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200/60 space-y-0.5">
                <div className="text-[10px] font-bold text-rose-500">😴 깨어있는 시간</div>
                <div className="font-extrabold text-slate-900">{ageGuide.awakeWindowMinutes}</div>
              </div>
            </div>

            {ageGuide.tip && (
              <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200/60 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] font-medium leading-relaxed text-slate-700">
                  <strong className="text-rose-900 font-bold block mb-0.5">💡 수유 팁</strong>
                  {ageGuide.tip}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Last Feed Info Footer */}
      {lastLog && (
        <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>최근 수유:</span>
            <strong className="text-slate-700">{formatTimeAgo(lastLog.startTime)}</strong>
          </div>
          <div>
            {lastLog.type === 'breast' &&
              `모유 (${lastLog.breastSide === 'left' ? '왼쪽' : lastLog.breastSide === 'right' ? '오른쪽' : '양쪽'} ${Math.ceil((lastLog.durationSeconds || 0) / 60)}분)`}
            {lastLog.type === 'formula' && `분유 ${lastLog.amountMl}mL`}
            {lastLog.type === 'weaning' &&
              `이유식 ${lastLog.weaningFood} ${lastLog.weaningAmount}${lastLog.weaningUnit}`}
          </div>
        </div>
      )}
    </div>
  );
};

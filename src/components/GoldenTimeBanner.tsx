import React, { useEffect, useState } from 'react';
import { PredictionResult } from '../types';
import { Milk, Moon, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { getCharacterImage } from '../utils';

interface GoldenTimeBannerProps {
  prediction: PredictionResult;
  babyName: string;
  birthDate?: string;
  gender?: 'male' | 'female';
}

export const GoldenTimeBanner: React.FC<GoldenTimeBannerProps> = ({
  prediction,
  babyName,
  birthDate,
  gender,
}) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000); // refresh every 10 seconds
    return () => clearInterval(timer);
  }, []);

  // Format countdowns
  const formatCountdown = (mins: number) => {
    if (mins <= 0) return '지금 권장!';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}분 후`;
    return `${h}시간 ${m}분 후`;
  };

  const formatElapsed = (mins: number) => {
    if (mins >= 999) return '기록 없음';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}분 경과`;
    return `${h}시간 ${m}분 경과`;
  };

  const characterImg = birthDate ? getCharacterImage(birthDate, gender) : undefined;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-3xl shadow-sm space-y-3 my-3 border border-slate-700/50">
      {/* Top Banner Tagline */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-coral-400">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6B6B]" />
          <span className="text-slate-200">{babyName} 골든타임 리듬</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>실시간 예측</span>
          </div>
          {characterImg && (
            <img
              src={characterImg}
              alt={babyName}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="w-8 h-8 rounded-full object-contain bg-slate-800 border border-slate-600 p-0.5"
            />
          )}
        </div>
      </div>

      {/* Grid of Status Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Feeding Prediction */}
        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <span>🍼</span> 수유 예측
            </span>
            {prediction.nextFeedMinutes <= 15 && (
              <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-bold">
                준비
              </span>
            )}
          </div>

          <div className="my-1">
            <div className="text-lg font-black text-white tracking-tight">
              {prediction.nextFeedMinutes <= 0
                ? '수유 시각 도착'
                : formatCountdown(prediction.nextFeedMinutes)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              수유 후 {formatElapsed(prediction.lastFeedMinutesAgo)}
            </div>
          </div>
        </div>

        {/* Sleep Prediction */}
        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <span>😴</span> 수면 예측
            </span>
            {prediction.isCurrentlySleeping ? (
              <span className="text-[9px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded font-bold">
                꿈나라
              </span>
            ) : (
              prediction.nextSleepMinutes <= 15 && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                  졸림
                </span>
              )
            )}
          </div>

          <div className="my-1">
            {prediction.isCurrentlySleeping ? (
              <>
                <div className="text-lg font-black text-indigo-300 tracking-tight">
                  수면 진행 중 🌙
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  아이가 안심하고 자는 중입니다
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-black text-white tracking-tight">
                  {prediction.nextSleepMinutes <= 0
                    ? '수면 타이밍'
                    : formatCountdown(prediction.nextSleepMinutes)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  기상 후 {formatElapsed(prediction.awakeMinutes)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

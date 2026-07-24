import React, { useState } from 'react';
import { ActivityLog, PoopConsistency } from '../types';
import { triggerHaptic, addLog, formatTimeAgo } from '../utils';
import { Droplets, Check, Clock, Sparkles } from 'lucide-react';

interface DiaperPanelProps {
  babyId: string;
  diaperLogs: ActivityLog[];
  onLogAdded: () => void;
}

export const DiaperPanel: React.FC<DiaperPanelProps> = ({
  babyId,
  diaperLogs,
  onLogAdded,
}) => {
  const [showPoopModal, setShowPoopModal] = useState<boolean>(false);
  const [poopConsistency, setPoopConsistency] = useState<PoopConsistency>('normal');

  // Today count
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = diaperLogs.filter((l) => l.startTime.startsWith(todayStr));
  const peeCount = todayLogs.filter((l) => l.diaperType === 'pee').length;
  const poopCount = todayLogs.filter((l) => l.diaperType === 'poop').length;

  // Last diaper log
  const lastLog = diaperLogs[0];

  const handlePeeRecord = () => {
    triggerHaptic();
    addLog({
      babyId,
      type: 'diaper',
      diaperType: 'pee',
      startTime: new Date().toISOString(),
    });
    onLogAdded();
  };

  const handlePoopRecord = () => {
    triggerHaptic();
    addLog({
      babyId,
      type: 'diaper',
      diaperType: 'poop',
      poopConsistency,
      startTime: new Date().toISOString(),
    });
    setShowPoopModal(false);
    onLogAdded();
  };

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      {/* Today Summary Banner */}
      <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/80 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-emerald-800">오늘 기저귀 현황 💧</div>
          <div className="text-lg font-black text-emerald-950 mt-0.5">
            소변 <span className="text-[#34D399]">{peeCount}회</span> · 대변{' '}
            <span className="text-amber-600">{poopCount}회</span>
          </div>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#34D399] flex items-center justify-center font-bold text-xl">
          💧
        </div>
      </div>

      {/* Main One-Touch Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Pee Button */}
        <button
          type="button"
          onClick={handlePeeRecord}
          className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/80 active:scale-97 transition-all text-center space-y-2 group"
        >
          <div className="w-12 h-12 bg-white rounded-full shadow-xs mx-auto flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            💛
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900">소변 원터치</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">탭하면 즉시 기록</div>
          </div>
        </button>

        {/* Poop Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setShowPoopModal(true);
          }}
          className="p-5 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100/80 active:scale-97 transition-all text-center space-y-2 group"
        >
          <div className="w-12 h-12 bg-white rounded-full shadow-xs mx-auto flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            💩
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900">대변 기록</div>
            <div className="text-[11px] text-amber-700 font-semibold mt-0.5">변 상태 선택 후 기록</div>
          </div>
        </button>
      </div>

      {/* Poop Consistency Modal */}
      {showPoopModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 space-y-4 shadow-xl border border-slate-100">
            <div className="text-center">
              <div className="text-3xl mb-1">💩</div>
              <h3 className="font-bold text-base text-slate-900">대변 상태를 선택해주세요</h3>
              <p className="text-xs text-slate-500">소아과 상담 시 유용한 데이터가 됩니다.</p>
            </div>

            <div className="space-y-2">
              {[
                { id: 'normal', label: '정상변 (무름/황금색)', icon: '🟢' },
                { id: 'loose', label: '묽은 변 (설사 양상)', icon: '🟡' },
                { id: 'hard', label: '딱딱한 변 (변비 양상)', icon: '🟤' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    setPoopConsistency(item.id as PoopConsistency);
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all ${
                    poopConsistency === item.id
                      ? 'border-amber-500 bg-amber-50 text-slate-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  {poopConsistency === item.id && (
                    <Check className="w-4 h-4 text-amber-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPoopModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handlePoopRecord}
                className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 shadow-xs"
              >
                기록 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Last Diaper Footer */}
      {lastLog && (
        <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>최근 교체:</span>
            <strong className="text-slate-700">{formatTimeAgo(lastLog.startTime)}</strong>
          </div>
          <div>
            {lastLog.diaperType === 'pee' ? '💛 소변' : '💩 대변'}
            {lastLog.poopConsistency &&
              ` (${
                lastLog.poopConsistency === 'normal'
                  ? '정상'
                  : lastLog.poopConsistency === 'loose'
                  ? '묽음'
                  : '딱딱함'
              })`}
          </div>
        </div>
      )}
    </div>
  );
};

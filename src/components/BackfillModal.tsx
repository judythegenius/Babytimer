import React, { useState } from 'react';
import { ActivityLog, ActivityType, DiaperType, SleepType } from '../types';
import { addLog, triggerHaptic } from '../utils';
import { X, Check } from 'lucide-react';

interface BackfillModalProps {
  babyId: string;
  initialTimeISO?: string;
  onClose: () => void;
  onSave: () => void;
}

export const BackfillModal: React.FC<BackfillModalProps> = ({
  babyId,
  initialTimeISO,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<ActivityType>('formula');
  const [startTime, setStartTime] = useState<string>(
    initialTimeISO
      ? new Date(initialTimeISO).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [amountMl, setAmountMl] = useState<number>(120);
  const [sleepType, setSleepType] = useState<SleepType>('nap');
  const [sleepDurationMins, setSleepDurationMins] = useState<number>(60);
  const [diaperType, setDiaperType] = useState<DiaperType>('pee');
  const [memo, setMemo] = useState<string>('');

  const handleSave = () => {
    triggerHaptic();
    const startIso = new Date(startTime).toISOString();

    let endTimeIso: string | undefined = undefined;
    let durationSeconds: number | undefined = undefined;

    if (type === 'sleep') {
      const endMs = new Date(startIso).getTime() + sleepDurationMins * 60 * 1000;
      endTimeIso = new Date(endMs).toISOString();
      durationSeconds = sleepDurationMins * 60;
    }

    addLog({
      babyId,
      type,
      startTime: startIso,
      endTime: endTimeIso,
      amountMl: type === 'formula' ? amountMl : undefined,
      sleepType: type === 'sleep' ? sleepType : undefined,
      durationSeconds,
      diaperType: type === 'diaper' ? diaperType : undefined,
      memo: memo ? memo : undefined,
      isBackfilled: true,
    });

    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900">소급(백필) 기록 추가 ⏱️</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Activity Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            활동 카테고리
          </label>
          <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-2xl">
            {[
              { id: 'formula', label: '🍼 먹' },
              { id: 'sleep', label: '😴 잠' },
              { id: 'diaper', label: '💧 대소변' },
              { id: 'cry', label: '😭 울음' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  triggerHaptic();
                  setType(cat.id as ActivityType);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  type === cat.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date / Time */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            기록 일시
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6B6B]"
          />
        </div>

        {/* Conditional Details */}
        {type === 'formula' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              분유량 (mL)
            </label>
            <input
              type="number"
              value={amountMl}
              onChange={(e) => setAmountMl(Number(e.target.value) || 0)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-[#FF6B6B]"
            />
          </div>
        )}

        {type === 'sleep' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                수면 종류
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSleepType('nap')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                    sleepType === 'nap'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  낮잠
                </button>
                <button
                  type="button"
                  onClick={() => setSleepType('night')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                    sleepType === 'night'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  밤잠
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                수면 시간 (분)
              </label>
              <input
                type="number"
                value={sleepDurationMins}
                onChange={(e) => setSleepDurationMins(Number(e.target.value) || 0)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {type === 'diaper' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              대소변 구분
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDiaperType('pee')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                  diaperType === 'pee'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                💛 소변
              </button>
              <button
                type="button"
                onClick={() => setDiaperType('poop')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                  diaperType === 'poop'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                💩 대변
              </button>
            </div>
          </div>
        )}

        {/* Memo */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            메모 (선택)
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="특이사항 기록"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 shadow-xs flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>기록 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};

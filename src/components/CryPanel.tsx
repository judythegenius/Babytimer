import React, { useState } from 'react';
import { ActivityLog, CryDiagnosisResult } from '../types';
import { diagnoseCryReasons, triggerHaptic, addLog } from '../utils';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react';

interface CryPanelProps {
  babyId: string;
  birthDate: string;
  babyLogs: ActivityLog[];
  onSelectCategory: (cat: 'feed' | 'sleep' | 'diaper' | 'cry') => void;
  onLogAdded: () => void;
}

export const CryPanel: React.FC<CryPanelProps> = ({
  babyId,
  birthDate,
  babyLogs,
  onSelectCategory,
  onLogAdded,
}) => {
  const [isDiagnosed, setIsDiagnosed] = useState<boolean>(false);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<CryDiagnosisResult | null>(null);

  const handleRunDiagnosis = (currentChecklist: string[] = checklist) => {
    triggerHaptic();
    const result = diagnoseCryReasons(birthDate, babyLogs, currentChecklist);
    setDiagnosis(result);
    setIsDiagnosed(true);
  };

  const toggleChecklistItem = (itemKey: string) => {
    triggerHaptic();
    const updated = checklist.includes(itemKey)
      ? checklist.filter((i) => i !== itemKey)
      : [...checklist, itemKey];
    setChecklist(updated);
    if (isDiagnosed) {
      handleRunDiagnosis(updated);
    }
  };

  const handleRecordCryOnly = () => {
    triggerHaptic();
    addLog({
      babyId,
      type: 'cry',
      startTime: new Date().toISOString(),
      cryDiagnosis: diagnosis || undefined,
      memo: '울음 원인 분석 및 기록 저장',
    });
    onLogAdded();
    setIsDiagnosed(false);
  };

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      {!isDiagnosed ? (
        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
            😭
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-900">지금 아기가 울고 있나요?</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              수유/수면/기저귀 타임스탬프 패턴을 실시간 분석하여
              우선순위 울음 원인을 제시해드립니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleRunDiagnosis()}
            className="w-full py-4 bg-[#FBBF24] text-slate-900 rounded-2xl text-sm font-black shadow-md hover:bg-amber-400 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 fill-current" />
            <span>울음 원인 진단 시작하기</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
              <span>😭</span>
              <span>울음 원인 분석 결과</span>
            </div>
            <button
              onClick={() => setIsDiagnosed(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-medium underline"
            >
              다시 진단
            </button>
          </div>

          {/* Ranked Reasons */}
          <div className="space-y-2.5">
            {diagnosis?.rankedReasons.slice(0, 3).map((item, index) => {
              const isFirst = index === 0;

              return (
                <div
                  key={item.reason}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isFirst
                      ? 'border-amber-400 bg-amber-50/80 shadow-xs ring-1 ring-amber-400/30'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isFirst ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">
                        {item.reasonLabel}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        item.confidence === 'high'
                          ? 'bg-red-100 text-red-700'
                          : item.confidence === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.confidence === 'high'
                        ? '가능성 매우 높음'
                        : item.confidence === 'medium'
                        ? '가능성 있음'
                        : '참고'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 pl-7 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Interactive Checklist */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-700">
              체크리스트 (선택 시 결과가 재조정됩니다)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'diaper', label: '기저귀 이상 없음' },
                { key: 'burp', label: '트림 시도 완료' },
                { key: 'temp', label: '실내 온습도 쾌적' },
                { key: 'hug', label: '안아주기 시도함' },
              ].map((chk) => (
                <button
                  key={chk.key}
                  type="button"
                  onClick={() => toggleChecklistItem(chk.key)}
                  className={`p-2 rounded-xl border text-left text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    checklist.includes(chk.key)
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      checklist.includes(chk.key)
                        ? 'text-emerald-600 fill-emerald-100'
                        : 'text-slate-300'
                    }`}
                  />
                  <span>{chk.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Action Navigation Buttons */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  onSelectCategory('feed');
                }}
                className="py-3 bg-[#FF6B6B] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#FF5252] transition-all flex items-center justify-center gap-1"
              >
                <span>🍼 수유하러 가기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  onSelectCategory('sleep');
                }}
                className="py-3 bg-[#A78BFA] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#9061F9] transition-all flex items-center justify-center gap-1"
              >
                <span>😴 재우러 가기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleRecordCryOnly}
              className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
            >
              울음 발생 타임스탬프만 기록하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

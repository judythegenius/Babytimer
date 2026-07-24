import React, { useState } from 'react';
import { Baby, AppSettings, FeedingMode, BabyGender } from '../types';
import { triggerHaptic, saveBabies, saveAppSettings } from '../utils';
import { DEFAULT_BABY_AVATAR, PRESET_AVATARS } from '../data/avatars';
import { X, Save, Download, Plus, Upload, Image as ImageIcon } from 'lucide-react';

interface SettingsModalProps {
  babies: Baby[];
  settings: AppSettings;
  activeBabyId: string;
  onClose: () => void;
  onSaved: (updatedBabies: Baby[], updatedSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  babies,
  settings,
  activeBabyId,
  onClose,
  onSaved,
}) => {
  const [localBabies, setLocalBabies] = useState<Baby[]>(babies);
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const activeBabyIndex = localBabies.findIndex((b) => b.id === activeBabyId);
  const currentBaby = localBabies[activeBabyIndex] || localBabies[0];

  const handleUpdateCurrentBaby = (fields: Partial<Baby>) => {
    const updated = localBabies.map((b) =>
      b.id === currentBaby.id ? { ...b, ...fields } : b
    );
    setLocalBabies(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          handleUpdateCurrentBaby({ avatarUrl: result });
          triggerHaptic();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSecondBaby = () => {
    triggerHaptic();
    const newTwin: Baby = {
      id: `baby_twin_${Date.now()}`,
      name: '별님이',
      birthDate: currentBaby.birthDate,
      gender: currentBaby.gender === 'female' ? 'male' : 'female',
      feedingMode: 'mixed',
      weaningStarted: false,
      isTwin: true,
    };
    setLocalBabies([...localBabies, newTwin]);
  };

  const handleSaveAll = () => {
    triggerHaptic();
    saveBabies(localBabies);
    saveAppSettings(localSettings);
    onSaved(localBabies, localSettings);
    onClose();
  };

  const handleExportData = () => {
    triggerHaptic();
    const exportObj = {
      babies: localBabies,
      settings: localSettings,
      logs: JSON.parse(localStorage.getItem('baby_timer_logs_v2') || '[]'),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `baby_timer_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900">앱 및 아기 정보 설정 ⚙️</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Baby Info Form */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400">아기 세부 정보 수정</div>

          {/* Baby Avatar / Character Selector & Upload */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2.5">
            <label className="block text-xs font-bold text-slate-800">
              아기 캐릭터 / 프로필 사진
            </label>
            
            <div className="flex items-center gap-3">
              <img
                src={currentBaby.avatarUrl || DEFAULT_BABY_AVATAR}
                alt={currentBaby.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-300 shadow-xs"
              />
              <div className="flex-1 space-y-1.5">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-rose-300" />
                  <span>내 사진/캐릭터 업로드</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400">
                  원하는 사진이나 직접 만든 캐릭터 이미지를 업로드할 수 있어요.
                </p>
              </div>
            </div>

            {/* Presets */}
            <div className="pt-1 border-t border-slate-200/60">
              <div className="text-[10px] font-bold text-slate-500 mb-1.5">기본 추천 캐릭터 선택</div>
              <div className="flex items-center gap-2">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = currentBaby.avatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        handleUpdateCurrentBaby({ avatarUrl: preset.url });
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                        isSelected
                          ? 'border-rose-500 ring-2 ring-rose-200 scale-105'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">아기 태명/이름</label>
            <input
              type="text"
              maxLength={6}
              value={currentBaby.name}
              onChange={(e) => handleUpdateCurrentBaby({ name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-[#FF6B6B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">생년월일</label>
            <input
              type="date"
              value={currentBaby.birthDate}
              onChange={(e) => handleUpdateCurrentBaby({ birthDate: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6B6B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">성별</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleUpdateCurrentBaby({ gender: 'female' })}
                className={`py-2 text-xs font-bold rounded-xl border ${
                  currentBaby.gender === 'female'
                    ? 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                👧 여아
              </button>
              <button
                type="button"
                onClick={() => handleUpdateCurrentBaby({ gender: 'male' })}
                className={`py-2 text-xs font-bold rounded-xl border ${
                  currentBaby.gender === 'male'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                👦 남아
              </button>
            </div>
          </div>

          {/* Add Twin Button if single */}
          {localBabies.length === 1 && (
            <button
              type="button"
              onClick={handleAddSecondBaby}
              className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>쌍둥이(둘째 아기) 추가하기</span>
            </button>
          )}
        </div>

        {/* Notifications & Quiet Hours */}
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div className="text-xs font-bold text-slate-400">알림 설정</div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">예측 수유/수면 알림</div>
              <div className="text-[10px] text-slate-400">골든타임 도착 시 웹 푸시</div>
            </div>
            <button
              type="button"
              onClick={() =>
                setLocalSettings({
                  ...localSettings,
                  predictionAlert: !localSettings.predictionAlert,
                })
              }
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                localSettings.predictionAlert ? 'bg-[#FF6B6B] justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600">
            🌙 <strong className="text-slate-800">야간 조용한 시간 (23:00 ~ 07:00)</strong>
            <p className="text-[10px] text-slate-400 mt-0.5">
              야간 수면 시간 동안 기저귀 Remind 알림이 자동 차단됩니다.
            </p>
          </div>
        </div>

        {/* Backup / Export */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <div className="text-xs font-bold text-slate-400">데이터 백업</div>
          <button
            type="button"
            onClick={handleExportData}
            className="w-full py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>기록 데이터 JSON 내보내기</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex-1 py-3 bg-[#FF6B6B] text-white rounded-xl font-bold text-xs hover:bg-[#FF5252] shadow-xs flex items-center justify-center gap-1"
          >
            <Save className="w-4 h-4" />
            <span>설정 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Baby, AppSettings } from '../types';
import { triggerHaptic, saveBabies, saveAppSettings } from '../utils';
import { DEFAULT_BABY_AVATAR } from '../data/avatars';
import { X, Save, Plus, Upload } from 'lucide-react';

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

  // 생년월일 기반 추천 캐릭터 계산
  const getRecommendedCharacters = () => {
    const ageMonths = Math.floor(
      (Date.now() - new Date(currentBaby.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const stage =
      ageMonths < 3 ? '신생아'
      : ageMonths < 9 ? '6개월'
      : ageMonths < 15 ? '1년'
      : '1년6개월';

    const ageDays = Math.floor(
      (Date.now() - new Date(currentBaby.birthDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      stage,
      ageDays,
      suggestions: [
        { id: 'f', name: '여아', url: `/characters/${stage}-여자.png` },
        { id: 'm', name: '남아', url: `/characters/${stage}-남자.png` },
      ],
    };
  };

  const { stage, ageDays, suggestions } = getRecommendedCharacters();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900">앱 및 아기 정보 설정 ⚙️</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 아기 정보 */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400">아기 세부 정보 수정</div>

          {/* 캐릭터 / 프로필 */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              아기 캐릭터 / 프로필 사진
            </label>

            {/* 현재 아바타 + 업로드 버튼 */}
            <div className="flex items-center gap-3">
              <img
                src={currentBaby.avatarUrl || DEFAULT_BABY_AVATAR}
                alt={currentBaby.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-300 shadow-sm bg-blue-100"
              />
              <div className="flex-1 space-y-1.5">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-sm">
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
                  직접 만든 캐릭터나 사진을 업로드할 수 있어요.
                </p>
              </div>
            </div>

            {/* 생년월일 기반 추천 캐릭터 */}
            <div className="border-t border-slate-200/60 pt-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold text-slate-500">
                  개월 수 기반 추천 캐릭터
                </div>
                <div className="text-[10px] font-bold text-[#FF6B6B]">
                  생후 {ageDays}일 ({stage})
                </div>
              </div>

              <div className="flex gap-3">
                {suggestions.map((preset) => {
                  const isSelected = currentBaby.avatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic();
                        handleUpdateCurrentBaby({ avatarUrl: preset.url });
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <div className={`rounded-xl overflow-hidden border-2 p-0.5 transition-all ${
                        isSelected
                          ? 'border-[#FF6B6B] ring-2 ring-[#FF6B6B]/30 scale-105'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}>
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-14 h-14 rounded-lg object-cover bg-blue-100"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
                <div className="flex flex-col justify-center text-[10px] text-slate-400 leading-relaxed pl-1">
                  <span>생년월일 기준으로</span>
                  <span>자동 추천돼요</span>
                  <span className="text-[10px] text-slate-300 mt-1">
                    생일 바꾸면 업데이트
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              아기 태명/이름
            </label>
            <input
              type="text"
              maxLength={6}
              value={currentBaby.name}
              onChange={(e) => handleUpdateCurrentBaby({ name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-[#FF6B6B]"
            />
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              생년월일
            </label>
            <input
              type="date"
              value={currentBaby.birthDate}
              onChange={(e) => handleUpdateCurrentBaby({ birthDate: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6B6B]"
            />
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">성별</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleUpdateCurrentBaby({ gender: 'female' })}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  currentBaby.gender === 'female'
                    ? 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                👧🏻 여아
              </button>
              <button
                type="button"
                onClick={() => handleUpdateCurrentBaby({ gender: 'male' })}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  currentBaby.gender === 'male'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                👶🏻 남아
              </button>
            </div>
          </div>

          {/* 쌍둥이 추가 */}
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

        {/* 알림 설정 */}
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div className="text-xs font-bold text-slate-400">알림 설정</div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">수유/수면 예상 알림</div>
              <div className="text-[10px] text-slate-400">골든타임 도착 시 푸시</div>
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
                localSettings.predictionAlert
                  ? 'bg-[#FF6B6B] justify-end'
                  : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600">
            🌙 <strong className="text-slate-800">야간 조용한 시간 (23:00 ~ 07:00)</strong>
            <p className="text-[10px] text-slate-400 mt-0.5">
              야간에는 기저귀 알림이 자동으로 차단됩니다.
            </p>
          </div>
        </div>

        {/* 하단 버튼 */}
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
            className="flex-1 py-3 bg-[#FF6B6B] text-white rounded-xl font-bold text-xs hover:bg-[#FF5252] shadow-sm flex items-center justify-center gap-1"
          >
            <Save className="w-4 h-4" />
            <span>설정 저장</span>
          </button>
        </div>

      </div>
    </div>
  );
};